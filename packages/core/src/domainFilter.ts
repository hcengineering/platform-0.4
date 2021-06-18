import { Class, Doc, Domain, Ref } from './classes'
import { Hierarchy } from './hierarchy'
import { Storage } from './storage'
import { Tx, txObjectClass } from './tx'

/**
 * Will do not pass transactions with specified domain.
 */
export class DomainFilter implements Storage {
  constructor (
    readonly hierarchy: Hierarchy,
    readonly delegate: Storage,
    readonly allowDomain?: Set<Domain>,
    readonly disallowDomain?: Set<Domain>
  ) {}

  async findAll<T extends Doc>(_class: Ref<Class<T>>, query: Partial<T>): Promise<T[]> {
    const domain = this.hierarchy.getDomain(_class)

    // If domain is allowed, return
    if (this.allowDomain?.has(domain) ?? false) {
      await this.delegate.findAll(_class, query)
    }

    // If domain is not equal to dis allowed
    if (!(this.disallowDomain?.has(domain) ?? false)) {
      return await this.delegate.findAll(_class, query)
    }
    // Skip if domain is disallowed or undefined.
    return await Promise.resolve([])
  }

  async tx (tx: Tx): Promise<void> {
    const domain = this.hierarchy.getDomain(txObjectClass(tx))

    // If domain is allowed
    if (this.allowDomain?.has(domain) ?? false) {
      await this.delegate.tx(tx)
      return
    }
    // If domain is not disallowed
    if (!(this.disallowDomain?.has(domain) ?? false)) {
      await this.delegate.tx(tx)
      return
    }

    // Skip if domain is disallowed or undefined.
    return await Promise.resolve()
  }
}

export function allowDomain (hierarchy: Hierarchy, storage: Storage, ...domain: Domain[]): Storage {
  return new DomainFilter(hierarchy, storage, new Set(domain))
}
export function disallowDomain (hierarchy: Hierarchy, storage: Storage, ...domain: Domain[]): Storage {
  return new DomainFilter(hierarchy, storage, undefined, new Set(domain))
}
