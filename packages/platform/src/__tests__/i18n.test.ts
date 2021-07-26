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

import status, { Component, component, Severity, Status } from '@anticrm/status'

import { addStringsLoader, IntlString, translate } from '../i18n'
import { addEventListener, PlatformEvent, removeEventListener } from '../event'

import platform from '../component'

const TestComponent = 'test-strings' as Component

const strings = component(TestComponent, {
  loadingPlugin: '' as IntlString<{ plugin: string }>
})

describe('i18n', () => {
  it('should translate string', async () => {
    addStringsLoader(TestComponent, async (locale: string) => await import(`./lang/${locale}.json`))
    const translated = await translate(strings.loadingPlugin, { plugin: 'xxx' })
    expect(translated).toBe('Loading plugin <b>xxx</b>...')
  })

  it('should return id when no translation found', async () => {
    const id = (TestComponent + '.inexistent') as IntlString
    const inexistent = await translate(id, {})
    expect(inexistent).toBe(id)
  })

  it('should cache translated string', async () => {
    const translated = await translate(strings.loadingPlugin, { plugin: 'xxx' })
    expect(translated).toBe('Loading plugin <b>xxx</b>...')
  })

  it('should emit status and return id when no loader', async () => {
    const component = 'component-for-no-loader'
    const message = `${component}.id`

    const checkStatus = new Status(Severity.ERROR, platform.status.NoLoaderForStrings, { component })

    let eventListener!: (event: string, data: any) => Promise<void>
    const pp = new Promise((resolve) => {
      eventListener = async (event, data) => {
        await expect(data).toEqual(checkStatus)
        resolve(null)
      }
    })
    addEventListener(PlatformEvent, eventListener)
    const translated = await translate(message as IntlString, {})
    await pp
    expect(translated).toBe(message)
    removeEventListener(PlatformEvent, eventListener)
  })

  it('should emit status and return id when bad loader', async () => {
    const component = 'component-for-bad-loader'
    const message = `${component}.id`
    const errorMessage = 'bad loader'
    addStringsLoader(component as Component, (locale: string) => {
      throw new Error(errorMessage)
    })

    const checkStatus = new Status(Severity.ERROR, status.status.UnknownError, { message: errorMessage })
    let eventListener!: (event: string, data: any) => Promise<void>
    const pp = new Promise((resolve) => {
      eventListener = async (event, data) => {
        await expect(data).toEqual(checkStatus)
        resolve(null)
      }
    })
    addEventListener(PlatformEvent, eventListener)
    const translated = await translate(message as IntlString, {})
    await pp
    expect(translated).toBe(message)
    removeEventListener(PlatformEvent, eventListener)
  })

  it('should cache error', async () => {
    const component = 'component'
    const message = `${component}.id`
    let status: Status | undefined
    let eventListener!: (event: string, data: any) => Promise<void>
    const pp = new Promise((resolve) => {
      eventListener = async (event, data): Promise<void> => {
        if (status === undefined) {
          status = data
          resolve(null)
          return
        }

        try {
          expect(data).toBe(status)
          resolve(null)
        } catch (e) {
          resolve(null)
        }
      }

      addEventListener(PlatformEvent, eventListener)
    })
    const t1 = await translate(message as IntlString, {})
    const t2 = await translate(message as IntlString, {})
    await pp
    expect(t1).toBe(t2)
    removeEventListener(PlatformEvent, eventListener)
  })

  it('should return message when message not IntlString', async () => {
    const message = 'testMessage' as IntlString
    const checkStatus = new Status(Severity.ERROR, status.status.InvalidId, { id: message })
    let eventListener!: (event: string, data: any) => Promise<void>

    const pp = new Promise((resolve) => {
      eventListener = async (event: string, data: any): Promise<void> => {
        await expect(data).toEqual(checkStatus)
        resolve(null)
      }
      addEventListener(PlatformEvent, eventListener)
    })
    const translated = await translate(message, {})
    await pp
    expect(translated).toBe(message)
    removeEventListener(PlatformEvent, eventListener)
  })
})
