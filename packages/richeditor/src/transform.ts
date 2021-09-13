import { Transaction, EditorState } from 'prosemirror-state'
import { Node as ProsemirrorNode } from 'prosemirror-model'
import { schema } from './internal/schema'

export interface ItemRefefence {
  id: string
  class: string
}
type TransformFunction = (tr: Transaction | null) => Transaction
export type StateTransformer = (
  state: EditorState
) => Promise<Transaction | null>
export type FindFunction = (text: string) => Promise<ItemRefefence[]>

function findMark (node: ProsemirrorNode): ItemRefefence | undefined {
  for (let i = 0; i < node.marks.length; i++) {
    if (node.marks[i].type === schema.marks.reference) {
      return {
        id: node.marks[i].attrs.id,
        class: node.marks[i].attrs.class
      }
    }
  }
}

export function createTextTransform (find: FindFunction): StateTransformer {
  return async (state: EditorState) => {
    const operations: TransformFunction[] = []
    await processEditorState(state, find, operations)
    return await applyOperations(operations)
  }
}
async function processEditorState (
  state: EditorState<any>,
  find: FindFunction,
  operations: TransformFunction[]
): Promise<void> {
  const promises: Array<Promise<void>> = []
  state.doc.descendants((node, pos) => {
    promises.push(processNode(node, find, operations, state, pos))
  })
  await Promise.all(promises)
}

async function processNode (
  node: ProsemirrorNode,
  find: FindFunction,
  operations: TransformFunction[],
  state: EditorState,
  pos: number
): Promise<void> {
  if (isText(node)) {
    const prev = findMark(node) ?? {
      id: '',
      class: ''
    }

    const nodeText = node.text ?? ''
    const len = nodeText.length
    let i = 0
    while (i < len) {
      if (nodeText.startsWith('[[', i)) {
        // We found trigger, we need to call replace method
        i =
          (await handleCompletion(
            nodeText,
            i,
            find,
            prev,
            operations,
            state,
            pos
          )) - 1
      }
      i++
    }
  }
}

function isText (node: ProsemirrorNode): boolean {
  return node.isText && node.text !== null
}

async function handleCompletion (
  nodeText: string,
  i: number,
  find: FindFunction,
  prev: ItemRefefence,
  operations: TransformFunction[],
  state: EditorState<any>,
  pos: number
): Promise<number> {
  const endpos = nodeText.indexOf(']]', i)
  let end = nodeText.length
  let refText: string
  if (endpos !== -1) {
    end = endpos + 2

    refText = nodeText.substring(i + 2, end - 2)
    // Move to next char after ]]
    await checkUpdateItem(find, refText, prev, operations, state, pos, i, end)
  }
  return end
}

async function applyOperations (
  operations: TransformFunction[]
): Promise<Transaction | null> {
  let tr: Transaction | null = null
  for (let i = 0; i < operations.length; i++) {
    const t = operations[i]
    if (t !== null) {
      tr = t(tr)
    }
  }
  return tr
}
function findSameItem (
  prev: ItemRefefence,
  items: ItemRefefence[]
): ItemRefefence[] {
  for (let ii = 0; ii < items.length; ii++) {
    if (items[ii].id === prev.id) {
      items = [items[ii]]
      break
    }
  }
  return items
}

async function checkUpdateItem (
  find: FindFunction,
  refText: string,
  prev: ItemRefefence,
  operations: TransformFunction[],
  state: EditorState,
  cpos: number,
  ci: number,
  cend: number
): Promise<void> {
  let items = await find(refText)
  if (items.length > 1) {
    // Check if we had item selected already
    items = findSameItem(prev, items)
  }
  if (items.length >= 1) {
    operations.push(createItemReference(items[0], state, cpos, ci, cend))
  }
  if (items.length === 0 && prev.id === '') {
    operations.push(createUndefinedReference(state, cpos, ci, cend))
  }
}

function createUndefinedReference (
  state: EditorState,
  cpos: number,
  ci: number,
  cend: number
): TransformFunction {
  return (tr) => {
    const mark = schema.marks.reference.create({
      id: null,
      class: '#unknown'
    })
    return (tr === null ? state.tr : tr).addMark(cpos + ci, cpos + cend, mark)
  }
}

function createItemReference (
  item: ItemRefefence,
  state: EditorState,
  cpos: number,
  ci: number,
  cend: number
): TransformFunction {
  return (tr) => {
    const mark = schema.marks.reference.create(item)
    return (tr === null ? state.tr : tr).addMark(cpos + ci, cpos + cend, mark)
  }
}
