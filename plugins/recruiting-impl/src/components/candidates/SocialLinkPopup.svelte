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
  import { SocialLink } from '@anticrm/recruiting'
  import { UIComponent, Asset } from '@anticrm/status'
  import { EditBox, Label, Icon, ActionIcon } from '@anticrm/ui'
  import { createEventDispatcher } from 'svelte'
  import IconCopy from '../icons/Copy.svelte'
  import IconDelete from '../icons/Delete.svelte'

  export let icon: Asset | UIComponent
  export let value: SocialLink
  export let editable: boolean = false

  const dispatch = createEventDispatcher()

  const save = (): void => dispatch('close', value)
  const removeLink = (): void => dispatch('close', 'remove')
  const copyLink = (): void => {
    navigator.clipboard
      .writeText(value.link)
      .then(() => {
        console.log('Copied!', value.link)
      })
      .catch((err) => {
        console.log('Something went wrong', err)
      })
    dispatch('close')
  }
</script>

<div class="flex-row-center">
  {#if editable}
    <EditBox {icon} bind:value={value.link} on:change={save} />
  {:else}
    <div class="flex-center mr-1 icon">
      <Icon {icon} size={12} fill={'currentColor'} />
    </div>
    <Label label={value.link} />
  {/if}
  <div class="ml-4"><ActionIcon icon={IconCopy} action={copyLink} /></div>
  {#if editable}
    <div class="ml-1"><ActionIcon icon={IconDelete} fill={'var(--system-error-color)'} action={removeLink} /></div>
  {/if}
</div>

<style lang="scss">
  .icon {
    flex-shrink: 0;
    width: 1rem;
    height: 1rem;
    color: var(--theme-content-trans-color);
  }
</style>
