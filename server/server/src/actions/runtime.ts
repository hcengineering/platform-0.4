import {
  Class,
  Doc,
  DocumentQuery,
  DOMAIN_MODEL,
  FindOptions,
  FindResult,
  generateId,
  Hierarchy,
  ModelDb,
  Ref,
  Storage,
  Tx,
  TxCreateDoc,
  TxRemoveDoc,
  TxUpdateDoc
} from '@anticrm/core'
import core from '@anticrm/core'
import { getResource } from '@anticrm/platform'
import plugin, { ActionState } from '@anticrm/action-plugin'
import type { ActionInstance } from '@anticrm/action-plugin'
import { exec } from './exec'
import { Service, updateTx } from './service'

type PureActionInst = Omit<ActionInstance, keyof Doc> & { _id: Ref<ActionInstance> }

export class ActionRuntime {
  private readonly actions = new Map<Ref<ActionInstance>, PureActionInst>()
  private _tx: ((tx: Tx<Doc>) => Promise<void>) | undefined

  constructor (
    private readonly hierarchy: Hierarchy,
    private readonly model: ModelDb,
    private readonly storage: Storage,
    private readonly clientId = generateId()
  ) {}

  async init (sendTx: (clientId: string, tx: Tx<Doc>) => Promise<void>): Promise<void> {
    this._tx = async (tx: Tx<Doc>) => await sendTx(this.clientId, tx)

    await this.execExistingActions()
  }

  async execExistingActions (): Promise<void> {
    const actions = await this.model.findAll(plugin.class.ActionInstance, { state: ActionState.Pending })

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    Promise.all(actions.map(async (x) => await this.runAction(x._id, x)))
  }

  txHandlers = {
    [core.class.TxCreateDoc]: async (tx: Tx) => await this.txCreateDoc(tx as TxCreateDoc<Doc>),
    [core.class.TxUpdateDoc]: async (tx: Tx) => await this.txUpdateDoc(tx as TxUpdateDoc<Doc>),
    [core.class.TxRemoveDoc]: async (tx: Tx) => await this.txRemoveDoc(tx as TxRemoveDoc<Doc>)
  }

  async tx (_clientId: string, tx: Tx): Promise<void> {
    return await this.txHandlers[tx._class]?.(tx)
  }

  async txCreateDoc (tx: TxCreateDoc<Doc>): Promise<void> {
    if (tx.objectClass === plugin.class.ActionInstance) {
      const instance = tx.attributes as PureActionInst

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.runAction(tx.objectId as Ref<ActionInstance>, instance)
    }
  }


  async txUpdateDoc (_tx: TxUpdateDoc<Doc>): Promise<void> {}
  async txRemoveDoc (_tx: TxRemoveDoc<Doc>): Promise<void> {}

  private readonly findAll = async <T extends Doc>(
    _class: Ref<Class<T>>,
    query: DocumentQuery<T>,
    options?: FindOptions<T>
  ): Promise<FindResult<T>> => {
    if (this.hierarchy.getDomain(_class) === DOMAIN_MODEL) {
      return await this.model.findAll(_class, query, options)
    }

    return await this.storage.findAll(_class, query, options)
  }

  async runAction (id: Ref<ActionInstance>, actionInst: PureActionInst): Promise<void> {
    if (this._tx === undefined) {
      return
    }

    const action = (await this.model.findAll(plugin.class.Action, { _id: actionInst.action }))[0]
    const state = (await this.model.findAll(plugin.class.ExecutionContext, { _id: actionInst.context }))[0]

    if (action === undefined || state === undefined) {
      return
    }

    this.actions.set(id, actionInst)

    const actionDef = await getResource(action.resId)
    const service = new Service(this._tx, this.findAll, state._id)

    try {
      await exec(actionDef, service, state)
      await this._tx(
        updateTx({
          id,
          clazz: plugin.class.ActionInstance,
          space: core.space.Model,
          ops: {
            state: ActionState.Fullfilled
          }
        })
      )
    } catch (e: unknown) {
      await this._tx(
        updateTx({
          id,
          clazz: plugin.class.ActionInstance,
          space: core.space.Model,
          ops: {
            state: ActionState.Rejected,
            reject: e instanceof Error ? e.message : undefined
          }
        })
      )
    } finally {
      this.actions.delete(id)
    }
  }
}
