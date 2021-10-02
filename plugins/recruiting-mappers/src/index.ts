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

import { DerivedData, Doc, MappingOptions, Tx, TxCreateDoc, TxProcessor, Ref, generateId, DerivedDataDescriptor, TxUpdateDoc, TxRemoveDoc } from '@anticrm/core'
import core, { registerMapper } from '@anticrm/core'
import type { DerivedFeedback, Feedback } from '@anticrm/recruiting'
import recruiting from '@anticrm/recruiting'

async function createFeedback (feedback: Feedback, d: DerivedDataDescriptor<Doc, DerivedData>, opts: MappingOptions): Promise<(DerivedFeedback & DerivedData)[]> {
  const req = (await opts.storage.findAll(recruiting.class.FeedbackRequest, { _id: feedback.request }))[0]

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

export default async (): Promise<void> => {
  registerMapper(recruiting.mapper.Feedback, {
    map: async (tx: Tx, options: MappingOptions): Promise<DerivedData[]> => {
      if (tx._class === core.class.TxCreateDoc) {
        const ttx = tx as TxCreateDoc<Doc>

        if (options.hierarchy.isDerived(ttx.objectClass, recruiting.class.Feedback)) {
          return await createFeedback(TxProcessor.createDoc2Doc(ttx) as Feedback, options.descriptor, options)
        }
      }

      if (tx._class === core.class.TxUpdateDoc) {
        const ttx = tx as TxUpdateDoc<Doc>

        if (options.hierarchy.isDerived(ttx.objectClass, recruiting.class.Feedback)) {
          const feedback = (await options.storage.findAll(recruiting.class.Feedback, { _id: ttx.objectId as Ref<Feedback> }))[0]

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

        if (options.hierarchy.isDerived(ttx.objectClass, recruiting.class.Feedback)) {
          return []
        }
      }

      return []
    }
  })
}
