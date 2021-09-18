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

import contact from '@anticrm/contact'
import { Account, DocumentPresenter, PresentationMode, Ref, Timestamp } from '@anticrm/core'
import fsm from '@anticrm/fsm'
import { Builder, Model } from '@anticrm/model'
import { TPerson } from '@anticrm/model-contact'
import core, { TSpace } from '@anticrm/model-core'
import { templateFSM, TFSMItem, TWithFSM } from '@anticrm/model-fsm'
import workbench from '@anticrm/model-workbench'
import type { Applicant, Candidate, CandidatePoolSpace, CandidateStatus, VacancySpace } from '@anticrm/recruiting'
import recruiting from '@anticrm/recruiting'

/**
 * @public
 */
@Model(recruiting.class.Candidate, contact.class.Person)
class TCandidate extends TPerson implements Candidate {
  status!: CandidateStatus
  employment!: {
    position: string
    experience: number
  }

  salaryExpectation!: number
  resume!: string
}

/**
 * @public
 */
@Model(recruiting.class.CandidatePoolSpace, core.class.Space)
class TCandidatePoolSpace extends TSpace implements CandidatePoolSpace {}

/**
 * @public
 */
@Model(recruiting.class.Applicant, fsm.class.FSMItem)
class TApplicant extends TFSMItem implements Applicant {
  recruiter!: Ref<Account>
}

/**
 * @public
 */
@Model(recruiting.class.VacancySpace, fsm.class.WithFSM)
class TVacancySpace extends TWithFSM implements VacancySpace {
  company!: string
  description!: string
  location!: string
  type!: string
  dueDate!: Timestamp
}

/**
 * @public
 */
export function createModel (builder: Builder): void {
  builder.createModel(TApplicant, TCandidate, TCandidatePoolSpace, TVacancySpace)

  builder.createDoc(
    workbench.class.Application,
    {
      label: recruiting.string.App,
      icon: recruiting.icon.Recruiting,
      navigatorModel: {
        spaces: [
          {
            label: recruiting.string.Vacancies,
            spaceIcon: recruiting.icon.Recruiting,
            spaceClass: recruiting.class.VacancySpace,
            addSpaceLabel: recruiting.string.AddVacancy,
            createComponent: recruiting.component.CreateVacancy,
            item: {
              createComponent: recruiting.component.CreateApplication,
              createLabel: recruiting.string.CreateApplication
            }
          },
          {
            label: recruiting.string.Candidates,
            spaceIcon: recruiting.icon.Recruiting,
            spaceClass: recruiting.class.CandidatePoolSpace,
            addSpaceLabel: recruiting.string.AddPoolSpace,
            createComponent: recruiting.component.CreatePool,
            item: {
              createComponent: recruiting.component.CreateCandidate,
              createLabel: recruiting.string.AddCandidate,
              editComponent: recruiting.component.EditCandidate
            }
          }
        ],
        spaceView: recruiting.component.WorkspaceComponent
      }
    },
    recruiting.app.Recruiting
  )

  // P R E S E N T E R S
  builder.createDoc<DocumentPresenter<Candidate>>(core.class.DocumentPresenter, {
    objectClass: recruiting.class.Candidate,
    presentation: [
      {
        component: recruiting.component.EditCandidate,
        description: 'Candidate editor',
        mode: PresentationMode.Edit
      }
    ]
  })

  const states = {
    rejected: { name: 'Rejected' },
    applied: { name: 'Applied' },
    hrInterview: { name: 'HR interview' },
    testTask: { name: 'Test Task' },
    techInterview: { name: 'Technical interview' },
    offer: { name: 'Offer' },
    contract: { name: 'Contract signing' }
  }

  templateFSM('Default developer vacancy', recruiting.class.VacancySpace)
    .transition(states.applied, [states.hrInterview, states.rejected])
    .transition(states.hrInterview, [states.testTask, states.rejected])
    .transition(states.testTask, [states.techInterview, states.rejected])
    .transition(states.techInterview, [states.offer, states.rejected])
    .transition(states.offer, [states.contract, states.rejected])
    .transition(states.offer, states.rejected)
    .build(builder)

  templateFSM('Another default vacancy', recruiting.class.VacancySpace)
    .transition(states.applied, [states.techInterview, states.rejected])
    .transition(states.techInterview, [states.offer, states.rejected])
    .transition(states.offer, states.rejected)
    .build(builder)
}
