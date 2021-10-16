import core, { Client, Data, Ref, TxOperations } from '@anticrm/core'
import fsmPlugin, { FSM, State } from '@anticrm/fsm'
import recrutting from '@anticrm/recruiting'
import { TrelloBoard, TrelloCard } from './trello'

export interface FSMItem {
  id: string
  name: string
  items: TrelloCard[]
}

export async function createFSM (
  client: Client,
  fsmId: Ref<FSM>,
  board: TrelloBoard,
  operations: Client & TxOperations
): Promise<void> {
  let fsms = await client.findAll(fsmPlugin.class.FSM, { _id: fsmId })
  if (fsms.length === 0) {
    console.info('Create FSM:', board.id, board.name)

    const fsmInstance: Data<FSM> = {
      name: board.name,
      clazz: recrutting.class.VacancySpace,
      isTemplate: false,
      states: []
    }
    await operations.createDoc(fsmPlugin.class.FSM, core.space.Model, fsmInstance, fsmId)
    fsms = await client.findAll(fsmPlugin.class.FSM, { _id: fsmId })
  }
}

export async function updateFSMStates (
  client: Client & TxOperations,
  fsmId: Ref<FSM>,
  fsm: FSMItem[]
): Promise<State[]> {
  let states = await client.findAll(fsmPlugin.class.State, {
    fsm: fsmId
  })
  const statesMap = new Map<Ref<State>, State>(Array.from(states).map((s) => [s._id, s]))
  const result: State[] = []

  let needUpdateStates = false

  for (const o of fsm) {
    // Check if no state, add it.
    let cur = statesMap.get(o.id as Ref<State>)
    if (cur === undefined) {
      // Need to create new state.
      const st: Data<State> = {
        name: o.name,
        color: 'black',
        fsm: fsmId,
        items: [],
        optionalActions: [],
        requiredActions: []
      }
      cur = await client.createDoc(fsmPlugin.class.State, core.space.Model, st, o.id as Ref<State>)
      needUpdateStates = true
    }
    result.push(cur)
  }
  if (needUpdateStates) {
    states = await client.findAll(fsmPlugin.class.State, {
      fsm: fsmId
    })
    await client.updateDoc(fsmPlugin.class.FSM, core.space.Model, fsmId, { states: states.map((s) => s._id) })
  }
  return result
}

export function buildFSMItems (board: TrelloBoard): FSMItem[] {
  const fsm: FSMItem[] = []
  const fsmMap = new Map<string, FSMItem>()

  for (const l of Array.from(board.lists).sort((l1, l2) => l1.pos - l2.pos)) {
    if (!l.closed) {
      const fsmItem = { id: l.id, name: l.name, items: [] }
      fsm.push(fsmItem)
      fsmMap.set(fsmItem.id, fsmItem)
    }
  }

  for (const c of Array.from(board.cards).sort((l1, l2) => l1.pos - l2.pos)) {
    const list = fsmMap.get(c.idList)
    if (list !== undefined && !c.closed) {
      list.items.push(c)
    }
  }

  return fsm
}
