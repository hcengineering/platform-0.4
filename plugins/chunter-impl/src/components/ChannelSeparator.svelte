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
  import type { IntlString } from '@anticrm/status'
  import { Label } from '@anticrm/ui'

  export let label: IntlString
  export let line: boolean = false
  export let params: any = undefined
</script>

<div class="flex-center container" class:line>
  <div class="label">
    <Label {label} {params} />
  </div>
</div>

<style lang="scss">
  .container {
    width: 100%;
    height: 28px;
    margin-bottom: 32px;

    .label {
      position: relative;
      padding: 6px 12px;
      font-weight: 600;
      font-size: 12px;
      letter-spacing: 0.5;
      text-transform: uppercase;
      color: var(--theme-content-trans-color);
      z-index: 1;

      &::before {
        position: absolute;
        content: '';
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: 20px;
        background-color: var(--theme-chat-divider);
        z-index: -1;
      }
    }

    &.line {
      position: relative;
      width: 100%;
      &::before {
        position: absolute;
        content: '';
        top: 50%;
        left: 0;
        width: 100%;
        height: 1px;
        background-color: var(--theme-chat-divider);
      }
    }
  }
</style>
