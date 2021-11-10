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
  import recruting, { SocialLink } from '@anticrm/recruiting'
  import { IconAdd, Label, IconEdit, CircleButton, showPopup } from '@anticrm/ui'
  import { createEventDispatcher } from 'svelte'
  import SocialLinkView from './SocialLink.svelte'
  import SocialEditor from './SocialEditor.svelte'

  export let value: SocialLink[]
  export let editable: boolean = false

  const dispatch = createEventDispatcher()

  function update (): void {
    value = value.filter((l) => l.link !== '')
    dispatch('update')
  }

  const editSocialLinks = (ev: Event) => {
    const target = ev.currentTarget as HTMLElement
    showPopup(SocialEditor, { value: value ?? [] }, target, (result) => {
      if (result) value = result
      update()
    })
  }
</script>

<div class="flex-row-center social-container">
  {#if value.length > 0}
    {#each value as socialLink}
      <div class="item">
        <SocialLinkView bind:socialLink {editable} on:update={update} />
      </div>
    {/each}
    {#if editable}
      <div class="item">
        <CircleButton icon={IconEdit} size={'small'} transparent on:click={editSocialLinks} />
      </div>
    {/if}
  {:else if editable}
    <div class="flex-row-center item" on:click={editSocialLinks}>
      <CircleButton icon={IconAdd} size={'small'} transparent />
      <span><Label label={recruting.string.AddSocialLinks} /></span>
    </div>
  {/if}
</div>

<style lang="scss">
  .social-container {
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 0.125rem;
    &::-webkit-scrollbar:horizontal {
      height: 2px;
    }
    &::-webkit-scrollbar-track {
      margin: 0;
    }
    &::-webkit-scrollbar-thumb {
      background-color: var(--theme-bg-accent-color);
    }
    &::-webkit-scrollbar-thumb:hover {
      background-color: var(--theme-bg-accent-hover);
    }
  }
  .item span {
    margin-left: 0.5rem;
    cursor: pointer;
  }
  .item:hover {
    color: var(--theme-caption-color);
  }
  .item:active {
    color: var(--theme-content-accent-color);
  }
  .item + .item {
    margin-left: 0.25rem;
  }
</style>
