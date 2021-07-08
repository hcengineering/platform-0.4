//
// Copyright © 2020, 2021 Anticrm Platform Contributors.
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

import { plugin } from '@anticrm/platform'
import type { Plugin, Service } from '@anticrm/platform'
import type { Doc, Ref, Class } from '@anticrm/core'
import type { Application } from '@anticrm/workbench'

export interface FSM extends Doc {
  name: string
  application: Ref<Application>
  isTemplate: boolean
}

export interface Transition extends Doc {
  from: Ref<State>
  to: Ref<State>
  fsm: Ref<FSM>
}

export interface WithFSM extends Doc {
  fsm: Ref<FSM>
}

export interface FSMItem extends Doc {
  fsm: Ref<WithFSM>
  state: Ref<State>
  item: Ref<Doc> // TODO: Should be Ref<VDoc>, update as soon as it be introduced
  clazz: Ref<Class<Doc>>
}

export interface State extends Doc {
  name: string
  fsm: Ref<FSM>
}

export interface FSMService extends Service {
  getStates: (fsm: Ref<FSM>) => Promise<State[]>
  getTransitions: (fsm: Ref<FSM>) => Promise<Transition[]>

  removeItem: (item: Ref<Doc>, fsmOwner: WithFSM) => Promise<void>
  addItem: <T extends FSMItem>(fsmOwner: WithFSM, item: {
    _class?: Ref<Class<T>>
    obj: Omit<T, keyof Doc | 'state' | 'fsm'> & {state?: Ref<State>}
  }) => Promise<FSMItem | undefined>

  duplicateFSM: (fsm: Ref<FSM>) => Promise<FSM | undefined>
}

const PluginMeeting = 'fsm' as Plugin<FSMService>

export default plugin(PluginMeeting, {}, {})
