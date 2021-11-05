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
  import { SocialLink, SocialLinkType } from '@anticrm/recruiting'
  import { UIComponent } from '@anticrm/status'
  import { showPopup } from '@anticrm/ui'
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
  import SocialLinkPopup from './SocialLinkPopup.svelte'

  export let socialLink: SocialLink
  export let editable: boolean = false
  const dispatch = createEventDispatcher()

  $: icon = getIcon(socialLink.type)
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

  function edit (ev: MouseEvent) {
    showPopup(SocialLinkPopup, { value: socialLink.link, editable: editable }, ev.target as HTMLElement, (result) => {
      socialLink.link = result !== undefined ? result : socialLink.link
      dispatch('update')
    })
  }
</script>

<div class="icon" class:empty={socialLink.link.length === 0} on:click|stopPropagation={edit}>
  {#if icon}
    <div><svelte:component this={icon} size={10} /></div>
  {/if}
</div>

<style lang="scss">
  .icon {
    display: flex;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border-color: var(--theme-border-modal);
    border: solid thin;

    div {
      margin: auto;
    }

    &.empty {
      opacity: 0.6;
    }

    &:hover {
      opacity: 1;
    }
  }
</style>
