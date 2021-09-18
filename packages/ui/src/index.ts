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

import type { UIComponent } from '@anticrm/status'
import Root from './components/internal/Root.svelte'

import type { IntlString } from '@anticrm/platform'
import { writable } from 'svelte/store'
import type { LabelAndProps, TooltipAligment, PopupAlignment } from './types'

export * from './types'
export { applicationShortcutKey, defaultApplicationShortcutKey } from './utils'
export * from './location'
export * from './router'

export { default as EditBox } from './components/EditBox.svelte'
export { default as EditWithIcon } from './components/EditWithIcon.svelte'
export { default as StylishEdit } from './components/StylishEdit.svelte'
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
export { default as CheckBox } from './components/CheckBox.svelte'
export { default as CheckBoxList } from './components/CheckBoxList.svelte'
export { default as CheckBoxWithLabel } from './components/CheckBoxWithLabel.svelte'
export { default as Progress } from './components/Progress.svelte'
export { default as Tabs } from './components/Tabs.svelte'
export { default as ScrollBox } from './components/ScrollBox.svelte'
export { default as PopupMenu } from './components/PopupMenu.svelte'
export { default as PopupItem } from './components/PopupItem.svelte'
export { default as SelectBox } from './components/SelectBox.svelte'
export { default as SelectItem } from './components/SelectItem.svelte'
export { default as UserInfo } from './components/UserInfo.svelte'
export { default as UserBox } from './components/UserBox.svelte'
export { default as TextArea } from './components/TextArea.svelte'
export { default as CompletionPopup } from './components/CompletionPopup.svelte'
export { default as Table } from './components/Table.svelte'
export { default as Kanban } from './components/kanban/Kanban.svelte'
export { default as DatePicker } from './components/DatePicker.svelte'
export { default as Section } from './components/Section.svelte'
export { default as Grid } from './components/Grid.svelte'
export { default as Row } from './components/Row.svelte'
export { default as DateTime } from './components/DateTime.svelte'
export { default as Splitter } from './components/Splitter.svelte'
export { default as TooltipInstance } from './components/TooltipInstance.svelte'
export { default as Popup } from './components/Popup.svelte'
export { default as IconGroup } from './components/IconGroup.svelte'
export { default as Dropdown } from './components/Dropdown.svelte'
export { default as PersonSummary } from './components/PersonSummary.svelte'

export { default as IconAdd } from './components/icons/Add.svelte'
export { default as IconEdit } from './components/icons/Edit.svelte'
export { default as IconClose } from './components/icons/Close.svelte'
export { default as IconFile } from './components/icons/File.svelte'
export { default as IconComments } from './components/icons/Comments.svelte'
export { default as IconToDo } from './components/icons/ToDo.svelte'
export { default as IconSearch } from './components/icons/Search.svelte'
export { default as IconProjectFolder } from './components/icons/ProjectFolder.svelte'
export { default as IconPerson } from './components/icons/Person.svelte'
export { default as IconMoreV } from './components/icons/MoreV.svelte'
export { default as IconList } from './components/icons/List.svelte'
export { default as IconCard } from './components/icons/Card.svelte'
export { default as IconKanban } from './components/icons/Kanban.svelte'

export { default as MessageViewer } from './components/text/MessageViewer.svelte'
export { default as MarkdownViewer } from './components/text/MarkdownViewer.svelte'

export { default as MDRefEditor } from './components/MDRefEditor.svelte'

export { default } from './component'

export function createApp (target: HTMLElement): UIComponent {
  return new Root({ target })
}

interface CompAndProps {
  is: UIComponent
  props: any
  element?: PopupAlignment
  onClose?: (result: any) => void
}

export const popupstore = writable<CompAndProps[]>([])

export function showPopup (
  component: UIComponent,
  props: any,
  element?: PopupAlignment,
  onClose?: (result: any) => void
): void {
  popupstore.update((popups) => {
    popups.push({ is: component, props, element, onClose })
    return popups
  })
}

export function closePopup (): void {
  popupstore.update((popups) => {
    popups.pop()
    return popups
  })
}

export const tooltipstore = writable<LabelAndProps>({
  label: undefined,
  element: undefined,
  direction: undefined
})

export function showTooltip (label: IntlString, element: HTMLElement, direction?: TooltipAligment): void {
  tooltipstore.set({ label: label, element: element, direction: direction })
}

export function closeTooltip (): void {
  tooltipstore.set({ label: undefined, element: undefined, direction: undefined })
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
