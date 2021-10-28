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
  export let maxHeight: number | undefined = undefined
</script>

<div class="popup-window" style="max-height: {maxHeight ? maxHeight + 'px' : 'max-content'}">
  <div class="flex-grow scroll">
    <div class="flex-col h-full box">
      <slot />
    </div>
  </div>
</div>

<style lang="scss">
  .popup-window {
    display: flex;
    flex-direction: column;
    margin-right: 7px;
    padding: 8px 1px 8px 8px;
    height: min-content;
    background-color: var(--theme-popup-bg);
    border: var(--theme-popup-border);
    border-radius: 20px;
    box-shadow: var(--theme-popup-shadow);
    -webkit-backdrop-filter: blur(30px);
    backdrop-filter: blur(30px);

    .scroll {
      overflow-y: scroll;
      .box {
        margin-right: 1px;
      }
    }
  }
</style>
