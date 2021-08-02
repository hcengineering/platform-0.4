import { Plugin } from 'esbuild'
import fs from 'fs'

// eslint-disable-next-line
interface SvgOptions {}
export const pluginSvg = (options: SvgOptions = {}): Plugin => ({
  name: 'svg',
  setup (build) {
    const loader = 'text'

    build.onLoad({ filter: /\.svg$/ }, async (args) => {
      const contents: string = await fs.promises.readFile(args.path, 'utf8')
      return { contents, loader }
    })
  }
})
