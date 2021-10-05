import { Resource } from '@anticrm/status'
import {
  CollectionRule,
  DerivedData,
  DerivedDataDescriptor,
  DerivedDataDescriptorState,
  DocumentMapper,
  MappingRule,
  RuleExpresson
} from '.'
import core, { generateId, Storage, Tx, TxRemoveDoc, withOperations } from '..'
import { Account, Class, Doc, FullRefString, Ref, Space, Timestamp } from '../classes'
import { Hierarchy } from '../hierarchy'
import { ModelDb } from '../memdb'
import { DocumentQuery, FindOptions, FindResult } from '../storage'
import { DocumentUpdate, TxCreateDoc, TxProcessor, TxUpdateDoc } from '../tx'
import { parseFullRef } from '../utils'
import { DescriptorMap } from './descriptors'
import { findExistingData, getRuleFieldValues, groupOrValue, lastOrAdd, newDerivedData, sortRules } from './utils'

const derivedDataMappers = new Map<Resource<DocumentMapper>, DocumentMapper>()
const EMPTY_MAPPER = '' as Resource<DocumentMapper>

type Descr = DerivedDataDescriptor<Doc, DerivedData>
type DescrWithTarget = Exclude<Descr, 'targetClass'> & Required<Pick<Descr, 'targetClass'>>

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

class DDStorage implements Storage {
  processor: TxProcessor | undefined
  constructor (private readonly storage: Storage) {}

  async findAll<T extends Doc>(
    _class: Ref<Class<T>>,
    query: DocumentQuery<T>,
    options?: FindOptions<T>
  ): Promise<FindResult<T>> {
    return await this.storage.findAll(_class, query)
  }

  async tx (tx: Tx): Promise<void> {
    const result = await this.storage.tx(tx)
    await this.processor?.tx(tx)
    return result
  }
}

/**
 * Allow to generate derived data with rules and mappers.
 * @public
 */
export class DerivedDataProcessor extends TxProcessor {
  private constructor (
    readonly descrs: DescriptorMap,
    readonly model: ModelDb,
    readonly hierarchy: Hierarchy,
    readonly storage: Storage,
    readonly allowRebuildDD: boolean
  ) {
    super()
  }

  public clone (storage: Storage): DerivedDataProcessor {
    return new DerivedDataProcessor(this.descrs, this.model, this.hierarchy, storage, this.allowRebuildDD)
  }

  /**
   * Obtain initial set of descriptors and have derived data up to date.
   */
  static async create (
    model: ModelDb,
    hierarchy: Hierarchy,
    storage: Storage,
    allowRebuildDD = false
  ): Promise<DerivedDataProcessor> {
    const ddStorage = new DDStorage(storage)
    const processor = new DerivedDataProcessor(
      new DescriptorMap(hierarchy),
      model,
      hierarchy,
      ddStorage,
      allowRebuildDD
    )
    ddStorage.processor = processor
    const descriptors = await model.findAll(core.class.DerivedDataDescriptor, {})

    for (const d of descriptors) {
      processor.descrs.update(d)
    }

    if (allowRebuildDD) {
      const descriptorsState = await model.findAll(core.class.DerivedDataDescriptorState, {})
      await processor.refreshDescriptors(descriptors, descriptorsState)
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
    const doc: CachedDoc = {
      resolve: async () => await Promise.resolve(TxProcessor.createDoc2Doc(tx))
    }

    for (const d of descriptors) {
      let results = (await this.applyMapper(d, tx)) ?? (await this.applyRule(d, tx, doc))
      results = this.withDescrId(results, d._id, tx.objectId, tx.objectClass)
      if (d.targetClass !== undefined) {
        await this.applyDerivedData([], results, tx.modifiedBy)

        await this.applyCollectionRules(d as DescrWithTarget, tx, true)
      }
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
  private async applyCollectionRules (d: DescrWithTarget, tx: Tx, push: boolean): Promise<void> {
    for (const r of d.collections ?? []) {
      if (push) {
        const doc = TxProcessor.createDoc2Doc(tx as TxCreateDoc<Doc>)
        if (r.sourceFieldPattern === undefined) {
          const target = await this.getTargetByRef(doc, d.targetClass, r)
          await this.pushToCollection(doc, target, r)
        } else {
          const targets = await this.getTargetsByRegex(doc, d.targetClass, r)
          for (const target of targets) {
            await this.pushToCollection(doc, target, r)
          }
        }
      } else {
        // Handle pull, since our document is already removed from storage, we need to search for transactions to update source doc.
        const eid = (r.rules?.length ?? 0) > 0 ? '._id' : ''
        const pushOps = await this.storage.findAll<TxUpdateDoc<Doc>>(core.class.TxUpdateDoc, {
          objectClass: d.targetClass,
          [`operations.\\$push.${r.targetField}${eid}`]: tx.objectId
        })
        // If it was in few fields at once, operation probable will be execured few times.
        await this.pullFromCollection(r, pushOps)
      }
    }
  }

  private async getTargetsByRegex (
    doc: Doc,
    targetClass: Ref<Class<DerivedData>>,
    r: CollectionRule
  ): Promise<Array<Doc>> {
    if (r.sourceFieldPattern?.pattern === undefined) return []
    const source = (doc as any)[r.sourceField]

    const refs = this.processRulePattern(r.sourceFieldPattern, source)
    return await this.storage.findAll(targetClass, { _id: { $in: refs } })
  }

  private async getTargetByRef (
    doc: Doc,
    targetClass: Ref<Class<DerivedData>>,
    r: CollectionRule
  ): Promise<Doc | undefined> {
    const parentDocRefString = (doc as any)[r.sourceField] as FullRefString
    const parentDocRef = parseFullRef(parentDocRefString)
    if (parentDocRef !== undefined && this.hierarchy.isDerived(parentDocRef._class, targetClass)) {
      return (await this.storage.findAll(parentDocRef._class, { _id: parentDocRef._id }, { limit: 1 })).shift()
    }
  }

  private async pushToCollection (doc: Doc, target: Doc | undefined, r: CollectionRule): Promise<void> {
    if (target === undefined) return
    try {
      const obj = this.extractEmbeddedDoc(doc, r.rules)
      const operation: DocumentUpdate<Doc> = {
        $push: { [r.targetField]: obj }
      }
      if (r.lastModifiedField !== undefined) {
        ;(operation as any)[r.lastModifiedField] = doc.modifiedOn
      }
      await this.updateData(operation, target.modifiedBy, target.modifiedOn, target._id, target._class, target.space)
    } catch (err) {
      console.log(err)
    }
  }

  private async pullFromCollection (r: CollectionRule, pushOps: FindResult<TxUpdateDoc<Doc>>): Promise<void> {
    for (const op of pushOps) {
      try {
        const operation = {
          $pull: { [r.targetField]: (op.operations.$push as any)[r.targetField] }
        }
        await this.updateData(operation, op.modifiedBy, op.modifiedOn, op.objectId, op.objectClass, op.objectSpace)
      } catch (err) {
        // Ignore exception.
        console.log(err)
      }
    }
  }

  private async updateDescriptor (objectId: Ref<Descr>, modifiedBy: Ref<Account>): Promise<void> {
    this.descrs.remove(objectId)
    // New descriptor construction
    const descr = this.model.getObject(objectId)
    this.descrs.update(descr)

    if (this.allowRebuildDD) {
      await this.refreshDerivedData(descr, true)
    }
  }

  private async updateData<T extends Doc>(
    operations: DocumentUpdate<T>,
    modifiedBy: Ref<Account>,
    modifiedOn: Timestamp,
    objectId: Ref<T>,
    objectClass: Ref<Class<T>>,
    objectSpace: Ref<Space>
  ): Promise<void> {
    const tx: TxUpdateDoc<Doc> = {
      _id: generateId(),
      _class: core.class.TxUpdateDoc,
      space: core.space.Tx,
      modifiedBy: modifiedBy,
      modifiedOn: modifiedOn,
      createOn: Date.now(),
      objectId: objectId,
      objectClass: objectClass,
      objectSpace: objectSpace,
      operations: operations
    }
    await this.storage.tx(tx).catch((err) => console.log(err))
  }

  protected async txUpdateDoc (tx: TxUpdateDoc<Doc>): Promise<void> {
    if (this.hierarchy.isDerived(tx.objectClass, core.class.DerivedDataDescriptor)) {
      await this.updateDescriptor(tx.objectId as Ref<Descr>, tx.modifiedBy)
      return
    }

    const descriptors = this.descrs.getByClass(tx.objectClass)

    // We expect storage is alrady updated before derived data is being processed.
    const doc: CachedDoc = {
      resolve: async () => (await this.storage.findAll(tx.objectClass, { _id: tx.objectId }))[0]
    }

    for (const d of descriptors) {
      const results = (await this.applyMapper(d, tx)) ?? (await this.applyRule(d, tx, doc))
      if (d.targetClass !== undefined) {
        const oldData = await this.storage.findAll(d.targetClass, {
          objectId: tx.objectId,
          objectClass: tx.objectClass,
          descriptorId: d._id
        })

        await this.applyDerivedData(oldData, results, tx.modifiedBy)
      }
    }
  }

  protected async txRemoveDoc (tx: TxRemoveDoc<Doc>): Promise<void> {
    if (this.hierarchy.isDerived(tx.objectClass, core.class.DerivedDataDescriptor)) {
      await this.removeDescriptorDerivedData(tx)
      return
    }

    const descriptors = this.descrs.getByClass(tx.objectClass)

    for (const d of descriptors) {
      if (d.targetClass !== undefined) {
        const oldData = await this.storage.findAll(d.targetClass, {
          objectId: tx.objectId,
          objectClass: tx.objectClass,
          descriptorId: d._id
        })
        await this.applyDerivedData(oldData, [], tx.modifiedBy)
        await this.applyCollectionRules(d as DescrWithTarget, tx, false)
      }
    }
  }

  private async removeDescriptorDerivedData (tx: TxRemoveDoc<Doc>): Promise<void> {
    const descr = this.descrs.descriptors.get(tx.objectId)
    if (descr != null) {
      this.descrs.remove(tx.objectId as Ref<Descr>)
      if (this.allowRebuildDD) {
        await this.refreshDerivedData(descr, false)
      }
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
    modifiedBy: Ref<Account>
  ): Promise<void> {
    const storage = withOperations(modifiedBy, this.storage)
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
      return await mapper.map(tx, { descriptor, hierarchy: this.hierarchy, storage: this.storage, model: this.model })
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

  ddHash (str: string, seed = 327): number {
    let h1 = 0xdeadbeef ^ seed
    let h2 = 0x41c6ce57 ^ seed
    for (let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i)
      h1 = Math.imul(h1 ^ ch, 2654435761)
      h2 = Math.imul(h2 ^ ch, 1597334677)
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
    return 4294967296 * (2097151 & h2) + (h1 >>> 0)
  }

  private async refreshDescriptors (
    descriptors: Descr[],
    descriptorsState: DerivedDataDescriptorState[]
  ): Promise<void> {
    const states = new Map(descriptorsState.map((d) => [d.descriptorId, d]))

    for (const d of descriptors) {
      let needUpdate = true
      const state = states.get(d._id)
      const version = this.getDDVersion(d)
      if (state !== undefined) {
        needUpdate = version !== d.version
      }
      if (needUpdate) {
        await this.refreshDerivedData(d, true)

        await this.updateDDState(state, d, version)
      }
    }
  }

  private getDDVersion (d: Descr): string {
    let version = d.version
    if (version === undefined) {
      version = this.ddHash(JSON.stringify(d)).toString(16)
    }
    return version
  }

  private async updateDDState (state: DerivedDataDescriptorState | undefined, d: Descr, version: string): Promise<void> {
    if (state === undefined) {
      const ctx: TxCreateDoc<DerivedDataDescriptorState> = {
        _id: generateId(),
        modifiedBy: core.account.System,
        modifiedOn: Date.now(),
        createOn: Date.now(),
        _class: core.class.TxCreateDoc,
        objectClass: core.class.DerivedDataDescriptorState,
        objectId: generateId(),
        space: core.space.Tx,
        objectSpace: core.space.DerivedData,
        attributes: {
          descriptorId: d._id,
          version
        }
      }
      await this.storage.tx(ctx)
    } else {
      const ctx: TxUpdateDoc<DerivedDataDescriptorState> = {
        _id: generateId(),
        createOn: Date.now(),
        modifiedBy: core.account.System,
        modifiedOn: Date.now(),
        _class: core.class.TxUpdateDoc,
        objectClass: core.class.DerivedDataDescriptorState,
        objectId: state._id,
        space: core.space.Tx,
        objectSpace: core.space.DerivedData,
        operations: {
          version
        }
      }
      await this.storage.tx(ctx)
    }
  }

  /**
   * Perform iterable update of all source class to derived Data mapping, should be performed without active clients on DB.
   */
  private async refreshDerivedData (d: Descr, apply: boolean): Promise<void> {
    // Perform a full rebuild of derived data of required type.
    // we need to find all objects affected

    const partSize = 100
    try {
      this.hierarchy.getDomain(d.sourceClass)
    } catch (err: any) {
      // If we had an generic class without domain, we could not rebuild DD for it.
      console.info('DD rebuild for ', d.sourceClass, d.targetClass, 'is skipped...')
      return
    }
    let allDD = await this.storage.findAll(d.sourceClass, {}, { limit: partSize })
    const total = allDD.total
    let processed = 0

    while (processed < total) {
      for (const dbDoc of allDD) {
        try {
          const dbDD =
            d.targetClass !== undefined
              ? await this.storage.findAll<DerivedData>(d.targetClass, {
                objectId: dbDoc._id,
                descriptorId: d._id
              })
              : []
          const doc: CachedDoc = {
            resolve: async () => await Promise.resolve(dbDoc)
          }
          const tx: TxCreateDoc<Doc> = {
            _id: generateId(),
            modifiedBy: dbDoc.modifiedBy,
            modifiedOn: dbDoc.modifiedOn,
            createOn: dbDoc.createOn,
            _class: core.class.TxCreateDoc,
            objectClass: dbDoc._class,
            objectId: dbDoc._id,
            space: core.space.Tx,
            objectSpace: dbDoc.space,
            attributes: dbDoc
          }
          const results = apply ? (await this.applyMapper(d, tx)) ?? (await this.applyRule(d, tx, doc)) : []
          if (d.targetClass !== undefined) {
            await this.applyDerivedData(Array.from(dbDD), results, tx.modifiedBy)
          }
        } catch (err: any) {
          console.error('Error processing DD', err)
        }
      }
      processed += allDD.length
      allDD = await this.storage.findAll(d.sourceClass, {}, { limit: partSize, skip: processed })
      console.info(`DD rebuild of ${d.sourceClass} (${processed}, ${total})`)
    }
  }
}
