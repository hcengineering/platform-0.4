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
  import Close from './icons/Close.svelte'
  import { EditBox, Button, Toggle } from '@anticrm/ui'

  export let title: string = ''
  export let opened: boolean = false

  let kl: boolean = false
</script>

<div class="overlay"/>
<div class="container">
  <div class="header">
    <span class="title">{title}</span>
    <div class="tool" on:click={() => {opened = false}}><Close size={16}/></div>
  </div>
  <EditBox label="Name" value="Channel Name" error={kl ? 'Error' : undefined}/>
  <EditBox label="Description" value="This is a little description" error={kl ? 'Error' : undefined}/>
  <div class="private">
    <div class="caption">
      Make channel private
      <span>Lorem ipsum dolor sit amet quantum nunca sic</span>
    </div>
    <Toggle bind:on={kl}/>
  </div>
  <div class="footer">
    <Button title="Create" primary/>
  </div>
</div>

<style lang="scss">
  .container {
    width: 568px;
    min-height: 456px;
    background-color: var(--theme-bg-modal);
    border: 1px solid var(--theme-border-modal);
    border-radius: 20px;
    box-shadow: 0px 50px 120px rgba(0, 0, 0, 0.4);
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 101;
    padding: 48px 40px;

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 26px;
      margin-bottom: 40px;

      .title {
        flex-grow: 1;
        font-weight: 500;
        font-size: 20px;
        line-height: 26px;
        color: var(--theme-caption-color);
      }
      .tool {
        width: 16px;
        height: 16px;
        margin-left: 12px;
        opacity: .4;
      }
    }

    .private {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 32px;
      .caption {
        font-size: 14px;
        font-weight: 400;
        color: var(--theme-caption-color);

        span {
          display: block;
          font-size: 12px;
          opacity: .3;
        }
      }
    }

    .footer {
      display: flex;
      flex-direction: row-reverse;
      margin-top: 56px;
    }
  }

  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: var(--theme-menu-color);
    opacity: .7;
    z-index: 100;
    transition: .3s all;
  }
</style>