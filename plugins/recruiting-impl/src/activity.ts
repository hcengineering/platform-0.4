import { Doc, DocumentQuery, getFullRef, Tx } from '@anticrm/core'
import chunter from '@anticrm/chunter'
import recruiting from '@anticrm/recruiting'

export function candidateActivityMapper (doc: Doc): Array<DocumentQuery<Tx<Doc>>> {
  return [
    {
      objectClass: chunter.class.Comment,
      'attributes.replyOf': getFullRef(doc._id, doc._class)
    },
    {
      objectClass: recruiting.class.Applicant,
      'attributes.candidate': getFullRef(doc._id, doc._class)
    }
  ]
}
export function applicantActivityMapper (doc: Doc): Array<DocumentQuery<Tx<Doc>>> {
  return [
    {
      objectClass: chunter.class.Comment,
      'attributes.replyOf': getFullRef(doc._id, doc._class)
    }
  ]
}
