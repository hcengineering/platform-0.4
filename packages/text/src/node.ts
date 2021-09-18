import { MessageMark, MessageNode } from './model'
import { traverseMarks } from './marks'

export function traverseMessage (node: MessageNode, f: (el: MessageNode) => void): void {
  f(node)
  node.content?.forEach((c) => traverseMessage(c, f))
}

/**
 * @public
 */
export function traverseAllMarks (node: MessageNode, f: (el: MessageNode, mark: MessageMark) => void): void {
  traverseMessage(node, (node) => traverseMarks(node, (mark) => f(node, mark)))
}

export function messageContent (node: MessageNode): MessageNode[] {
  return node?.content ?? []
}

export function nodeAttrs (node: MessageNode): { [key: string]: string } {
  return node.attrs ?? {}
}
