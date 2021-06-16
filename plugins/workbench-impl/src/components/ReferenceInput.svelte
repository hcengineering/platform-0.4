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
  import Send from './icons/Send.svelte'
  import Attach from './icons/Attach.svelte'
  import Emoji from './icons/Emoji.svelte'
  import GIF from './icons/GIF.svelte'
  import TextStyle from './icons/TextStyle.svelte'

  export let thread: boolean = false
</script>

<div class="ref-container">
  <div class="textInput">
    <input class="inputMsg" class:thread={thread} type="text" placeholder="Type a new message"/>
    <button class="sendButton"><div class="icon"><Send/></div></button>
  </div>
  <div class="buttons">
    <div class="tool"><Attach/></div>
    <div class="tool"><TextStyle/></div>
    <div class="tool"><Emoji/></div>
    <div class="tool"><GIF/></div>
  </div>
</div>

<style lang="scss">
  .ref-container {
    display: flex;
    flex-direction: column;
    min-height: 74px;
    height: 74px;
    margin: 20px 40px;

    .textInput {
      display: flex;
      justify-content: space-between;
      align-items: center;
      min-height: 44px;
      height: 44px;
      padding: 0 16px;
      background-color: var(--theme-bg-accent-color);
      border: 1px solid var(--theme-bg-accent-color);
      border-radius: 12px;

      .inputMsg {
        width: 100%;
        color: var(--theme-content-color);
        background-color: transparent;
        border: none;
        outline: none;
        &.thread {
          width: auto;
        }
      }
      .sendButton {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-left: 8px;
        padding: 0;
        width: 20px;
        height: 20px;
        background-color: transparent;
        border: 1px solid transparent;
        border-radius: 4px;
        outline: none;
        cursor: pointer;

        .icon {
          width: 20px;
          height: 20px;
          opacity: .3;
          cursor: pointer;
          &:hover {
            opacity: 1;
          }
        }
        &:focus {
          border: 1px solid var(--primary-button-focused-border);
          box-shadow: 0 0 0 3px var(--primary-button-outline);
          & > .icon {
            opacity: 1;
          }
        }
      }
    }
    .buttons {
      margin: 10px 0 0 8px;
      display: flex;

      .tool {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 20px;
        height: 20px;
        opacity: .3;
        cursor: pointer;
        &:hover {
          opacity: 1;
        }
      }
      .tool + .tool {
        margin-left: 16px;
      }
    }
  }
</style>
