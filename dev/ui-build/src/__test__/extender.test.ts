import { BuildOptions } from 'esbuild'
import { rm } from 'fs/promises'
import { getElementByTag } from '../elementMap'
import bld, { uiBuild } from '../index'

describe('test extender', () => {
  it('check element map', () => {
    expect(getElementByTag('qwe')).toEqual('HTMLElement')
    expect(getElementByTag('video')).toEqual('HTMLVideoElement')
  })
  it('check build', async () => {
    jest.setTimeout(120000)
    await rm('./.ui-build', { recursive: true, force: true })
    const pkg = {
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
    }
    const opt: Partial<BuildOptions> = {
      entryPoints: ['demo/src/index.ts'],
      outfile: 'demo/lib/index.js',
      logLevel: 'silent'
    }
    await uiBuild(pkg, opt)
    // Do second time.
    await bld(pkg, opt)
  })
})
