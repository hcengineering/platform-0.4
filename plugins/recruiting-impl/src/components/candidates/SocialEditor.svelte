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
  import recruiting, { SocialLink, SocialLinkType, allSocialLinks } from '@anticrm/recruiting'
  import { UIComponent, IntlString } from '@anticrm/status'
  import { EditBox, Button } from '@anticrm/ui'
  import { createEventDispatcher } from 'svelte'
  import Discord from '../icons/Discord.svelte'
  import Email from '../icons/Email.svelte'
  import Facebook from '../icons/Facebook.svelte'
  import Github from '../icons/Github.svelte'
  import Instagram from '../icons/Instagram.svelte'
  import Linkedin from '../icons/Linkedin.svelte'
  import Phone from '../icons/Phone.svelte'
  import Telegram from '../icons/Telegram.svelte'
  import Twitter from '../icons/Twitter.svelte'
  import Vk from '../icons/Vk.svelte'
  import Whatsapp from '../icons/Whatsapp.svelte'
  import Youtube from '../icons/Youtube.svelte'

  export let value: SocialLink[]

  const dispatch = createEventDispatcher()

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

  function getIcon (type: SocialLinkType): UIComponent | undefined {
    switch (type) {
      case 'Discord':
        return Discord
      case 'Email':
        return Email
      case 'Facebook':
        return Facebook
      case 'Github':
        return Github
      case 'Instagram':
        return Instagram
      case 'Linkedin':
        return Linkedin
      case 'Phone':
        return Phone
      case 'Telegram':
        return Telegram
      case 'Twitter':
        return Twitter
      case 'Vk':
        return Vk
      case 'Whatsapp':
        return Whatsapp
      case 'Youtube':
        return Youtube
    }
  }
  const getLabel = (t: SocialLinkType): IntlString => { return t as IntlString }

  const filterUndefined = (links: SocialLink[]): SocialLink[] =>
    links.filter(link => link.link !== undefined && link.link.length > 0)

</script>

<div class="popup">
  <span>Social Links</span>
  <div class="flex-grow scroll">
    <div class="flex-col h-full box">
      {#each getAllSocialLinks(value) as sl}
        <EditBox
          icon={getIcon(sl.type)}
          label={getLabel(sl.type)}
          id={sl.type}
          bind:value={sl.link}
          maxWidth={'13rem'}
        />
      {/each}
    </div>
  </div>
  <div class="buttons">
    <div class="btn"><Button label={recruiting.string.Save} width={'100%'} on:click={() => { dispatch('close', filterUndefined(value)) }}/></div>
  </div>
</div>

<style lang="scss">
  .popup {
    display: flex;
    flex-direction: column;
    padding: 1rem;
    width: 17rem;
    max-width: 17rem;
    height: 22rem;
    color: var(--theme-caption-color);
    background-color: var(--theme-button-bg-hovered);
    border: 1px solid var(--theme-button-border-enabled);
    border-radius: .75rem;
    filter: drop-shadow(0 1.5rem 4rem rgba(0, 0, 0, .35));

    span {
      margin-bottom: 1rem;
      font-weight: 500;
      font-size: 1rem;
      color: var(--theme-caption-color);
    }

    .scroll {
      overflow-y: scroll;
      .box {
        display: grid;
        grid-auto-flow: row;
        row-gap: .75rem;
        margin-right: 1px;
      }
    }
  }
  .buttons {
    display: flex;
    align-items: center;
    margin-top: 1rem;
    .btn { flex-grow: 1; }
  }
</style>
