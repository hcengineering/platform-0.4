import { Account, Class, Data, Doc, DOMAIN_MODEL, Ref } from './classes'
import core from './component'
import { Hierarchy } from './hierarchy'
import { ModelDb } from './memdb'
import { Storage } from './storage'
import { DocumentUpdate, Tx, TxCreateDoc, TxRemoveDoc, TxUpdateDoc } from './tx'
import { generateId } from './utils'
import { deepEqual } from 'fast-equals'

/**
 * Will check if transactions is targer model domain, it could be system model
 * or user model.
 * @public
 */
export function isModelTx (tx: Tx): boolean {
  // We accept both model and account model spaces.
  return tx.objectSpace === core.space.Model
}

/**
 * Check if find operation is targeting model domain.
 * @public
 */
export function isModelFind<T extends Doc> (_class: Ref<Class<T>>, hierarchy: Hierarchy): boolean {
  return hierarchy.getDomain(_class) === DOMAIN_MODEL
}

/**
 * Find all system and user model transactions.
 * @public
 */
export async function findModelTxs (storage: Storage, accountId: Ref<Account>): Promise<Tx[]> {
  // We search for model object space.
  return await storage.findAll(core.class.Tx, { objectSpace: core.space.Model })
}

/**
 * @public
 */
export async function buildModel (existingTxes: Tx[]): Promise<{ hierarchy: Hierarchy, model: ModelDb, dropTx: Tx[] }> {
  existingTxes = existingTxes.filter((tx) => tx.modifiedBy === core.account.System)
  const dropTx: Tx[] = []
  const hierarchy = new Hierarchy()
  const model = new ModelDb(hierarchy)
  // Construct existing model
  existingTxes.forEach(hierarchy.tx.bind(hierarchy))
  for (const tx of existingTxes) {
    await applyTx(model, tx, dropTx)
  }
  return { hierarchy, model, dropTx }
}

async function applyTx (model: ModelDb, tx: Tx<Doc>, dropTx: Tx<Doc>[]): Promise<void> {
  try {
    await model.tx(tx)
  } catch (err: any) {
    dropTx.push(tx)
    console.info('Found issue during processing of tx. Transaction', tx, 'is dropped...')
  }
}

function toUndef (value: any): any {
  return value === null ? undefined : value
}

function diffAttributes (doc: Data<Doc>, newDoc: Data<Doc>): DocumentUpdate<Doc> {
  const result: DocumentUpdate<any> = {}
  const allDocuments = new Map(Object.entries(doc))
  const newDocuments = new Map(Object.entries(newDoc))

  for (const [key, value] of allDocuments) {
    const newValue = toUndef(newDocuments.get(key))
    if (!deepEqual(newValue, toUndef(value))) {
      // update is required, since values are different
      result[key] = newValue
    }
  }
  for (const [key, value] of newDocuments) {
    const oldValue = toUndef(allDocuments.get(key))
    if (oldValue === undefined && value !== undefined) {
      // Update with new value.
      result[key] = value
    }
  }
  return result
}

/**
 * Generate a set of transactions to upgrade from one model to another.
 * @public
 */
export async function generateModelDiff (existingTxes: Tx[], txes: Tx[]): Promise<{ diffTx: Tx[], dropTx: Tx[] }> {
  const { model, dropTx } = await buildModel(existingTxes)
  const { model: newModel } = await buildModel(txes)

  const allDocuments = new Map((await model.findAll(core.class.Doc, {})).map((d) => [d._id, d]))
  const newDocuments = new Map((await newModel.findAll(core.class.Doc, {})).map((d) => [d._id, d]))

  const diffTx: Tx[] = []

  // Find same documents.
  allDocuments.forEach(handleUpdateRemove(newDocuments, diffTx))
  newDocuments.forEach(handleAdd(allDocuments, diffTx))
  return { diffTx, dropTx }
}
function handleAdd (allDocuments: Map<Ref<Doc>, Doc>, newTxes: Tx[]): (value: Doc, key: Ref<Doc>) => void {
  return (doc, key) => {
    if (!allDocuments.has(key)) {
      // Add is required
      const { _class, modifiedBy, modifiedOn, space, ...data } = doc
      const tx: TxCreateDoc<Doc> = {
        _id: generateId(),
        _class: core.class.TxCreateDoc,
        space: core.space.Tx,
        modifiedBy: doc.modifiedBy,
        modifiedOn: doc.modifiedOn,
        createOn: doc.createOn,
        objectId: key,
        objectClass: doc._class,
        objectSpace: doc.space,
        attributes: data
      }
      newTxes.push(tx)
    }
  }
}

function handleUpdateRemove (newDocuments: Map<Ref<Doc>, Doc>, newTxes: Tx<Doc>[]): (value: Doc, key: Ref<Doc>) => void {
  return (doc, key) => {
    const newDoc = newDocuments.get(key)
    if (newDoc !== undefined) {
      // update is required.
      const { _id, _class, modifiedBy, modifiedOn, space, createOn, ...data } = newDoc
      const { _id: _0, _class: _1, modifiedBy: _2, modifiedOn: _3, createOn: _4, space: _5, ...oldData } = doc
      const operations = diffAttributes(oldData, data)
      if (Object.keys(operations).length > 0) {
        const tx: TxUpdateDoc<Doc> = {
          _id: generateId(),
          _class: core.class.TxUpdateDoc,
          space: core.space.Tx,
          modifiedBy: core.account.System,
          modifiedOn: Date.now(),
          createOn: Date.now(),
          objectId: _id,
          objectClass: _class,
          objectSpace: space,
          operations
        }
        newTxes.push(tx)
      }
    } else {
      // Delete is required
      const tx: TxRemoveDoc<Doc> = {
        _id: generateId(),
        _class: core.class.TxRemoveDoc,
        space: core.space.Tx,
        modifiedBy: core.account.System,
        modifiedOn: Date.now(),
        createOn: Date.now(),
        objectId: key,
        objectClass: doc._class,
        objectSpace: doc.space
      }
      newTxes.push(tx)
    }
  }
}
