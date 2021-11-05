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
  import recruting, { SocialLink, SocialLinkType } from '@anticrm/recruiting'
  import { ActionIcon, IconAdd, Label, IconEdit, closeTooltip } from '@anticrm/ui'
  import { createEventDispatcher } from 'svelte'
  import SocialLinkView from './SocialLink.svelte'

  export let socialLinks: SocialLink[]
  export let editable: boolean = false
  export let width: number | undefined = undefined

  const dispatch = createEventDispatcher()
  let edit = false

  const allSocialLinks: SocialLinkType[] = [
    'Discord',
    'Email',
    'Facebook',
    'Github',
    'Instagram',
    'Linkedin',
    'Phone',
    'Telegram',
    'Twitter',
    'Vk',
    'Whatsapp',
    'Youtube'
  ]

  function getAllSocialLinks (currentLinks: SocialLink[]): SocialLink[] {
    const result = currentLinks
    for (const type of allSocialLinks) {
      const index = currentLinks.findIndex((l) => l.type === type)
      if (index === -1) {
        result.push({ type: type, link: '' })
      }
    }
    return result
  }

  function update (): void {
    edit = false
    socialLinks = socialLinks.filter((l) => l.link !== '')
    dispatch('update')
  }
</script>

<div class="container" style={width ? `width: ${width}px` : ''}>
  {#if edit}
    {#each getAllSocialLinks(socialLinks) as socialLink}
      <div class="item">
        <SocialLinkView bind:socialLink editable={edit} on:update={update} />
      </div>
    {/each}
  {:else if socialLinks.length > 0}
    {#each socialLinks as socialLink}
      <div class="item">
        <SocialLinkView bind:socialLink editable={edit} on:update={update} />
      </div>
    {/each}
    {#if editable}
      <div class="item editIcon">
        <div>
          <ActionIcon
            icon={IconEdit}
            action={() => {
              edit = true
              closeTooltip()
            }}
            label={recruting.string.EditSocialLinks}
          />
        </div>
      </div>
    {/if}
  {:else if editable}
    <div
      class="add-item"
      on:click={() => {
        edit = true
      }}
    >
      <div class="icon"><div><IconAdd /></div></div>
      <div class="label"><Label label={recruting.string.AddSocialLinks} /></div>
    </div>
  {/if}
</div>

<style lang="scss">
  .container {
    display: flex;
    flex-grow: 1;
    align-items: center;
    flex-direction: row;
    overflow-y: hidden;
    overflow-x: auto;
    padding-bottom: 5px;

    .item {
      width: 24px;
      height: 24px;
    }

    .editIcon {
      display: flex;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border-color: var(--theme-border-modal);
      border: solid thin;

      div {
        margin: auto;
      }
    }

    .item + .item {
      margin-left: 4px;
    }

    .add-item {
      display: flex;
      align-items: center;
      cursor: pointer;

      .icon {
        opacity: 0.6;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background-color: var(--theme-button-bg-enabled);
        border-color: var(--theme-button-border);
        display: flex;

        div {
          margin: auto;
        }
      }
      .label {
        margin-left: 8px;
        color: var(--theme-content-color);
      }

      &:hover {
        .icon {
          opacity: 1;
        }
        .label {
          color: var(--theme-caption-color);
        }
      }
    }
  }
</style>
