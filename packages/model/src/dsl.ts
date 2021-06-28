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

import type { Ref, Doc, Type, PropertyType, Attribute, Tx, Class, Obj, Data, TxCreateDoc, Domain } from '@anticrm/core'
import { ClassifierKind, generateId, Hierarchy, DOMAIN_MODEL } from '@anticrm/core'
import toposort from 'toposort'

import core from './component'

type NoIDs<T extends Tx> = Omit<T, '_id' | 'objectId'>

interface ClassTxes {
  _id: Ref<Class<Obj>>
  extends?: Ref<Class<Obj>>
  domain?: Domain
  txes: Array<NoIDs<Tx>>
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
    const tx: NoIDs<TxCreateDoc<Attribute<PropertyType>>> = {
      _class: core.class.TxCreateDoc,
      space: core.space.Tx,
      modifiedBy: core.account.System,
      modifiedOn: 0,
      objectSpace: core.space.Model,
      objectClass: core.class.Attribute,
      attributes: {
        type,
        name: propertyKey,
        attributeOf: txes._id
      }
    }
    txes.txes.push(tx)
  }
}

export function Model<T extends Obj> (
  _class: Ref<Class<T>>,
  _extends: Ref<Class<Obj>>,
  domain?: Domain
) {
  return function classDecorator<C extends new () => T> (constructor: C): void {
    const txes = getTxes(constructor.prototype)
    txes._id = _class
    txes.extends = _class !== core.class.Obj ? _extends : undefined
    txes.domain = domain
  }
}

function generateIds (objectId: Ref<Doc>, txes: Array<NoIDs<Tx>>): Tx[] {
  return txes.map((tx) => ({
    _id: generateId<Tx>(),
    objectId,
    ...tx
  }))
}

function txCreateDoc<T extends Doc> (
  _class: Ref<Class<T>>,
  domain: Domain,
  attributes: Data<T>,
  objectId?: Ref<T>
): TxCreateDoc<T> {
  return {
    _id: generateId<TxCreateDoc<T>>(),
    _class: core.class.TxCreateDoc,
    space: core.space.Tx,
    modifiedBy: core.account.System,
    modifiedOn: 0,
    objectId: objectId ?? generateId(),
    objectClass: _class,
    objectSpace: core.space.Model,
    attributes
  }
}

function _generateTx (tx: ClassTxes): Tx[] {
  const objectId = tx._id
  const createTx = txCreateDoc(
    core.class.Class,
    DOMAIN_MODEL,
    {
      domain: tx.domain,
      kind: ClassifierKind.CLASS,
      extends: tx.extends
    },
    objectId
  )
  return [createTx, ...generateIds(objectId, tx.txes)]
}

export class Builder {
  private readonly txes: Tx[] = []
  private readonly hierarchy = new Hierarchy()

  createModel (...classes: Array<new () => Obj>): void {
    const txes = classes.map((ctor) => getTxes(ctor.prototype))
    const byId = new Map<string, ClassTxes>()

    txes.forEach((tx) => {
      byId.set(tx._id, tx)
    })

    const generated = this.generateTransactions(txes, byId)

    for (const tx of generated) {
      this.txes.push(tx)
      this.hierarchy.tx(tx)
    }
  }

  private generateTransactions (txes: ClassTxes[], byId: Map<string, ClassTxes>): Tx[] {
    const graph = this.createGraph(txes)
    const sorted = toposort(graph)
      .reverse()
      .map((edge) => byId.get(edge))
    return sorted.flatMap((tx) => (tx != null ? _generateTx(tx) : []))
  }

  private createGraph (txes: ClassTxes[]): [string, string | undefined][] {
    return txes.map((tx) => [tx._id, tx.extends] as [string, string | undefined])
  }

  createDoc<T extends Doc>(_class: Ref<Class<T>>, attributes: Data<T>, objectId?: Ref<T>): void {
    this.txes.push(txCreateDoc(_class, this.hierarchy.getDomain(_class), attributes, objectId))
  }

  getTxes (): Tx[] {
    return this.txes
  }
}

// T Y P E S

export function TypeString (): Type<string> {
  return { _class: core.class.TypeString }
}
