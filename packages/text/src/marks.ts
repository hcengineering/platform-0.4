import { MessageMark, MessageMarkType, MessageNode } from './model'
import { deepEqual } from 'fast-equals'

export function traverseMarks (node: MessageNode, f: (el: MessageMark) => void): void {
  node.marks?.forEach(f)
}

export function markAttrs (mark: MessageMark): { [key: string]: string } {
  return mark.attrs ?? []
}

export function isInSet (mark: MessageMark, marks: MessageMark[]): boolean {
  return marks.find((m) => markEq(mark, m)) !== undefined
}

export function addToSet (mark: MessageMark, marks: MessageMark[]): MessageMark[] {
  const m = marks.find((m) => markEq(mark, m))
  if (m !== undefined) {
    // We already have mark
    return marks
  }
  return [...marks, mark]
}

export function removeFromSet (markType: MessageMarkType, marks: MessageMark[]): MessageMark[] {
  return marks.filter((m) => m.type !== markType)
}

export function sameSet (a: MessageMark[] | undefined, b: MessageMark[] | undefined): boolean {
  if (a === b) return true
  if (a === undefined || b === undefined || a.length !== b.length) return false

  for (let i = 0; i < a.length; i++) {
    if (!markEq(a[i], b[i])) {
      return false
    }
  }
  return true
}

export function markEq (first: MessageMark, other: MessageMark): boolean {
  return first === other || (first.type === other.type && deepEqual(first.attrs, other.attrs))
}
