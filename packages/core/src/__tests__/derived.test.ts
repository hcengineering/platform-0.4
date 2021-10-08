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
import copy from 'fast-copy'
import { getFullRef, Storage, TxCreateDoc, TxOperations, TxProcessor, TxUpdateDoc, withOperations, withSID } from '..'
import { Account, Class, Doc, FullRefString, Ref, Space } from '../classes'
import { createClient } from '../client'
import core from '../component'
import { DerivedData, DerivedDataDescriptor, DerivedDataProcessor, DocumentMapper, registerMapper } from '../derived'
import { newDerivedData } from '../derived/utils'
import { Hierarchy } from '../hierarchy'
import { ModelDb, TxDb } from '../memdb'
import { _createClass, _createDoc, createTestTxAndDocStorage, _genMinModel } from '../minmodel'
import { Reference } from '../reference'
import { SortingOrder } from '../storage'
import { Title } from '../title'
import { Tx } from '../tx'
import { connect } from './connection'

const txes = _genMinModel()

interface CommentRef {
  _id: Ref<Comment>
  userId: Ref<Account>
}

interface CommentRef {
  _id: Ref<Comment>
  userId: Ref<Account>
}

interface Task extends Doc {
  shortId: string
  title: string
  description: string
  comments?: Ref<Comment>[]
}

interface Message extends Doc {
  message: string
  comments?: Ref<Comment>[]
}

interface Comment extends Doc {
  replyOf: FullRefString
  message: string
}

interface Page extends Doc {
  name: string
  description: string
  comments?: CommentRef[]
}

const testIds = component('test' as Component, {
  class: {
    Task: '' as Ref<Class<Task>>,
    Message: '' as Ref<Class<Message>>,
    Page: '' as Ref<Class<Page>>,
    Comment: '' as Ref<Class<Comment>>
  },
  mapper: {
    PageTitleMapper: '' as Resource<DocumentMapper>
  }
})

const dtxes = [
  ...txes,
  // Test ids
  _createClass(testIds.class.Task, { extends: core.class.Doc }),
  _createClass(testIds.class.Message, { extends: core.class.Doc }),
  _createClass(testIds.class.Page, { extends: core.class.Doc }),
  _createClass(testIds.class.Comment, { extends: core.class.Doc })
]

registerMapper(testIds.mapper.PageTitleMapper, {
  map: async (tx, options): Promise<DerivedData[]> => {
    switch (tx._class) {
      case core.class.TxCreateDoc: {
        const ctx = tx as TxCreateDoc<Doc>
        if (ctx.objectClass === testIds.class.Page) {
          const doc = TxProcessor.createDoc2Doc(ctx) as Page
          const data = newDerivedData<Title>(doc, options.descriptor, 0)
          data.title = '#-' + doc.name
          return [data]
        }
        break
      }
      case core.class.TxUpdateDoc: {
        const ctx = tx as TxUpdateDoc<Doc>
        if (ctx.objectClass === testIds.class.Page) {
          const doc = (await options.storage.findAll(ctx.objectClass, { _id: ctx.objectId }))[0] as Page
          const data = newDerivedData<Title>(doc, options.descriptor, 0)
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
  txData: Tx[]
}

const taskTitleDD = _createDoc<DerivedDataDescriptor<Task, Title>>(core.class.DerivedDataDescriptor, {
  sourceClass: testIds.class.Task,
  targetClass: core.class.Title,
  initiValue: {},
  rules: [{ sourceField: 'shortId', targetField: 'title' }]
})
const pageTitleDD = _createDoc<DerivedDataDescriptor<Task, Title>>(core.class.DerivedDataDescriptor, {
  sourceClass: testIds.class.Page,
  targetClass: core.class.Title,
  mapper: testIds.mapper.PageTitleMapper
})

describe('deried data', () => {
  async function prepare (txes: Tx[]): Promise<{
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
    const txDb = new TxDb(hierarchy)
    const sidTx = withSID(txDb)

    for (let tx of txes) {
      tx = await sidTx(tx)
      await txDb.tx(tx)
    }

    const storage = createTestTxAndDocStorage(hierarchy, txDb, model)

    const counter: Counter = {
      txes: 0,
      txData: []
    }
    const countModel: Storage = {
      findAll: async (_class, query, options) => {
        return await storage.findAll(_class, query, options)
      },
      tx: async (tx) => {
        await storage.tx(tx)
        counter.txData.push(tx)
        counter.txes += 1
      }
    }

    const promises: Promise<void>[] = []
    const processor = await DerivedDataProcessor.create(model, hierarchy, countModel, (p) => {
      promises.push(p)
    })
    await processor.waitComplete()

    const countStorage: Storage = {
      findAll: async (_class, query, options) => await storage.findAll(_class, query, options),
      tx: async (tx) => {
        tx = await sidTx(tx)
        // For test we need to update dates on processing, to be sequentially correct.
        tx.createOn = Date.now()
        tx.modifiedOn = tx.createOn
        hierarchy.tx(tx)
        await countModel.tx(tx)
        await processor.tx(tx)

        // Wait for any DD event occured to be complete.
        await Promise.all(promises)
        promises.splice(0, promises.length)
      }
    }

    const operations = withOperations(core.account.System, countStorage)
    return { hierarchy, model, processor, operations, storage: countStorage, counter }
  }

  it('check DD appear after being added', async () => {
    // We need few descriptors to be available

    const { operations, model, storage } = await prepare([...dtxes])

    // Add descriptor
    await storage.tx(taskTitleDD)

    // Just copy all title to reference :-)
    await storage.tx(
      _createDoc<DerivedDataDescriptor<Title, Reference>>(core.class.DerivedDataDescriptor, {
        sourceClass: core.class.Title,
        targetClass: core.class.Reference,
        initiValue: {},
        rules: [{ sourceField: 'title', targetField: 'link' }]
      })
    )

    await operations.createDoc(testIds.class.Task, core.space.Model, {
      title: 'my-task',
      shortId: 'T-101',
      description: ''
    })

    // Check for Title to be created

    const titles = await model.findAll(core.class.Title, {})
    expect(titles.length).toEqual(1)
    expect(titles[0].title).toEqual('T-101')

    const references = await model.findAll(core.class.Reference, {})
    expect(references.length).toEqual(1)
    expect(references[0].link).toEqual('T-101')
  })

  it('check DD updated appear after being updated', async () => {
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
  it('check DD remove appear after being removed', async () => {
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

    let titles = await model.findAll(core.class.Title, {})
    expect(titles.length).toEqual(1)
    expect(titles[0].title).toEqual('T-101')

    await operations.removeDoc<DerivedDataDescriptor<Doc, DerivedData>>(
      core.class.DerivedDataDescriptor,
      core.space.Model,
      taskTitleDD.objectId as Ref<DerivedDataDescriptor<Doc, DerivedData>>
    )
    titles = await model.findAll(core.class.Title, {})
    expect(titles.length).toEqual(0)
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
    expect(counter.txes).toEqual(3) // 5 - update doc
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
      _createDoc<DerivedDataDescriptor<Task, Title>>(core.class.DerivedDataDescriptor, {
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
    expect(titles.length).toEqual(1)
    expect(titles.map((t) => t.title)).toEqual(['AQ'])
  })
  it('check regexp group rule', async () => {
    // We need few descriptors to be available

    const { operations, model } = await prepare([
      ...dtxes,
      _createDoc<DerivedDataDescriptor<Task, Title>>(core.class.DerivedDataDescriptor, {
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

  it('check dd transactions', async () => {
    const transactions: Tx[] = []

    const client = withOperations(
      core.account.System,
      await createClient(connect, (tx) => {
        transactions.push(tx)
      })
    )
    try {
      const result = await client.findAll(core.class.Space, {})
      expect(result).toHaveLength(2)

      await client.createDoc<DerivedDataDescriptor<Space, Title>>(core.class.DerivedDataDescriptor, core.space.Model, {
        sourceClass: core.class.Space,
        targetClass: core.class.Title,
        rules: [
          {
            sourceField: 'name',
            targetField: 'title'
          }
        ]
      })

      const count = transactions.length

      await client.createDoc<Space>(core.class.Space, core.space.Model, {
        private: false,
        name: 'NewSpace',
        description: '',
        members: []
      })

      expect(transactions.length - count).toEqual(2) // 1 space + 1 title

      const titles = await client.findAll(core.class.Title, {})
      expect(titles.length).toEqual(3) // Sp1 + Sp2 + (NewSpace) from fake server, this is expected.
    } finally {
      await client.close()
    }
  })

  it('check collection rule-add-remove', async () => {
    // We need few descriptors to be available

    const { operations, model } = await prepare([
      ...dtxes,
      _createDoc<DerivedDataDescriptor<Comment, any>>(core.class.DerivedDataDescriptor, {
        sourceClass: testIds.class.Comment,
        targetClass: testIds.class.Task,
        collections: [
          {
            sourceField: 'replyOf',
            targetField: 'comments'
          }
        ]
      })
    ])

    const doc1 = await operations.createDoc(testIds.class.Task, core.space.Model, {
      title: 'my-task',
      shortId: 'T-101',
      description: ''
    })

    for (let i = 0; i < 10; i++) {
      await operations.createDoc(testIds.class.Comment, core.space.Model, {
        replyOf: getFullRef(doc1._id, doc1._class),
        message: `Comment of ${i}`
      })
    }

    const comments = await operations.findAll(testIds.class.Comment, {})
    expect(comments.length).toEqual(10)

    const updD1 = await model.findAll(testIds.class.Task, { _id: doc1._id })
    expect(updD1.length).toEqual(1)
    expect(updD1[0].comments?.length).toEqual(10) // 1 - create Doc, 2 - create title

    // Check remove

    await operations.removeDoc(testIds.class.Comment, core.space.Model, comments[0]._id)

    const updD2 = await model.findAll(testIds.class.Task, { _id: doc1._id })
    expect(updD2.length).toEqual(1)
    expect(updD2[0].comments?.length).toEqual(9) // 1 - create Doc, 2 - create title
  })

  it('check collection rule - doc map', async () => {
    // We need few descriptors to be available

    const { operations, model } = await prepare([
      ...dtxes,
      _createDoc<DerivedDataDescriptor<Comment, Page>>(core.class.DerivedDataDescriptor, {
        sourceClass: testIds.class.Comment,
        targetClass: testIds.class.Page,
        collections: [
          {
            sourceField: 'replyOf',
            targetField: 'comments',
            rules: [{ sourceField: 'modifiedBy', targetField: 'userId' }]
          }
        ]
      })
    ])

    const doc1 = await operations.createDoc(testIds.class.Page, core.space.Model, {
      name: 'my-page',
      description: ''
    })

    for (let i = 0; i < 10; i++) {
      await operations.createDoc(testIds.class.Comment, core.space.Model, {
        replyOf: getFullRef(doc1._id, doc1._class),
        message: `Comment of ${i}`
      })
    }

    const comments = await operations.findAll(testIds.class.Comment, {})
    expect(comments.length).toEqual(10)

    const updD1 = await model.findAll(testIds.class.Page, { _id: doc1._id })
    expect(updD1.length).toEqual(1)
    expect(updD1[0].comments?.length).toEqual(10) // 1 - create Doc, 2 - create title
    expect(updD1[0].comments?.[0]?.userId).toEqual(core.account.System) // 1 - create Doc, 2 - create title

    // Check remove

    await operations.removeDoc(testIds.class.Comment, core.space.Model, comments[0]._id)

    const updD2 = await model.findAll(testIds.class.Page, { _id: doc1._id })
    expect(updD2.length).toEqual(1)
    expect(updD2[0].comments?.length).toEqual(9) // 1 - create Doc, 2 - create title
  })

  it('check DD over DD', async () => {
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

  it('check rebuild of DD', async () => {
    // We need few descriptors to be available

    const ops = [...dtxes, taskTitleDD]

    for (let i = 0; i < 997; i++) {
      // Create tasks
      ops.push(
        _createDoc(testIds.class.Task, {
          title: `my-task-${i}`,
          shortId: `T-${i}`,
          description: ''
        })
      )
    }

    const { model } = await prepare(ops)

    const titles = await model.findAll(core.class.Title, {})
    expect(titles.length).toEqual(997)
  })

  it('check DD with query', async () => {
    // We need few descriptors to be available

    const taskTitleQ = copy(taskTitleDD) as TxCreateDoc<DerivedDataDescriptor<Doc, Doc>>
    taskTitleQ.attributes.query = {
      shortId: { $like: 'T-1%' }
    }
    const ops = [...dtxes, taskTitleQ]

    for (let i = 0; i < 997; i++) {
      // Create tasks
      ops.push(
        _createDoc(testIds.class.Task, {
          title: `my-task-${i}`,
          shortId: `T-${i}`,
          description: ''
        })
      )
    }
    const { model } = await prepare(ops)

    // Check for Title to be created

    const titles = await model.findAll(core.class.Title, {})
    expect(titles.length).toEqual(111)
  })

  it('check sid tx findAll', async () => {
    const ops = [...dtxes, taskTitleDD]

    for (let i = 0; i < 997; i++) {
      // Create tasks
      ops.push(
        _createDoc(testIds.class.Task, {
          title: `my-task-${i}`,
          shortId: `T-${i}`,
          description: ''
        })
      )
    }
    const hierarchy = new Hierarchy()
    for (const tx of ops) hierarchy.tx(tx)
    const model1 = new ModelDb(hierarchy)
    for (const tx of ops) await model1.tx(tx)
    const txDb = new TxDb(hierarchy)

    const sidTx = withSID(txDb)
    for (const tx of ops) {
      await sidTx(tx)
      await txDb.tx(tx)
    }

    const storage = createTestTxAndDocStorage(hierarchy, txDb, model1)

    const txes = await storage.findAll(
      core.class.Tx,
      { sid: { $gt: -1 } },
      { limit: 1000, sort: { sid: SortingOrder.Ascending } }
    )
    expect(txes.length).toEqual(1000)
    expect(txes[0].sid).toEqual(0)
    expect(txes[999].sid).toEqual(999)

    const txes2 = await storage.findAll(
      core.class.Tx,
      { sid: { $gt: 999 } },
      { limit: 1000, sort: { createOn: SortingOrder.Ascending } }
    )

    expect(txes2.length).toEqual(21)
    expect(txes2[0].sid).toEqual(1000)
    expect(txes2[20].sid).toEqual(1020)
  })
})
