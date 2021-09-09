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

import { Builder, Model } from '@anticrm/model'
import type { Applicant, Candidate, CandidatePoolSpace, Resume, VacancySpace } from '@anticrm/recruiting'
import core, { TDoc, TSpace } from '@anticrm/model-core'
import { Domain, Ref } from '@anticrm/core'
import workbench from '@anticrm/model-workbench'
import { templateFSM, TWithFSM, TFSMItem } from '@anticrm/model-fsm'
import fsm from '@anticrm/fsm'
import recruiting from '@anticrm/recruiting'

const DOMAIN_RECRUITING = 'recruiting' as Domain

/**
 * @public
 */
@Model(recruiting.class.Candidate, core.class.Doc, DOMAIN_RECRUITING)
class TCandidate extends TDoc implements Candidate {
  name!: string
  bio!: string
  location!: string
  position!: string
  salaryExpectation!: number
  resume!: Ref<Resume>
}

/**
 * @public
 */
@Model(recruiting.class.CandidatePoolSpace, core.class.Space)
class TCandidatePoolSpace extends TSpace implements CandidatePoolSpace {}

/**
 * @public
 */
@Model(recruiting.class.Resume, core.class.Doc, DOMAIN_RECRUITING)
class TResume extends TDoc implements Resume {
  description!: string
}

/**
 * @public
 */
@Model(recruiting.class.Applicant, fsm.class.FSMItem)
class TApplicant extends TFSMItem implements Applicant {}

/**
 * @public
 */
@Model(recruiting.class.VacancySpace, fsm.class.WithFSM)
class TVacancySpace extends TWithFSM implements VacancySpace {
  company!: string
  description!: string
  location!: string
  salary!: number
  salaryMin!: number
  salaryMax!: number
}

/**
 * @public
 */
export function createModel (builder: Builder): void {
  builder.createModel(TApplicant, TResume, TCandidate, TCandidatePoolSpace, TVacancySpace)

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
              createComponent: recruiting.component.CreateVacancy
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
              editComponent: recruiting.component.EditCandidate
            }
          }
        ],
        spaceView: recruiting.component.WorkspaceComponent
      }
    },
    recruiting.app.Recruiting
  )

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
