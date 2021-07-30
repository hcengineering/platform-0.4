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
import Root from './components/internal/Root.svelte'

export * from './types'
export { applicationShortcutKey } from './utils'
export { getCurrentLocation, navigate, location } from './location'

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
export { default as CheckBox } from './components/CheckBox.svelte'
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

export { default as IconAdd } from './components/icons/Add.svelte'
export { default as IconClose } from './components/icons/Close.svelte'
export { default as IconFile } from './components/icons/File.svelte'
export { default as IconComments } from './components/icons/Comments.svelte'

export { default as MessageViewer } from './components/text/MessageViewer.svelte'
export { default as MarkdownViewer } from './components/text/MarkdownViewer.svelte'

export { default as MDRefEditor } from './components/MDRefEditor.svelte'

export { default } from './component'

export function createApp (target: HTMLElement): SvelteComponent {
  return new Root({ target })
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
