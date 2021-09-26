import { build, BuildOptions } from 'esbuild'
import sassPlugin from 'esbuild-plugin-sass'
import sveltePlugin from './svelte'
import { dtsPlugin } from 'esbuild-plugin-d.ts'

/**
 * @public
 */
export async function uiBuild (pkg: any, extra: Partial<BuildOptions>): Promise<void> {
  let mainOptions: BuildOptions = {
    format: 'esm',
    bundle: true,
    minify: false,
    allowOverwrite: true,
    sourcemap: 'inline',
    legalComments: 'inline',
    color: true,
    keepNames: true,
    loader: { '.png': 'dataurl', '.jpg': 'dataurl', '.svg': 'dataurl' },

    // Ignore dependencies и peerDependencies from package.json
    external: [...Object.keys(pkg.dependencies), ...Object.keys(pkg.peerDependencies)]
  }
  mainOptions = Object.assign(mainOptions, extra)

  // Svelte compiler plugin
  const svelte = sveltePlugin({
    compileOptions: {
      // Styles with component
      css: false, // Will generate index.css
      dev: (process.env.SVELTE_DEV_MODE ?? 'true') === 'true',
      errorMode: 'throw'
    },
    logLevel: mainOptions.logLevel
  })

  mainOptions.plugins = [sassPlugin(), svelte, dtsPlugin()]

  // Build ES-module
  await build(mainOptions)
}

/**
 * @public
 */
export default async function (pkg: any, extra: Partial<BuildOptions>): Promise<void> {
  return await uiBuild(pkg, extra).catch((err) => {
    console.log(err)
  })
}
