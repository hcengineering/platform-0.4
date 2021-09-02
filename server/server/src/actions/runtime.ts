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
  Space,
  Storage,
  Tx,
  TxCreateDoc,
  TxRemoveDoc,
  TxUpdateDoc
} from '@anticrm/core'
import core from '@anticrm/core'
import { getResource } from '@anticrm/platform'
import { UpdateTxCallback, UpdateTxFilter } from '@anticrm/action'
import plugin, { ActionState } from '@anticrm/action-plugin'
import type { ActionInstance } from '@anticrm/action-plugin'
import { exec } from './exec'
import { Service, updateTx } from './service'

type PureActionInst = Omit<ActionInstance, keyof Doc> & { _id: Ref<ActionInstance>, space: Ref<Space> }

interface UpdateTxSub {
  filter: UpdateTxFilter
  cb: UpdateTxCallback
}

export class ActionRuntime {
  private readonly actions = new Map<Ref<ActionInstance>, PureActionInst>()
  private _tx: ((tx: Tx<Doc>) => Promise<void>) | undefined
  private readonly updateTxSubs: Map<string, UpdateTxSub> = new Map()

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
    const actions = await this.storage.findAll(plugin.class.ActionInstance, { state: ActionState.Pending })

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    Promise.all(actions.map(async (x) => await this.runAction(x)))
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
    if (this.hierarchy.isDerived(tx.objectClass, plugin.class.ActionInstance)) {
      const instance = tx.attributes as PureActionInst

      const biba = await this.storage.findAll(plugin.class.ActionInstance, { _id: instance._id })
      console.log(biba)
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.runAction({
        ...instance,
        _id: tx.objectId as Ref<ActionInstance>,
        space: tx.objectSpace
      })
    }
  }

  private readonly subscribe = (filter: UpdateTxFilter, cb: UpdateTxCallback): () => void => {
    const id = generateId()
    this.updateTxSubs.set(id, { filter, cb })

    return () => this.unsubscribe(id)
  }

  private unsubscribe (id: string): void {
    this.updateTxSubs.delete(id)
  }

  async txUpdateDoc (tx: TxUpdateDoc<Doc>): Promise<void> {
    const cbs = [...this.updateTxSubs.values()]
      .filter(({ filter }) => {
        return (filter.id === undefined || filter.id === tx.objectId) &&
          (filter.clazz === undefined || filter.clazz === tx.objectClass) &&
          (filter.space === undefined || filter.space === tx.objectSpace)
      })
      .map(x => x.cb)

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    Promise.all(cbs.map(async cb => await cb(tx)))
  }

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

  async runAction (actionInst: PureActionInst): Promise<void> {
    if (this._tx === undefined) {
      return
    }

    const action = (await this.model.findAll(plugin.class.Action, { _id: actionInst.action }))[0]
    const state = (await this.storage.findAll(plugin.class.ExecutionContext, { _id: actionInst.context }))[0]

    if (action === undefined || state === undefined) {
      return
    }

    this.actions.set(actionInst._id, actionInst)

    const actionDef = await getResource(action.resId)
    const service = new Service(this._tx, actionInst.space, this.findAll, this.subscribe, state._id)

    try {
      await exec(actionDef, service, state)
      await this._tx(
        updateTx({
          id: actionInst._id,
          clazz: plugin.class.ActionInstance,
          space: actionInst.space,
          ops: {
            state: ActionState.Fullfilled
          }
        })
      )
    } catch (e: unknown) {
      await this._tx(
        updateTx({
          id: actionInst._id,
          clazz: plugin.class.ActionInstance,
          space: actionInst.space,
          ops: {
            state: ActionState.Rejected,
            reject: e instanceof Error ? e.message : undefined
          }
        })
      )
    } finally {
      this.actions.delete(actionInst._id)
    }
  }
}
