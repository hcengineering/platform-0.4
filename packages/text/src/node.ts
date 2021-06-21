import { MessageNode } from './model'

export function traverseMessage (node: MessageNode, f: (el: MessageNode) => void): void {
  f(node)
  node.content?.forEach((c) => traverseMessage(c, f))
}

export function messageContent (node: MessageNode): MessageNode[] {
  return node?.content ?? []
}

export function nodeAttrs (node: MessageNode): { [key: string]: string } {
  return node.attrs ?? {}
}
