//
// Copyright © 2020, 2021 Anticrm Platform Contributors.
//
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
//

import { MessageNode } from './model'
import { MarkdownParser } from './parser'
import { MarkdownState } from './serializer'

export * from './model'
export { traverseAllMarks } from './node'

/**
 * @public
 */
export function parseMessage (message: string, convertReferences?: boolean): MessageNode {
  return parseMessageMarkdown(message, convertReferences)
}

/**
 * @public
 */
export function parseMessageMarkdown (message?: string, convertReferences?: boolean): MessageNode {
  const parser = new MarkdownParser(convertReferences)
  return parser.parse(message ?? '')
}

/**
 * @public
 */
export function serializeMessage (node: MessageNode): string {
  const state = new MarkdownState()
  state.renderContent(node)
  return state.out
}
