import { Schema } from 'prosemirror-model'
import { toggleMark } from 'prosemirror-commands'
import { wrapInList } from 'prosemirror-schema-list'
import { EditorState, Transaction } from 'prosemirror-state'

import { schema } from './schema'

type CommandType<S extends Schema<any, any>> = (
  state: EditorState<S>,
  dispatch?: (tr: Transaction<S>) => void
) => boolean

export const Commands: Record<string, CommandType<any>> = {
  toggleStrong: toggleMark(schema.marks.strong),
  toggleItalic: toggleMark(schema.marks.em),
  toggleStrike: toggleMark(schema.marks.strike),
  toggleUnderline: toggleMark(schema.marks.underline),
  toggleOrdered: wrapInList(schema.nodes.ordered_list),
  toggleUnOrdered: wrapInList(schema.nodes.bullet_list)
}
