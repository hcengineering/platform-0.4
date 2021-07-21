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

import type { RecruitingService } from '@anticrm/recruiting'
import { setResource } from '@anticrm/platform'

import CreateCandidatePool from './components/candidates/CreateCandidatePool.svelte'
import CreateVacancy from './components/vacancies/CreateVacancy.svelte'
import Workspace from './components/Workspace.svelte'

import meeting from './plugin'

export default async (): Promise<RecruitingService> => {
  setResource(meeting.component.CreatePool, CreateCandidatePool)
  setResource(meeting.component.CreateVacancy, CreateVacancy)
  setResource(meeting.component.WorkspaceComponent, Workspace)

  return {}
}
