<!--
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
-->
<script lang="ts">
  import { Component } from '@anticrm/ui'
  import type { MessageReference } from '../messages'
  import { PresentationMode } from '@anticrm/core'
  import { findPresentation } from '../presentation'
  import type { PresentationResult } from '../presentation'

  import { getClient } from '@anticrm/workbench'

  export let reference: MessageReference
  export let mode: PresentationMode = PresentationMode.Preview
  let component: PresentationResult | undefined

  export let componentOnly = false

  const client = getClient()

  $: findPresentation(client, reference, mode).then((ct) => {
    component = ct
  })
</script>

{#if component}
  <pre
    class="container">
    {#if !componentOnly}
    <div class="line" />
    {/if}
    <div class="content">
      <Component is={component.component} props={component.props} />
    </div>
  </pre>
{/if}

<style lang="scss">
  .container {
    flex-shrink: 0;
    display: flex;
    align-items: stretch;
    min-width: 466px;

    .line {
      margin-right: 14px;
      width: 5px;
      background-color: #22cc62;
      border-radius: 3px;
    }
    .content {
      display: flex;
      width: 444px;
      flex-direction: column;
      background-color: var(--theme-button-bg-enabled);
      border: 1px solid var(--theme-bg-accent-color);
      border-radius: 12px;
    }
  }
</style>
