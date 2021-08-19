import { build, BuildOptions } from 'esbuild'
import sassPlugin from 'esbuild-plugin-sass'
import sveltePlugin from './svelte'
import { dtsPlugin } from 'esbuild-plugin-d.ts'

/**
 * @public
 */
export async function uiBuild (pkg: any, extra: Partial<BuildOptions>): Promise<void> {
  // Svelte compiler plugin
  const svelte = sveltePlugin({
    compileOptions: {
      // Styles with component
      css: false, // Will generate index.css
      dev: true,
      errorMode: 'throw'
    }
  })

  const mainOptions: BuildOptions = {
    format: 'esm',
    bundle: true,
    minify: false,
    allowOverwrite: true,
    sourcemap: 'inline',
    legalComments: 'inline',
    color: true,
    keepNames: true,
    plugins: [sassPlugin(), svelte, dtsPlugin()],
    loader: { '.png': 'dataurl', '.jpg': 'dataurl', '.svg': 'dataurl' },

    // Ignore dependencies и peerDependencies from package.json
    external: [...Object.keys(pkg.dependencies), ...Object.keys(pkg.peerDependencies)]
  }

  // Build ES-module
  await build(Object.assign(mainOptions, extra))
}

/**
 * @public
 */
export default function (pkg: any, extra: Partial<BuildOptions>): void {
  uiBuild(pkg, extra).catch((err) => {
    console.log(err)
  })
}
