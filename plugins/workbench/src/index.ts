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

import { getContext } from 'svelte'

import type { IntlString, Asset } from '@anticrm/status'
import type { Ref, Class, Doc, Space } from '@anticrm/core'
import type { Service, Plugin } from '@anticrm/platform'
import type { PresentationClient } from '@anticrm/presentation'
import type { AnyComponent, AnySvelteComponent } from '@anticrm/ui'

import { plugin } from '@anticrm/platform'
import { CompAndProps, store } from './stores'

/**
 * @public
 */
export interface Application extends Doc {
  label: IntlString
  icon: Asset
  navigatorModel?: NavigatorModel
}

/**
 * @public
 */
export interface SpacesNavModel {
  label: IntlString
  spaceIcon: Asset
  spaceClass: Ref<Class<Space>>
  addSpaceLabel: IntlString
  createComponent: AnyComponent
  notificationObjectClass?: Ref<Class<Doc>>
  component?: AnyComponent
}

/**
 * @public
 */
export interface NavigatorModel {
  spaces: SpacesNavModel[]
  spaceView: AnyComponent
  createComponent?: AnyComponent
  editComponent?: AnyComponent
}

/**
 * @public
 */
export interface WorkbenchService extends Service {}

const PluginWorkbench = 'workbench' as Plugin<WorkbenchService>

/**
 * @public
 */
const workbench = plugin(
  PluginWorkbench,
  {},
  {
    context: {
      Client: ''
    },
    class: {
      Application: '' as Ref<Class<Application>>
    },
    string: {
      Logout: '' as IntlString,
      Profile: '' as IntlString
    }
  }
)

/**
 * @public
 */
export function getClient (): PresentationClient {
  return getContext<PresentationClient>(workbench.context.Client)
}

/**
 * @public
 */
export function showModal (component: AnySvelteComponent | AnyComponent, props: any, element?: HTMLElement): void {
  store.set({ is: component, props, element: element })
}

/**
 * @public
 */
export function closeModal (): void {
  store.set({ is: undefined, props: {}, element: undefined })
}

/**
 * @public
 */
export { store, CompAndProps }

/**
 * @public
 */
export default workbench
