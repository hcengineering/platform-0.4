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
import type {
  Account,
  Ref,
  Timestamp,
  Space,
  DerivedData,
  DerivedDataDescriptor,
  Doc,
  DocumentPresenter,
  Domain,
  Class
} from '@anticrm/core'
import { generateId, PresentationMode } from '@anticrm/core'
import fsm from '@anticrm/fsm'
import { Builder, Model } from '@anticrm/model'
import { TPerson } from '@anticrm/model-contact'
import core, { TSpace, TDoc } from '@anticrm/model-core'
import type {
  Applicant,
  Candidate,
  CandidatePoolSpace,
  CandidateStatus,
  DerivedFeedback,
  Feedback,
  FeedbackRequest,
  VacancySpace
} from '@anticrm/recruiting'
import workbench from '@anticrm/model-workbench'
import calendar from '@anticrm/calendar'
import { templateFSM, TWithFSM, TFSMItem } from '@anticrm/model-fsm'
import recruiting from '@anticrm/recruiting'
import action from '@anticrm/action-plugin'
import type { Action } from '@anticrm/action-plugin'

const DOMAIN_RECRUITING = 'recruiting' as Domain

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
@Model(recruiting.class.FeedbackRequest, core.class.Doc, DOMAIN_RECRUITING)
class TFeedbackRequest extends TDoc implements FeedbackRequest {
  parent!: Ref<Doc>
  targetSpace!: Ref<Space>
}

/**
 * @public
 */
@Model(recruiting.class.Feedback, core.class.Doc, DOMAIN_RECRUITING)
class TFeedback extends TDoc implements Feedback {
  parent!: Ref<Doc>
  request!: Ref<FeedbackRequest>
  feedback!: string
}

/**
 * @public
 */
@Model(recruiting.class.DerivedFeedback, recruiting.class.Feedback, DOMAIN_RECRUITING)
class TDerivedFeedback extends TFeedback implements DerivedFeedback {
  descriptorId!: Ref<DerivedDataDescriptor<Doc, DerivedData>>
  objectId!: Ref<Doc>
  objectClass!: Ref<Class<Doc>>
}

/**
 * @public
 */
export function createModel (builder: Builder): void {
  builder.createModel(
    TApplicant,
    TCandidate,
    TCandidatePoolSpace,
    TVacancySpace,
    TFeedbackRequest,
    TFeedback,
    TDerivedFeedback
  )

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
  builder.createDoc<DocumentPresenter<Candidate>>(
    core.class.DocumentPresenter,
    {
      objectClass: recruiting.class.Candidate,
      presentation: [
        {
          component: recruiting.component.EditCandidate,
          description: 'Candidate editor',
          mode: PresentationMode.Edit
        }
      ]
    },
    recruiting.presenter.CandidatePresenter
  )

  builder.createDoc<DocumentPresenter<FeedbackRequest>>(
    core.class.DocumentPresenter,
    {
      objectClass: recruiting.class.FeedbackRequest,
      presentation: [
        {
          component: recruiting.component.Feedback,
          description: 'Feedback request',
          mode: PresentationMode.Preview
        }
      ]
    },
    recruiting.presenter.FeedbackRequestPresenter
  )

  // Actions
  const interviewId: Ref<Action> = generateId()
  builder.createDoc(
    action.class.Action,
    {
      name: 'Interview',
      description: 'Plan interview',
      resId: recruiting.action.Interview,
      input: calendar.class.Event
    },
    interviewId
  )

  // FSM
  const states = {
    applied: { name: 'Applied', requiredActions: [], optionalActions: [] },
    hrInterview: { name: 'HR interview', requiredActions: [interviewId], optionalActions: [] },
    testTask: { name: 'Test Task', requiredActions: [], optionalActions: [] },
    techInterview: { name: 'Technical interview', requiredActions: [interviewId], optionalActions: [] },
    offer: { name: 'Offer', requiredActions: [], optionalActions: [] },
    contract: { name: 'Contract signing', requiredActions: [], optionalActions: [] },
    rejected: { name: 'Rejected', requiredActions: [], optionalActions: [] }
  }

  templateFSM('Default developer vacancy', recruiting.class.VacancySpace, recruiting.fsm.DefaultVacancy)
    .transition(states.applied, [states.hrInterview, states.rejected])
    .transition(states.hrInterview, [states.testTask, states.rejected])
    .transition(states.testTask, [states.techInterview, states.rejected])
    .transition(states.techInterview, [states.offer, states.rejected])
    .transition(states.offer, [states.contract, states.rejected])
    .build(builder)

  // Derived data
  builder.createDoc(
    core.class.DerivedDataDescriptor,
    {
      targetClass: recruiting.class.DerivedFeedback,
      sourceClass: recruiting.class.Feedback,
      mapper: recruiting.mapper.Feedback
    },
    recruiting.dd.Feedback
  )
}
