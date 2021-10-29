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
import core, {
  generateId,
  matchDocument,
  measure,
  measureAsync,
  SortingOrder,
  Space,
  Storage,
  Tx,
  TxRemoveDoc,
  withOperations
} from '..'
import { Account, Class, Doc, FullRefString, Ref } from '../classes'
import { Hierarchy } from '../hierarchy'
import { ModelDb } from '../memdb'
import { DocumentQuery, FindOptions, FindResult } from '../storage'
import { DocumentUpdate, TransactionID, TxCreateDoc, TxProcessor, TxUpdateDoc } from '../tx'
import { DeferredPromise, parseFullRef } from '../utils'
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
  _class: Ref<Class<Doc>>
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
  processor: DerivedDataProcessor | undefined
  constructor (private readonly storage: Storage) {}

  async findAll<T extends Doc>(
    _class: Ref<Class<T>>,
    query: DocumentQuery<T>,
    options?: FindOptions<T>
  ): Promise<FindResult<T>> {
    return await this.storage.findAll(_class, query, options)
  }

  async tx (tx: Tx): Promise<void> {
    const result = await this.storage.tx(tx)
    await this.processor?.txDDInclude(tx)
    return result
  }
}

interface DDRebuildContext {
  descriptor: Descr
  collectionCleanCache: Set<Ref<Doc>>
  apply: boolean
}
/**
 * Allow to generate derived data with rules and mappers.
 * @public
 */
export class DerivedDataProcessor {
  private readonly ddStates: Map<Ref<Descr>, TransactionID> = new Map<Ref<Descr>, TransactionID>()
  private wakeup = new DeferredPromise<void>()
  private readonly sleeping: DeferredPromise<void>[] = []
  private readonly ddQuery: Tx[] = []
  private isClosed = false
  private lastSIDAvailable: TransactionID = 0
  private allDescriptorState = new Map<Ref<Descr>, DerivedDataDescriptorState>()
  updateStateTimeout = 200

  private constructor (
    readonly descrs: DescriptorMap,
    readonly model: ModelDb,
    readonly hierarchy: Hierarchy,
    readonly storage: Storage,
    readonly rawStorage: Storage,
    readonly applyHandler?: (p: Promise<void>) => void
  ) {}

  private readonly txHandlers = {
    [core.class.TxCreateDoc]: async (tx: Tx, context?: DDRebuildContext) =>
      await this.txCreateDocWith(tx as TxCreateDoc<Doc>, context),
    [core.class.TxUpdateDoc]: async (tx: Tx, context?: DDRebuildContext) =>
      await this.txUpdateDocWith(tx as TxUpdateDoc<Doc>, context),
    [core.class.TxRemoveDoc]: async (tx: Tx, context?: DDRebuildContext) =>
      await this.txRemoveDocWith(tx as TxRemoveDoc<Doc>, context)
  }

  // Will be called by incoming parties
  async tx (tx: Tx): Promise<void> {
    if (tx.sid > this.lastSIDAvailable) {
      this.lastSIDAvailable = tx.sid
    }
    const p = new DeferredPromise<void>()
    this.sleeping.push(p)
    // We just need to wait it up.
    this.wakeup.resolve()
    await p.promise
  }

  async txDDInclude (tx: Tx): Promise<void> {
    this.ddQuery.push(tx)
    // We just need to wait it up.
    this.wakeup.resolve()
  }

  private async txWith (tx: Tx, context?: DDRebuildContext): Promise<void> {
    return await this.txHandlers[tx._class]?.(tx, context)
  }

  /**
   * Obtain initial set of descriptors and have derived data up to date.
   */
  static async create (
    model: ModelDb,
    hierarchy: Hierarchy,
    storage: Storage,
    applyHandler?: (p: Promise<void>) => void
  ): Promise<DerivedDataProcessor> {
    const ddStorage = new DDStorage(storage)
    const processor = new DerivedDataProcessor(
      new DescriptorMap(hierarchy),
      model,
      hierarchy,
      ddStorage,
      storage,
      applyHandler
    )
    ddStorage.processor = processor
    const descriptors = await model.findAll(core.class.DerivedDataDescriptor, {})

    for (const d of descriptors) {
      d.version = this.getDDVersion(d)
      processor.descrs.update(d)
    }

    // Start processing
    void processor.doProcessing()

    return processor
  }

  async waitComplete (): Promise<void> {
    const p = new DeferredPromise<void>()
    this.sleeping.push(p)
    // We just need to wait it up.
    this.wakeup.resolve()
    await p.promise
  }

  private async txCreateDocWith (tx: TxCreateDoc<Doc>, context?: DDRebuildContext): Promise<void> {
    const descriptors = context !== undefined ? [context.descriptor] : this.descrs.getByClass(tx.objectClass)
    if (this.hierarchy.isDerived(tx.objectClass, core.class.DerivedDataDescriptor)) {
      await this.updateDescriptor(tx.objectId as Ref<Descr>, tx.sid)
      return
    }

    // Obtain descriptors an traverse build derived data
    const txDoc = TxProcessor.createDoc2Doc(tx)
    const doc: CachedDoc = {
      resolve: async () => await Promise.resolve(txDoc)
    }
    const apply = context?.apply ?? true
    for (const d of descriptors) {
      const done = measure('dd.create', d._id)
      if (d.query !== undefined && !matchDocument(txDoc, d.query)) {
        // Skip as not matched by query.
        continue
      }
      let results = apply ? (await this.applyMapper(d, tx)) ?? (await this.applyRule(d, tx, doc)) : []
      if (results !== null) {
        results = this.withDescrId(results, d._id, tx.objectId, tx.objectClass)
        if (d.targetClass !== undefined) {
          // In case of dd rebuild, we need to replace previous derived data.
          const oldData =
            context !== undefined
              ? await measureAsync(
                'dd.findOld',
                async () =>
                  await this.storage.findAll(d.targetClass as Ref<Class<DerivedData>>, {
                    objectId: tx.objectId,
                    objectClass: tx.objectClass,
                    descriptorId: d._id
                  }),
                d._id
              )
              : []

          await measureAsync(
            'dd.apply',
            async () => await this.applyDerivedData(oldData, results as DerivedData[], tx.modifiedBy),
            d._id,
            'create'
          )

          await measureAsync(
            'dd.collection',
            async () => await this.applyCollectionRules(d as DescrWithTarget, tx, apply, context?.collectionCleanCache),
            d._id,
            'create'
          )
        }
      }
      done()
    }
  }

  extractEmbeddedDoc (doc: Doc, rules?: MappingRule[]): any {
    if ((rules?.length ?? 0) > 0) {
      return this.extractRuleValues(doc, getRuleFieldValues(sortRules(rules), doc))
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
  private async applyCollectionRules (
    d: DescrWithTarget,
    tx: Tx,
    push: boolean,
    collectionCleanCache?: Set<Ref<Doc>>
  ): Promise<void> {
    for (const r of d.collections ?? []) {
      if (push) {
        const doc = TxProcessor.createDoc2Doc(tx as TxCreateDoc<Doc>)
        if (r.sourceFieldPattern === undefined) {
          const target = await this.getTargetByRef(doc, d.targetClass, r)
          if (target !== undefined) {
            await this.pushToCollection(d, doc, { ...target, space: tx.objectSpace }, r, collectionCleanCache)
          }
        } else {
          const targets = await this.getTargetsByRegex(doc, d.targetClass, r)
          for (const target of targets) {
            await this.pushToCollection(d, doc, { ...target, space: tx.objectSpace }, r, collectionCleanCache)
          }
        }
      } else {
        // We need to find all documents of targetClass with out field specified inside collection
        const objEmb = (r.rules?.length ?? 0) > 0
        const q = objEmb ? { [`${r.targetField}._id`]: tx.objectId } : { [`${r.targetField}`]: tx.objectId }
        const targets = await this.storage.findAll(d.targetClass, q)
        // If it was in few fields at once, operation probable will be execured few times.
        for (const t of targets) {
          const operation = {
            $pull: objEmb ? { [r.targetField]: { _id: tx.objectId } } : { [r.targetField]: tx.objectId }
          }
          await this.updateData(operation, t._id, t._class, t.space)
        }
      }
    }
  }

  private async getTargetsByRegex (
    doc: Doc,
    targetClass: Ref<Class<DerivedData>>,
    r: CollectionRule
  ): Promise<Array<Pick<Doc, '_id' | '_class'>>> {
    if (r.sourceFieldPattern?.pattern === undefined) return []
    const source = (doc as any)[r.sourceField]

    const refs = this.processRulePattern(r.sourceFieldPattern, source)
    return refs.map((r) => ({ _class: targetClass, _id: r as Ref<Doc> }))
  }

  private async getTargetByRef (
    doc: Doc,
    targetClass: Ref<Class<DerivedData>>,
    r: CollectionRule
  ): Promise<Pick<Doc, '_id' | '_class'> | undefined> {
    const parentDocRefString = (doc as any)[r.sourceField] as FullRefString
    const parentDocRef = parseFullRef(parentDocRefString)
    if (parentDocRef !== undefined && this.hierarchy.isDerived(parentDocRef._class, targetClass)) {
      return { _class: parentDocRef._class, _id: parentDocRef._id }
    }
    return undefined
  }

  private async pushToCollection (
    d: DescrWithTarget,
    doc: Doc,
    target: Pick<Doc, '_id' | '_class' | 'space'>,
    r: CollectionRule,
    collectionCleanCache?: Set<Ref<Doc>>
  ): Promise<void> {
    if (target === undefined) return
    try {
      const dd = measure('dd.pushToCollection', d._id)
      const obj = this.extractEmbeddedDoc(doc, r.rules)

      let operation: DocumentUpdate<Doc> = {
        $push: { [r.targetField]: obj }
      }

      // Replace operation if collection is required to be cleaned
      if (collectionCleanCache !== undefined && !collectionCleanCache.has(target._id)) {
        collectionCleanCache.add(target._id)
        // Replace with value of first collection item.
        operation = {
          [r.targetField]: [obj]
        }
      }

      if (r.lastModifiedField !== undefined) {
        ;(operation as any)[r.lastModifiedField] = doc.modifiedOn
      }

      // We need to do pull of all previous records with out id.
      await this.updateData(operation, target._id, target._class, target.space)
      dd()
    } catch (err) {
      console.log(err)
    }
  }

  private async updateDescriptor (objectId: Ref<Descr>, lastSID: TransactionID): Promise<void> {
    this.descrs.remove(objectId)
    // New descriptor construction
    const descr = this.model.getObject(objectId)

    const state = (
      await this.rawStorage.findAll(core.class.DerivedDataDescriptorState, { descriptorId: objectId }, { limit: 1 })
    ).shift()
    const prevVersion = state !== undefined ? state.version : ''

    const newVersion = DerivedDataProcessor.getDDVersion(descr)
    if (prevVersion !== newVersion) {
      // We have updated version of descriptor, so only in this case we need to do any update actions.
      this.descrs.update(descr)

      // Disable all DD processig until descriptor will complete rebuild of current set of documents.
      await this.refreshDerivedData(descr, true, lastSID)

      await this.updateDDState(objectId, newVersion, this.lastSIDAvailable)
    }
  }

  private async updateData<T extends Doc>(
    operations: DocumentUpdate<T>,
    objectId: Ref<T>,
    objectClass: Ref<Class<T>>,
    objectSpace: Ref<Space>
  ): Promise<void> {
    const tx: TxUpdateDoc<Doc> = {
      sid: 0,
      _id: '' as Ref<TxUpdateDoc<Doc>>,
      _class: core.class.TxUpdateDoc,
      space: core.space.DerivedData, // It will be ignored.,
      modifiedBy: core.account.System,
      modifiedOn: -1,
      createOn: Date.now(),
      objectId: objectId,
      objectClass: objectClass,
      objectSpace: objectSpace,
      operations: operations
    }

    await this.storage.tx(tx).catch((err) => console.log(err))
  }

  private async txUpdateDocWith (tx: TxUpdateDoc<Doc>, context?: DDRebuildContext): Promise<void> {
    const descriptors = context !== undefined ? [context.descriptor] : this.descrs.getByClass(tx.objectClass)
    if (this.hierarchy.isDerived(tx.objectClass, core.class.DerivedDataDescriptor)) {
      await this.updateDescriptor(tx.objectId as Ref<Descr>, tx.sid)
      return
    }

    let resolvedDoc: Doc | undefined = undefined
    // We expect storage is alrady updated before derived data is being processed.
    const doc: CachedDoc = {
      resolve: async () => {
        if (resolvedDoc === undefined) {
          resolvedDoc = (await this.storage.findAll(tx.objectClass, { _id: tx.objectId }, { limit: 1 }))[0]
        }
        return resolvedDoc
      }
    }

    const apply = context?.apply ?? true

    for (const d of descriptors) {
      const done = measure('dd.update', d._id)
      if (d.query !== undefined && !matchDocument(await doc.resolve(), d.query)) {
        // Skip as not matched by query.
        continue
      }
      const results = apply ? (await this.applyMapper(d, tx)) ?? (await this.applyRule(d, tx, doc)) : []
      if (results !== null && d.targetClass !== undefined) {
        const oldData = await measureAsync(
          'dd.findOld',
          async () =>
            await this.storage.findAll(d.targetClass as Ref<Class<DerivedData>>, {
              objectId: tx.objectId,
              objectClass: tx.objectClass,
              descriptorId: d._id
            }),
          d._id
        )
        await measureAsync(
          'dd.apply',
          async () => await this.applyDerivedData(oldData, results, tx.modifiedBy),
          d._id,
          'update'
        )
      }
      done()
    }
  }

  private async txRemoveDocWith (tx: TxRemoveDoc<Doc>, context?: DDRebuildContext): Promise<void> {
    const descriptors = context !== undefined ? [context.descriptor] : this.descrs.getByClass(tx.objectClass)

    if (this.hierarchy.isDerived(tx.objectClass, core.class.DerivedDataDescriptor)) {
      await this.removeDescriptorDerivedData(tx)
      return
    }

    for (const d of descriptors) {
      if (d.targetClass !== undefined) {
        const oldData = await measureAsync(
          'dd.findOld',
          async () =>
            await this.storage.findAll(d.targetClass as Ref<Class<DerivedData>>, {
              objectId: tx.objectId,
              objectClass: tx.objectClass,
              descriptorId: d._id
            }),
          d._id,
          'remove'
        )
        await measureAsync(
          'dd.apply',
          async () => await this.applyDerivedData(oldData, [], tx.modifiedBy),
          d._id,
          'remove'
        )
        await measureAsync(
          'dd.collection',
          async () => await this.applyCollectionRules(d as DescrWithTarget, tx, false),
          d._id,
          'remove'
        )
      }
    }
  }

  private async removeDescriptorDerivedData (tx: TxRemoveDoc<Doc>): Promise<void> {
    const descr = this.descrs.descriptors.get(tx.objectId)
    if (descr != null) {
      this.descrs.remove(tx.objectId as Ref<Descr>)
      await this.refreshDerivedData(descr, false, tx.sid)
    }
  }

  private async applyRule (d: Descr, tx: ObjTx, doc: CachedDoc): Promise<DerivedData[] | null> {
    // We need to check if Tx has field changes.
    if (tx._class === core.class.TxUpdateDoc) {
      const upd = tx as TxUpdateDoc<Doc>
      if (getRuleFieldValues(sortRules(d.rules), upd.operations).length === 0) {
        // No rule change are detected, so skipping DD.
        return null
      }
    }

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

    // We do not need to wait for apply, unless we are writing tests.
    await Promise.all([added, updated, deleted]).then()
  }

  private async applyMapper (descriptor: Descr, tx: Tx): Promise<DerivedData[] | undefined | null> {
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

  static ddHash (str: string, seed = 327): number {
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

  public async close (): Promise<void> {
    console.log('DD Processing close triggered')
    this.isClosed = true

    const p = new DeferredPromise<void>()
    this.sleeping.push(p)
    // We just need to wait it up.
    this.wakeup.resolve()
    await p.promise
    console.log('DD Processing close complete')
  }

  private async doProcessing (): Promise<void> {
    this.allDescriptorState = new Map(
      (await this.rawStorage.findAll(core.class.DerivedDataDescriptorState, {})).map((s) => [s.descriptorId, s])
    )
    const state = this.allDescriptorState.get(core.dd.Global)

    let lastSID = state?.lastSID ?? -1

    const step = 100
    let processed = lastSID
    let totallDDP = 0

    console.log('starting DD processor')

    this.lastSIDAvailable =
      (await this.storage.findAll(core.class.Tx, {}, { limit: -1, sort: { sid: SortingOrder.Descending } })).shift()
        ?.sid ?? 0

    while (!this.isClosed) {
      const ddLen = this.ddQuery.length
      totallDDP += ddLen
      const txes =
        ddLen > 0
          ? Object.assign(this.ddQuery.splice(0, ddLen), { total: ddLen })
          : await this.storage.findAll(
            core.class.Tx,
            { sid: { $gt: lastSID } },
            { limit: step, sort: { sid: SortingOrder.Ascending } }
          )
      if (txes.length === 0) {
        // Wait until some event occur.
        this.wakeup = new DeferredPromise<void>()

        // Notify any stuff wating end of completion.
        this.processSleepers()
        await this.wakeup.promise
        continue
      }
      for (const tx of txes) {
        if (this.isClosed) {
          break
        }
        await this.txWith(tx)
        if (tx.sid !== 0) {
          lastSID = tx.sid
        }
        if (processed % 500 === 0) {
          console.log(
            `processing DDD transactions: ${processed - totallDDP} of ${
              this.lastSIDAvailable
            }, dd transactions: ${totallDDP}`
          )
        }
        processed++
      }
      await this.updateDDState(core.dd.Global, '1.0', lastSID)
    }
    this.processSleepers()
    console.info('DD processing is finished')
  }

  private processSleepers (): void {
    for (const p of this.sleeping) {
      p.resolve() // Mark init pass as completed
    }
    if (this.sleeping.length > 0) {
      this.sleeping.splice(0, this.sleeping.length)
    }
  }

  private static getDDVersion (d: Descr): string {
    let version = d.version
    if (version === undefined) {
      version = this.ddHash(JSON.stringify(d)).toString(16)
    }
    return version
  }

  private async updateDDState (
    descriptorId: Ref<Descr>,
    version: string | undefined,
    lastSID: TransactionID
  ): Promise<void> {
    if (lastSID === -1) {
      return
    }
    if (this.ddStates.has(descriptorId)) {
      // Update timer is already scheduled
      this.ddStates.set(descriptorId, lastSID)
      return
    }
    this.ddStates.set(descriptorId, lastSID)
    const updateState = async (): Promise<void> => {
      const lastActualSID = this.ddStates.get(descriptorId) ?? lastSID
      this.ddStates.delete(descriptorId)
      const state = this.allDescriptorState.get(descriptorId)
      if (state === undefined) {
        const ctx: TxCreateDoc<DerivedDataDescriptorState> = {
          sid: 0,
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
            descriptorId: descriptorId,
            version: version ?? '',
            lastSID: lastActualSID
          }
        }
        this.allDescriptorState.set(descriptorId, TxProcessor.createDoc2Doc(ctx) as DerivedDataDescriptorState)
        await this.rawStorage.tx(ctx)
      } else {
        const ctx: TxUpdateDoc<DerivedDataDescriptorState> = {
          sid: 0,
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
            lastSID: lastActualSID,
            version: version ?? ''
          }
        }
        await this.rawStorage.tx(ctx)
        state.lastSID = lastActualSID
        state.version = version ?? ''
        this.allDescriptorState.set(descriptorId, state)
      }
    }
    const op = (): void => {
      if (!this.isClosed) {
        void updateState()
      }
    }
    if (this.updateStateTimeout !== 0) {
      setTimeout(op, this.updateStateTimeout)
    } else {
      op()
    }
  }

  /**
   * Perform iterable update of all source class to derived Data mapping, should be performed without active clients on DB.
   */
  private async refreshDerivedData (d: Descr, apply: boolean, lastSID: TransactionID): Promise<void> {
    // Perform a full rebuild of derived data of required type.
    console.log(`Schedule DD rebuild of ${d._id} version=${d.version ?? ''}`)

    const time = Date.now()

    let skip = 0
    while (true) {
      const txes = await this.storage.findAll(
        core.class.Tx,
        {
          sid: { $lt: lastSID },
          objectClass: { $in: this.hierarchy.getDescendants(d.sourceClass) }
        },
        { limit: 1000, skip, sort: { sid: SortingOrder.Ascending } }
      )
      if (txes.length === 0) {
        break
      }
      if (txes[txes.length - 1].sid !== 0) {
        console.log('rebuilding DDD transactions:', txes[0].sid, txes[txes.length - 1].sid)
      }
      const ctx: DDRebuildContext = {
        descriptor: d,
        collectionCleanCache: new Set(),
        apply
      }
      for (const tx of txes) {
        await this.txWith(tx, ctx)
      }
      skip += txes.length
    }
    console.info(
      'DD rebuild complete for ',
      d._id,
      d.sourceClass,
      d.targetClass,
      d.query,
      `complete, time: ${Date.now() - time}`
    )
  }
}
