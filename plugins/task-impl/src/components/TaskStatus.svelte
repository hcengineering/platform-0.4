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
  import { IntlString } from '@anticrm/status'
  import { Label } from '@anticrm/ui'
  import { getStatusColor } from '../plugin'

  export let title: IntlString
  $: color = getStatusColor(title)
</script>

<div class="taskstatus-container" style="color: {color}">
  <Label label={title} />
</div>

<style lang="scss">
  .taskstatus-container {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: nowrap;
    min-width: 100px;
    width: 100%;
    height: 24px;
    padding: 6px 8px;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.5;
    border-radius: 8px;
    background-color: var(--theme-bg-focused-color);
  }
</style>
