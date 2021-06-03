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
  import FullRight from './icons/FullRight.svelte'
  import Bookmark from './icons/Bookmark.svelte'
  import MoreH from './icons/MoreH.svelte'
  import avatar from '../../img/avatar.png'

  export let name: string
  export let time: string
  export let message: string
</script>

<div class="msgContainer">
  <div class="avatar"><img src={avatar} alt="Avatar"></div>
  <div class="message">
    <div class="header">{name}<span>{time}</span></div>
    <div class="text">{message}</div>
  </div>
  <div class="buttons">
    <div class="tool"><MoreH size={20}/></div>
    <div class="tool"><Bookmark size={20}/></div>
    <div class="tool"><FullRight size={20}/></div>
  </div>
</div>

<style lang="scss">
  .msgContainer {
    position: relative;
    display: flex;
    flex-direction: row;
    margin-bottom: 32px;
    z-index: 1;
    .avatar {
      min-width: 36px;
      width: 36px;
      height: 36px;
      background-color: var(--theme-bg-accent-color);
      border-radius: 50%;
    }
    .message {
      display: flex;
      flex-direction: column;
      margin-left: 16px;

      .header {
        font-weight: 500;
        font-size: 16px;
        line-height: 150%;
        color: var(--theme-caption-color);
        span {
          margin-left: 8px;
          font-weight: 400;
          font-size: 14px;
          line-height: 18px;
          opacity: .4;
        }
      }
      .text {
        line-height: 150%;
      }
    }

    .buttons {
      position: absolute;
      visibility: hidden;
      top: -8px;
      right: -8px;
      display: flex;
      flex-direction: row-reverse;

      .tool {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 28px;
        height: 28px;
        background-color: transparent;
        border: 1px solid transparent;
        border-radius: 4px;
        opacity: .3;
        cursor: pointer;
        &:hover {
          background-color: var(--theme-menu-divider);
          border: 1px solid var(--theme-bg-accent-color);
          opacity: 1;
        }
      }

      .tool + .tool {
        margin-right: 8px;
      }
    }

    &:hover > .buttons {
      visibility: visible;
    }
    &:hover::before {
      content: '';
    }

    &::before {
      position: absolute;
      top: -20px;
      left: -20px;
      width: calc(100% + 40px);
      height: calc(100% + 40px);
      background-color: var(--theme-button-bg-enabled);
      border: 1px solid var(--theme-bg-accent-color);
      border-radius: 12px;
      z-index: -1;
    }
  }
</style>