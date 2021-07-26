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

import type { Class, Doc, Ref, Space } from '@anticrm/core'
import type { FSMItem, WithFSM } from '@anticrm/fsm'
import type { Plugin, Service } from '@anticrm/platform'
import { plugin } from '@anticrm/platform'
import type { Asset, IntlString } from '@anticrm/status'

export interface Resume extends Doc {
  description: string
}

export interface Candidate extends Doc {
  name: string
  bio: string
  position: string
  location: string
  salaryExpectation?: number
  resume: Ref<Resume>
}

export interface Applicant extends FSMItem {}

export interface CandidatePoolSpace extends Space {}

export interface Vacancy {
  company: string
  description: string
  location: string
  salary?: number
  salaryMin?: number
  salaryMax?: number
}
export interface VacancySpace extends WithFSM, Vacancy {}

export interface RecruitingService extends Service {}

const PluginRecruiting = 'recruiting' as Plugin<RecruitingService>

export default plugin(PluginRecruiting, {}, {
  icon: {
    Recruiting: '' as Asset
  },
  class: {
    Candidate: '' as Ref<Class<Candidate>>,
    CandidatePoolSpace: '' as Ref<Class<CandidatePoolSpace>>,
    Resume: '' as Ref<Class<Resume>>,
    Applicant: '' as Ref<Class<Applicant>>,
    VacancySpace: '' as Ref<Class<VacancySpace>>
  },
  string: {
    App: '' as IntlString,
    Candidates: '' as IntlString,
    Vacancies: '' as IntlString,

    Name: '' as IntlString,
    Description: '' as IntlString,
    MakePrivate: '' as IntlString,
    MakePrivateDescription: '' as IntlString,

    AddPoolSpace: '' as IntlString,

    AddVacancy: '' as IntlString,
    Company: '' as IntlString,

    Position: '' as IntlString,
    Location: '' as IntlString,

    AddCandidate: '' as IntlString,
    Bio: '' as IntlString
  }
})
