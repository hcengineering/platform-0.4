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

  import { createEventDispatcher } from 'svelte'

  import { IconClose, Label, ScrollBox } from '@anticrm/ui'

  export let title: IntlString | string

  const dispatch = createEventDispatcher()
</script>

<div class="root">
  <div class="container">
    <div class="header">
      <div class="title"><Label label={title} /></div>
      <div
        class="close"
        on:click={() => {
          dispatch('close')
        }}
      >
        <IconClose size={16} />
      </div>
    </div>
    <div class="content">
      <ScrollBox vertical><slot /></ScrollBox>
    </div>
  </div>
</div>

<style lang="scss">
  .root {
    position: relative;
    display: flex;
    justify-content: flex-end;
    flex-direction: row;
    width: 100vw;
    max-height: 100vh;
    height: 100vh;
  }

  .container {
    display: flex;
    flex-direction: column;
    min-width: 40%;
    max-width: 80%;
    width: auto;
    max-height: 100vh;
    height: 100vh;
    background-color: var(--theme-bg-color);
    border-top-left-radius: 30px;
    border-bottom-left-radius: 30px;
    box-shadow: 0px 50px 120px rgba(0, 0, 0, 0.4);
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
    margin-top: 12px;
    padding: 0 32px 0 40px;
    height: 72px;
  }

  .title {
    flex-grow: 1;
    font-weight: 500;
    font-size: 20px;
    line-height: 26px;
    color: var(--theme-caption-color);
    user-select: none;
  }

  .close {
    width: 16px;
    height: 16px;
    margin-left: 12px;
    opacity: 0.4;
    cursor: pointer;
    &:hover {
      opacity: 1;
    }
  }

  .content {
    flex-shrink: 0;
    margin: 24px 20px 0;
    padding: 0 20px;
    height: calc(100vh - 204px);
  }
</style>
