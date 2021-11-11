//
// Copyright © 2021 Anticrm Platform Contributors.
//
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
//

import { LexoRank } from 'lexorank'
import type { Class, Data, Doc, Ref, Space } from '@anticrm/core'
import { SortingOrder } from '@anticrm/core'
import type { FSM, FSMItem, FSMService, State, Transition } from '@anticrm/fsm'
import { getPlugin } from '@anticrm/platform'
import corePlugin, { Client } from '@anticrm/plugin-core'
import fsmPlugin from './plugin'

export { fsmPlugin }

export default async (): Promise<FSMService> => {
  const coreP = await getPlugin(corePlugin.id)
  const client: Client = await coreP.getClient()

  const getStates = async (
    fsmID: Ref<FSM>,
    order: SortingOrder = SortingOrder.Ascending,
    limit?: number
  ): Promise<State[]> => {
    return await client.findAll(fsmPlugin.class.State, { fsm: fsmID }, { sort: { rank: order }, limit })
  }

  const getTransitions = async (fsm: Ref<FSM>): Promise<Transition[]> =>
    await client
      .findAll(fsmPlugin.class.Transition, { fsm })
      .then((xs) => xs.filter((x): x is Transition => x !== undefined))

  const getTargetFSM = async (fsmID: Ref<FSM>): Promise<FSM | undefined> => {
    return (await client.findAll(fsmPlugin.class.FSM, { _id: fsmID }))[0]
  }

  const calcRank = (prev?: { rank: string }, next?: { rank: string }): LexoRank =>
    (prev?.rank !== undefined ? LexoRank.parse(prev.rank) : LexoRank.min()).between(
      next?.rank !== undefined ? LexoRank.parse(next.rank) : LexoRank.max()
    )

  return {
    getStates,
    getTransitions,
    addItem: async <T extends FSMItem>(
      fsmID: Ref<FSM>,
      item: {
        _class?: Ref<Class<T>>
        obj: Omit<T, keyof Doc | 'state' | 'fsm' | 'rank'> & { state?: Ref<State> }
      },
      space?: Ref<Space>
    ) => {
      const fsm = await getTargetFSM(fsmID)

      if (fsm === undefined) {
        return
      }

      const state = item.obj.state ?? (await getStates(fsm._id, undefined, 1))[0]?._id

      if (state === undefined) {
        return
      }

      const firstItem = (
        await client.findAll(fsmPlugin.class.FSMItem, { state }, { sort: { rank: SortingOrder.Ascending }, limit: 1 })
      )[0]

      const rank = calcRank(undefined, firstItem)
      const doc = await client.createDoc<FSMItem>(item._class ?? fsmPlugin.class.FSMItem, space ?? fsm.space, {
        ...item.obj,
        fsm: fsm._id,
        state,
        rank: rank.toString()
      })

      return doc
    },
    moveItem: async (
      item: FSMItem,
      state: Ref<State>,
      place: {
        prev?: FSMItem
        next?: FSMItem
      }
    ): Promise<void> => {
      const rank = calcRank(place.prev, place.next).toString()

      await client.updateDoc(item._class, item.space, item._id, {
        state,
        rank
      })
    },

    addState: async (state: Omit<Data<State>, 'rank'>): Promise<State> => {
      const fsm = await getTargetFSM(state.fsm)

      if (fsm === undefined) {
        throw Error(`FSM is not found: ${state.fsm}`)
      }

      const lastState = (await getStates(fsm._id, SortingOrder.Descending, 1))[0]
      const rank = calcRank(lastState, undefined)

      return await client.createDoc(fsmPlugin.class.State, fsm.space, { ...state, rank: rank.toString() })
    },
    moveState: async (state: State, place: { prev?: State, next?: State }): Promise<void> => {
      const rank = calcRank(place.prev, place.next).toString()

      await client.updateDoc(state._class, state.space, state._id, {
        rank
      })
    },
    removeState: async (state: State): Promise<void> => {
      const fsm = await getTargetFSM(state.fsm)

      if (fsm === undefined) {
        throw Error(`FSM is not found: ${state.fsm}`)
      }

      const hasItems = (await client.findAll(fsmPlugin.class.FSMItem, { state: state._id }, { limit: 1 })).length > 0

      if (hasItems) {
        throw Error('FSM state contains items')
      }

      await client.removeDoc(fsmPlugin.class.State, state.space, state._id)
    }
  }
}
