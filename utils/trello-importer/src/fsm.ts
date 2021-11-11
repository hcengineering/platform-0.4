import { Client, Data, Ref, TxOperations } from '@anticrm/core'
import fsmPlugin, { FSM, State } from '@anticrm/fsm'
import recrutting, { VacancySpace } from '@anticrm/recruiting'
import { TrelloBoard } from './trello'
import { genRanks } from './utils'

export interface FSMColumn {
  id: string
  name: string
  items: FSMItem[]
}

export interface FSMItem {
  id: string // Card id
  name: string
  pos: number

  comments: {
    time: number
    text: string
    author: string
  }[]
}

export async function createFSM (
  client: Client,
  fsmId: Ref<FSM>,
  spaceId: Ref<VacancySpace>,
  board: TrelloBoard,
  operations: Client & TxOperations
): Promise<void> {
  let fsms = await client.findAll(fsmPlugin.class.FSM, { _id: fsmId })
  if (fsms.length === 0) {
    console.info('Create FSM:', board.id, board.name)

    const fsmInstance: Data<FSM> = {
      name: board.name,
      clazz: recrutting.class.VacancySpace,
      isTemplate: false
    }
    await operations.createDoc(fsmPlugin.class.FSM, spaceId, fsmInstance, fsmId)
    fsms = await client.findAll(fsmPlugin.class.FSM, { _id: fsmId })
  }
}

export async function updateFSMStates (
  client: Client & TxOperations,
  fsmId: Ref<FSM>,
  spaceId: Ref<VacancySpace>,
  fsm: FSMColumn[]
): Promise<State[]> {
  const states = await client.findAll(fsmPlugin.class.State, {
    fsm: fsmId
  })
  const statesMap = new Map<Ref<State>, State>(Array.from(states).map((s) => [s._id, s]))
  const result: State[] = []
  const rankGen = genRanks(fsm.length)

  for (const o of fsm) {
    const rank = rankGen.next().value

    if (rank === undefined) {
      throw Error('Unable to gen rank')
    }

    // Check if no state, add it.
    let cur = statesMap.get(o.id as Ref<State>)
    if (cur === undefined) {
      // Need to create new state.
      const st: Data<State> = {
        name: o.name,
        color: 'black',
        fsm: fsmId,
        optionalActions: [],
        requiredActions: [],
        rank
      }

      cur = await client.createDoc(fsmPlugin.class.State, spaceId, st, o.id as Ref<State>)
    } else {
      await client.updateDoc(cur._class, cur.space, cur._id, { rank: rank })
    }

    result.push(cur)
  }

  return result
}

export function buildFSMItems (board: TrelloBoard): FSMColumn[] {
  const fsm: FSMColumn[] = []
  const fsmMap = new Map<string, FSMColumn>()

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
      const item: FSMItem = { id: c.id, name: c.name, pos: c.pos, comments: [] }
      list.items.push(item)
    }
  }

  return fsm
}
