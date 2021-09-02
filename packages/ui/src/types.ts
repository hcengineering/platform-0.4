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

import { /* Metadata, Plugin, plugin, */ Resource /*, Service */ } from '@anticrm/status'
import { /* getContext, */ SvelteComponent } from 'svelte'
import type { Asset, IntlString } from '@anticrm/status'

export type { Asset }

export type AnySvelteComponent = typeof SvelteComponent

export type Component<C extends AnySvelteComponent> = Resource<C>
export type AnyComponent = Resource<AnySvelteComponent>

export const CONTEXT_PLATFORM = 'platform'
export const CONTEXT_PLATFORM_UI = 'platform-ui'

export interface Document {} // eslint-disable-line @typescript-eslint/no-empty-interface

/**
 * Allow to control currently selected document.
 */
export interface DocumentProvider {
  /**
   * Opening a document
   * */
  open: (doc: Document) => Promise<void>

  /**
   * Return currently selected document, if one.
   */
  selection: () => Document | undefined
}

export interface Action {
  label: IntlString
  icon: Asset | AnySvelteComponent
  action: () => Promise<void>
}

export interface IPopupItem {
  _id?: number
  title?: IntlString
  component?: AnySvelteComponent
  props?: Object
  selected?: boolean
  action?: Function
  onDeselect?: Function
  matcher?: (search: string) => boolean
}

export interface CheckListItem {
  description: string
  done: boolean
}

export interface CompletionItem {
  key: string
  completion: string
  label: string
  title?: string
}

export interface CompletionPopupActions {
  handleUp: () => void
  handleDown: () => void
  handleSubmit: () => void
}

export interface ItemRefefence {
  id: string
  class: string
}

export interface ExtendedCompletionItem extends CompletionItem, ItemRefefence {}
