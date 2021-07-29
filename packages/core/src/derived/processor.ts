import { Resource } from '@anticrm/status'
import { DerivedData, DerivedDataDescriptor, DocumentMapper, MappingRule, RuleExpresson } from '.'
import core, { generateId, Storage, Tx, TxOperations, TxRemoveDoc, withOperations } from '..'
import { Account, Class, Doc, FullRefString, Ref } from '../classes'
import { Hierarchy } from '../hierarchy'
import { ModelDb } from '../memdb'
import { TxCreateDoc, TxProcessor, TxUpdateDoc } from '../tx'
import { parseFullRef } from '../utils'
import { DescriptorMap } from './descriptors'
import { findExistingData, getRuleFieldValues, groupOrValue, lastOrAdd, newDerivedData, sortRules } from './utils'

const derivedDataMappers = new Map<Resource<DocumentMapper>, DocumentMapper>()
const EMPTY_MAPPER = '' as Resource<DocumentMapper>

type Descr = DerivedDataDescriptor<Doc, DerivedData>
interface CachedDoc {
  doc?: Doc
  resolve: () => Promise<Doc>
}
interface ObjTx {
  objectId: Ref<Doc>
  objectClass: Ref<Class<Doc>>
}
/**
 * Register derived data mapper globally.
 * @public
 */
export function registerMapper (id: Resource<DocumentMapper>, mapper: DocumentMapper): void {
  derivedDataMappers.set(id, mapper)
}

/**
 * Allow to generate derived data with rules and mappers.
 * @public
 */
export class DerivedDataProcessor extends TxProcessor {
  private readonly descrs: DescriptorMap

  private constructor (readonly model: ModelDb, readonly hierarchy: Hierarchy, readonly storage: Storage) {
    super()
    this.descrs = new DescriptorMap(hierarchy)
  }

  /**
   * Obtain initial set of descriptors and have derived data up to date.
   */
  static async create (model: ModelDb, hierarchy: Hierarchy, storage: Storage): Promise<DerivedDataProcessor> {
    const processor = new DerivedDataProcessor(model, hierarchy, storage)
    const descriptors = await model.findAll(core.class.DerivedDataDescriptor, {})

    for (const d of descriptors) {
      processor.descrs.update(d)
    }
    return processor
  }

  protected async txCreateDoc (tx: TxCreateDoc<Doc>): Promise<void> {
    if (this.hierarchy.isDerived(tx.objectClass, core.class.DerivedDataDescriptor)) {
      await this.updateDescriptor(tx.objectId as Ref<Descr>, tx.modifiedBy)
      return
    }

    // Obtain descriptors an traverse build derived data
    const descriptors = this.descrs.getByClass(tx.objectClass)
    const ops = withOperations(tx.modifiedBy, this.storage)
    const doc: CachedDoc = {
      resolve: async () => await Promise.resolve(TxProcessor.createDoc2Doc(tx))
    }

    for (const d of descriptors) {
      let results = (await this.applyMapper(d, tx)) ?? (await this.applyRule(d, tx, doc))
      results = this.withDescrId(results, d._id, tx.objectId, tx.objectClass)
      await this.applyDerivedData([], results, ops)

      await this.applyCollectionRules(d, tx, true, ops)
    }
  }

  extractEmbeddedDoc (doc: Doc, rules?: MappingRule[]): any {
    const ruleFields = getRuleFieldValues(sortRules(rules), doc)
    if (ruleFields.length > 0) {
      return this.extractRuleValues(doc, ruleFields)
    }

    return doc._id
  }

  private extractRuleValues (doc: Doc, ruleFields: { value: string, rule: MappingRule }[]): any {
    const result = { _id: doc._id }
    // Extract field values.
    for (const { rule, value } of ruleFields) {
      const newValue = this.matchRuleValue(rule, value)
      this.assignValue(result, rule.targetField, newValue)
    }
    return result
  }

  private matchRuleValue (rule: MappingRule, value: string): any {
    return rule.pattern !== undefined ? this.processRulePattern(rule.pattern, value)?.[0] : value
  }

  /**
   * Will update collection back references.
   */
  private async applyCollectionRules (d: Descr, tx: Tx, push: boolean, ops: Storage & TxOperations): Promise<void> {
    for (const r of d.collections ?? []) {
      if (push) {
        const doc = TxProcessor.createDoc2Doc(tx as TxCreateDoc<Doc>)
        const parentDocRefString = (doc as any)[r.sourceField] as FullRefString
        const parentDocRef = parseFullRef(parentDocRefString)
        if (parentDocRef !== undefined && this.hierarchy.isDerived(parentDocRef._class, d.targetClass)) {
          try {
            const obj = this.extractEmbeddedDoc(doc, r.rules)
            await ops
              .updateDoc(d.targetClass, tx.objectSpace, parentDocRef._id, {
                $push: { [r.targetField]: obj }
              })
              .catch((err) => console.log(err))
          } catch (err) {
            console.log(err)
          }
        }
      } else {
        // Handle pull, since our document is already removed from storage, we need to search for transactions to update source doc.
        const eid = (r.rules?.length ?? 0) > 0 ? '._id' : ''
        const pushOps = await ops.findAll<TxUpdateDoc<Doc>>(core.class.TxUpdateDoc, {
          objectClass: d.targetClass,
          [`operations.\\$push.${r.targetField}${eid}`]: tx.objectId
        })
        // If it was in few fields at once, operation probable will be execured few times.
        for (const op of pushOps) {
          try {
            await ops
              .updateDoc(d.targetClass, tx.objectSpace, op.objectId, {
                $pull: { [r.targetField]: (op.operations.$push as any)[r.targetField] }
              })
              .catch((err) => console.log(err))
          } catch (err) {
            // Ignore exception.
            console.log(err)
          }
        }
      }
    }
  }

  private async updateDescriptor (objectId: Ref<Descr>, modifiedBy: Ref<Account>): Promise<void> {
    this.descrs.remove(objectId)
    // New descriptor construction
    const descr = this.model.getObject(objectId)
    this.descrs.update(descr)

    await this.refreshDerivedData(descr, modifiedBy, true)
  }

  protected async txUpdateDoc (tx: TxUpdateDoc<Doc>): Promise<void> {
    if (this.hierarchy.isDerived(tx.objectClass, core.class.DerivedDataDescriptor)) {
      await this.updateDescriptor(tx.objectId as Ref<Descr>, tx.modifiedBy)
      return
    }

    const descriptors = this.descrs.getByClass(tx.objectClass)
    const ops = withOperations(tx.modifiedBy, this.storage)

    // We expect storage is alrady updated before derived data is being processed.
    const doc: CachedDoc = {
      resolve: async () => (await this.storage.findAll(tx.objectClass, { _id: tx.objectId }))[0]
    }

    for (const d of descriptors) {
      const results = (await this.applyMapper(d, tx)) ?? (await this.applyRule(d, tx, doc))
      const oldData = await this.storage.findAll(core.class.DerivedData, {
        objectId: tx.objectId,
        objectClass: tx.objectClass,
        descriptorId: d._id
      })
      await this.applyDerivedData(oldData, results, ops)
    }
  }

  protected async txRemoveDoc (tx: TxRemoveDoc<Doc>): Promise<void> {
    if (this.hierarchy.isDerived(tx.objectClass, core.class.DerivedDataDescriptor)) {
      await this.removeDescriptorDerivedData(tx)
      return
    }

    const descriptors = this.descrs.getByClass(tx.objectClass)
    const ops = withOperations(tx.modifiedBy, this.storage)

    for (const d of descriptors) {
      const oldData = await this.storage.findAll(core.class.DerivedData, {
        objectId: tx.objectId,
        objectClass: tx.objectClass,
        descriptorId: d._id
      })
      await this.applyDerivedData(oldData, [], ops)
      await this.applyCollectionRules(d, tx, false, ops)
    }
  }

  private async removeDescriptorDerivedData (tx: TxRemoveDoc<Doc>): Promise<void> {
    const descr = this.descrs.descriptors.get(tx.objectId)
    if (descr != null) {
      this.descrs.remove(tx.objectId as Ref<Descr>)
      await this.refreshDerivedData(descr, tx.modifiedBy, false)
    }
  }

  private async applyRule (d: Descr, tx: ObjTx, doc: CachedDoc): Promise<DerivedData[]> {
    doc.doc = doc.doc ?? (await doc.resolve())
    const ruleFields = getRuleFieldValues(sortRules(d.rules), doc.doc)
    if (ruleFields.length === 0) {
      return []
    }
    return await this.applyRules(d, doc.doc, ruleFields)
  }

  private withDescrId (
    results: DerivedData[],
    id: Ref<Descr>,
    objectId: Ref<Doc>,
    objectClass: Ref<Class<Doc>>
  ): DerivedData[] {
    for (const r of results) {
      r.descriptorId = id
      r.objectId = objectId
      r.objectClass = objectClass
    }
    return results
  }

  // Apply derived data
  private async applyDerivedData (
    oldData: DerivedData[],
    newData: DerivedData[],
    storage: Storage & TxOperations
  ): Promise<void> {
    // Do diff from old refs to remove only missing.
    const { additions, updates, deletes } = findExistingData(oldData, newData)

    const added = Promise.all(
      additions.map(async (add) => await storage.createDoc(add._class, add.space, add, add._id))
    )
    const updated = Promise.all(updates.map(async (up) => await storage.updateDoc(up._class, up.space, up._id, up)))
    const deleted = Promise.all(deletes.map(async (del) => await storage.removeDoc(del._class, del.space, del._id)))

    await Promise.all([added, updated, deleted])
  }

  private async applyMapper (descriptor: Descr, tx: Tx): Promise<DerivedData[] | undefined> {
    const mapper = derivedDataMappers.get(descriptor.mapper ?? EMPTY_MAPPER)
    if (mapper !== undefined) {
      return await mapper.map(tx, { descriptor, hierarchy: this.hierarchy, storage: this.storage })
    }
    return undefined
  }

  private async applyRules (
    d: Descr,
    doc: Doc,
    ruleFields: { value: string, rule: MappingRule }[]
  ): Promise<DerivedData[]> {
    const results: DerivedData[] = []
    // Check if we have rules matched.

    for (const { rule, value } of ruleFields) {
      if (rule.pattern !== undefined) {
        this.processRuleMatches(rule.pattern, rule.targetField, value, results, doc, d)
      } else {
        // Just copy of value
        this.assignValue(lastOrAdd(results, d, doc), rule.targetField, value)
      }
    }
    return results
  }

  private processRuleMatches (
    pattern: RuleExpresson,
    targetField: string,
    value: string,
    results: DerivedData[],
    doc: Doc,
    d: Descr
  ): void {
    const matches = this.processRulePattern(pattern, value)
    let needAdd = false
    for (const match of matches) {
      if (needAdd && results.length > 0) {
        // We have multi doc, so produce document and wait for next match.
        results.push(newDerivedData(doc, d, results.length))
        needAdd = false
      }
      const lastResult = lastOrAdd(results, d, doc)
      this.assignValue(lastResult, targetField, match)

      if (pattern.multDoc ?? false) {
        needAdd = true
      }
    }
  }

  private processRulePattern (pattern: RuleExpresson, sourceValue: string): any[] {
    // Extract some data from value
    const reg = new RegExp(pattern.pattern, 'g')

    let matches: RegExpExecArray | null
    const result = []
    while ((matches = reg.exec(sourceValue)) !== null) {
      result.push(groupOrValue(pattern, matches))
    }
    return result
  }

  private assignValue (lastResult: any, targetField: string, value?: any): void {
    if (value !== undefined) {
      lastResult[targetField] = value
    }
  }

  private async refreshDerivedData (d: Descr, modifiedBy: Ref<Account>, apply: boolean): Promise<void> {
    // Perform a full rebuild of derived data of required type.
    const ops = withOperations(modifiedBy, this.storage)

    // we need to find all objects affected

    const allDD = await this.storage.findAll(d.sourceClass, {})

    for (const dbDoc of allDD) {
      const dbDD = await this.storage.findAll(core.class.DerivedData, { objectId: dbDoc._id, descriptorId: d._id })
      const doc: CachedDoc = {
        resolve: async () => await Promise.resolve(dbDoc)
      }
      const tx: TxCreateDoc<Doc> = {
        _id: generateId(),
        modifiedBy: dbDoc.modifiedBy,
        modifiedOn: dbDoc.modifiedOn,
        _class: core.class.TxCreateDoc,
        objectClass: dbDoc._class,
        objectId: dbDoc._id,
        space: core.space.Tx,
        objectSpace: dbDoc.space,
        attributes: dbDoc
      }
      const results = apply ? (await this.applyMapper(d, tx)) ?? (await this.applyRule(d, tx, doc)) : []
      await this.applyDerivedData(Array.from(dbDD), results, ops)
    }
  }
}
