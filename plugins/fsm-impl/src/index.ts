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

import { getPlugin } from '@anticrm/platform'
import type { Class, Client, Doc, Ref, TxOperations } from '@anticrm/core'
import core from '@anticrm/core'
import type { FSM, FSMItem, FSMService, State, Transition, WithFSM } from '@anticrm/fsm'
import corePlugin from '@anticrm/plugin-core'

import fsmPlugin from './plugin'

export default async (): Promise<FSMService> => {
  const coreP = await getPlugin(corePlugin.id)
  const client = await coreP.getClient() as never as Client & TxOperations

  const getStates = async (fsm: Ref<FSM>): Promise<State[]> =>
    await client.findAll(fsmPlugin.class.State, { fsm })

  const getTransitions = async (fsm: Ref<FSM>): Promise<Transition[]> =>
    await client.findAll(fsmPlugin.class.Transition, { fsm })
      .then(xs => xs.filter((x): x is Transition => x !== undefined))

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
        obj: Omit<T, keyof Doc | 'state' | 'fsm'> & {state?: Ref<State>}
      }
    ) => {
      const fsm = await getTargetFSM(fsmOwner)

      if (fsm === undefined) {
        return
      }

      const state = item.obj.state ?? (await getStates(fsm._id))[0]._id

      return await client.createDoc<FSMItem>(item._class ?? fsmPlugin.class.FSMItem, core.space.Model, {
        ...item.obj,
        fsm: fsmOwner._id,
        state
      })
    },
    removeItem: async (item: Ref<Doc>, fsmOwner: WithFSM) => {
      const docs = await client.findAll(fsmPlugin.class.FSMItem, { item, fsm: fsmOwner._id })

      await Promise.all(docs.map(async x => await client.removeDoc(x._class, core.space.Model, x._id)))
    },
    duplicateFSM: async (fsmRef: Ref<FSM>) => {
      const fsm = (await client.findAll(fsmPlugin.class.FSM, { _id: fsmRef }))[0]

      if (fsm === undefined) {
        return undefined
      }

      const transitions = await getTransitions(fsm._id)
      const states = await getStates(fsm._id)

      const newFSM = await client.createDoc(
        fsmPlugin.class.FSM,
        core.space.Model,
        {
          ...fsm,
          isTemplate: false
        }
      )

      const stateMap = await Promise
        .all(states.map(async state => [
          state,
          await client.createDoc(
            fsmPlugin.class.State,
            core.space.Model,
            {
              ...state,
              fsm: newFSM._id
            }
          )
        ] as [State, State]))
        .then(xs => new Map(xs.map(([x, y]) => [x._id, y._id] as [Ref<State>, Ref<State>])))

      await Promise.all(transitions.map(async transition => await client.createDoc(
        fsmPlugin.class.Transition,
        core.space.Model,
        {
          ...transition,
          fsm: newFSM._id,
          from: stateMap.get(transition.from) ?? '' as Ref<State>,
          to: stateMap.get(transition.to) ?? '' as Ref<State>
        }
      )))

      return newFSM
    }
  }
}
