//
// Copyright © 2020 Anticrm Platform Contributors.
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

import { SvelteComponent } from 'svelte'
import type { AnyComponent, AnySvelteComponent } from './types'
import { store } from './stores'

import Root from './components/internal/Root.svelte'

export type { AnyComponent, Action } from './types'
export { applicationShortcutKey } from './utils'

export { default as EditBox } from './components/EditBox.svelte'
export { default as Label } from './components/Label.svelte'
export { default as Button } from './components/Button.svelte'
export { default as StatusControl } from './components/StatusControl.svelte'
export { default as Component } from './components/Component.svelte'
export { default as Icon } from './components/Icon.svelte'
export { default as ActionIcon } from './components/ActionIcon.svelte'
export { default as Toggle } from './components/Toggle.svelte'
export { default as Dialog } from './components/Dialog.svelte'
export { default as ToggleWithLabel } from './components/ToggleWithLabel.svelte'
export { default as Tooltip } from './components/Tooltip.svelte'

export { default as IconAdd } from './components/icons/Add.svelte'

export function createApp (target: HTMLElement): SvelteComponent {
  return new Root({ target })
}

export function showModal (component: AnySvelteComponent | AnyComponent, props: any, element?: HTMLElement): void {
  store.set({ is: component, props, element: element })
}

export function closeModal (): void {
  store.set({ is: undefined, props: {}, element: undefined })
}

// let documentProvider: DocumentProvider | undefined

// async function open (doc: Document): Promise<void> {
//   if (documentProvider != null) {
//     return await documentProvider.open(doc)
//   }
//   return await Promise.reject(new Error('Document provider is not registred'))
// }

// function selection (): Document | undefined {
//   if (documentProvider != null) {
//     return documentProvider.selection()
//   }
//   return undefined
// }

// function registerDocumentProvider (provider: DocumentProvider): void {
//   documentProvider = provider
// }
