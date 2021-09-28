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

import { DOMAIN_MODEL } from '@anticrm/core'
import type { Class, Doc, Domain, Ref } from '@anticrm/core'
import type { FSM, FSMItem, State, Transition, WithFSM } from '@anticrm/fsm'
import fsmPlugin from '@anticrm/fsm'
import { Builder, Model } from '@anticrm/model'
import core, { TDoc, TSpace } from '@anticrm/model-core'
import type { Action } from '@anticrm/action-plugin'

const DOMAIN_FSM = 'fsm' as Domain

/**
 * @public
 */
@Model(fsmPlugin.class.FSM, core.class.Doc, DOMAIN_MODEL)
export class TFSM extends TDoc implements FSM {
  name!: string
  clazz!: Ref<Class<Doc>>
  isTemplate!: boolean
}

/**
 * @public
 */
@Model(fsmPlugin.class.FSMItem, core.class.Doc, DOMAIN_FSM)
export class TFSMItem extends TDoc implements FSMItem {
  fsm!: Ref<WithFSM>
  state!: Ref<State>
  item!: Ref<Doc>
  clazz!: Ref<Class<Doc>>
}

/**
 * @public
 */
@Model(fsmPlugin.class.State, core.class.Doc, DOMAIN_MODEL)
export class TState extends TDoc implements State {
  name!: string
  color!: string
  fsm!: Ref<FSM>
  optionalActions!: Ref<Action>[]
  requiredActions!: Ref<Action>[]
}

/**
 * @public
 */
@Model(fsmPlugin.class.Transition, core.class.Doc, DOMAIN_MODEL)
export class TTransition extends TDoc implements Transition {
  from!: Ref<State>
  to!: Ref<State>
  fsm!: Ref<FSM>
}

/**
 * @public
 */
@Model(fsmPlugin.class.WithFSM, core.class.Space)
export class TWithFSM extends TSpace implements WithFSM {
  fsm!: Ref<FSM>
}

/**
 * @public
 */
export function createModel (builder: Builder): void {
  builder.createModel(TFSM, TState, TTransition, TFSMItem, TWithFSM)
}

/**
 * @public
 */
export type PureState = Omit<State, keyof Doc | 'fsm' | 'color'> & {
  color?: string
}

/**
 * @public
 */
export class FSMBuilder {
  private readonly states = new Map<string, PureState>()
  private readonly transitions: Array<[string, string]> = []
  private readonly ids = new Set<Ref<Doc>>()

  constructor (readonly name: string, readonly clazz: Ref<Class<Doc>>, readonly fsmId: Ref<FSM>) {}

  private getState (a: PureState): PureState | undefined {
    if (!this.states.has(a.name)) {
      this.states.set(a.name, a)
    }

    return this.states.get(a.name)
  }

  private _transition (a: PureState, b: PureState): FSMBuilder {
    const existingA = this.getState(a)
    const existingB = this.getState(b)

    if (existingA == null || existingB == null) {
      return this
    }

    this.transitions.push([existingA.name, existingB.name])

    return this
  }

  transition (a: PureState, b: PureState | PureState[]): FSMBuilder {
    ;(Array.isArray(b) ? b : [b]).forEach((x) => this._transition(a, x))

    return this
  }

  private readonly genColor = (function * defaultColors () {
    while (true) {
      yield * [
        'var(--primary-color-pink)',
        'var(--primary-color-purple-01)',
        'var(--primary-color-orange-01)',
        'var(--primary-color-skyblue)',
        'var(--primary-color-purple-02)',
        'var(--primary-color-orange-02)',
        'var(--primary-color-purple-03)'
      ]
    }
  })()

  makeId<T extends Doc>(key: string, name: string): Ref<T> {
    const id = (this.fsmId + `-${key}-` + name.toLowerCase()) as Ref<T>
    if (this.ids.has(id)) {
      throw new Error(`Non uniq ID for FSM detected:${id}, ${Array.from(this.ids.keys()).toString()}`)
    }
    this.ids.add(id)
    return id
  }

  build (S: Builder): Ref<FSM> {
    S.createDoc(
      fsmPlugin.class.FSM,
      {
        name: this.name,
        clazz: this.clazz,
        isTemplate: true
      },
      this.fsmId
    )

    const stateIDs = new Map<string, Ref<State>>()

    this.states.forEach((state) => {
      const color = state.color ?? this.genColor.next().value
      const sID: Ref<State> = this.makeId('st', state.name)
      S.createDoc(
        fsmPlugin.class.State,
        {
          ...state,
          color,
          fsm: this.fsmId
        },
        sID
      )

      stateIDs.set(state.name, sID)
    })

    const transitions: Array<Ref<Transition>> = []

    this.transitions.forEach(([fromName, toName]) => {
      const from = stateIDs.get(fromName)
      const to = stateIDs.get(toName)

      if (from == null || to == null) {
        return
      }

      const tID: Ref<Transition> = this.makeId('tr', fromName + '-' + toName)
      S.createDoc(
        fsmPlugin.class.Transition,
        {
          from,
          to,
          fsm: this.fsmId
        },
        tID
      )

      transitions.push(tID)
    })

    return this.fsmId
  }
}

/**
 * @public
 */
export const templateFSM = (name: string, clazz: Ref<Class<Doc>>, fsmId: Ref<FSM>): FSMBuilder =>
  new FSMBuilder(name, clazz, fsmId)
