import { deepEqual } from 'fast-equals'
import { DerivedData, DerivedDataDescriptor, MappingRule, RuleExpresson } from '.'
import { Data, Doc, Ref } from '../classes'
import { generateId } from '../utils'

type Descr = DerivedDataDescriptor<Doc, DerivedData>
/**
 * Find same data with old Id.
 */
export function popByValue (
  d: DerivedData,
  values: DerivedData[]
): { data: DerivedData, oldId: Ref<DerivedData> } | undefined {
  const { _id: oldId, ...data } = d
  let pos = 0
  for (const newValue of values) {
    const { _id: newId, ...newData } = newValue
    if (deepEqual(data, newData)) {
      values.splice(pos, 1)
      return { data: newValue, oldId } // Return new derived data if old one is found, without id matching.
    }
    pos++
  }
  return undefined
}

export function findExistingData (
  oldData: DerivedData[],
  newData: DerivedData[]
): { deletes: Map<Ref<DerivedData>, DerivedData>, existing: DerivedData[] } {
  const results: { deletes: Map<Ref<DerivedData>, DerivedData>, existing: DerivedData[] } = {
    deletes: new Map(),
    existing: []
  }

  for (const old of oldData) {
    const newValue = popByValue(old, newData)
    if (newValue !== undefined) {
      results.existing.push(newValue.data) // Same data, but different Id, no actions required.
    } else {
      results.deletes.set(old._id, old) // No data in new set.
    }
  }
  return results
}

export function newDerivedData<T extends DerivedData> (doc: Doc, d: Descr): T {
  const result = {
    _class: d.targetClass,
    objectId: doc._id,
    objectClass: doc._class,
    ...(d.initiValue ?? {}),
    _id: generateId(),
    modifiedBy: doc.modifiedBy,
    modifiedOn: Date.now(),
    space: doc.space,
    descriptorId: d._id
  }
  return result as T
}

export function lastOrAdd (results: DerivedData[], d: Descr, doc: Doc): DerivedData {
  if (results.length === 0) {
    results.push(newDerivedData(doc, d))
  }
  return results[results.length - 1]
}
export function groupOrValue (pattern: RuleExpresson, matches: RegExpExecArray): any {
  return matches[pattern.group ?? 0]
}

export function sortRules (d: Descr): MappingRule[] {
  return [...(d.rules ?? [])].sort(ruleCompare)
}

function ruleCompare (a: MappingRule, b: MappingRule): number {
  const am = +(a.pattern?.multDoc ?? false)
  const bm = +(b.pattern?.multDoc ?? false)
  return am - bm
}

export function getRuleFieldValues (
  rules: MappingRule[],
  doc: Partial<Data<Doc>>
): { value: string, rule: MappingRule }[] {
  const results: { value: string, rule: MappingRule }[] = []
  for (const rule of rules) {
    const value = (doc as any)[rule.sourceField]
    if (value !== undefined) {
      results.push({ rule, value: value as string })
    }
  }
  return results
}
