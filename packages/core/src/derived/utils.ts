import { deepEqual } from 'fast-equals'
import { DerivedData, DerivedDataDescriptor, MappingRule, RuleExpresson } from '.'
import { Data, Doc } from '../classes'
import { generateId } from '../utils'

type Descr = DerivedDataDescriptor<Doc, DerivedData>

/**
 * @internal
 */
export interface DerivedDataOperations {
  additions: DerivedData[]
  updates: DerivedData[]
  deletes: DerivedData[]
}

function dataEqual (a: DerivedData, b: DerivedData): boolean {
  const { _id: aId, modifiedOn: mona, createOn: cona, ...aData } = a
  const { _id: bId, modifiedOn: monb, createOn: conb, ...bData } = b
  return deepEqual(aData, bData)
}
/**
 * Find same data with old Id.
 * @internal
 */
export function popSameValue (d: DerivedData, values: DerivedData[]): boolean {
  const di = values.findIndex((newValue) => dataEqual(newValue, d))
  if (di === -1) {
    return true
  }
  values.splice(di, 1)
  return false // Return new derived data if old one is found, without id matching.
}

/**
 * @internal
 */
export function findExistingData (oldData: DerivedData[], newData: DerivedData[]): DerivedDataOperations {
  const ops: DerivedDataOperations = { additions: [], updates: [], deletes: [] }

  // Check deletes
  // If same but different Id, no actions required.
  oldData.forEach((old) => (popSameValue(old, newData) ? ops.deletes.push(old) : 0))

  // Check updates
  for (const newd of newData) {
    const oldi = ops.deletes.findIndex((d) => d._class === newd._class)
    if (oldi !== -1) {
      const old = ops.deletes.splice(oldi, 1)[0]
      ops.updates.push({ ...newd, _id: old._id })
    } else {
      ops.additions.push(newd)
    }
  }

  return ops
}

/**
 * @internal
 */
export function newDerivedData<T extends DerivedData> (doc: Doc, d: Descr, len: number): T {
  const result = {
    _class: d.targetClass,
    objectId: doc._id,
    objectClass: doc._class,
    ...(d.initiValue ?? {}),
    _id: `dd-${generateId()}`,
    modifiedBy: doc.modifiedBy,
    modifiedOn: Date.now(),
    createOn: Date.now(),
    space: doc.space,
    descriptorId: d._id
  }
  return result as T
}

export function lastOrAdd (results: DerivedData[], d: Descr, doc: Doc): DerivedData {
  if (results.length === 0) {
    results.push(newDerivedData(doc, d, results.length))
  }
  return results[results.length - 1]
}
export function groupOrValue (pattern: RuleExpresson, matches: RegExpExecArray): any {
  return matches[pattern.group ?? 0]
}

export function sortRules (rules?: MappingRule[]): MappingRule[] {
  return [...(rules ?? [])].sort(ruleCompare)
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
