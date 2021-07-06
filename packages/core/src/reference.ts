import { Class, Doc, Ref } from './classes'
import { DerivedData } from './derived'

/**
 * An back reference index
 */
export interface Reference extends DerivedData {
  targetObjectId: Ref<Doc>
  targetObjectClass: Ref<Class<Doc>>
}
