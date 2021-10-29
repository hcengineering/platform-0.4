//
// Copyright © 2021 Anticrm Platform Contributors.
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

import { Account, Client, generateDocumentDiff, getFullRef, measure, Ref, TxOperations } from '@anticrm/core'
import { State } from '@anticrm/fsm'
import recruiting, { Applicant, Candidate, VacancySpace } from '@anticrm/recruiting'
import { CandState } from './candidates'
import chunter, { Comment } from '@anticrm/chunter'

/**
 * @public
 */
export async function createUpdateApplicant (
  candidates: Candidate[],
  applicantsMap: Map<Ref<Candidate>, Applicant>,
  candidateStates: Map<Ref<Candidate>, CandState>,
  vacancyId: Ref<VacancySpace>,
  clientId: Ref<Account>,
  // membersMap: Map<string, Account>,
  clientOps: Client & TxOperations,
  newStates: Map<Ref<State>, CandState[]>
): Promise<void> {
  for (const c of candidates) {
    const aid = ('a' + c._id) as Ref<Applicant>
    let appl = applicantsMap.get(c._id)

    console.log('update applicant', c.lastName, c.firstName, aid)
    const done = measure('update.applicant')
    const candState = candidateStates.get(c._id) as CandState
    const applData: Applicant = {
      _class: recruiting.class.Applicant,
      space: vacancyId,
      modifiedOn: Date.now(),
      modifiedBy: clientId,
      createOn: Date.now(),
      _id: aid,
      item: c._id,
      recruiter: clientId, // membersMap.get(candState.idMember ?? '') ?? clientId,
      fsm: vacancyId,
      clazz: c._class,
      state: candState.state,
      comments: []
    }
    if (appl === undefined) {
      // No applicant defined
      appl = await clientOps.createDoc(recruiting.class.Applicant, vacancyId, applData, aid)
    } else {
      // Perform update, in case values are different.
      for (const t of generateDocumentDiff([appl], [applData])) {
        await clientOps.tx(t)
      }
    }
    const appls: CandState[] = newStates.get(candState.state) ?? []
    appls.push({ ...candState, applicant: appl?._id })
    newStates.set(candState.state, appls)

    // Add individual attachments as comments.
    const replyOf = getFullRef(aid, recruiting.class.Applicant)
    if ((candState.attachments?.length ?? 0) > 0) {
      const isImage = (name: string): string => {
        if (name.endsWith('.jpg') || name.endsWith('.png') || name.endsWith('.jpeg')) {
          return '!'
        }
        return ''
      }

      const ids = (candState.attachments ?? []).map((a) => a.id as Ref<Comment>)
      const allComments = new Map(
        (await clientOps.findAll(chunter.class.Comment, { replyOf, _id: { $in: ids } }, { limit: ids.length })).map(
          (c) => [c._id, c]
        )
      )

      for (const a of candState.attachments ?? []) {
        // const memberId = membersMap.get(a.idMember ?? '')
        const message = `Attachment added ${isImage(a.name)}[${a.name}](${a.url})`

        const cData: Comment = {
          _class: chunter.class.Comment,
          space: vacancyId,
          modifiedOn: Date.now(),
          modifiedBy: clientId,
          createOn: Date.now(),
          _id: a.id as Ref<Comment>,
          message,
          replyOf
        }

        const comment = allComments.get(a.id as Ref<Comment>)

        if (comment === undefined) {
          // No applicant defined
          await clientOps.createDoc(chunter.class.Comment, appl.space, cData, a.id as Ref<Comment>)
        } else {
          // Perform update, in case values are different.
          for (const t of generateDocumentDiff([comment], [cData])) {
            await clientOps.tx(t)
          }
        }
      }
    }
    done()
  }
}
