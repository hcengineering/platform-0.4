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
  import { IntlString } from '@anticrm/status'
  import ActionIcon from './ActionIcon.svelte'
  import Add from './icons/Add.svelte'
  import Label from './Label.svelte'
  import ui from '../component'

  export let label: IntlString
  export let addHandler: (() => void) | undefined
</script>

<div class="header flex-row-center">
  <Label {label} />
  {#if addHandler}
    <div class="add">
      <ActionIcon label={ui.string.Add} icon={Add} size={20} circleSize={24} action={addHandler} />
    </div>
  {/if}
</div>

<style lang="scss">
  .header {
    color: var(--theme-caption-color);
    font-weight: 500;
    font-size: 20px;
    margin-top: 28px;
    margin-bottom: 28px;
    .add {
      margin-left: 12px;
    }
  }
</style>
