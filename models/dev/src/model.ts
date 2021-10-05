import { Class, Data, Doc, Ref } from '@anticrm/core'

/**
 * @public
 */
export interface DemoBuilder {
  createDoc: <T extends Doc>(
    _class: Ref<Class<T>>,
    attributes: Data<T>,
    objectId: Ref<T>, // ObjectID should be not uniq for model instance values, for upgrade procedure to work properly.
    docOptions?: Partial<Doc>
  ) => Promise<T>
}
