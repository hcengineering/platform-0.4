import { DerivedData, DerivedDataDescriptor } from '.'
import { Class, Doc, Obj, Ref } from '../classes'
import { Hierarchy } from '../hierarchy'

/**
 * @public
 */
export type Descr = DerivedDataDescriptor<Doc, DerivedData>

/**
 * @public
 */
export class DescriptorMap {
  class2Descr = new Map<Ref<Class<Obj>>, Map<Ref<Doc>, Descr>>()
  descriptors = new Map<Ref<Doc>, Descr>()

  constructor (readonly hierarchy: Hierarchy) {}

  getByClass (_class: Ref<Class<Doc>>): Descr[] {
    const result: Descr[] = []
    for (const o of this.hierarchy.getAncestors(_class)) {
      const descrs = this.class2Descr.get(o)
      if (descrs !== undefined && descrs.size > 0) {
        result.push(...descrs.values())
      }
    }
    return result
  }

  allDescriptors (): Descr[] {
    return Array.from(this.descriptors.values())
  }

  update (d: Descr): void {
    this.descriptors.set(d._id, d)
    let descriptors = this.class2Descr.get(d.sourceClass)
    if (descriptors === undefined) {
      descriptors = new Map()
      this.class2Descr.set(d.sourceClass, descriptors)
    }
    descriptors.set(d._id, d)
  }

  remove (id: Ref<Descr>): void {
    const descr = this.descriptors.get(id)
    if (descr === undefined) {
      return
    }
    const descriptors = this.class2Descr.get(descr.sourceClass)
    if (descriptors !== undefined) {
      descriptors.delete(id)
    }
  }
}
