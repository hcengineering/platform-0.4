import type { Account, Class, Doc, Ref, Space, Storage, TxCreateDoc, TxUpdateDoc } from '@anticrm/core'
import { nanoid } from 'nanoid'

/**
 * @public
 */export interface UpdateTxFilter {
  space?: Ref<Space>
  clazz?: Ref<Class<Doc>>
  id?: Ref<Doc>
}

/**
 * @public
 */
export type UpdateTxCallback = (tx: TxUpdateDoc<Doc>) => Promise<void>

/**
 * @public
 */
export interface Context {
  recur: (ret: any) => Promise<void>
  pop: () => any
  push: (item: any) => void
  create: <T extends Doc>(data: {
    id?: Ref<T>
    clazz: Ref<Class<T>>
    space: Ref<Space>
    attributes: TxCreateDoc<T>['attributes']
    account?: Ref<Account>
  }) => void
  update: <T extends Doc>(data: {
    id: Ref<T>
    clazz: Ref<Class<T>>
    space: Ref<Space>
    ops: TxUpdateDoc<T>['operations']
    account?: Ref<Account>
  }) => void
  subscribe: (filter: UpdateTxFilter, cb: UpdateTxCallback) => () => void
  findAll: Storage['findAll']
}

/**
 * @public
 */
export type ActionFn<T = any> = (ctx: Context) => Promise<T>
/**
 * @public
 */
export type ActionPred = ActionFn<boolean>

/**
 * @public
 */
export interface FnAtom<T = any> {
  _type: 'fn'
  fn: ActionFn<T>
}
/**
 * @public
 */
export interface GotoAtom {
  _type: 'goto'
  cond: ActionPred
  label: string
}
/**
 * @public
 */
export interface ActionAtom {
  _type: 'action'
  action: string
}

/**
 * @public
 */
export type Atom = FnAtom | GotoAtom | ActionAtom
/**
 * @public
 */
export type Program = Atom[]

/**
 * @public
 */
export class Action {
  private readonly _program: Program = []
  private counter = 0
  private readonly _labelMap = new Map<string, number>()

  get program (): Program {
    return this._program
  }

  get labelMap (): Map<string, number> {
    return this._labelMap
  }

  exec (fn: ActionFn, label?: string): Action {
    this.addAtom(
      {
        _type: 'fn',
        fn
      },
      label
    )

    return this
  }

  call (action: string, label?: string): Action {
    this.addAtom(
      {
        _type: 'action',
        action
      },
      label
    )

    return this
  }

  ifelse (pred: ActionPred, pos: (x: Action) => void, neg: (x: Action) => {}, label?: string): Action {
    // call predicate
    // goto 'neg' if false
    // "positive branch"
    // ...
    // ...
    // goto 'end'
    // neg: "negative branch"
    // ...
    // ...
    // end: "next instruction"

    this.addAtom(
      {
        _type: 'fn',
        fn: pred
      },
      label
    )

    const endLabel = nanoid()
    const negLabel = nanoid()

    this.goto(negLabel, async (ctx: Context) => ctx.pop() === false)

    pos(this)

    this.goto(endLabel)

    this.addLabel(negLabel)

    neg(this)

    this.addLabel(endLabel)

    return this
  }

  goto (label: string, cond: ActionPred = async () => true): Action {
    this.addAtom({
      _type: 'goto',
      cond,
      label
    })

    return this
  }

  private addAtom (atom: Atom, label?: string): void {
    this._program.push(atom)

    if (label !== undefined) {
      this.addLabel(label)
    }

    this.counter++
  }

  private addLabel (label: string): void {
    this._labelMap.set(label, this.counter)
  }
}
