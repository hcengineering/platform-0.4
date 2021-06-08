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

import type {
  Ref,
  Doc,
  Type,
  PropertyType,
  Attribute,
  Tx,
  Class,
  Obj,
  Data,
  TxAddCollection,
  TxCreateDoc,
  Domain
} from '@anticrm/core'
import { ClassifierKind, generateId, makeEmb, Hierarchy, DOMAIN_MODEL } from '@anticrm/core'
import toposort from 'toposort'

import core from './component'

type NoIDs<T extends Tx> = Omit<T, '_id' | 'objectId'>

interface ClassTxes {
  _id: Ref<Doc>
  extends?: Ref<Class<Obj>>
  domain?: string
  txes: NoIDs<Tx>[]
}

const transactions = new Map<any, ClassTxes>()

function getTxes (target: any): ClassTxes {
  const txes = transactions.get(target)
  if (txes === undefined) {
    const txes = { txes: [] } as unknown as ClassTxes
    transactions.set(target, txes)
    return txes
  }
  return txes
}

export function Prop (type: Type<PropertyType>) {
  return function (target: any, propertyKey: string): void {
    const txes = getTxes(target)
    const tx: NoIDs<TxAddCollection<Attribute<PropertyType>>> = {
      _class: core.class.TxAddCollection,
      domain: DOMAIN_MODEL,
      collection: 'attributes',
      localId: propertyKey,
      attributes: makeEmb(core.class.Attribute, { type })
    }
    txes.txes.push(tx)
  }
}

export function Model<T extends Obj> (
  _class: Ref<Class<T>>,
  _extends: Ref<Class<Obj>>, 
  domain?: string
) {
  return function classDecorator<C extends new () => T> (constructor: C): void {
    const txes = getTxes(constructor.prototype)
    txes._id = _class
    txes.extends = _class !== core.class.Obj ? _extends : undefined
    txes.domain = domain
  }
}

function generateIds (objectId: Ref<Doc>, txes: NoIDs<Tx>[]): Tx[] {
  return txes.map((tx) => ({
    _id: generateId<Tx>(),
    objectId,
    ...tx
  }))
}

function txCreateDoc<T extends Doc> (_class: Ref<Class<T>>, domain: Domain, attributes: Data<T>, objectId?: Ref<T>): TxCreateDoc<T> {
  return {
    _id: generateId<TxCreateDoc<T>>(),
    _class: core.class.TxCreateDoc,
    domain,
    objectId: objectId ?? generateId(),
    objectClass: _class,
    attributes
  }
}

function _generateTx (tx: ClassTxes): Tx[] {
  const objectId = tx._id
  const createTx = txCreateDoc(core.class.Class, DOMAIN_MODEL, {
    domain: tx.domain,
    kind: ClassifierKind.CLASS,
    extends: tx.extends
  }, objectId)
  return [createTx, ...generateIds(objectId, tx.txes)]
}

export class Builder {
  private readonly txes: Tx[] = []
  private readonly hierarchy = new Hierarchy()

  createModel (...classes: (new () => Obj)[]): void {
    const txes = classes.map((ctor) => getTxes(ctor.prototype))
    const byId = new Map<string, ClassTxes>()
    txes.forEach((tx) => {byId.set(tx._id, tx)})
    const graph = txes.map(tx => [tx._id, tx.extends] as [string, string | undefined])
    const sortedGraph = toposort(graph).reverse()
    const sorted = sortedGraph.map(edge => byId.get(edge))
    const generated = sorted.flatMap(tx => tx ? _generateTx(tx): [])

    for(const tx of generated) {
      this.txes.push(tx)
      this.hierarchy.tx(tx)  
    }
  }

  createDoc<T extends Doc> (_class: Ref<Class<T>>, attributes: Data<T>, objectId?: Ref<T>): void {
    this.txes.push(txCreateDoc(_class, this.hierarchy.getDomain(_class), attributes, objectId))
  }

  getTxes(): Tx[] { return this.txes }
  
}


// T Y P E S

export function TypeString (): Type<string> {
  return makeEmb(core.class.TypeString, {})
}
