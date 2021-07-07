import { Class, Doc, Ref } from './classes'
import { DerivedData } from './derived'

/**
 * An generic reference from objecId, classId.
 */
export interface Reference extends DerivedData {}

/**
 * An back reference index.
 */
export interface BackReference extends Reference {
  sourceObjectId: Ref<Doc>
  sourceObjectClass: Ref<Class<Doc>>
}
