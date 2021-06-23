import core, {
  Account,
  Class,
  Doc,
  DocumentQuery,
  DOMAIN_MODEL,
  DOMAIN_TX,
  Emb,
  Hierarchy,
  makeEmb,
  Member,
  Ref,
  Space,
  Storage,
  Tx,
  TxAddCollection,
  TxCreateDoc,
  TxProcessor
} from '@anticrm/core'
import { component, Component, PlatformError, Severity, Status, StatusCode } from '@anticrm/status'

export class SecurityModel extends TxProcessor {
  private readonly hierarchy: Hierarchy
  private readonly allowedSpaces: Map<Ref<Account>, Set<Ref<Space>>> = new Map<Ref<Account>, Set<Ref<Space>>>()
  private readonly publicSpaces: Set<Ref<Space>> = new Set<Ref<Space>>()

  constructor (hierarchy: Hierarchy) {
    super()
    this.hierarchy = hierarchy
  }

  protected async txCreateDoc (tx: TxCreateDoc<Doc>): Promise<void> {
    if (this.hierarchy.isDerived(tx.objectClass, core.class.Space)) {
      const obj = TxProcessor.createDoc2Doc(tx) as Space
      if (!obj.private) this.publicSpaces.add(tx.objectId as Ref<Space>)
    }
  }

  protected async txAddCollection (tx: TxAddCollection<Doc, Emb>): Promise<void> {
    if (tx.itemClass === core.class.Member && tx.collection === 'members') {
      const obj = makeEmb(tx.itemClass, tx.attributes) as Member
      const accountSpaces = this.allowedSpaces.get(obj.account)
      if (accountSpaces === undefined) {
        this.allowedSpaces.set(obj.account, new Set<Ref<Space>>([tx.objectId as Ref<Space>]))
      } else {
        accountSpaces.add(tx.objectId as Ref<Space>)
      }
    }
  }

  checkSecurity (userId: Ref<Account>, space: Ref<Space>): boolean {
    if (space === core.space.Model) return true
    const spaces = this.allowedSpaces.get(userId)
    if (spaces === undefined || spaces.size === 0) return false
    return spaces.has(space)
  }

  getSpaces (userId: Ref<Account>): Set<Ref<Space>> {
    return new Set<Ref<Space>>([...this.publicSpaces, ...(this.allowedSpaces.get(userId) ?? [])])
  }
}

export interface ClientInfo {
  clientId: string
  accountId: Ref<Account>
  workspaceId: string
  tx: (tx: Tx) => void
}

export class SecurityClientStorage implements Storage {
  constructor (
    readonly security: SecurityModel,
    readonly workspace: Storage,
    readonly hierarchy: Hierarchy,
    readonly user: ClientInfo,
    readonly clients: Map<string, ClientInfo>
  ) {}

  async findAll<T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>): Promise<T[]> {
    // Filter for client accountId
    const domain = this.hierarchy.getDomain(_class)
    if (domain === DOMAIN_MODEL || domain === DOMAIN_TX) return await this.workspace.findAll(_class, query)
    const querySpace = (query as DocumentQuery<Doc>).space
    const spaces = this.security.getSpaces(this.user.accountId)
    if (spaces === undefined || spaces.size === 0) { throw new PlatformError(new Status(Severity.ERROR, Code.AccessDenied, {})) }
    if (querySpace !== undefined) {
      if (typeof querySpace === 'string') {
        if (!spaces.has(querySpace)) throw new PlatformError(new Status(Severity.ERROR, Code.AccessDenied, {}))
      } else {
        if (querySpace.$in?.every((space) => spaces.has(space)) === false) { throw new PlatformError(new Status(Severity.ERROR, Code.AccessDenied, {})) }
      }
    } else {
      ;(query as any).space = { $in: [...spaces.values()] }
    }
    return await this.workspace.findAll(_class, query)
  }

  async tx (tx: Tx): Promise<void> {
    if (!this.security.checkSecurity(this.user.accountId, tx.objectSpace)) { throw new PlatformError(new Status(Severity.ERROR, Code.AccessDenied, {})) }
    // Check if tx is allowed and process with workspace
    await this.workspace.tx(tx)

    // Check security and send to other clients.
    for (const cl of this.clients.entries()) {
      if (cl[0] !== this.user.clientId && this.security.checkSecurity(cl[1].accountId, tx.objectSpace)) {
        cl[1].tx(tx)
      }
    }
  }
}

export const Code = component('security' as Component, {
  AccessDenied: '' as StatusCode
})
