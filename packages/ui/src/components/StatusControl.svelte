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
  import type { Status } from '@anticrm/status'
  import { Severity } from '@anticrm/status'

  import StatusControl from './internal/Status.svelte'

  export let status: Status
</script>

{#if status.severity !== Severity.OK}
<div class="message-container" class:error={status.severity === Severity.ERROR}>
  <StatusControl {status} />
</div>
{/if}

<style lang="scss">
  .message-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 12px 16px;
    color: var(--theme-content-color);
    fill: var(--theme-caption-color);
    background-color: var(--theme-bg-accent-color);
    border: 1px solid var(--theme-bg-accent-hover);
    border-radius: 8px;
    .icon {
      width: 16px;
      height: 16px;
      margin-right: 12px;
    }
    .message {
      font-family: inherit;
      font-size: 12px;
      flex-grow: 1;
    }
  }

  .error {
    color: var(--system-error-color);
    fill: var(--system-error-color);
    background-color: var(--theme-button-bg-error);
    border-color: var(--system-error-60-color);
  }
</style>