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

import { getContext, setContext } from 'svelte'
import { writable, derived } from 'svelte/store'
import type { Readable } from 'svelte/store'
import type { Location } from './types'
import { locationToUrl, parseLocation } from './location'

function windowLocation (): Location {
  return parseLocation(window.location)
}

const locationWritable = writable(windowLocation())
window.addEventListener('popstate', () => {
  locationWritable.set(windowLocation())
})

// const location: Readable<Location> = derived(locationWritable, (loc) => loc)

const ROUTER_CONTEXT = 'router'

interface Router {
  navigate(path: string[]): void
  getCurrentPath(): string[]
}

export function getRouter(): Router {
  return getContext<Router>(ROUTER_CONTEXT)
}

export function newRouter(segments: number, onChange: (route: string[]) => void) {
  const parent = getRouter()
  
  let currentPath: string[] = []
  currentPath.length = segments

  function getParentPath(): string[] {
    return parent?.getCurrentPath() ?? []
  }

  function getCurrentPath(): string[] {
    return [...getParentPath(), ...currentPath]
  }

  const router: Router = {
    navigate (path: string[]): void {
      currentPath = path
      if (path.length < segments)
        currentPath.length = segments
      const url = '/' + getCurrentPath().join('/')
      console.log('url', url)
      history.pushState(null, '', url)
      locationWritable.set(windowLocation())
    },

    getCurrentPath
  }

  setContext(ROUTER_CONTEXT, router)

  const unsubscribe = locationWritable.subscribe((location) => {
    const parentSegments = getParentPath().length
    currentPath = location.path.slice(parentSegments, parentSegments + segments)
    onChange(currentPath)
  })

  return unsubscribe
}