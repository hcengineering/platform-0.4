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

/* eslint-env jest */

import { Class, Doc, Ref, Space } from '@anticrm/core'
import { locationToUrl, parseLocation } from '../location'
import { Router } from '../router'
import { newLocation, Location } from '..'

interface MyProps {
  spaceId: Ref<Space>
  objId: Ref<Doc>
  _class: Ref<Class<Doc>>
}

interface ChildProps {
  docId: Ref<Doc>
  filter: string
}

interface ParentProps {
  author: string
}

interface FilterProps {
  doFilter: boolean
  filter?: string
  threshold: number
}

describe('routes', () => {
  it('match object value', () => {
    let matched = 0
    const r = new Router<Partial<MyProps>>({
      patternText: '/workbench/:spaceId/browse/:objId?_class',
      matcher: (props) => {
        matched++
      },
      defaults: {}
    })
    r.update({
      path: ['workbench', 'sp1', 'browse', 'obj1'],
      query: { _class: 'qwe' },
      fragment: ''
    })
    expect(matched).toEqual(1)
    const pp = r.properties()

    expect(pp).toBeDefined()
    expect(pp?.objId).toEqual('obj1')
    expect(pp?.spaceId).toEqual('sp1')
    expect(pp?._class).toEqual('qwe')
  })

  it('match width default value', () => {
    let matched = 0
    const r = new Router<ParentProps>({
      patternText: ':author',
      matcher: (props) => {
        matched++
      },
      defaults: { author: 'qwe' }
    })
    r.update({
      path: [],
      query: { _class: 'qwe' },
      fragment: ''
    })
    expect(matched).toEqual(1)

    r.update({
      path: ['qwe2'],
      query: { _class: 'qwe' },
      fragment: ''
    })
    expect(matched).toEqual(2)
    const pp = r.properties()

    expect(pp?.author).toEqual('qwe2')
  })

  it('match query without value', () => {
    let matched = 0
    const r = new Router<FilterProps>({
      patternText: '?doFilter&filter&threshold',
      matcher: (props) => {
        matched++
      },
      defaults: { doFilter: false, threshold: 100 }
    })
    r.update(parseLocation({ pathname: '', search: '?filter=123', hash: '' }))
    expect(matched).toEqual(1)
    let pp = r.properties()

    expect(pp?.doFilter).toEqual(false)
    expect(pp?.filter).toEqual('123')
    expect(pp?.threshold).toEqual(100)

    r.update(parseLocation({ pathname: '', search: '?doFilter&filter=123&threshold=99', hash: '' }))
    expect(matched).toEqual(2)
    pp = r.properties()

    expect(pp?.doFilter).toEqual(true)
    expect(pp?.threshold).toEqual(99)

    r.update(parseLocation({ pathname: '', search: '?doFilter=true&filter=123&threshold=99', hash: '' }))
    expect(matched).toEqual(2)
    pp = r.properties()

    expect(pp?.doFilter).toEqual(true)
    expect(pp?.threshold).toEqual(99)

    r.update(parseLocation({ pathname: '', search: '?doFilter=true&filter=123&threshold', hash: '' }))
    expect(matched).toEqual(3)
    pp = r.properties()

    expect(pp?.doFilter).toEqual(true)
    expect(pp?.threshold).toEqual(0)
  })

  it('test chained routers', () => {
    let matched = 0
    const r = new Router<Partial<MyProps>>({
      patternText: '/workbench/:spaceId/?_class',
      matcher: (props) => {
        matched++
      },
      defaults: {}
    })
    r.update({
      path: ['workbench', 'sp1', 'browse', 'GEN-1'],
      query: { _class: 'qwe', data: 'azs', filter: 'fff' },
      fragment: ''
    })
    expect(matched).toEqual(1)

    const child = r.newRouter<Partial<ChildProps>>(
      '/browse/:docId?filter',
      (props) => {
        matched++
      },
      {}
    )
    expect(matched).toEqual(2)

    const pp = child.properties()

    expect(pp?.docId).toEqual('GEN-1')
    expect(pp?.filter).toEqual('fff')
  })

  it('test navigate', () => {
    let matched = 0
    const r1 = new Router<Partial<ParentProps>>({
      patternText: '/author/:author',
      matcher: (props) => {
        matched++
      },
      defaults: {}
    })
    const r2 = r1.newRouter<Partial<MyProps>>(
      '/workbench/:spaceId/?_class',
      (props) => {
        matched++
      },
      {}
    )
    const r3 = r2.newRouter<Partial<ChildProps>>(
      '/browse/:docId/?filter',
      (props) => {
        matched++
      },
      {}
    )
    r1.update({
      path: ['author', 'master', 'workbench', 'sp1', 'browse', 'GEN-1'],
      query: { _class: 'qwe', data: 'azs', filter: 'fff' },
      fragment: ''
    })
    expect(matched).toEqual(3)
    const nl1 = r1.location({ author: 'qwe' })
    const nl2 = r2.location({ spaceId: 'zzz' as Ref<Space> })
    const nl3 = r3.location({ filter: 'teta' })
    expect(locationToUrl(nl1 ?? newLocation())).toEqual('/author/qwe/workbench/sp1/browse/GEN-1?_class=qwe&filter=fff')
    expect(locationToUrl(nl2 ?? newLocation())).toEqual(
      '/author/master/workbench/zzz/browse/GEN-1?_class=qwe&filter=fff'
    )
    expect(locationToUrl(nl3 ?? newLocation())).toEqual(
      '/author/master/workbench/sp1/browse/GEN-1?_class=qwe&filter=teta'
    )
    r1.clearChildRouter() // Just for coverage
  })

  it('test multiple routes', () => {
    let matched = -1
    const navigated: Location[] = []
    const r1 = new Router<Partial<ParentProps>>(
      {
        patternText: '/author/:author',
        matcher: (props) => {
          matched = 0
        },
        defaults: {}
      },
      undefined,
      (loc) => {
        navigated.push(loc)
      }
    )
    const r2 = r1.addRoute<Partial<MyProps>>(
      '/workbench/:spaceId/?_class',
      (props) => {
        matched = 1
      },
      {}
    )
    const r3 = r2.addRoute<Partial<ChildProps>>(
      '/browse/:docId/?filter',
      (props) => {
        matched = 2
      },
      {}
    )

    r1.update({
      path: ['author', 'master'],
      query: { _class: 'qwe', data: 'azs', filter: 'fff' },
      fragment: ''
    })
    expect(matched).toEqual(0)

    r1.update({
      path: ['workbench', 'sp1'],
      query: { _class: 'qwe', data: 'azs', filter: 'fff' },
      fragment: ''
    })
    expect(matched).toEqual(1)

    r1.update({
      path: ['browse', 'sp1'],
      query: { _class: 'qwe', data: 'azs', filter: 'fff' },
      fragment: ''
    })
    expect(matched).toEqual(2)

    const nl1 = r1.location({ author: 'qwe' })
    const nl2 = r2.location({ spaceId: 'zzz' as Ref<Space>, _class: 'qwe' as Ref<Class<Doc>> })
    const nl3 = r3.location({ docId: 'GEN-1' as Ref<Doc>, filter: 'teta' })

    expect(locationToUrl(nl1 ?? newLocation())).toEqual('/author/qwe')
    expect(locationToUrl(nl2 ?? newLocation())).toEqual('/workbench/zzz?_class=qwe')
    expect(locationToUrl(nl3 ?? newLocation())).toEqual('/browse/GEN-1?filter=teta')

    r1.navigate({})
    r2.navigate({})
    r3.navigate({})
    expect(navigated.length).toEqual(3)
    expect(navigated.map((e) => locationToUrl(e))).toEqual(['/author/', '/workbench/', '/browse/'])
  })
})
