// original version from https://github.com/evanw/esbuild/blob/plugins/docs/plugin-examples.md
import type { OnLoadResult, PartialMessage, Plugin } from 'esbuild'
import { readFile, statSync, existsSync, mkdirSync, writeFile } from 'fs'
import { basename, dirname, join, relative } from 'path'
import { CompiledSvelteCode, ComponentParser } from './componentParser'
import { writeTsDefinition } from './componentWriter'
import sveltePreporocess from 'svelte-preprocess'
import { compile, preprocess } from 'svelte/compiler'
import type { CompileOptions, Warning } from 'svelte/types/compiler/interfaces'
import { promisify } from 'util'
import * as prettier from 'prettier'
import { extractTypeInformation as extendTypeInformation } from './componentExtender'

interface esbuildSvelteOptions {
  /**
   * Svelte compiler options
   */
  compileOptions?: CompileOptions
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

export default function sveltePlugin (options?: esbuildSvelteOptions): Plugin {
  return {
    name: 'esbuild-svelte',
    setup (build) {
      // main loader

      const svelteFiles: Map<string, string> = new Map()

      const outDir = build.initialOptions.outdir ?? dirname(build.initialOptions.outfile ?? '.')
      const parser = new ComponentParser({ verbose: true })

      build.onLoad({ filter: /\.svelte$/ }, async (args) => {
        const source = await promisify(readFile)(args.path, 'utf8')
        const filename = relative(process.cwd(), args.path)

        svelteFiles.set(filename, source)

        // file modification time storage
        const dependencyModifcationTimes = new Map<string, Date>()
        dependencyModifcationTimes.set(args.path, statSync(args.path).mtime) // add the target file

        // actually compile file
        try {
          // do preprocessor stuff if it exists
          const preprocessResult = await preprocess(source, sveltePreporocess(), {
            filename
          })
          const jsSource = preprocessResult.code

          const compileOptions = { css: true, ...options?.compileOptions }
          const { js, warnings, ast, vars } = compile(jsSource, { ...compileOptions, filename })
          const contents = (js.code as string) + '\n//# sourceMappingURL=' + (js.map.toUrl() as string)

          // Extract typescript code from svelte
          const tsCode = extractTypescript(source)

          await generateDefinitions(filename, { vars, ast }, parser, tsCode, jsSource, outDir, args, build)

          const result: OnLoadResult = {
            contents,
            warnings: warnings.map(convertMessage)
          }

          // make sure to tell esbuild to watch any additional files used if supported
          if (build.initialOptions.watch != null) {
            // this array does include the orignal file, but esbuild should be smart enough to ignore it
            result.watchFiles = Array.from(dependencyModifcationTimes.keys())
          }

          return result
        } catch (e) {
          return { errors: [convertMessage(e)], loader: 'default' }
        }
      })
    }
  }
}
async function generateDefinitions (
  filename: string,
  code: CompiledSvelteCode,
  parser: ComponentParser,
  source: string,
  jsSource: string,
  outDir: string,
  args: any,
  build: any
): Promise<void> {
  let definition = ''
  try {
    const moduleName = basename(filename).replace('.svelte', '')
    const parsed = parser.parseSvelteComponent(source, jsSource, code, { moduleName: moduleName, filePath: filename })

    // Extend type information using typescript
    await extendTypeInformation(source, parsed)

    let outRelPath = join(outDir, relative(args.path, filename))
    for (const s of build.initialOptions.entryPoints as string[]) {
      const srcRel = dirname(s)
      const r = dirname(relative(srcRel, filename))
      if (r.length > 0) {
        outRelPath = join(outDir, r)
      }
    }
    const outFileName = join(outRelPath, moduleName + '.svelte.d.ts')
    if (!existsSync(outRelPath)) {
      mkdirSync(outRelPath, { mode: 0o744, recursive: true })
    }
    definition = writeTsDefinition(Object.assign(parsed, { filePath: filename, moduleName: moduleName }))
    console.log('generate d.ts inside ', outFileName, definition.length)

    const options = { parser: 'typescript', printWidth: 80 }

    const formetted = prettier.format(definition, options)
    await promisify(writeFile)(outFileName, formetted)
  } catch (err) {
    console.log('failed to generate typings for ', filename, err, definition)
  }
}
