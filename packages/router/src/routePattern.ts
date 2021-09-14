//
// Copyright © 2021 Anticrm Platform Contributors.
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

import { parseHash, parsePath, parseQuery } from './location'
import { Location, newLocation, QueryType } from '.'

export interface RoutePattern {
  segments: string[]
  queryNames: string[]
  fragmentName: string
}

export function parsePattern (patternText: string): RoutePattern {
  const pattern: RoutePattern = {
    segments: [],
    queryNames: [],
    fragmentName: ''
  }
  // Parse pattern for faster matching
  pattern.segments = parsePath(patternText)
  // Extract query from last path segment.
  if (pattern.segments.length > 0) {
    let lastPath = pattern.segments[pattern.segments.length - 1]
    // Extract #fragment
    lastPath = extractFragment(lastPath, pattern)

    // Extract ?queryA=a,queryB=b,queryC
    lastPath = extractQuery(lastPath, pattern)
    // Replace last segment or remove it.
    updateLastSegment(lastPath, pattern)
  }
  return pattern
}

function updateLastSegment (lastPath: string, pattern: RoutePattern): void {
  if (lastPath.length > 0) {
    pattern.segments[pattern.segments.length - 1] = lastPath
  } else {
    // No need last item, just remove it
    pattern.segments.splice(pattern.segments.length - 1, 1)
  }
}

function extractQuery (lastPath: string, pattern: RoutePattern): string {
  const qpos = lastPath.indexOf('?')
  if (qpos !== -1) {
    pattern.queryNames = Object.keys(parseQuery(lastPath.substring(qpos)))
    lastPath = lastPath.substring(0, qpos)
  }
  return lastPath
}

function extractFragment (lastPath: string, pattern: RoutePattern): string {
  const fpos = lastPath.indexOf('#')
  if (fpos !== -1) {
    pattern.fragmentName = parseHash(lastPath.substring(fpos))
    lastPath = lastPath.substring(0, fpos)
  }
  return lastPath
}

// Perform matching of current location with extraction of variables and constructing childLocation.
export function matchLocation (pattern: RoutePattern, location: Location, defaults?: QueryType): {childLocation: Location, variables: QueryType, matched: boolean} {
  const variables: QueryType = {}

  const childLocation = newLocation()
  const path = [...location.path]

  const matched = matchSegments(pattern, path, defaults, variables)

  if (matched !== pattern.segments.length) {
    // we have unmatched segments.
    return { childLocation, variables, matched: false }
  }
  childLocation.path = path

  // Update fragment
  updateFragment(pattern, location, variables, childLocation)

  childLocation.query = { }

  // Update Query
  updateQueries(pattern, location, variables, childLocation)
  return { variables, childLocation, matched: true }
}
function matchSegments (pattern: RoutePattern, path: string[], defaults: QueryType | undefined, variables: QueryType): number {
  let matched = 0
  for (const s of pattern.segments) {
    if (path.length > 0) {
      const value = path.splice(0, 1)[0]
      const msegm = matchSegment(s, value)
      if (matchOrDefault(msegm, defaults)) { // Check if matched or has defaults
        variables[msegm.key] = msegm.value
      }
    }
    matched += hasVarDefaults(s, variables, defaults)
  }
  return matched
}

function matchOrDefault (msegm: { matched: boolean, key: string }, defaults?: QueryType): boolean {
  return msegm.matched || defaults?.[msegm.key] !== undefined
}

function hasVarDefaults (s: string, variables: QueryType, defaults?: QueryType): 0|1 {
  // Check if we had default value, then mark as matched
  const key = s.startsWith(':') ? s.substring(1) : ''
  const varVal = variables[key] !== undefined
  const defVal = defaults?.[key] !== undefined
  return (varVal || defVal) ? 1 : 0
}

function updateQueries (pattern: RoutePattern, location: Location, variables: QueryType, childLocation: Location): void {
  for (const q of pattern.queryNames) {
    const v = location.query?.[q]
    if (v !== undefined) {
      variables[q] = v
    }
  }
  for (const q of Object.entries(location.query ?? {})) {
    if (!pattern.queryNames.includes(q[0])) {
      childLocation.query = childLocation.query ?? {}
      childLocation.query[q[0]] = q[1]
    }
  }
}

function updateFragment (pattern: RoutePattern, location: Location, variables: QueryType, childLocation: Location): void {
  if (pattern.fragmentName !== '' && location.fragment !== undefined) {
    variables[pattern.fragmentName] = location.fragment
  } else {
    childLocation.fragment = location.fragment
  }
}

function matchSegment (s: string, value: string): { matched: boolean, key: string, value: string } {
  if (s.startsWith(':')) {
    return { matched: true, key: s.substring(1), value }
  }
  return { matched: (s === value || regExpTest(s, value)), key: '', value: '' }
}

function regExpTest (s: string, value: string): boolean {
  try {
    return new RegExp(s).test(value)
  } catch (e) {
    return false
  }
}

