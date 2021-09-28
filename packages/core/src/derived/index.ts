import { Resource } from '@anticrm/status'
import { Class, Data, Doc, Domain, Ref } from '../classes'
import { Hierarchy } from '../hierarchy'
import { ModelDb } from '../memdb'
import { DocumentQuery, Storage } from '../storage'
import { Tx } from '../tx'
import { Descr, DescriptorMap } from './descriptors'

/**
 * @public
 */
export interface MappingOptions {
  descriptor: DerivedDataDescriptor<Doc, DerivedData>
  hierarchy: Hierarchy
  storage: Storage
  model: ModelDb
}
/**
 * Provide an maping function to transform
 * particular document transactions to derived
 * data object update transactions.
 * @public
 */
export interface DocumentMapper {
  /**
   * Perform mapping of transaction to appropriate Derived Data documents.
   *
   * @param tx - source transaction
   * @param hierarchy - classs hierarchy to use.
   * @param storage - underlien storage to perform operation on.
   */
  map: (tx: Tx, options: MappingOptions) => Promise<DerivedData[]>
}

/**
 * Define an expression to match for source field.
 * @public
 */
export interface RuleExpresson {
  pattern: string // Regular expression pattern
  group?: number // If specified, a group with required number will be used
  multDoc?: boolean // If defined and true, will cause multiple document to occur
}

/**
 * Provide information about mapping of one source field to some target field.
 *
 * In case pattern is specified a reguler expression will be matched agains source field value,
 * and targetField will be filled with value of source field.
 *
 * in case pattern.multiDoc is set to `true`, for every match individual document will be produced.
 * @public
 */
export interface MappingRule {
  sourceField: string // If source field is not set, a value should be specified.
  targetField: string // Target field to store value in DD document.
  pattern?: RuleExpresson // A value pattern to match
}

/**
 * An collection update rule, if defined, our document _id will be push/pull to/from objectId specified in our refField.
 * @public
 */
export interface CollectionRule {
  sourceField: string // A field reference to source object.
  targetField: string // A source field collection we need to push our _id inside.
  /**
   * A value pattern to match source field
   * must capture id field
   */
  sourceFieldPattern?: RuleExpresson

  /**
   *  Allow to perform additional document mapping of source document fields to inserted embedded document fields.
   *
   * _id source field will automatically mapped to _id:Ref<Doc> field.
   *
   * Fields mapped only on document creation and not updated during updates, so they should be immutable.
   */
  rules?: MappingRule[]
}

/**
 * Document describing derived data
 * @public
 */
export interface DerivedDataDescriptor<T extends Doc, D extends Doc> extends Doc {
  sourceClass: Ref<Class<T>> // Defined for instances of this class.
  targetClass: Ref<Class<D>> // A derived data class to produce.

  initiValue?: Partial<Data<D>> // Initial value for derived data instance.
  query?: DocumentQuery<T> // A query filter to match source object.

  /**
   * Document mapper to use.
   */
  mapper?: Resource<DocumentMapper>
  /**
   * A mapping operator, some fields to document.
   *
   * In case of rules set, final document will be created only in case all required rules are matched.
   *
   * If rule is matched multiple times, multiple derived data documents will be created.
   */
  rules?: MappingRule[]

  /**
   * An collection rules.
   */
  collections?: CollectionRule[]

  /**
   * Version of descriptor, if changed will trigger update of all derived data produced with previous version.
   * Required for offline DB structure updates.
   *
   * Required with mapper, to inform about mapper version is changed.
   * If version is not defined, hash of descriptor will be used.
   */
  version?: string
}

/**
 * Define some detived data interfaces
 * @public
 */
export interface DerivedData extends Doc {
  descriptorId: Ref<DerivedDataDescriptor<Doc, DerivedData>>
  objectId: Ref<Doc> // <-- reference to source document.
  objectClass: Ref<Class<Doc>> // <-- source object class.
}

/**
 * @public
 * Processing state for Derived Data
 * */
export interface DerivedDataDescriptorState extends Doc {
  descriptorId: Ref<DerivedDataDescriptor<Doc, DerivedData>>
  version: string
}

/**
 * @public
 */
export const DOMAIN_DERIVED_DATA = 'derived-data' as Domain

export { DerivedDataProcessor, registerMapper } from './processor'
export { DescriptorMap, Descr }
