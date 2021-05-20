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

import { Component, component, mergeIds, parseId, StatusCode, Id } from '..'

describe('status', () => {
  it('should identify resources', () => {
    const ids = component('test' as Component, {
      resource: {
        MyString: '' as StatusCode<{}>,
        FixedId: 'my-id' as StatusCode<{}>
      },
      simple: '' as StatusCode<{}>
    })
    expect(ids.resource.MyString).toBe('resource:test.MyString')
    expect(ids.resource.FixedId).toBe('my-id')
    expect(ids.simple).toBe('test.simple')
  })

  it('should merge ids', () => {
    const ids = component('test' as Component, {
      resource: {
        MyString: '' as StatusCode<{}>,
        FixedId: 'my-id' as StatusCode<{}>
      },
      simple: '' as StatusCode<{}>
    })
    const merged = mergeIds(ids, {
      resource: {
        OneMore: '' as StatusCode<{}>
      },
      more: '' as StatusCode<{}>
    })
    expect(merged.resource.MyString).toBe('resource:test.MyString')
    expect(merged.resource.FixedId).toBe('my-id')
    expect(merged.simple).toBe('test.simple')
    expect(merged.resource.OneMore).toBe('resource:test.OneMore')
    expect(merged.more).toBe('test.more')
  })

  it('should fail overwriting ids', () => {
    const ids = component('test' as Component, {
      resource: {
        MyString: '' as StatusCode<{}>,
        FixedId: 'my-id' as StatusCode<{}>
      },
      simple: '' as StatusCode<{}>
    })
    const f = (): any =>
      mergeIds(ids, {
        resource: {
          MyString: 'xxx' as StatusCode<{}>
        }
      })
    expect(f).toThrowError("'mergeIds' overwrites")
  })

  it('should fail to parse id', () => {
    expect(() => parseId('bad id' as Id)).toThrowError(
      'ERROR: status:status.InvalidId'
    )
  })

  it('should parse id', () => {
    expect(parseId('res:comp.X' as Id)).toEqual({kind: 'res', component: 'comp', name: 'X'})
  })

  it('should parse id without kind', () => {
    expect(parseId('comp.X' as Id)).toEqual({component: 'comp', name: 'X'})
  })

})
