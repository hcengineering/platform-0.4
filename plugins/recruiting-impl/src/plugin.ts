//
// Copyright © 2020 Anticrm Platform Contributors.
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

import { mergeIds } from '@anticrm/status'
import type { IntlString } from '@anticrm/status'
import type { Ref, Class } from '@anticrm/core'
import type { Applicant, Candidate, CandidatePoolSpace, Resume, VacancySpace } from '@anticrm/recruiting'
import type { AnyComponent } from '@anticrm/ui'

import recruiting from '@anticrm/recruiting'

export default mergeIds(recruiting, {
  component: {
    CreatePool: '' as AnyComponent,
    CreateVacancy: '' as AnyComponent,
    WorkspaceComponent: '' as AnyComponent
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
