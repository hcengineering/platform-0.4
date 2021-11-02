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

export interface DefOptions {
  tsCode: string
  moduleName: string
  parsedComponent: ParsedComponent
  outRelPath: string

  cacheDir: string

  defFile?: string
  defContent?: string // A full typescript defintiion for component
}

export async function extractTypeInformation (
  prg: ts.Program,
  cacheDir: string,
  filename: string,
  component: ParsedComponent
): Promise<void> {
  // const tmpDir = tmp.dirSync({}).name

  const fName = join(cacheDir, filename)
  const sourceFile = prg.getSourceFile(fName)

  if (sourceFile === undefined) {
    throw new Error('failed to obtain source file:')
  }

  const printer = ts.createPrinter()

  const result = emitCode(prg, sourceFile)

  // const declFile = sourceFile
  const declFile = ts.createSourceFile('declaration.ts', result, ts.ScriptTarget.ESNext)

  // We need to filter export declare let, since they will go into a proper place.
  ts.forEachChild(declFile, (node) => {
    if (ts.isVariableStatement(node)) {
      checkVariableStatement(node, printer, declFile, component)
    } else if (ts.isFunctionDeclaration(node)) {
      checkFunctionStatement(node, printer, declFile, component)
    } else if (
      ts.isImportDeclaration(node) ||
      ts.isExportDeclaration(node) ||
      ts.isInterfaceDeclaration(node) ||
      ts.isClassDeclaration(node) ||
      ts.isEnumDeclaration(node) ||
      ts.isTypeAliasDeclaration(node)
    ) {
      const nde = printer.printNode(ts.EmitHint.Unspecified, node, declFile)
      component.header.push(nde)
    }
  })
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
  let hasExport = false
  for (const m of node.modifiers ?? []) {
    if (m.kind === ts.SyntaxKind.ExportKeyword) {
      hasExport = true
    }
  }
  if (!hasExport) {
    return
  }
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

function checkFunctionStatement (
  node: ts.FunctionDeclaration,
  printer: ts.Printer,
  declFile: ts.SourceFile,
  component: ParsedComponent
): void {
  let hasExport = false
  for (const m of node.modifiers ?? []) {
    if (m.kind === ts.SyntaxKind.ExportKeyword) {
      hasExport = true
    }
  }
  if (!hasExport) {
    return
  }
  const dName = node.name?.escapedText
  if (dName === undefined) {
    return
  }
  let p = component.props.find((p) => p.name === dName)

  if (p === undefined) {
    p = {
      name: dName,
      kind: 'function',
      constant: false,
      isFunction: true,
      isFunctionDeclaration: true,
      params: [],
      reactive: false
    }
    component.props.push(p)
  }
  const printType = (ppType?: ts.Node): string | undefined => {
    return ppType !== undefined ? printer.printNode(ts.EmitHint.Unspecified, ppType, declFile) : undefined
  }

  p.params = node.parameters.map((pp) => ({
    name: (pp.name as ts.Identifier).escapedText as string,
    type: printType(pp.type)
  }))

  if (node.type !== undefined) {
    p.type = printer.printNode(ts.EmitHint.Unspecified, node.type, declFile)
  }
}
