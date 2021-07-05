import { Doc } from './classes'
import { createPredicates, isPredicate } from './predicate'

export const likeSymbol = '%'

export function checkLikeQuery (value: string, query: string): boolean {
  const searchString = query.split(likeSymbol).join('.*')
  const regex = RegExp(`^${searchString}$`)
  return regex.test(value)
}

export function findProperty (objects: Doc[], propertyKey: string, value: any): Doc[] {
  if (isPredicate(value)) {
    const preds = createPredicates(value, propertyKey)
    for (const pred of preds) {
      objects = pred(objects)
    }
    return objects
  }
  const result: Doc[] = []
  for (const object of objects) {
    if ((object as any)[propertyKey] === value) {
      result.push(object)
    }
  }
  return result
}
