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

import type { Class, Doc, Ref, Space } from '@anticrm/core'
import core from '@anticrm/core'
import type { FSM, FSMItem, FSMService, State, Transition, WithFSM } from '@anticrm/fsm'
import { getPlugin } from '@anticrm/platform'
import corePlugin, { Client } from '@anticrm/plugin-core'
import fsmPlugin from './plugin'

export { fsmPlugin }

export default async (): Promise<FSMService> => {
  const coreP = await getPlugin(corePlugin.id)
  const client: Client = await coreP.getClient()

  const getStates = async (fsmID: Ref<FSM>): Promise<State[]> => {
    const fsm = (await client.findAll(fsmPlugin.class.FSM, { _id: fsmID }))[0]

    if (fsm === undefined) {
      return []
    }

    const states = await client.findAll(fsmPlugin.class.State, { fsm: fsmID })

    return fsm.states.map((x) => states.find((state) => state._id === x)).filter((x): x is State => x !== undefined)
  }

  const getTransitions = async (fsm: Ref<FSM>): Promise<Transition[]> =>
    await client
      .findAll(fsmPlugin.class.Transition, { fsm })
      .then((xs) => xs.filter((x): x is Transition => x !== undefined))

  const getTargetFSM = async (fsmOwner: WithFSM): Promise<FSM | undefined> => {
    return (await client.findAll(fsmPlugin.class.FSM, { _id: fsmOwner.fsm }))[0]
  }

  return {
    getStates,
    getTransitions,
    addItem: async <T extends FSMItem>(
      fsmOwner: WithFSM,
      item: {
        _class?: Ref<Class<T>>
        obj: Omit<T, keyof Doc | 'state' | 'fsm'> & { state?: Ref<State> }
      },
      space: Ref<Space> = fsmOwner._id
    ) => {
      const fsm = await getTargetFSM(fsmOwner)

      if (fsm === undefined) {
        return
      }

      const state = item.obj.state ?? fsm.states[0]

      const doc = await client.createDoc<FSMItem>(item._class ?? fsmPlugin.class.FSMItem, space, {
        ...item.obj,
        fsm: fsmOwner._id,
        state
      })

      await client.updateDoc(fsmPlugin.class.State, core.space.Model, state, {
        $push: {
          items: doc._id
        }
      })

      return doc
    },
    moveItem: async (
      item: FSMItem,
      transition: {
        prev: Ref<State>
        actual: Ref<State>
      },
      idx: number
    ): Promise<void> => {
      const updateItems = (items: Array<Ref<FSMItem>>): Array<Ref<FSMItem>> =>
        [...items.slice(0, idx), item._id, ...items.slice(idx)].filter((x, i) => !(x === item._id && i !== idx))

      const prevState = (await client.findAll(fsmPlugin.class.State, { _id: transition.prev }))[0]
      const actualState = (await client.findAll(fsmPlugin.class.State, { _id: transition.actual }))[0]

      if (prevState === undefined || actualState === undefined) {
        return
      }

      if (prevState._id === actualState._id) {
        await client.updateDoc(fsmPlugin.class.State, core.space.Model, actualState._id, {
          items: updateItems(actualState.items)
        })

        return
      }

      await client.updateDoc(fsmPlugin.class.State, core.space.Model, prevState._id, {
        items: prevState.items.filter((x) => x !== item._id)
      })

      await client.updateDoc(fsmPlugin.class.State, core.space.Model, actualState._id, {
        items: updateItems(actualState.items)
      })

      await client.updateDoc(item._class, item.space, item._id, {
        state: actualState._id
      })
    },
    duplicateFSM: async (fsmRef: Ref<FSM>) => {
      const fsm = (await client.findAll(fsmPlugin.class.FSM, { _id: fsmRef }))[0]

      if (fsm === undefined) {
        return undefined
      }

      const transitions = await getTransitions(fsm._id)
      const states = await getStates(fsm._id)

      const cleanupModel = <T extends Doc>(x: T): Omit<T, '_id' | 'modifiedBy' | 'modifiedOn' | 'createOn'> =>
        Object.entries(x)
          .filter(([k]) => !['_id', 'modifiedBy', 'modifiedOn', 'createOn'].includes(k))
          .reduce<any>((o, [k, v]) => ({ ...o, [k]: v }), {})

      const newFSM = await client.createDoc(fsmPlugin.class.FSM, core.space.Model, {
        ...cleanupModel(fsm),
        isTemplate: false
      })

      const stateMap = await Promise.all(
        states.map(
          async (state) =>
            [
              state,
              await client.createDoc(fsmPlugin.class.State, core.space.Model, {
                ...cleanupModel(state),
                fsm: newFSM._id
              })
            ] as [State, State]
        )
      ).then((xs) => new Map(xs.map(([x, y]) => [x._id, y._id] as [Ref<State>, Ref<State>])))

      await client.updateDoc(fsmPlugin.class.FSM, core.space.Model, newFSM._id, {
        states: fsm.states.map((x) => stateMap.get(x)).filter((x): x is Ref<State> => x !== undefined)
      })

      await Promise.all(
        transitions.map(
          async (transition) =>
            await client.createDoc(fsmPlugin.class.Transition, core.space.Model, {
              ...cleanupModel(transition),
              fsm: newFSM._id,
              from: stateMap.get(transition.from) ?? ('' as Ref<State>),
              to: stateMap.get(transition.to) ?? ('' as Ref<State>)
            })
        )
      )

      return newFSM
    }
  }
}
