import { Class, Doc, Ref } from '@anticrm/core'
import { LinkMark, MessageMark, MessageMarkType, MessageNode, ReferenceMark, traverseAllMarks } from '@anticrm/text'

/**
 * @public
 */
export enum ReferenceKind {
  Document,
  External
}

/**
 * @public
 */
export interface MessageReference {
  kind: ReferenceKind
  text: string
}

/**
 * @public
 */
export interface DocumentReference extends MessageReference {
  objectClass: Ref<Class<Doc>>
  objectId: Ref<Doc>
}

/**
 * @public
 */
export interface ExternalReference extends MessageReference {
  href: string
  title: string
}

/**
 *
 * Return all references from current markdown document.
 * @public
 */
export function findReferences (message: MessageNode): MessageReference[] {
  const result: MessageReference[] = []
  traverseAllMarks(message, (node, mark) => {
    if (mark.type === MessageMarkType.link) {
      result.push(extractLink(mark, node))
    }
    if (mark.type === MessageMarkType.reference) {
      result.push(extractDocReference(mark, node))
    }
  })

  return result
}

function extractDocReference (mark: MessageMark, node: MessageNode): DocumentReference {
  const rm: ReferenceMark = mark as ReferenceMark
  return {
    kind: ReferenceKind.Document,
    objectClass: rm.attrs.class as Ref<Class<Doc>>,
    objectId: (rm.attrs.id ?? '') as Ref<Doc>,
    text: node.text ?? ''
  }
}

function extractLink (mark: MessageMark, node: MessageNode): ExternalReference {
  const linkMark = mark as LinkMark
  const href = linkMark.attrs.href
  const title = linkMark.attrs.title
  return {
    kind: ReferenceKind.External,
    href,
    title,
    text: node.text ?? ''
  }
}
