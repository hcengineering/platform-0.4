import { MessageMark, MessageMarkType, MessageNode } from './model'

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
  if (a === undefined) return false
  if (b === undefined) return false
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (!markEq(a[i], b[i])) {
      return false
    }
  }
  return true
}

export function markEq (first: MessageMark, other: MessageMark): boolean {
  return first === other || (first.type === other.type && compareDeep(first.attrs, other.attrs))
}

function compareDeep (a: any, b: any): boolean {
  if (a === b) return true
  if (!(a !== undefined && typeof a === 'object') || !(b !== undefined && typeof b === 'object')) return false
  const isarray = Array.isArray(a)
  if (Array.isArray(b) !== isarray) return false
  if (isarray) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!compareDeep(a[i], b[i])) return false
    }
  } else {
    for (const p in a) if (!(p in b) || !compareDeep(a[p], b[p])) return false
    for (const p in b) if (!(p in a)) return false
  }
  return true
}
