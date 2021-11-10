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

import type { Applicant, RecruitingService } from '@anticrm/recruiting'
import { setResource } from '@anticrm/platform'
import recruiting from '@anticrm/recruiting'

import CreateCandidatePool from './components/candidates/CreateCandidatePool.svelte'
import CreateVacancy from './components/vacancies/CreateVacancy.svelte'
import CreateApplication from './components/applicants/CreateApplication.svelte'
import CreateCandidate from './components/candidates/CreateCandidate.svelte'
import EditCandidate from './components/candidates/EditCandidate.svelte'
import Workspace from './components/Workspace.svelte'
import Applications from './components/applicants/Applications.svelte'
import ApplicantPresenter from './components/applicants/ApplicantPresenter.svelte'
import FeedbackForm from './components/feedback/FeedbackForm.svelte'
import CandidatePoolProperties from './components/candidates/CandidatePoolProperties.svelte'
import VacancyProperties from './components/vacancies/VacancyProperties.svelte'
import { Action } from '@anticrm/action-plugin'
import { State } from '@anticrm/fsm'

export interface ApplicantUIModel extends Applicant {
  stateData: StateUIModel
}

export interface StateUIModel extends State {
  requiredActionsData: Action[]
  optionalActionsData: Action[]
}

export default async (): Promise<RecruitingService> => {
  setResource(recruiting.component.CreatePool, CreateCandidatePool)
  setResource(recruiting.component.CreateVacancy, CreateVacancy)
  setResource(recruiting.component.CreateCandidate, CreateCandidate)
  setResource(recruiting.component.EditCandidate, EditCandidate)
  setResource(recruiting.component.WorkspaceComponent, Workspace)
  setResource(recruiting.component.CreateApplication, CreateApplication)
  setResource(recruiting.component.Applications, Applications)
  setResource(recruiting.component.Feedback, FeedbackForm)
  setResource(recruiting.component.ApplicantPresenter, ApplicantPresenter)
  setResource(recruiting.component.CandidatePoolProperties, CandidatePoolProperties)
  setResource(recruiting.component.VacancyProperties, VacancyProperties)

  return {}
}
