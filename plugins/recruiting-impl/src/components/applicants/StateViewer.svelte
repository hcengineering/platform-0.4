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
  import { State } from '@anticrm/fsm'

  export let width: number = 108
  export let height: number = 32
  export let state: State
</script>

<div class="status flex-center" style="background-color: {state.color}; width: {width}px; height: {height}px;">
  {state.name}
</div>

<style lang="scss">
  .status {
    border-radius: 8px;
    font-weight: 500;
    color: var(--theme-caption-color);
    text-transform: uppercase;
    font-size: 10px;
  }
</style>
