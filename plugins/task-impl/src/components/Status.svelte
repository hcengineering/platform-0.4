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
  import type { IntlString } from '@anticrm/status'
  import { Label } from '@anticrm/ui'
  import { getStatusColor } from '../plugin'

  export let value: IntlString
  $: color = getStatusColor(value)
</script>

<div class="taskstatus-container">
  <div class="status" style="background-color: {color}" />
  <Label label={value} />
</div>

<style lang="scss">
  .taskstatus-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: nowrap;
    min-width: 80px;
    width: 100%;
    height: 24px;
    font-size: 13px;
    font-weight: 500;

    .status {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      margin: 5px;
    }
  }
</style>
