import { Domain } from './classes'
import { DerivedData } from './derived'

/**
 * An generic reference from objecId, classId to link.
 *
 * A `link` field value.
 *
 * Generic format is as in markdown:
 *
 * Example: [Text](ref://classId#objectId)
 *
 * @public
 */
export interface Reference extends DerivedData {
  link: string
}

/**
 * @public
 */
export const DOMAIN_REFERENCES = 'references' as Domain
