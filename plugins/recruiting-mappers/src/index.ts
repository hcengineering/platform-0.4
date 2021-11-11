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

import { DerivedData, Doc, MappingOptions, Tx, TxCreateDoc, TxProcessor, Ref, generateId, DerivedDataDescriptor, TxUpdateDoc, TxRemoveDoc, Hierarchy, Class } from '@anticrm/core'
import core, { registerMapper } from '@anticrm/core'
import type { Applicant, Candidate, DerivedFeedback, Feedback } from '@anticrm/recruiting'
import recruiting from '@anticrm/recruiting'

async function createFeedback (feedback: Feedback, d: DerivedDataDescriptor<Doc, DerivedData>, opts: MappingOptions): Promise<(DerivedFeedback & DerivedData)[]> {
  const req = (await opts.storage.findAll(recruiting.class.FeedbackRequest, { _id: feedback.request }, { limit: 1 }))[0]

  if (req === undefined) {
    return []
  }

  return [
    {
      ...feedback,
      _id: `dd-${generateId()}` as Ref<DerivedFeedback>,
      _class: recruiting.class.DerivedFeedback,
      objectId: feedback._id,
      objectClass: feedback._class,
      modifiedOn: Date.now(),
      createOn: Date.now(),
      descriptorId: d._id,
      space: req.targetSpace
    }
  ]
}

const isTarget = (hierarchy: Hierarchy, c: Ref<Class<Doc>>): boolean =>
  hierarchy.isDerived(c, recruiting.class.Feedback) &&
  !hierarchy.isDerived(c, recruiting.class.DerivedFeedback)

export default async (): Promise<void> => {
  registerMapper(recruiting.mapper.Feedback, {
    map: async (tx: Tx, options: MappingOptions): Promise<DerivedData[]> => {
      if (tx._class === core.class.TxCreateDoc) {
        const ttx = tx as TxCreateDoc<Doc>

        if (isTarget(options.hierarchy, ttx.objectClass)) {
          return await createFeedback(TxProcessor.createDoc2Doc(ttx) as Feedback, options.descriptor, options)
        }
      }

      if (tx._class === core.class.TxUpdateDoc) {
        const ttx = tx as TxUpdateDoc<Doc>

        if (isTarget(options.hierarchy, ttx.objectClass)) {
          const feedback = (await options.storage.findAll(recruiting.class.Feedback, { _id: ttx.objectId as Ref<Feedback> }, { limit: 1 }))[0]

          if (feedback === undefined) {
            return []
          }

          return (await options.storage.findAll(recruiting.class.DerivedFeedback, { objectId: ttx.objectId }))
            .map(dfeedback => ({
              ...feedback,
              _id: dfeedback._id,
              _class: dfeedback._class,
              objectId: dfeedback.objectId,
              objectClass: dfeedback.objectClass,
              modifiedOn: Date.now(),
              createOn: dfeedback.createOn,
              space: dfeedback.space,
              descriptorId: dfeedback.descriptorId
            }))
        }
      }

      if (tx._class === core.class.TxRemoveDoc) {
        const ttx = tx as TxRemoveDoc<Doc>

        if (isTarget(options.hierarchy, ttx.objectClass)) {
          return []
        }
      }

      return []
    }
  })

  registerMapper(recruiting.mapper.ApplicantCandidate, {
    map: async (tx: Tx, options: MappingOptions): Promise<DerivedData[]> => {
      if (tx._class === core.class.TxUpdateDoc) {
        const ctx = tx as TxUpdateDoc<Candidate>
        const candidate = (await options.storage.findAll(ctx.objectClass, { _id: ctx.objectId }, { limit: 1 })).pop()
        if (candidate !== undefined && candidate.applicants.length !== 0) {
          let needUpdate = false
          const candidateData = {
            location: candidate.address.city,
            firstName: candidate.firstName,
            lastName: candidate.lastName,
            title: candidate.title,
            avatar: candidate.avatar
          }
          for (const key in ctx.operations) {
            const value = (ctx.operations as any)[key]
            switch (key) {
              case 'address': {
                candidateData.location = value.city
                needUpdate = true
                break
              }
              case 'firstName': {
                candidateData.firstName = value
                needUpdate = true
                break
              }
              case 'lastName': {
                candidateData.lastName = value
                needUpdate = true
                break
              }
              case 'title': {
                candidateData.title = value
                needUpdate = true
                break
              }
              case 'avatar': {
                candidateData.avatar = value
                needUpdate = true
                break
              }
              default:
                continue
            }
          }

          if (needUpdate) {
            const applicants = await options.storage.findAll(recruiting.class.Applicant, { _id: { $in: candidate.applicants } })

            for (const applicant of applicants) {
              const tx: TxUpdateDoc<Applicant> = {
                sid: 0,
                _id: generateId(),
                _class: core.class.TxUpdateDoc,
                space: core.space.Tx,
                modifiedBy: ctx.modifiedBy,
                modifiedOn: Date.now(),
                createOn: Date.now(),
                objectId: applicant._id,
                objectClass: applicant._class,
                objectSpace: applicant.space,
                operations: {
                  candidateData: candidateData
                }
              }
              await options.storage.tx(tx)
            }
          }
        }
      }

      return []
    }
  })
}
