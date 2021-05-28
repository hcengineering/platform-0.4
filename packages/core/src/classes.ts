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

import type { KeysByType } from 'simplytyped'
import type { IntlString, Asset } from '@anticrm/status'

export type PrimitiveType = number | string | boolean | undefined

export type Ref<T extends Doc> = string & { __ref: T }

export interface Obj {
  _class: Ref<Class<this>>
}

export interface Emb extends Obj {
  __embedded: this
}

export interface Doc extends Obj {
  _id: Ref<this>
  _mixins?: Array<Ref<Mixin<Doc>>>
}

export type EmbType = PrimitiveType | Emb | Ref<Doc>
export type PropertyType = EmbType | Collection<Emb> | Record<string, EmbType>

export interface UXObject extends Obj {
  label?: IntlString
  icon?: Asset
}

export interface Type<T extends PropertyType> extends Emb, UXObject {
}

// C O L L E C T I O N


export interface Collection<T extends Emb> {
  __collection: T
}

export type WithoutCollections<T extends Doc> = Omit<T, KeysByType<T, Collection<Emb>>>

export interface CollectionOf<T extends Emb> extends Type<Collection<T>> {

}

export interface Attribute<T extends PropertyType> extends Emb, UXObject {
  type: Type<T>
}

export enum ClassifierKind {
  CLASS,
  MIXIN,
}

export interface Classifier extends Doc, UXObject {
  kind: ClassifierKind
}

export type Domain = string & { __domain: true }

export interface Class<T extends Obj> extends Classifier {
  attributes: Collection<Attribute<PropertyType>>
  extends?: Ref<Class<Obj>>
  domain?: Domain
}

export type Mixin<T extends Doc> = Class<T>

// D A T A

export type Data<T extends Doc> = Omit<WithoutCollections<T>, keyof Doc>

// T Y P E S

export interface RefTo<T extends Doc> extends Type<Ref<Class<T>>> {
  to: Ref<Class<T>>
}

export interface BagOf extends Type<Record<string, EmbType>> {
  of: Type<EmbType>
}

export const DOMAIN_MODEL = 'model' as Domain
