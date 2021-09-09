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
import recruiting from '@anticrm/recruiting'

import CreateCandidatePool from './components/candidates/CreateCandidatePool.svelte'
import CreateVacancy from './components/vacancies/CreateVacancy.svelte'
import CreateCandidate from './components/candidates/CreateCandidate.svelte'
import EditCandidate from './components/candidates/EditCandidate.svelte'
import Workspace from './components/Workspace.svelte'

export default async (): Promise<RecruitingService> => {
  setResource(recruiting.component.CreatePool, CreateCandidatePool)
  setResource(recruiting.component.CreateVacancy, CreateVacancy)
  setResource(recruiting.component.CreateCandidate, CreateCandidate)
  setResource(recruiting.component.EditCandidate, EditCandidate)
  setResource(recruiting.component.WorkspaceComponent, Workspace)

  return {}
}
