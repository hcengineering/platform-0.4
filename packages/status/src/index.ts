//
// Copyright © 2020, 2021 Anticrm Platform Contributors.
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

/**
 * Anticrm Platform Foundation Types
 * @packageDocumentation
 */

/**
 * Status severity
 * @public
 */
export enum Severity {
  OK = 'OK',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
}

export type Id = string & { __id: true }

/**
 * Component that created status object
 * @public
 */
export type Component = string & { __component: true }

// TODO: remove `StatusCode`?
export type StatusCode<P extends Record<string, any> = {}> = IntlString<P>

/**
 * Status of an operation
 * @public
 */
export class Status<P = {}> {
  readonly severity: Severity
  readonly code: StatusCode<P>
  readonly params: P

  constructor (severity: Severity, code: StatusCode<P>, params: P) {
    this.severity = severity
    this.code = code
    this.params = params
  }
}

/**
 * Error object wrapping `Status`
 * @public
 */
export class PlatformError<P extends Record<string, any>> extends Error {
  readonly status: Status<P>

  constructor (status: Status<P>) {
    super(`${status.severity}: ${status.code}`)
    this.status = status
  }
}

// I D E N T I T Y

export type Namespace = Record<string, string | Record<string, string>>
type ComponentDescriptor<C extends Component> = { id: C }

function transform (
  result: Record<string, any>,
  prefix: string,
  namespace: Record<string, any>
): Namespace {
  for (const key in namespace) {
    const value = namespace[key]
    if (typeof result[key] === 'string') {
      throw new Error(`'mergeIds' overwrites '${key}'.`)
    }
    result[key] =
      typeof value === 'string'
        ? value === ''
          ? prefix + '.' + key
          : value
        : transform(
          result[key] === undefined ? {} : result[key],
          key + ':' + prefix,
          value
        )
  }
  return result
}

export function component<C extends Component, N extends Namespace> (
  component: C,
  namespace: N
): ComponentDescriptor<C> & N {
  return { id: component, ...transform({}, component, namespace) as N }
}

export function mergeIds<C extends ComponentDescriptor<Component>, M extends Namespace> (
  component: C,
  merge: M
): C & M {
  return transform(Object.assign({}, component), component.id, merge) as C & M
}

export interface IdInfo {
  kind?: string
  component: Component
  name: string
}

export function parseId (id: Id): IdInfo {
  const [prefix, name] = id.split('.')
  if (name === undefined) {
    throw new PlatformError(new Status(Severity.ERROR, status.status.InvalidId, { id }))
  }
  const kindAndComponent = prefix.split(':')
  if (kindAndComponent.length === 1) 
    return {
      component: kindAndComponent[0] as Component,
      name
    }
  return { 
    kind: kindAndComponent[0],
    component: kindAndComponent[1] as Component,
    name
  }
}


// S T A T U S  C O D E S

const status = component('status' as Component, {
  status: {
    OK: '' as StatusCode,
    UnknownError: '' as StatusCode<{ message: string }>,
    InvalidId: '' as StatusCode<{ id: Id }>
  }
})

/**
 * OK Status
 * @public
 */
export const OK = new Status(Severity.OK, status.status.OK, {})

export function unknownStatus(message: string): Status<{}> {
  return new Status(Severity.ERROR, status.status.UnknownError, { message })
}

/**
 * Creates unknown error status
 * @public
 */
export function unknownError (err: Error): Status {
  return err instanceof PlatformError ? err.status : unknownStatus(err.message)
}

// R E S O U R C E S

export type IntlString<T extends Record<string, any> = {}> = Id & {
  __intl_string: T
}

/**
 * Platform Metadata Identifier (PMI).
 *
 * 'Metadata' is simply any JavaScript object, which is used to configure platform, e.g. IP addresses.
 * Another example of metadata is an asset URL. The logic behind providing asset URLs as metadata is
 * we know URL at compile time only and URLs vary depending on deployment options.
 */
export type Metadata<T> = Id & { __metadata: T }

/**
 * Platform Resource Identifier (PRI)
 *
 * @remarks
 *
 * Almost anything in the Anticrm Platform is a `Resource`. Resources referenced by Platform Resource Identifier (PRI).
 *
 * TODO: understand Resource better. Is this just a `platform` thing or should be in `core` as well
 *
 * 'Resource' is simply any JavaScript object. There is a plugin exists, which 'resolve' PRI into actual object.
 * This is a difference from Metadata. Metadata object 'resolved' by Platform instance, so we may consider Metadata as
 * a Resource, provided by Platform itself. Because there is always a plugin, which resolve `Resource` resolution is
 * asynchronous process.
 *
 * `Resource` is a string of `kind:plugin.id` format. Since Metadata is a kind of Resource.
 * Metadata also can be resolved using resource API.
 *
 * @example
 * ```typescript
 *   `class:contact.Person` as Resource<Class<Person>> // database object with id === `class:contact.Person`
 *   `string:class.ClassLabel` as Resource<string> // translated string according to current language and i18n settings
 *   `asset:ui.Icons` as Resource<URL> // URL to SVG sprites
 *   `easyscript:2+2` as Resource<() => number> // function
 * ```
 *
 * @public
 */
export type Resource<T> = Id & { __resource: T }

// U I

type URL = string
export type Asset = Metadata<URL>

export { status as default }

