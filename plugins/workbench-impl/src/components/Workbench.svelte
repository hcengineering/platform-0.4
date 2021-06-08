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
  import ActivityStatus from './ActivityStatus.svelte'
  import Applications from './Applications.svelte'
  import NavHeader from './NavHeader.svelte'
  import AppHeader from './AppHeader.svelte'
  import AsideHeader from './AsideHeader.svelte'
  import avatar from '../../img/avatar.png'

  import Message from './Message.svelte'
  import Send from './icons/Send.svelte'
  import Attach from './icons/Attach.svelte'
  import Emoji from './icons/Emoji.svelte'
  import GIF from './icons/GIF.svelte'
  import TextStyle from './icons/TextStyle.svelte'

  import { setContext } from 'svelte'
  import type { Client } from '@anticrm/plugin-core'
  import type { AnyComponent } from '@anticrm/ui'
  import { Component, Button } from '@anticrm/ui'

  import type { NavigatorModel } from '@anticrm/workbench'
  import workbench from '@anticrm/workbench'

  import Navigator from './Navigator.svelte'

  export let client: Client

  setContext(workbench.context.Client, client)

  let navigatorModel: NavigatorModel

  function onAppChange(event: any) {
    navigatorModel = event.detail.navigatorModel
    console.log('navigatorModel:', navigatorModel)
  }

  let kl: boolean = false
</script>

<svg class="mask">
  <clipPath id="notify">
    <path d="M0,0v48h48V0H0z M32,25c-3.9,0-7-3.1-7-7s3.1-7,7-7s7,3.1,7,7S35.9,25,32,25z"/>
  </clipPath>
</svg>
<div class="container">
  <div class="applications">
    <ActivityStatus status="active"/>
    <Applications on:app-change={onAppChange}/>
    <div class="profile">
      <img class="avatar" src={avatar} alt="Profile"/>
    </div>
  </div>
  {#if navigator}
  <div class="navigator">
    <NavHeader/>
    <Navigator model={navigatorModel}/>
  </div>
  {/if}
  <div class="component">
    <AppHeader title="boring project"/>
    <div class="messageBoard">
      <Message name="Rosamund Chen" time="3:20 PM" message="The Dark Lord has Nine. But we have One, mightier than they: the White Rider. Hero  has passed through the fire and the abyss, and they shall fear him. mightier than they: the White Rider. Hero  has passed through the fire and the abyss, and they shall fear him. I believe the QR “Typography and spacing” is showing the subtle differences in line height that need to be specified when the weight of fonts. Hero  has passed through the fire and the abyss, and they shall fear him. mightier than they. "/>
      <Message name="Rosamund Chen" time="3:20 PM" message="The Dark Lord has Nine. But we have One, mightier than they: the White Rider. I believe the QR “Typography and spacing” is showing the subtle differences in line height that need to be specified when the weight of fonts."/>
      <Message name="Rosamund Chen" time="3:20 PM" message="The Dark Lord has Nine. But we have One!"/>
      <Message name="Rosamund Chen" time="3:20 PM" message="The Dark Lord has Nine. But we have One, mightier than they: the White Rider. Hero  has passed through the fire and the abyss, and they shall fear him. mightier than they: the White Rider. Hero  has passed through the fire and the abyss, and they shall fear him. I believe the QR “Typography and spacing” is showing the subtle differences in line height that need to be specified when the weight of fonts. Hero  has passed through the fire and the abyss, and they shall fear him. mightier than they. "/>
      <Message name="Rosamund Chen" time="3:20 PM" message="The Dark Lord has Nine. But we have One, mightier than they: the White Rider. I believe the QR “Typography and spacing” is showing the subtle differences in line height that need to be specified when the weight of fonts."/>
      <Message name="Rosamund Chen" time="3:20 PM" message="The Dark Lord has Nine. But we have One!"/>
    </div>
    <div class="messageInput">
      <div class="textInput">
        <input class="inputMsg" type="text" placeholder="Type a new message"/>
        <button class="sendButton"><div class="icon"><Send/></div></button>
      </div>
      <div class="buttons">
        <div class="tool"><Attach/></div>
        <div class="tool"><TextStyle/></div>
        <div class="tool"><Emoji/></div>
        <div class="tool"><GIF/></div>
      </div>
    </div>
  </div>
  <div class="aside">
    <AsideHeader title="Applications"/>
  </div>
</div>

<style lang="scss">
  @mixin panel($bg-color) {
    display: flex;
    flex-direction: column;
    height: 100%;
    border-radius: 20px;
    background-color: $bg-color;
  }
  .mask {
    position: absolute;
    width: 0;
    height: 0;
  }

  .container {
    display: flex;
    flex-direction: row;
    height: 100%;
    padding-bottom: 20px;

    .applications {
      @include panel('transparent');
      justify-content: space-between;
      align-items: center;
      min-width: 96px;

      .profile {
        display: flex;
        align-items: center;
        height: 100px;
        min-height: 100px;
        .avatar {
          width: 36px;
          height: 36px;
        }
      }
    }

    .navigator {
      @include panel(var(--theme-bg-color));
      width: 280px;
      min-width: 280px;
      margin-right: 20px;
    }

    .component {
      @include panel(var(--theme-bg-color));
      flex-grow: 1;
      margin-right: 20px;

      .messageBoard {
        margin: 15px 15px 0px;
        padding: 25px 25px 0px;
        overflow: auto;
      }
      .messageInput {
        display: flex;
        flex-direction: column;
        margin: 20px 40px;
        .textInput {
          display: flex;
          justify-content: space-between;
          align-items: center;
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
    }

    .aside {
      @include panel(var(--theme-bg-color));
      min-width: 400px;
      margin-right: 20px;
    }
  }
</style>