//
// Copyright © 2020, 2021 Anticrm Platform Contributors.
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

import type { Account, Class, Doc, DocumentPresenter, Ref, Space, Timestamp } from '@anticrm/core'
import type { Person } from '@anticrm/contact'
import type { FSM, FSMItem, WithFSM } from '@anticrm/fsm'
import type { Plugin, Service } from '@anticrm/platform'
import { plugin } from '@anticrm/platform'
import type { AnyComponent, Asset, IntlString } from '@anticrm/status'
import { Application } from '@anticrm/workbench'

export enum CandidateStatus {
  Employed = 'employed',
  AvailableForHire = 'available-for-hire'
}

export interface Candidate extends Person {
  status: CandidateStatus
  employment: {
    position: string
    experience: number
  }
  salaryExpectation?: number
  resume: string
}

export interface Applicant extends FSMItem {
  recruiter: Ref<Account>
}

export interface CandidatePoolSpace extends Space {}

export interface Vacancy {
  company: string
  details?: {
    summary: string
    qualification: string
    experience: string
  }
  location: string
  type: string
  dueDate: Timestamp
}
export interface VacancySpace extends WithFSM, Vacancy {}

export interface RecruitingService extends Service {}

const PluginRecruiting = 'recruiting' as Plugin<RecruitingService>

export default plugin(PluginRecruiting, {}, {
  app: {
    Recruiting: '' as Ref<Application>
  },
  icon: {
    Recruiting: '' as Asset
  },
  class: {
    Candidate: '' as Ref<Class<Candidate>>,
    CandidatePoolSpace: '' as Ref<Class<CandidatePoolSpace>>,
    Applicant: '' as Ref<Class<Applicant>>,
    VacancySpace: '' as Ref<Class<VacancySpace>>
  },
  component: {
    CreatePool: '' as AnyComponent,
    CreateVacancy: '' as AnyComponent,
    CreateApplication: '' as AnyComponent,
    CreateCandidate: '' as AnyComponent,
    WorkspaceComponent: '' as AnyComponent,
    EditCandidate: '' as AnyComponent
  },
  string: {
    App: '' as IntlString,
    Candidates: '' as IntlString,
    Vacancies: '' as IntlString,
    Name: '' as IntlString,

    GeneralInformation: '' as IntlString,
    Details: '' as IntlString,
    VacancyTitle: '' as IntlString,
    Description: '' as IntlString,
    MakePrivate: '' as IntlString,
    MakePrivateDescription: '' as IntlString,
    Due: '' as IntlString,
    VacancyType: '' as IntlString,
    VacancyNotes: '' as IntlString,
    VacancyDetails: '' as IntlString,
    Summary: '' as IntlString,
    Qualification: '' as IntlString,
    VacationExperience: '' as IntlString,
    Flow: '' as IntlString,
    Location: '' as IntlString,

    PersonalInformation: '' as IntlString,
    FirstName: '' as IntlString,
    LastName: '' as IntlString,
    Email: '' as IntlString,
    Phone: '' as IntlString,
    SalaryExpectation: '' as IntlString,
    Position: '' as IntlString,
    Experience: '' as IntlString,
    EmploymentStatus: '' as IntlString,
    Address: '' as IntlString,
    Street: '' as IntlString,
    City: '' as IntlString,
    Zip: '' as IntlString,
    Country: '' as IntlString,
    ApplicationInfo: '' as IntlString,
    CreateApplication: '' as IntlString,
    Unassign: '' as IntlString,

    Candidate: '' as IntlString,
    Recruiter: '' as IntlString,
    SelectCandidate: '' as IntlString,
    AssignRecruiter: '' as IntlString,

    AddPoolSpace: '' as IntlString,

    AddVacancy: '' as IntlString,
    Company: '' as IntlString,

    AddCandidate: '' as IntlString,
    Bio: '' as IntlString
  },
  presenter: {
    CandidatePresenter: '' as Ref<DocumentPresenter<Doc>>
  },
  fsm: {
    DefaultVacancy: '' as Ref<FSM>,
    AnotherDefaultVacancy: '' as Ref<FSM>
  }
})
