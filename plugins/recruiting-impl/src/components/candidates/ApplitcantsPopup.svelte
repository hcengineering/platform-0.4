<!--
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
-->
<script lang="ts">
  import { Label } from '@anticrm/ui'
  import recruiting, { Applicant, VacancySpace } from '@anticrm/recruiting'
  import { getClient } from '@anticrm/workbench'
  import { Ref } from '@anticrm/core'
  import { State } from '@anticrm/fsm'
  import fsm from '@anticrm/fsm'
  import Details from '../icons/Details.svelte'
  import StateViewer from '../applicants/StateViewer.svelte'

  export let applicants: Applicant[] = []

  interface ApplicantItem {
    position: string
    company: string
    state: State
  }

  const client = getClient()

  async function getItems (applicants: Applicant[]): Promise<ApplicantItem[]> {
    const vacancyIds = applicants.map((a) => a.space as Ref<VacancySpace>)
    const stateIds = applicants.map((a) => a.state)
    const vacancies = await client.findAll(recruiting.class.VacancySpace, { _id: { $in: vacancyIds } })
    const states = await client.findAll(fsm.class.State, { _id: { $in: stateIds } })
    const result: ApplicantItem[] = []
    for (const applicant of applicants) {
      const vacancy = vacancies.find((v) => v._id === applicant.space)
      if (vacancy === undefined) continue
      const state = states.find((v) => v._id === applicant.state)
      if (state === undefined) continue
      const item = {
        position: vacancy.name,
        company: vacancy.company,
        state
      }
      result.push(item)
    }
    return result
  }
</script>

<div class="container">
  <div class="bg" />
  <div class="header">
    <Label label={recruiting.string.Applications} />
    ({applicants.length})
  </div>
  {#await getItems(applicants) then items}
    {#each items as item}
      <div class="item flex-between">
        <div class="flex">
          <div class="icon flex">
            <div>
              <Details />
            </div>
          </div>
          <div class="flex-column">
            <div class="position">{item.position}</div>
            <div class="company">{item.company}</div>
          </div>
        </div>
        <StateViewer state={item.state} width={62} height={28} />
      </div>
    {/each}
  {/await}
</div>

<style lang="scss">
  .container {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 320px;
    min-width: 320px;
    max-width: 320px;
    border-radius: 20px;
    padding: 24px;

    .header {
      color: var(--theme-caption-color);
      font-weight: 500;
      margin-bottom: 24px;
    }

    .bg {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      background-color: var(--theme-card-bg);
      border-radius: 20px;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      box-shadow: var(--theme-card-shadow);
      z-index: -1;
    }

    .item {
      padding-top: 12px;
      padding-bottom: 12px;

      .icon {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        margin-right: 20px;
        border: 0.5px solid var(--theme-avatar-border);

        div {
          margin: auto;
        }
      }

      .position {
        color: var(--theme-caption-color);
      }

      .company {
        font-size: 12px;
      }
    }

    .item + .item {
      border-top: 1px solid var(--theme-menu-divider);
    }
  }
</style>
