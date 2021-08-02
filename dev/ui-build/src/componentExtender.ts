import { rm, writeFile } from 'fs/promises'
import tmp from 'tmp'
import { join } from 'path'
import * as ts from 'typescript'
import { ParsedComponent } from './componentParser'

export const opt: ts.CompilerOptions = {
  noEmitOnError: false,
  noImplicitAny: true,
  outDir: './lib',
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.CommonJS,
  emitDeclarationOnly: true,
  declaration: true
}

export async function extractTypeInformation (source: string, component: ParsedComponent): Promise<void> {
  const tmpDir = tmp.dirSync({}).name

  const fName = join(tmpDir, 'component.ts')
  await writeFile(fName, source)

  const prg = ts.createProgram([fName], opt)
  const sourceFile = prg.getSourceFile(fName)

  const result = emitCode(prg, sourceFile)

  const printer = ts.createPrinter()

  const declFile = ts.createSourceFile('declaration.ts', result, ts.ScriptTarget.ESNext)

  // We need to filter export declare let, since they will go into a proper place.
  ts.forEachChild(declFile, (node) => {
    if (ts.isVariableStatement(node)) {
      checkVariableStatement(node, printer, declFile, component)
    } else {
      component.header.push(printer.printNode(ts.EmitHint.Unspecified, node, declFile))
    }
  })

  await rm(tmpDir, { recursive: true, force: true })
}
function emitCode (prg: ts.Program, sourceFile: ts.SourceFile | undefined): string {
  let result = ''

  const rr = prg.emit(
    sourceFile,
    (fileName, data) => {
      result += data
    },
    undefined,
    true
  )

  for (const d of rr.diagnostics) {
    console.error('ERROR', d.messageText, d.file, d.start)
  }
  return result
}

function checkVariableStatement (
  node: ts.VariableStatement,
  printer: ts.Printer,
  declFile: ts.SourceFile,
  component: ParsedComponent
): void {
  for (const d of node.declarationList.declarations) {
    const dName = printer.printNode(ts.EmitHint.Unspecified, d.name, declFile)
    let p = component.props.find((p) => p.name === dName)

    if (p === undefined) {
      p = {
        name: dName,
        kind: 'let',
        constant: false,
        isFunction: false,
        isFunctionDeclaration: false,
        reactive: false
      }
      component.props.push(p)
    }

    if (d.type !== undefined) {
      p.type = printer.printNode(ts.EmitHint.Unspecified, d.type, declFile)
    }
  }
}
