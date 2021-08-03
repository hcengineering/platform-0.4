import { extractTypeInformation } from '../componentExtender'
import { ParsedComponent } from '../componentParser'
import { uiBuild } from '../index'

describe('test extender', () => {
  it('check import extraction', async () => {
    const c: ParsedComponent = {
      header: [],
      props: [],
      slots: [],
      events: [],
      typedefs: [],
      restProps: undefined
    }
    await extractTypeInformation(
      `
                            import { parseMessage } from '@anticrm/text'
                            import type { MessageNode } from '@anticrm/text'
                            import MessageViewer from './MessageViewer.svelte'

                            interface DocRef {
                            _class: string
                            id: string
                            }

                            export let message: string
                            export let data: Record<string, string> = {}
                            export let msgNode: MessageNode
                            export let refAction: (doc: DocRef) => void = () => {}
    `,
      c
    )

    expect(c.header.length).toEqual(4)
  })
  it('check build', async () => {
    jest.setTimeout(120000)
    await uiBuild(
      {
        name: '@anticrm/demo-ui',
        version: '0.4.1',
        main: 'lib/index.js',
        typings: 'lib/index.d.ts',
        author: 'Anticrm Platform Contributors',
        license: 'EPL-2.0',
        peerDependencies: {
          svelte: '3.x'
        },
        devDependencies: {},
        dependencies: {}
      },
      {
        entryPoints: ['demo/src/index.ts'],
        outfile: 'demo/lib/index.js'
      }
    )
  })
})