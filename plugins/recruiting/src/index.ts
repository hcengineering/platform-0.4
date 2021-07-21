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

import { plugin } from '@anticrm/platform'
import type { Asset } from '@anticrm/status'
import type { Plugin, Service } from '@anticrm/platform'
import type { Doc, Ref, Space } from '@anticrm/core'
import type { FSMItem, WithFSM } from '@anticrm/fsm'

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
  }
})
