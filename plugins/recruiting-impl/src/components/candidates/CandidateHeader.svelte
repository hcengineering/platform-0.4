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
  <div class="icon flex">
    <div>
      <IconLocation size={12} />
    </div>
  </div>
  <div class="item flex-col-stretch">
    <Label label={recruiting.string.Location} />
    <div class="value">
      <EditBox bind:value={candidate.address.city} on:blur={update} />
    </div>
  </div>
  <div class="splitter" />
  <div class="item flex-col-stretch">
    <Label label={recruiting.string.Onsite} />
    <YesNo bind:value={candidate.workPreference.onsite} on:update={update} />
  </div>
  <div class="splitter" />
  <div class="item flex-col-stretch">
    <Label label={recruiting.string.Remote} />
    <YesNo bind:value={candidate.workPreference.remote} on:update={update} />
  </div>
  <div class="splitter" />
  <div class="item flex-col-stretch">
    <Label label={recruiting.string.SalaryExpectation} />
    <div class="value">
      <EditBox bind:value={candidate.salaryExpectation} on:blur={update} />
    </div>
  </div>
</div>

<style lang="scss">
  .header {
    padding-top: 12px;
    padding-bottom: 12px;

    .icon {
      height: 36px;
      width: 36px;
      border-radius: 50%;
      border: 0.5px solid var(--theme-avatar-border);

      div {
        margin: auto;
      }
    }

    .splitter {
      height: 100%;
      width: 1px;
      background-color: var(--theme-card-divider);
    }

    .item {
      margin-left: 24px;
      margin-right: 24px;

      .value {
        color: var(--theme-caption-color);
        font-weight: 500;
      }
    }
  }
</style>
