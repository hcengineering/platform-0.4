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

import type { AnyComponent, Resource } from '@anticrm/status'
import { Class, Doc, Ref } from './classes'

/**
 * Define an presentation format.
 *
 *  Link - define and presentatio of link and some basic status.
 *  Preview - define an presentation with mode details.
 *  Edit - a sidebar edit component mode
 * @public
 */
export enum PresentationMode {
  Link,
  Preview,
  Edit
}
/**
 * Define one presentatopwdn format for document instance.
 * @public
 */
export interface PresentationFormat {
  // A short description for presentation format
  description: string

  // if edit is true and mode is Link - a link itself should be editable.
  // overvise it should allow to edit an document we point on.
  mode: PresentationMode

  // define a component to be inserted into UI model
  component: AnyComponent
}

/**
 * @public
 */
export type DocumentLinkHandler = Resource<(objectClass: Ref<Class<Doc>>, objectId: Ref<Doc>) => Promise<void>>
/**
 * Define a set of presentation formats for document instance.
 * @public
 */
export interface DocumentPresenter<T extends Doc> extends Doc {
  // For all classes based on specified.
  objectClass: Ref<Class<T>>

  // An presentation format definition
  presentation: PresentationFormat[]

  // Handler to open link of this document format type.
  linkHandler?: DocumentLinkHandler
}
