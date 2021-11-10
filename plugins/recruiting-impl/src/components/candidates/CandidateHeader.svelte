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
  import recruiting, { Candidate } from '@anticrm/recruiting'
  import { createEventDispatcher } from 'svelte'
  import { EditBox, IconLocation, Label, YesNo } from '@anticrm/ui'

  export let candidate: Candidate
  const dispatch = createEventDispatcher()

  function update () {
    dispatch('update')
  }
</script>

<div class="header flex-row-center">
  <div class="flex-row-center column">
    <div class="flex-center icon">
      <IconLocation size={12} />
    </div>
    <div class="flex-col">
      <Label label={recruiting.string.Location} />
      <div class="value">
        <EditBox bind:value={candidate.address.city} on:blur={update} maxWidth="150px" />
      </div>
    </div>
  </div>
  <div class="flex-col column">
    <Label label={recruiting.string.Onsite} />
    <YesNo bind:value={candidate.workPreference.onsite} on:update={update} />
  </div>
  <div class="flex-col column">
    <Label label={recruiting.string.Remote} />
    <YesNo bind:value={candidate.workPreference.remote} on:update={update} />
  </div>
  <div class="flex-col column">
    <Label label={recruiting.string.SalaryExpectation} />
    <div class="value">
      <EditBox bind:value={candidate.salaryExpectation} on:blur={update} maxWidth="150px" />
    </div>
  </div>
</div>

<style lang="scss">
  .header {
    margin: 0.45rem 0;

    .icon {
      margin-right: 0.5rem;
      height: 2.25rem;
      width: 2.25rem;
      border-radius: 50%;
      border: 1px solid var(--theme-avatar-border);
    }

    .column + .column {
      position: relative;
      margin-left: 3rem;
      &::before {
        content: '';
        position: absolute;
        top: 0;
        bottom: 0;
        left: -1.5rem;
        width: 1px;
        background-color: var(--theme-card-divider);
      }
    }
    .value {
      font-weight: 500;
      color: var(--theme-caption-color);
    }
  }
</style>
