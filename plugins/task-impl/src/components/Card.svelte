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
  import { Progress, UserInfo } from '@anticrm/ui'
  import Reactions from './Reactions.svelte'
  import Chat from './icons/Chat.svelte'
  import Attach from './icons/Attach.svelte'

  export let user: string
  export let title: string
  export let description: string
  export let progress: object
  export let discussion: number = 0
  export let attach: number = 0
</script>

<div class="card-container">
  <div class="content">
    <div class="title">{title}</div>
    <div class="description">{description}</div>
    {#if progress}
      <div class="progress">
        <span>Progress</span>
        <Progress {...progress}/>
      </div>
    {/if}
  </div>
  <div class="footer">
    <UserInfo {user} size={24} avatarOnly/>
    <Reactions reactions={[{ icon: Chat, count: discussion }, { icon: Attach, count: attach }]}/>
  </div>
</div>

<style lang="scss">
  .card-container {
    display: flex;
    flex-direction: column;
    background-color: var(--theme-bg-accent-color);
    border: 1px solid var(--theme-bg-accent-color);
    border-radius: 12px;

    .content {
      padding: 40px 20px 28px;
      height: 100%;

      .title {
        font-weight: 500;
        font-size: 14px;
        line-height: 18px;
        color: var(--theme-caption-color);
      }
      .description {
        margin-top: 8px;
        font-size: 12px;
        line-height: 16px;
      }
      .progress {
        margin-top: 24px;
        span {
          margin-bottom: 8px;
          font-weight: 500;
          font-size: 10px;
          line-height: 13px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
      }
    }

    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 0;
      padding: 20px;
      height: 64px;
      min-height: 64px;
      // background-color: var(--theme-button-bg-focused);
      border-top: 1px solid var(--theme-bg-accent-hover);
      border-radius: 0 0 11px 11px;
    }

    &:hover {
      background-color: var(--theme-bg-accent-hover);
    }
  }
</style>
