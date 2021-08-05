//
// Copyright © 2020 Anticrm Platform Contributors.
//
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
//

import type { Plugin, Service } from './plugin'
import { getPlugin } from './plugin'
import type { Resource } from '@anticrm/status'
import { parseId } from '@anticrm/status'

const resources = new Map<Resource<any>, any>()
const resolvingResources = new Map<Resource<any>, Promise<any>>()

/**
 * Peek does not resolve resource. Return resource if it's already loaded.
 * @public
 */
export function peekResource<T> (resource: Resource<T>): T | undefined {
  return resources.get(resource)
}

/**
 * @public
 */
export async function getResource<T> (resource: Resource<T>): Promise<T> {
  const resolved = resources.get(resource)
  if (resolved !== undefined) {
    return resolved
  } else {
    let resolving = resolvingResources.get(resource)
    if (resolving !== undefined) {
      return await resolving
    }

    const info = parseId(resource)
    resolving = getPlugin(info.component as Plugin<Service>)
      .then(() => {
        const value = resources.get(resource)
        if (value === undefined) {
          throw new Error('resource not loaded: ' + resource)
        }
        return value
      })
      .finally(() => {
        resolvingResources.delete(resource)
      })

    resolvingResources.set(resource, resolving)
    return await resolving
  }
}

/**
 * @public
 */
export function setResource<T> (resource: Resource<T>, value: T): void {
  resources.set(resource, value)
}
