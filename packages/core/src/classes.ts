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

import type { IntlString, Asset } from '@anticrm/status'

/**
 * @public
 */
export type Ref<T extends Doc> = string & { __ref: T }
/**
 * @public
 */
export type FullRef<T extends Doc> = { _id: Ref<T> } & Obj
/**
 * @public
 */
export type FullRefString = string
/**
 * @public
 */
export type PrimitiveType = number | string | boolean | undefined | Ref<Doc>
/**
 * @public
 */
export type Timestamp = number

/**
 * Generic Object
 * @public
 */
export interface Obj {
  _class: Ref<Class<this>>
}

/**
 * A base class for all Documents
 * @public
 */
export interface Doc extends Obj {
  _id: Ref<this>
  space: Ref<Space>
  modifiedOn: Timestamp
  modifiedBy: Ref<Account>
  createOn: Timestamp
}

/**
 * Type of property
 * @public
 */
export type PropertyType = any

/**
 * Generic UI object
 * @public
 */
export interface UXObject extends Obj {
  label?: IntlString
  icon?: Asset
}

/**
 * @public
 */
export interface Type<T extends PropertyType> /* eslint-disable-line @typescript-eslint/no-unused-vars */
  extends UXObject {}

// C O L L E C T I O N

/**
 * Class attribute
 * @public
 */
export interface Attribute<T extends PropertyType> extends Doc, UXObject {
  attributeOf: Ref<Class<Obj>>
  name: string
  type: Type<T>
}

/**
 * Classifier kind
 * @public
 */
export enum ClassifierKind {
  CLASS,
  MIXIN
}

/**
 * Classifier base class
 * @public
 */
export interface Classifier extends Doc, UXObject {
  kind: ClassifierKind
}

/**
 * Domain type
 * @public
 */
export type Domain = string & { __domain: true }

/**
 * A class descriptor
 * @public
 */
export interface Class<T extends Obj> extends Classifier /* eslint-disable-line @typescript-eslint/no-unused-vars */ {
  extends?: Ref<Class<Obj>>
  domain?: Domain
}

/**
 * @public
 */
export type Mixin<T extends Doc> = Class<T>

// D A T A

/**
 * @public
 */
export type Data<T extends Doc> = Omit<T, keyof Doc>

// T Y P E S

/**
 * @public
 */
export interface RefTo<T extends Doc> extends Type<Ref<Class<T>>> {
  to: Ref<Class<T>>
}

/**
 * @public
 */
export type Bag<T extends PropertyType> = Record<string, T>

/**
 * @public
 */
export interface BagOf<T extends PropertyType> extends Type<Bag<T>> {
  of: Type<T>
}

/**
 * @public
 */
export type Arr<T extends PropertyType> = T[]

/**
 * @public
 */
export interface ArrOf<T extends PropertyType> extends Type<T[]> {
  of: Type<T>
}

/**
 * @public
 */
export const DOMAIN_MODEL = 'model' as Domain

// S E C U R I T Y

/**
 * @public
 */
export interface Space extends Doc {
  name: string
  description: string
  private: boolean
  members: Arr<Ref<Account>>
}

/**
 * @public
 */
export interface Account extends Doc {
  name: string // Account name, usually email field.
  firstName?: string
  lastName?: string
  avatar?: string
}
