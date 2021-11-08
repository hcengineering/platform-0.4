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
  import recruiting, { VacancySpace } from '@anticrm/recruiting'
  import { createEventDispatcher } from 'svelte'
  import { ActionIcon, DatePicker, EditBox, IconLocation, Label } from '@anticrm/ui'
  import Details from '../icons/Details.svelte'

  export let vacancy: VacancySpace
  const dispatch = createEventDispatcher()

  function update (key: string, value: any) {
    dispatch('update', { key, value })
  }
</script>

<div class="header flex-row-center">
  <div class="item flex">
    <DatePicker
      value={vacancy.dueDate !== undefined ? new Date(vacancy.dueDate) : undefined}
      label={recruiting.string.Due}
      noLabel={recruiting.string.NoDue}
      on:change={(e) => {
        update('dueDate', e.detail)
      }}
    />
  </div>
  <div class="splitter" />
  <div class="item flex">
    <ActionIcon icon={IconLocation} size={12} circleSize={36} />
    <div class="data flex-col-stretch">
      <Label label={recruiting.string.Location} />
      <div class="value">
        <EditBox
          bind:value={vacancy.location}
          on:blur={() => {
            update('location', vacancy.location)
          }}
        />
      </div>
    </div>
  </div>
  <div class="splitter" />
  <div class="item flex">
    <ActionIcon icon={Details} size={12} circleSize={36} />
    <div class="data flex-col-stretch">
      <Label label={recruiting.string.Company} />
      <div class="value">
        <EditBox
          bind:value={vacancy.company}
          on:blur={() => {
            update('company', vacancy.company)
          }}
        />
      </div>
    </div>
  </div>
</div>

<style lang="scss">
  .header {
    padding-top: 12px;
    padding-bottom: 12px;
    height: 100%;

    .splitter {
      margin-left: 24px;
      margin-right: 24px;
      height: 100%;
      width: 1px;
      background-color: var(--theme-card-divider);
    }

    .item {
      .data {
        margin-left: 8px;

        .value {
          color: var(--theme-caption-color);
          font-weight: 500;
        }
      }
    }
  }
</style>
