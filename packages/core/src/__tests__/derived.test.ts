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

import { Component, component, Resource } from '@anticrm/status'
import { describe, it } from '@jest/globals'
import { Storage, TxCreateDoc, TxOperations, TxProcessor, TxUpdateDoc, withOperations } from '..'
import { Class, Doc, Ref } from '../classes'
import core from '../component'
import { DerivedData, DerivedDataDescriptor, DerivedDataProcessor, DocumentMapper, registerMapper } from '../derived'
import { newDerivedData } from '../derived/utils'
import { Hierarchy } from '../hierarchy'
import { ModelDb } from '../memdb'
import { Title } from '../title'
import { Tx } from '../tx'
import { createClass, createDoc, genMinModel } from './minmodel'

const txes = genMinModel()

interface Task extends Doc {
  shortId: string
  title: string
  description: string
}

interface Message extends Doc {
  message: string
}

interface Page extends Doc {
  name: string
  description: string
}

const testIds = component('test' as Component, {
  class: {
    Task: '' as Ref<Class<Task>>,
    Message: '' as Ref<Class<Message>>,
    Page: '' as Ref<Class<Page>>
  },
  mapper: {
    PageTitleMapper: '' as Resource<DocumentMapper>
  }
})

const dtxes = [
  ...txes,
  createClass(core.class.DerivedData, { extends: core.class.Doc }),
  createClass(core.class.DerivedDataDescriptor, { extends: core.class.Doc }),
  createClass(core.class.Title, { extends: core.class.DerivedData }),
  createClass(core.class.Reference, { extends: core.class.DerivedData }),

  // Test ids
  createClass(testIds.class.Task, { extends: core.class.Doc }),
  createClass(testIds.class.Message, { extends: core.class.Doc }),
  createClass(testIds.class.Page, { extends: core.class.Doc })
]

registerMapper(testIds.mapper.PageTitleMapper, {
  map: async (tx, options): Promise<DerivedData[]> => {
    switch (tx._class) {
      case core.class.TxCreateDoc: {
        const ctx = tx as TxCreateDoc<Doc>
        if (ctx.objectClass === testIds.class.Page) {
          const doc = TxProcessor.createDoc2Doc(ctx) as Page
          const data = newDerivedData<Title>(doc, options.descriptor)
          data.title = '#-' + doc.name
          return [data]
        }
        break
      }
      case core.class.TxUpdateDoc: {
        const ctx = tx as TxUpdateDoc<Doc>
        if (ctx.objectClass === testIds.class.Page) {
          const doc = (await options.storage.findAll(ctx.objectClass, { _id: ctx.objectId }))[0] as Page
          const data = newDerivedData<Title>(doc, options.descriptor)
          data.title = '#-' + doc.name
          return [data]
        }
        break
      }
    }
    return []
  }
})

interface Counter {
  txes: number
}

const taskTitleDD = createDoc<DerivedDataDescriptor<Task, Title>>(core.class.DerivedDataDescriptor, {
  sourceClass: testIds.class.Task,
  targetClass: core.class.Title,
  initiValue: {},
  rules: [{ sourceField: 'shortId', targetField: 'title' }]
})
const pageTitleDD = createDoc<DerivedDataDescriptor<Task, Title>>(core.class.DerivedDataDescriptor, {
  sourceClass: testIds.class.Page,
  targetClass: core.class.Title,
  mapper: testIds.mapper.PageTitleMapper
})

describe('deried data', () => {
  async function prepare (
    txes: Tx[]
  ): Promise<{
      hierarchy: Hierarchy
      model: ModelDb
      processor: DerivedDataProcessor
      operations: Storage & TxOperations
      storage: Storage
      counter: Counter
    }> {
    const hierarchy = new Hierarchy()
    for (const tx of txes) hierarchy.tx(tx)
    const model = new ModelDb(hierarchy)
    for (const tx of txes) await model.tx(tx)

    const countModel: Storage = {
      findAll: async (_class, query) => await model.findAll(_class, query),
      tx: async (tx) => {
        await model.tx(tx)
        counter.txes += 1
      }
    }

    const processor = await DerivedDataProcessor.create(model, hierarchy, countModel)

    const counter = { txes: 0 }
    const storage: Storage = {
      findAll: async (_class, query) => await model.findAll(_class, query),
      tx: async (tx) => {
        hierarchy.tx(tx)
        await countModel.tx(tx)
        await processor.tx(tx)
      }
    }

    const operations = withOperations(core.account.System, storage)
    return { hierarchy, model, processor, operations, storage, counter }
  }

  it('check DD appear after being added', async () => {
    // We need few descriptors to be available

    const { operations, model, storage } = await prepare([...dtxes])

    await operations.createDoc(testIds.class.Task, core.space.Model, {
      title: 'my-task',
      shortId: 'T-101',
      description: ''
    })

    // Add descriptor
    await storage.tx(taskTitleDD)

    // Check for Title to be created

    const titles = await model.findAll(core.class.Title, {})
    expect(titles.length).toEqual(1)
    expect(titles[0].title).toEqual('T-101')
  })

  it('check DD  updatedappear after being updated', async () => {
    // We need few descriptors to be available

    const { operations, model, storage } = await prepare([...dtxes, taskTitleDD])

    await operations.createDoc(testIds.class.Task, core.space.Model, {
      title: 'my-task',
      shortId: 'T-101',
      description: ''
    })

    // Add descriptor
    await storage.tx(taskTitleDD)

    // Check for Title to be created

    let titles = await model.findAll(core.class.Title, {})
    expect(titles.length).toEqual(1)
    expect(titles[0].title).toEqual('T-101')

    await operations.updateDoc<DerivedDataDescriptor<Doc, DerivedData>>(
      core.class.DerivedDataDescriptor,
      core.space.Model,
      taskTitleDD.objectId as Ref<DerivedDataDescriptor<Doc, DerivedData>>,
      {
        rules: [{ sourceField: 'title', targetField: 'title' }]
      }
    )
    titles = await model.findAll(core.class.Title, {})
    expect(titles.length).toEqual(1)
    expect(titles[0].title).toEqual('my-task')
  })

  it('check task update not modify titles', async () => {
    // We need few descriptors to be available

    const { operations, model, counter } = await prepare([...dtxes, taskTitleDD])

    const doc1 = await operations.createDoc(testIds.class.Task, core.space.Model, {
      title: 'my-task',
      shortId: 'T-101',
      description: ''
    })

    // Check for Title to be created

    const titles = await model.findAll(core.class.Title, {})
    expect(titles.length).toEqual(1)
    expect(titles[0].title).toEqual('T-101')

    expect(counter.txes).toEqual(2) // 1 - create Doc, 2 - create title
    await operations.updateDoc(testIds.class.Task, core.space.Model, doc1._id, {
      description: 'some-descr'
    })
    expect(counter.txes).toEqual(3) // 3 - update doc
  })

  it('check add descriptor causes reindex', async () => {
    // We need few descriptors to be available

    const { operations, model, counter } = await prepare([...dtxes, taskTitleDD])

    const doc1 = await operations.createDoc(testIds.class.Task, core.space.Model, {
      title: 'my-task',
      shortId: 'T-101',
      description: ''
    })

    // Check for Title to be created

    const titles = await model.findAll(core.class.Title, {})
    expect(titles.length).toEqual(1)
    expect(titles[0].title).toEqual('T-101')

    expect(counter.txes).toEqual(2) // 1 - create Doc, 2 - create title
    await operations.updateDoc(testIds.class.Task, core.space.Model, doc1._id, {
      description: 'some-descr'
    })
    expect(counter.txes).toEqual(3) // 3 - update doc
  })

  it('create title for page', async () => {
    // We need few descriptors to be available

    const { operations, model } = await prepare([...dtxes, pageTitleDD])

    const doc1 = await operations.createDoc(testIds.class.Page, core.space.Model, {
      name: 'T-101',
      description: ''
    })

    // Check for Title to be created

    let titles = await model.findAll(core.class.Title, {})
    expect(titles.length).toEqual(1)
    expect(titles[0].title).toEqual('#-T-101')

    await operations.updateDoc(testIds.class.Page, core.space.Model, doc1._id, {
      name: 'T-102'
    })

    titles = await model.findAll(core.class.Title, {})
    expect(titles.length).toEqual(1)
    expect(titles[0].title).toEqual('#-T-102')
  })

  it('check regexp rule', async () => {
    // We need few descriptors to be available

    const { operations, model, counter } = await prepare([
      ...dtxes,
      createDoc<DerivedDataDescriptor<Task, Title>>(core.class.DerivedDataDescriptor, {
        sourceClass: testIds.class.Task,
        targetClass: core.class.Title,
        initiValue: {},
        rules: [
          {
            sourceField: 'description',
            targetField: 'title',
            pattern: {
              pattern: 'A.',
              multDoc: true // <-- We need multiple documents for this rule
            }
          }
        ]
      })
    ])

    const doc1 = await operations.createDoc(testIds.class.Task, core.space.Model, {
      title: 'my-task',
      shortId: 'T-101',
      description: 'AB AC DAD QAE'
    })

    // Check for Title to be created

    let titles = await model.findAll(core.class.Title, {})
    expect(titles.length).toEqual(4)
    expect(titles.map((t) => t.title)).toEqual(['AB', 'AC', 'AD', 'AE'])

    expect(counter.txes).toEqual(5) // 1 - create Doc, 2 - create title
    await operations.updateDoc(testIds.class.Task, core.space.Model, doc1._id, {
      description: 'AQ'
    })
    titles = await model.findAll(core.class.Title, {})
    expect(titles.length).toEqual(4)
    expect(titles.map((t) => t.title)).toEqual(['AQ', 'AC', 'AD', 'AE']) // <--------- TODO: Update after delete will be available.
  })
  it('check regexp group rule', async () => {
    // We need few descriptors to be available

    const { operations, model } = await prepare([
      ...dtxes,
      createDoc<DerivedDataDescriptor<Task, Title>>(core.class.DerivedDataDescriptor, {
        sourceClass: testIds.class.Task,
        targetClass: core.class.Title,
        initiValue: {},
        rules: [
          {
            sourceField: 'description',
            targetField: 'title',
            pattern: {
              pattern: '(A(.))',
              group: 2,
              multDoc: true
            }
          },
          {
            sourceField: 'shortId',
            targetField: 'title'
          } // <-- First rule will be replaced by multiDoc rule.
        ]
      })
    ])

    await operations.createDoc(testIds.class.Task, core.space.Model, {
      title: 'my-task',
      shortId: 'T-101',
      description: 'qwe AB AC DAD QAE'
    })

    // Check for Title to be created

    const titles = await model.findAll(core.class.Title, {})
    expect(titles.length).toEqual(4)
    expect(titles.map((t) => t.title)).toEqual(['B', 'C', 'D', 'E'])
  })
})
