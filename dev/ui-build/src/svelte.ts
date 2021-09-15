// original version from https://github.com/evanw/esbuild/blob/plugins/docs/plugin-examples.md
import crypto from 'crypto'
import type { OnLoadArgs, OnLoadResult, PartialMessage, Plugin, PluginBuild } from 'esbuild'
import { LogLevel } from 'esbuild'
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFile, readFileSync, statSync, writeFileSync } from 'fs'
import { writeFile } from 'fs/promises'
import { basename, dirname, join, relative } from 'path'
import * as prettier from 'prettier'
import sveltePreprocess from 'svelte-preprocess'
import { compile, preprocess } from 'svelte/compiler'
import type { CompileOptions, Warning } from 'svelte/types/compiler/interfaces'
import ts from 'typescript'
import { promisify } from 'util'
import { DefOptions, extractTypeInformation as extendTypeInformation, opt } from './componentExtender'
import { ComponentParser } from './componentParser'
import { writeTsDefinition } from './componentWriter'

interface esbuildSvelteOptions {
  /**
   * Svelte compiler options
   */
  compileOptions?: CompileOptions
  logLevel?: LogLevel
}

interface CacheEntry {
  digest: string

  contentFile: string

  cssFile: string
  cssPath: string

  defFile?: string
  defContent?: string // A full typescript defintiion for component
}

const convertMessage = ({ message, start, end, filename, frame }: Warning): PartialMessage => ({
  text: message,
  location:
    start !== undefined && end !== undefined
      ? {
          file: filename,
          line: start.line,
          column: start.column,
          length: start.line === end.line ? end.column - start.column : 0,
          lineText: frame
        }
      : null
})

function extractTypescript (source: string): string {
  // Take same regexp as svelte preprocess routine.
  const scriptRegex = /<script(\s[^]*?)?(?:>([^]*?)<\/script>|\/>)/gi

  let result = ''

  let matches: RegExpExecArray | null
  while ((matches = scriptRegex.exec(source)) !== null) {
    result += '\n' + matches[2]
  }
  return result
}

class SveltePlugin {
  private outDir: string = ''
  private readonly parser = new ComponentParser({ verbose: true })
  private readonly cssCode = new Map<string, { content: string, baseDir: string }>()
  private readonly componentTS = new Map<string, DefOptions>()
  private readonly svelteTsCacheDir: Set<string> = new Set<string>()
  private readonly genDefinitions: boolean = true

  private readonly cacheDir = './.ui-build/'
  private cacheFile: Record<string, CacheEntry> = {}

  constructor (private readonly options?: esbuildSvelteOptions) {}

  cacheFileName (): string {
    return join(this.cacheDir, 'build.cache')
  }

  setup (build: PluginBuild): void | Promise<void> {
    // main loader
    this.outDir = build.initialOptions.outdir ?? dirname(build.initialOptions.outfile ?? '.')

    // Load a cache and construct cache directory if required.

    this.loadCache()

    build.onLoad({ filter: /\.svelte$/ }, this.handleSvelteLoad.bind(this, build))

    // if the css exists in our map, then output it with the css loader
    build.onResolve({ filter: /\.esbuild-svelte-fake-css$/ }, ({ path }) => ({ path, namespace: 'fakecss' }))
    build.onLoad({ filter: /\.esbuild-svelte-fake-css$/, namespace: 'fakecss' }, this.handleCssLoad.bind(this))

    build.onEnd(async () => {
      // Generate svelte typings

      // eslint-disable-next-line
      if (this.genDefinitions) {
        await generateDefinitions(this.svelteTsCacheDir, this.componentTS, {
          logLevel: this.options?.logLevel
        })

        // Update cached typing information.
        for (const [filename, v] of this.componentTS) {
          if (v.defFile !== undefined && v.defContent !== undefined) {
            await this.cacheResultsDef(filename, v.defFile, v.defContent, this.cacheFile)
          }
        }
      }

      this.saveCache()

      // If bundled mode is selected, we
      this.updateCssImport(build)
    })
  }

  private saveCache (): void {
    writeFileSync(this.cacheFileName(), JSON.stringify(this.cacheFile, undefined, 2))
  }

  private updateCssImport (build: PluginBuild): void {
    if (build.initialOptions.outfile !== undefined) {
      try {
        const imports = this.collectCssFiles()
        if (imports.length > 0) {
          appendFileSync(build.initialOptions.outfile, imports)
        }
      } catch (err) {
        if ((this.options?.logLevel ?? '') !== 'silent') {
          console.error(err)
        }
      }
    }
  }

  private collectCssFiles (): string {
    let imports = ''
    const cssFiles = readdirSync(this.outDir)
    for (const o of cssFiles) {
      if (o.endsWith('.css')) {
        // We have css file inside out folder, so let's add an import
        imports += `\nimport './${o}'`
      }
    }
    return imports
  }

  private loadCache (): void {
    this.ensureDirExists(this.cacheDir)
    if (existsSync(this.cacheFileName())) {
      this.cacheFile = JSON.parse(readFileSync(this.cacheFileName()).toString())
    }
  }

  async handleCssLoad (args: OnLoadArgs): Promise<OnLoadResult | null> {
    const css = this.cssCode.get(args.path)
    return css !== undefined ? { contents: css.content, loader: 'css', resolveDir: css.baseDir } : null
  }

  async handleSvelteLoad (build: PluginBuild, args: OnLoadArgs): Promise<OnLoadResult> {
    const source = await promisify(readFile)(args.path, 'utf8')
    const filename = relative(process.cwd(), args.path)

    // file modification time storage
    const dependencyModifcationTimes = new Map<string, Date>()
    dependencyModifcationTimes.set(args.path, statSync(args.path).mtime) // add the target file

    const compileOptions = { css: false, ...this.options?.compileOptions }

    // use hash to check if file is changed

    const sourceHash = crypto.createHash('sha1')

    sourceHash.update(source)
    sourceHash.update(JSON.stringify(compileOptions)) // To invalidate cache in case of compile options change

    const sourceDigest = sourceHash.digest().toString('base64')
    const cacheEntry = this.cacheFile[filename]
    if (this.checkHash(cacheEntry, sourceDigest)) {
      // We had same file, so there is no errors and we could return cached files.
      return await this.getCachedResults(cacheEntry, build, dependencyModifcationTimes, this.cssCode, filename)
    }

    // actually compile svelte file with preprocessing
    return await this.compileSvelteFile(
      source,
      filename,
      compileOptions,
      args,
      build,
      dependencyModifcationTimes,
      sourceDigest
    )
  }

  private async compileSvelteFile (
    source: string,
    filename: string,
    compileOptions: CompileOptions,
    args: OnLoadArgs,
    build: PluginBuild,
    dependencyModifcationTimes: Map<string, Date>,
    sourceDigest: string
  ): Promise<OnLoadResult> {
    try {
      const { jsSource } = await this.doPreprocess(source, filename)

      const { js, css, warnings, ast, vars } = compile(jsSource, { ...compileOptions, filename })
      const sourceContents = (js.code as string) + '\n//# sourceMappingURL=' + (js.map.toUrl() as string)

      // if svelte emits css seperately, then store it in a map and import it from the js
      const { cssPath, cssContent, contents } = this.updateCss(
        compileOptions,
        css,
        filename,
        this.cssCode,
        sourceContents
      )
      // Extract typescript code from svelte
      const tsCode = extractTypescript(source)

      const moduleName = basename(filename).replace('.svelte', '')
      const parsed = this.parser.parseSvelteComponent(
        source,
        jsSource,
        { vars, ast },
        { moduleName: moduleName, filePath: filename }
      )

      function getOutRelDir (outDir: string): string {
        let outRelPath = join(outDir, relative(args.path, filename))
        for (const s of build.initialOptions.entryPoints as string[]) {
          const srcRel = dirname(s)
          const r = dirname(relative(srcRel, filename))
          if (r.length > 0) {
            outRelPath = join(outDir, r)
          }
        }
        return outRelPath
      }

      const outRelPath = getOutRelDir(this.outDir)
      const cdir = getOutRelDir(join(this.cacheDir, 'svelte_ts'))
      this.svelteTsCacheDir.add(cdir)

      this.componentTS.set(filename, {
        tsCode,
        parsedComponent: parsed,
        moduleName,
        outRelPath,
        cacheDir: cdir
      })

      const result: OnLoadResult = {
        contents,
        warnings: warnings.map(convertMessage)
      }

      // make sure to tell esbuild to watch any additional files used if supported
      this.updateResultWatch(build, result, dependencyModifcationTimes)

      if (result.warnings?.length === 0) {
        await this.cacheResults(filename, this.cacheDir, sourceDigest, cssPath, contents, cssContent, this.cacheFile)
      }

      return result
    } catch (e: any) {
      return { errors: [convertMessage(e)], loader: 'default' }
    }
  }

  private checkHash (cacheEntry: CacheEntry, sourceDigest: string): boolean {
    return cacheEntry !== undefined && cacheEntry.digest === sourceDigest
  }

  private updateResultWatch (
    build: PluginBuild,
    result: OnLoadResult,
    dependencyModifcationTimes: Map<string, Date>
  ): void {
    if (build.initialOptions.watch != null) {
      // this array does include the orignal file, but esbuild should be smart enough to ignore it
      result.watchFiles = Array.from(dependencyModifcationTimes.keys())
    }
  }

  ensureDirExists (dir: string): void {
    if (!existsSync(dir)) {
      mkdirSync(dir, { mode: 0o744, recursive: true })
    }
  }

  updateCss (
    compileOptions: CompileOptions,
    css: any,
    filename: string,
    cssCode: Map<string, { content: string, baseDir: string }>,
    contents: string
  ): {
      cssPath: string
      cssContent: string
      contents: string
    } {
    let cssPath = ''
    let cssContent = ''
    if (!(compileOptions?.css ?? false) && css.code != null) {
      cssPath = filename.replace('.svelte', '.esbuild-svelte-fake-css').replace(/\\/g, '/')
      cssContent = (css.code as string) + `\n/*# sourceMappingURL=${css.map.toUrl() as string} */`
      cssCode.set(cssPath, {
        content: cssContent,
        baseDir: dirname(filename)
      })
      contents = contents + `\nimport "${cssPath}";`
    }
    return { cssPath, cssContent, contents }
  }

  async doPreprocess (source: string, filename: string): Promise<{ jsSource: string, jsMap?: string | object }> {
    const preprocessResult = await preprocess(source, sveltePreprocess(), {
      filename
    })

    const jsSource = preprocessResult.code
    return { jsSource, jsMap: preprocessResult.map }
  }

  async cacheResults (
    filename: string,
    cacheDir: string,
    sourceDigest: string,
    cssPath: string,
    contents: string,
    cssContent: string,
    cacheFile: Record<string, CacheEntry>
  ): Promise<void> {
    const fname = basename(filename)
    const outRelPath = join(cacheDir, dirname(filename))
    if (!existsSync(outRelPath)) {
      mkdirSync(outRelPath, { mode: 0o744, recursive: true })
    }

    // We got results, let's cache them.
    const cacheEntry: CacheEntry = {
      digest: sourceDigest,

      contentFile: join(outRelPath, fname + '.js'),

      cssFile: join(outRelPath, fname + '.css'),
      cssPath
    }

    // Write contents file
    await writeFile(cacheEntry.contentFile, contents)
    await writeFile(cacheEntry.cssFile, cssContent)

    cacheFile[filename] = cacheEntry
  }

  async cacheResultsDef (
    filename: string,
    defFile: string,
    defContent: string,
    cacheFile: Record<string, CacheEntry>
  ): Promise<void> {
    // We got results, let's cache them.
    const cacheEntry: CacheEntry = cacheFile[filename]
    cacheEntry.defFile = defFile
    cacheEntry.defContent = defContent
    cacheFile[filename] = cacheEntry
  }

  async getCachedResults (
    cacheEntry: CacheEntry,
    build: PluginBuild,
    dependencyModifcationTimes: Map<string, Date>,
    cssCode: Map<string, { content: string, baseDir: string }>,
    filename: string
  ): Promise<OnLoadResult> {
    const result: OnLoadResult = {
      contents: await promisify(readFile)(cacheEntry.contentFile, 'utf-8'),
      warnings: []
    }

    // make sure to tell esbuild to watch any additional files used if supported
    if (build.initialOptions.watch != null) {
      // this array does include the orignal file, but esbuild should be smart enough to ignore it
      result.watchFiles = Array.from(dependencyModifcationTimes.keys())
    }

    if (cacheEntry.cssPath !== '') {
      // We need to load css file for further processing
      cssCode.set(cacheEntry.cssPath, {
        content: await promisify(readFile)(cacheEntry.cssFile, 'utf-8'),
        baseDir: dirname(filename)
      })
    }

    if (cacheEntry.defFile !== undefined && cacheEntry.defContent !== undefined) {
      const outDir = dirname(cacheEntry.defFile)
      if (!existsSync(outDir)) {
        mkdirSync(outDir, { mode: 0o744, recursive: true })
      }

      await writeFile(cacheEntry.defFile, cacheEntry.defContent)
    }

    return result
  }
}

export default function sveltePlugin (options?: esbuildSvelteOptions): Plugin {
  const plugin = new SveltePlugin(options)
  return {
    name: 'esbuild-svelte',
    setup (build): void | Promise<void> {
      return plugin.setup(build)
    }
  }
}
async function generateDefinitions (
  cacheDir: Set<string>,
  components: Map<string, DefOptions>,
  genOptions: {
    logLevel?: LogLevel
  }
): Promise<void> {
  // Create type script programm

  for (const o of cacheDir.values()) {
    if (!existsSync(o)) {
      mkdirSync(o, { mode: 0o744, recursive: true })
    }
  }

  const rootNames: string[] = []
  // Write all files
  for (const comp of components.values()) {
    const fName = join(comp.cacheDir, comp.moduleName + '.ts')
    rootNames.push(fName)
    await writeFile(fName, comp.tsCode)
  }

  const prg = ts.createProgram(rootNames, opt)

  for (const [filename, comp] of components.entries()) {
    let definition = ''
    try {
      // Extend type information using typescript
      const outFileName = join(comp.outRelPath, comp.moduleName + '.svelte.d.ts')
      if (!existsSync(comp.outRelPath)) {
        mkdirSync(comp.outRelPath, { mode: 0o744, recursive: true })
      }

      await extendTypeInformation(prg, comp.cacheDir, comp.moduleName + '.ts', comp.parsedComponent)

      definition = writeTsDefinition(
        Object.assign(comp.parsedComponent, { filePath: filename, moduleName: comp.moduleName })
      )
      if ((genOptions.logLevel ?? '') !== 'silent') {
        console.log('generate d.ts inside ', outFileName, definition.length)
      }

      const options = { parser: 'typescript', printWidth: 80 }

      const formetted = prettier.format(definition, options)
      await writeFile(outFileName, formetted)

      comp.defContent = formetted
      comp.defFile = outFileName
    } catch (err) {
      throw new Error(`failed to generate typings for ${filename} ${err as string} ${definition}`)
    }
  }
}
