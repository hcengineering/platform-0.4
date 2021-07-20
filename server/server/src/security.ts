import core, {
  Account,
  Class,
  Doc,
  DocumentQuery,
  DOMAIN_MODEL,
  DOMAIN_TX,
  FindOptions,
  FindResult,
  Hierarchy,
  checkLikeQuery,
  ObjQueryType,
  ModelDb,
  Ref,
  Space,
  Storage,
  Tx,
  TxCreateDoc,
  TxProcessor,
  TxUpdateDoc,
  WithAccountId,
  TxRemoveDoc
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

  static async create (hierarchy: Hierarchy, model: ModelDb): Promise<SecurityModel> {
    const spaces = await model.findAll(core.class.Space, {})
    const securityModel = new SecurityModel(hierarchy)
    for (const space of spaces) {
      securityModel.addSpace(space)
    }
    return securityModel
  }

  addSpace (space: Space): void {
    if (!space.private) this.publicSpaces.add(space._id)
    for (const acc of space.members) {
      const accountSpaces = this.allowedSpaces.get(acc)
      if (accountSpaces === undefined) {
        this.allowedSpaces.set(acc, new Set<Ref<Space>>([space._id]))
      } else {
        accountSpaces.add(space._id)
      }
    }
  }

  protected async txCreateDoc (tx: TxCreateDoc<Doc>): Promise<void> {
    if (this.hierarchy.isDerived(tx.objectClass, core.class.Space)) {
      const space = TxProcessor.createDoc2Doc(tx) as Space
      this.addSpace(space)
    }
  }

  protected async txUpdateDoc (tx: TxUpdateDoc<Doc>): Promise<void> {
    if (this.hierarchy.isDerived(tx.objectClass, core.class.Space)) {
      const spaceTx = tx as TxUpdateDoc<Space>
      this.changeSpacePrivate(spaceTx)
      this.changeSpaceMembers(spaceTx)
    }
  }

  changeSpaceMembers (spaceTx: TxUpdateDoc<Space>): void {
    const member = spaceTx.operations?.$push?.members
    if (member !== undefined) {
      const accountSpaces = this.allowedSpaces.get(member)
      if (accountSpaces === undefined) {
        this.allowedSpaces.set(member, new Set<Ref<Space>>([spaceTx.objectId]))
      } else {
        accountSpaces.add(spaceTx.objectId)
      }
    }
  }

  changeSpacePrivate (spaceTx: TxUpdateDoc<Space>): void {
    const spacePrivate = spaceTx.operations?.private
    if (spacePrivate !== undefined) {
      if (!spacePrivate) {
        this.publicSpaces.add(spaceTx.objectId)
      }
      if (spacePrivate) {
        this.publicSpaces.delete(spaceTx.objectId)
      }
    }
  }

  checkSecurity (userId: Ref<Account>, tx: Tx): boolean {
    if (tx.objectSpace === core.space.Model) return this.checkSpaceTx(userId, tx)
    const spaces = this.allowedSpaces.get(userId)
    return spaces?.has(tx.objectSpace) === true
  }

  checkSpaceTx (userId: Ref<Account>, tx: Tx): boolean {
    switch (tx._class) {
      case core.class.TxUpdateDoc:
        return this.txUpdateSpace(userId, tx as TxUpdateDoc<Doc>)
      case core.class.TxRemoveDoc:
        return this.txRemoveSpace(userId, tx as TxRemoveDoc<Doc>)
    }
    return true
  }

  txUpdateSpace (userId: Ref<Account>, tx: TxUpdateDoc<Doc>): boolean {
    if (!this.hierarchy.isDerived(tx.objectClass, core.class.Space)) return true
    const spaces = this.getSpaces(userId)
    return spaces?.has(tx.objectId as Ref<Space>)
  }

  txRemoveSpace (userId: Ref<Account>, tx: TxRemoveDoc<Doc>): boolean {
    if (!this.hierarchy.isDerived(tx.objectClass, core.class.Space)) return true
    const spaces = this.allowedSpaces.get(userId)
    return spaces?.has(tx.objectId as Ref<Space>) === true
  }

  getSpaces (userId: Ref<Account>): Set<Ref<Space>> {
    return new Set<Ref<Space>>([...this.publicSpaces, ...(this.allowedSpaces.get(userId) ?? [])])
  }

  getUserSpaces (userId: Ref<Account>): Set<Ref<Space>> {
    return this.allowedSpaces.get(userId) ?? new Set<Ref<Space>>()
  }
}

export interface ClientInfo {
  clientId: string
  accountId: Ref<Account>
  workspaceId: string
  tx: (tx: Tx) => void
}

function checkQuerySpaces (spaces: Set<Ref<Space>>, querySpace: ObjQueryType<Ref<Space>>): ObjQueryType<Ref<Space>> {
  if (typeof querySpace === 'string') {
    if (!spaces.has(querySpace)) throw new PlatformError(new Status(Severity.ERROR, Code.AccessDenied, {}))
  } else {
    if (querySpace.$in?.every((space) => spaces.has(space)) === false) {
      throw new PlatformError(new Status(Severity.ERROR, Code.AccessDenied, {}))
    }
    if (querySpace.$like !== undefined) {
      const query = querySpace.$like
      const querySpaces = querySpace.$in ?? [...spaces.values()]
      return { $in: querySpaces.filter((p) => checkLikeQuery(p, query)) }
    }
  }
  return querySpace
}

export class SecurityClientStorage implements WithAccountId {
  constructor (
    readonly security: SecurityModel,
    readonly workspace: Storage,
    readonly hierarchy: Hierarchy,
    readonly user: ClientInfo
  ) {}

  async findAll<T extends Doc>(
    _class: Ref<Class<T>>,
    query: DocumentQuery<T>,
    options?: FindOptions<T>
  ): Promise<FindResult<T>> {
    // Filter for client accountId
    const domain = this.hierarchy.getDomain(_class)
    if (domain === DOMAIN_MODEL || domain === DOMAIN_TX) return await this.workspace.findAll(_class, query, options)
    const querySpace = (query as DocumentQuery<Doc>).space
    const spaces = this.security.getUserSpaces(this.user.accountId)
    query.space =
      querySpace !== undefined
        ? (query.space = checkQuerySpaces(spaces, querySpace))
        : (query.space = { $in: [...spaces.values()] })
    return await this.workspace.findAll(_class, query, options)
  }

  async tx (tx: Tx): Promise<void> {
    if (!this.security.checkSecurity(this.user.accountId, tx)) {
      throw new PlatformError(new Status(Severity.ERROR, Code.AccessDenied, {}))
    }
    // Check if tx is allowed and process with workspace
    await this.workspace.tx(tx)
  }

  async accountId (): Promise<Ref<Account>> {
    return this.user.accountId
  }
}

export const Code = component('security' as Component, {
  AccessDenied: '' as StatusCode
})
