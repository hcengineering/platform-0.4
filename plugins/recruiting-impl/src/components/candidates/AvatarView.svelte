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
  import Avatar from '../icons/Avatar.svelte'

  export let src: string

  let kl: boolean = false
</script>

<div class="avatar-container">
  <div class="flex-center avatar-shadow">
    {#if kl}
      <div class="bg-avatar"><Avatar /></div>
    {:else}
      <div class="bg-avatar">
        <img class="img-avatar" {src} alt="Avatar" />
      </div>
    {/if}
  </div>
  <div
    class="flex-center avatar"
    on:click={() => {
      kl = !kl
    }}
  >
    <div class="border" />
    {#if kl}
      <Avatar />
    {:else}
      <img class="img-avatar" {src} alt="Avatar" />
    {/if}
  </div>
</div>

<style lang="scss">
  @import '../../../../../packages/theme/styles/mixins.scss';

  .avatar-container {
    flex-shrink: 0;
    position: relative;
    margin-right: 16px;
    width: 96px;
    height: 96px;
    user-select: none;
  }
  .avatar-shadow {
    position: absolute;
    width: 96px;
    height: 96px;

    .bg-avatar {
      transform: scale(1.1);
      filter: blur(10px);
      opacity: 0.2;
    }
  }
  .avatar {
    overflow: hidden;
    position: absolute;
    width: 96px;
    height: 96px;
    border-radius: 50%;
    filter: var(--theme-avatar-shadow);
    cursor: pointer;

    &::after {
      content: '';
      @include bg-layer(var(--theme-avatar-hover), 0.5);
      z-index: -1;
    }
    &::before {
      content: '';
      @include bg-layer(var(--theme-avatar-bg), 0.1);
      backdrop-filter: blur(25px);
      z-index: -2;
    }
    .border {
      @include bg-fullsize;
      border: 2px solid var(--theme-avatar-border);
      border-radius: 50%;
    }
  }
  .img-avatar {
    width: 96px;
    height: 96px;
  }
</style>
