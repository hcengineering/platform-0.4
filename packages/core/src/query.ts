import { deepEqual } from 'fast-equals'
import { Doc, Ref } from './classes'
import { createPredicates, isPredicate, isRootPredicate } from './predicate'
import { DocumentQuery, QuerySelector, SortingQuery } from './storage'

/**
 * @public
 */
export const likeSymbol = '%'

/**
 * @public
 */
export function checkLikeQuery (value: string, query: string): boolean {
  const searchString = query.split(likeSymbol).join('.*')
  const regex = RegExp(`^${searchString}$`)
  return regex.test(value)
}

/**
 * @public
 */
export function findQuery<T extends Doc> (query: DocumentQuery<T>, objects: T[]): T[] {
  let result: Doc[] = objects

  // Handler root predicates before do query filtering.

  for (const key of Object.keys(query).filter((q) => isRootPredicate(q))) {
    const value = (query as any)[key]
    const queries = value as unknown as Array<any>
    if (key === '$or') {
      const orResult = []
      const rMap = new Set<Ref<Doc>>()
      for (const q of queries) {
        const ov = findQuery(q as DocumentQuery<T>, objects)
        for (const oo of ov) {
          if (!rMap.has(oo._id)) {
            rMap.add(oo._id)
            orResult.push(oo)
          }
        }
      }
      result = orResult
    }
  }

  for (const key in query) {
    if (shouldSkipId<T>(key, query)) continue
    if (key === '$or') continue
    const value = (query as any)[key]
    result = findProperty(result, key, value)
  }
  return result as T[]
}

/**
 * @public
 */
export function findProperty<P> (objects: Doc[], propertyKey: string, value: P): Doc[] {
  if (value === undefined) {
    // Skip if value is undefined, we pass all objects.
    return objects
  }
  return isPredicate(value)
    ? findPropertyPredicate<P>(value, propertyKey, objects)
    : findPropertyValue<P>(objects, propertyKey, value)
}

function findPropertyValue<P> (objects: Doc[], propertyKey: string, value: P): Doc[] {
  const result: Doc[] = []
  for (const object of objects) {
    const val = getNestedValue(propertyKey, object)
    if (deepEqual(val, value) || isArrayValueCheck(val, value)) {
      result.push(object)
    }
  }
  return result
}

function findPropertyPredicate<P> (value: P, propertyKey: string, objects: Doc[]): Doc[] {
  const preds = createPredicates(value, propertyKey)
  for (const pred of preds) {
    objects = pred(objects)
  }
  return objects
}

function isArrayValueCheck<T, P> (val: T, value: P): boolean {
  return Array.isArray(val) && !Array.isArray(value) && val.includes(value)
}

/**
 * @public
 */
export function getNestedValue (key: string, doc: Doc): any {
  // Check dot notation
  if (key.length === 0) {
    return doc
  }
  key = key.split('\\$').join('$')
  const dots = key.split('.')
  // Replace escapting, since memdb is not escape keys

  // We have dots, so iterate in depth
  let pos = 0
  let value = doc as any
  for (const d of dots) {
    if (Array.isArray(value) && isNestedArrayQuery(value, d)) {
      // Array and d is not an indexed field.
      // So return array of nested values.
      return getNestedArrayValue(value, dots.slice(pos).join('.'))
    }
    value = value?.[d]
    pos++
  }
  return value
}

function isNestedArrayQuery (value: any, d: string): boolean {
  return Number.isNaN(Number.parseInt(d)) && value?.[d as any] === undefined
}

function getNestedArrayValue (value: any[], name: string): any[] {
  const result = []
  for (const v of value) {
    result.push(...arrayOrValue(getNestedValue(name, v)))
  }
  return result
}

function arrayOrValue (vv: any): any[] {
  return Array.isArray(vv) ? vv : [vv]
}

/**
 * @public
 */
export function resultSort<T extends Doc> (result: T[], sortOptions: SortingQuery<T>): void {
  const sortFunc = (a: any, b: any): number => {
    for (const key in sortOptions) {
      const result = typeof a[key] === 'string' ? a[key].localeCompare(b[key]) : a[key] - b[key]
      if (result !== 0) return result * (sortOptions[key] as number)
    }
    return 0
  }
  result.sort(sortFunc)
}

/**
 * @public
 */
export function matchDocument<T extends Doc> (doc: T, query: DocumentQuery<T>): boolean {
  const result = findQuery(query, [doc])
  return result.length === 1
}

/**
 * @public
 */
export function shouldSkipId<T extends Doc> (key: string, query: DocumentQuery<T>): boolean {
  return (
    key === '_id' &&
    (query._id as QuerySelector<T>)?.$like === undefined &&
    (query._id as QuerySelector<T>)?.$ne === undefined &&
    (query._id as QuerySelector<T>)?.$exists === undefined
  )
}
