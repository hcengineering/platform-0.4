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
  import attachment, { Attachment } from '@anticrm/attachment'
  import { Class, Doc, Ref, Space } from '@anticrm/core'
  import { showPopup } from '@anticrm/ui'
  import { createEventDispatcher } from 'svelte'

  import Avatar from '../icons/Avatar.svelte'

  export let src: string | undefined
  export let objectId: Ref<Doc>
  export let objectClass: Ref<Class<Doc>>
  export let space: Ref<Space>
  export let size: 'medium' | 'large' | 'small' = 'medium'
  export let editable: boolean = true

  const dispatch = createEventDispatcher()
  let input: HTMLElement

  async function fileInputChange (e: Event): Promise<void> {
    const elem = e.target as HTMLInputElement
    const list = elem.files
    if (list === null || list.length === 0 || !editable) return
    selectFiles(list)
  }

  function selectFiles (list: FileList): void {
    for (let index = 0; index < list.length; index++) {
      const file = list.item(index)
      if (file === null) continue
      showPopup(
        attachment.component.AvatarEditor,
        { objectId, objectClass, space, file },
        undefined,
        (item: Attachment | undefined) => {
          src = item?.url
          // closePopup()
          dispatch('update')
        }
      )
    }
  }

  async function drop (e: DragEvent): Promise<void> {
    const list = e.dataTransfer?.files
    if (list === undefined || list.length === 0 || !editable) return
    selectFiles(list)
  }

  function getImageURL (url: string): string {
    return url.startsWith('blob') ? url : url + '?width=96'
  }
</script>

<div class="avatar-container avatar-{size}" on:drop|preventDefault={drop} on:dragover|preventDefault>
  <input class="hidden" bind:this={input} on:change={fileInputChange} type="file" accept="image/*" />
  <div class="flex-center avatar-shadow avatar-{size}">
    {#if !src}
      <div class="bg-avatar"><Avatar /></div>
    {:else}
      <div class="bg-avatar">
        <img class="avatar-{size}" src={getImageURL(src)} alt="Avatar" />
      </div>
    {/if}
  </div>
  <div
    class="flex-center avatar avatar-{size}"
    class:editable
    on:click={() => {
      if (editable) {
        input.click()
      }
    }}
  >
    <div class="border" />
    {#if !src}
      <Avatar />
    {:else}
      <img class="avatar-{size}" src={getImageURL(src)} alt="Avatar" />
    {/if}
  </div>
</div>

<style lang="scss">
  @import '../../../../../packages/theme/styles/mixins.scss';

  .avatar-container {
    flex-shrink: 0;
    position: relative;
    user-select: none;

    .hidden {
      display: none;
    }
  }
  .avatar-shadow {
    position: absolute;

    .bg-avatar {
      // transform: scale(1.1);
      filter: blur(10px);
      opacity: 0.2;
    }
  }
  .avatar {
    overflow: hidden;
    position: absolute;
    border-radius: 50%;
    filter: var(--theme-avatar-shadow);

    &.editable {
      cursor: pointer;
    }

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
  .avatar-small {
    width: 4.5rem;
    height: 4.5rem;
  }
  .avatar-medium {
    width: 6rem;
    height: 6rem;
  }
  .avatar-large {
    width: 7.5rem;
    height: 7.5rem;
  }
</style>
