import { Doc, DocumentQuery, getFullRef, Tx } from '@anticrm/core'
import chunter from '@anticrm/chunter'

export function taskActivityMapper (doc: Doc): Array<DocumentQuery<Tx<Doc>>> {
  return [
    {
      objectClass: chunter.class.Comment,
      'attributes.replyOf': getFullRef(doc._id, doc._class)
    }
  ]
}
