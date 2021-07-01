import { DerivedData, DerivedDataDescriptor, DocumentMapper, MappingRule, RuleExpresson } from '.'
import core, { generateId, Storage, Tx, TxOperations, withOperations } from '..'
import { Resource } from '../../../status/lib'
import { Account, Class, Doc, Ref } from '../classes'
import { Hierarchy } from '../hierarchy'
import { ModelDb } from '../memdb'
import { TxCreateDoc, TxProcessor, TxUpdateDoc } from '../tx'
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
 */
export function registerMapper (id: Resource<DocumentMapper>, mapper: DocumentMapper): void {
  derivedDataMappers.set(id, mapper)
}

/**
/**
 * Allow to generate derived data with rules and mappers.
 */
export class DerivedDataProcessor extends TxProcessor {
  descrs: DescriptorMap

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
    }
  }

  private async updateDescriptor (objectId: Ref<Descr>, modifiedBy: Ref<Account>): Promise<void> {
    this.descrs.remove(objectId)
    // New descriptor construction
    const descr = this.model.getObject(objectId)
    this.descrs.update(descr)

    await this.refreshDerivedData(descr, modifiedBy)
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

  async applyRule (d: Descr, tx: ObjTx, doc: CachedDoc): Promise<DerivedData[]> {
    doc.doc = doc.doc ?? (await doc.resolve())
    const ruleFields = getRuleFieldValues(sortRules(d), doc.doc)
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

    const added = Promise.all(additions.map(async (add) => await storage.createDoc(add._class, add.space, add)))
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
        this.processRulePattern(d, doc, rule.pattern, rule.targetField, value, results)
      } else {
        // Just copy of value
        this.processAssignValue(results, d, doc, rule.targetField, value)
      }
    }
    return results
  }

  private processAssignValue (results: DerivedData[], d: Descr, doc: Doc, targetField: string, value: string): void {
    const lastResult = lastOrAdd(results, d, doc)
    ;(lastResult as any)[targetField] = value
  }

  private processRulePattern (
    d: Descr,
    doc: Doc,
    pattern: RuleExpresson,
    targetField: string,
    sourceValue: string,
    results: DerivedData[]
  ): DerivedData[] {
    // Extract some data from value
    const reg = new RegExp(pattern.pattern, 'g')

    let matches: RegExpExecArray | null
    let needAdd = false
    while ((matches = reg.exec(sourceValue)) !== null) {
      if (needAdd) {
        // We have multi doc, so produce document and wait for next match.
        results.push(newDerivedData(lastOrAdd(results, d, doc), d))
        needAdd = false
      }
      const lastResult = lastOrAdd(results, d, doc)
      ;(lastResult as any)[targetField] = groupOrValue(pattern, matches)

      if (pattern.multDoc ?? false) {
        needAdd = true
      }
    }
    return results
  }

  private async refreshDerivedData (d: Descr, modifiedBy: Ref<Account>): Promise<void> {
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
      const results = (await this.applyMapper(d, tx)) ?? (await this.applyRule(d, tx, doc))
      await this.applyDerivedData(Array.from(dbDD), results, ops)
    }
  }
}
