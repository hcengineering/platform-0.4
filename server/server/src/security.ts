import core, {
  Account, checkLikeQuery, Class,
  Doc,
  DocumentQuery,
  DOMAIN_MODEL,
  DOMAIN_TX,
  FindOptions,
  FindResult,
  Hierarchy, ModelDb, ObjQueryType, Ref,
  Space, Tx,
  TxCreateDoc,
  TxProcessor, TxRemoveDoc, TxUpdateDoc,
  WithAccountId
} from '@anticrm/core'
import { component, Component, PlatformError, Severity, Status, StatusCode } from '@anticrm/status'
import { WithWorkspaceTx } from '@anticrm/workspace'

function accountTxSpace (user: Ref<Account>): Ref<Space> {
  return (core.space.Tx + '#' + user) as Ref<Space>
}

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
      this.pushSpaceMembers(spaceTx)
      this.pullSpaceMembers(spaceTx)
    }
  }

  protected async txRemoveDoc (tx: TxRemoveDoc<Doc>): Promise<void> {
    if (this.hierarchy.isDerived(tx.objectClass, core.class.Space)) {
      this.publicSpaces.delete(tx.objectId as Ref<Space>)

      for (const allowed of this.allowedSpaces) {
        allowed[1].delete(tx.objectId as Ref<Space>)
      }
    }
  }

  pushSpaceMembers (spaceTx: TxUpdateDoc<Space>): void {
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

  pullSpaceMembers (spaceTx: TxUpdateDoc<Space>): void {
    const member = spaceTx.operations?.$pull?.members
    if (member !== undefined) {
      const accountSpaces = this.allowedSpaces.get(member)
      if (accountSpaces !== undefined) {
        accountSpaces.delete(spaceTx.objectId)
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
    if (tx.objectSpace === core.space.Model) {
      return this.checkSpaceTx(userId, tx)
    }

    const spaces = this.getUserSpaces(userId)
    return spaces.has(tx.objectSpace)
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
    return spaces.has(tx.objectId as Ref<Space>)
  }

  txRemoveSpace (userId: Ref<Account>, tx: TxRemoveDoc<Doc>): boolean {
    if (!this.hierarchy.isDerived(tx.objectClass, core.class.Space)) return true
    const spaces = this.getSpaces(userId)
    return spaces.has(tx.objectId as Ref<Space>)
  }

  getSpaces (userId: Ref<Account>): Set<Ref<Space>> {
    return new Set<Ref<Space>>([...this.publicSpaces, ...(this.allowedSpaces.get(userId) ?? [])])
      .add(core.space.Model)
      .add(core.space.Tx)
  }

  getUserSpaces (userId: Ref<Account>): Set<Ref<Space>> {
    return new Set(this.allowedSpaces.get(userId) ?? new Set<Ref<Space>>())
      .add(core.space.Model)
      .add(core.space.Tx)
      .add(userId.toString() as Ref<Space>)
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
    if (!spaces.has(querySpace)) {
      throw new PlatformError(new Status(Severity.ERROR, Code.AccessDenied, { space: querySpace }))
    }
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
    readonly workspace: WithWorkspaceTx,
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
    if (domain === DOMAIN_MODEL) {
      // Model requests are handled on client side.
      return Object.assign([], { total: 0 })
    }

    return domain === DOMAIN_TX
      ? await this.findInTxDomain<T>(query, _class, options)
      : await this.findInWorkspace<T>(query, _class, options)
  }

  private async findInWorkspace<T extends Doc>(query: DocumentQuery<T>, _class: Ref<Class<T>>, options: FindOptions<T> | undefined): Promise<FindResult<T>> {
    const querySpace = (query as DocumentQuery<Doc>).space
    const spaces = this.security.getUserSpaces(this.user.accountId)
    query.space =
      querySpace !== undefined
        ? (query.space = checkQuerySpaces(spaces, querySpace))
        : (query.space = { $in: [...spaces.values()] })
    return await this.workspace.findAll(_class, query, options)
  }

  private async findInTxDomain<T extends Doc>(query: DocumentQuery<T>, _class: Ref<Class<T>>, options: FindOptions<T> | undefined): Promise<FindResult<T>> {
    const txQuery = (query as DocumentQuery<Tx>)
    const querySpace = txQuery.objectSpace

    // Availabel spaces + model
    const spaces = this.security.getUserSpaces(this.user.accountId)
      .add(core.space.Model) // Every one capable to query model

    txQuery.objectSpace =
      querySpace !== undefined
        ? (query.space = checkQuerySpaces(spaces, querySpace))
        : (query.space = { $in: [...spaces.values()] })

    // We allow to return only transactions visible to global and account tx spaces.
    txQuery.space = { $in: [core.space.Tx, accountTxSpace(this.user.accountId)] }
    // We need to enhance with current client security.
    return await this.workspace.findAll(_class, txQuery, options)
  }

  async tx (tx: Tx): Promise<void> {
    // Check if transaction is into global or custom user space.
    this.checkModelTransactions(tx)
    if (!this.security.checkSecurity(this.user.accountId, tx)) {
      throw new PlatformError(new Status(Severity.ERROR, Code.AccessDenied, {}))
    }
    // Check if tx is allowed and process with workspace
    await this.workspace.tx(this.user.clientId, tx)
  }

  private checkModelTransactions (tx: Tx<Doc>): void {
    const accountSpace = accountTxSpace(this.user.accountId)
    if (![core.space.Tx, accountSpace].includes(tx.space)) {
      throw new PlatformError(new Status(Severity.ERROR, Code.TransactionSpaceDenied, {}))
    }
    // Disallow account space transactions to modify non model objects.
    if (tx.space === accountSpace && tx.objectSpace !== core.space.Model) {
      throw new PlatformError(new Status(Severity.ERROR, Code.TransactionSpaceDenied, {}))
    }
  }

  async accountId (): Promise<Ref<Account>> {
    return this.user.accountId
  }
}

export const Code = component('security' as Component, {
  AccessDenied: '' as StatusCode<{space?: Ref<Space>}>,
  TransactionSpaceDenied: '' as StatusCode
})
