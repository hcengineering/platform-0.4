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
  import type { Doc, Ref, Space } from '@anticrm/core'
  import { PresentationClient } from '@anticrm/presentation'
  import { location } from '@anticrm/ui'
  import { Component } from '@anticrm/ui'
  import type { Application, NavigatorModel } from '@anticrm/workbench'
  import workbench from '@anticrm/workbench'
  import { onDestroy, setContext } from 'svelte'
  import avatar from '../../img/avatar.png'
  import ActivityStatus from './ActivityStatus.svelte'
  import Applications from './Applications.svelte'
  import Modal from './Modal.svelte'
  import NavHeader from './NavHeader.svelte'
  import Navigator from './Navigator.svelte'
  import SpaceHeader from './SpaceHeader.svelte'

  export let client: PresentationClient

  setContext(workbench.context.Client, client)

  let currentApp: Ref<Application> | undefined
  let currentSpace: Ref<Space> | undefined
  let navigatorModel: NavigatorModel | undefined
  let itemId: Ref<Doc> | undefined

  onDestroy(
    location.subscribe(async (loc) => {
      currentApp = loc.path[1] as Ref<Application>
      currentSpace = loc.path[2] as Ref<Space>
      itemId = loc.path[3] as Ref<Doc>
      navigatorModel = (await client.findAll(workbench.class.Application, { _id: currentApp })).pop()?.navigatorModel
    })
  )
</script>

<svg class="mask">
  <clipPath id="notify">
    <path d="M0,0v48h48V0H0z M32,25c-3.9,0-7-3.1-7-7s3.1-7,7-7s7,3.1,7,7S35.9,25,32,25z" />
  </clipPath>
</svg>
<div class="container">
  <div class="applications">
    <ActivityStatus status="active" />
    <Applications active={currentApp} />
    <div class="profile">
      <img class="avatar" src={avatar} alt="Profile" />
    </div>
  </div>
  {#if navigator}
    <div class="navigator">
      <NavHeader />
      <Navigator model={navigatorModel} />
    </div>
  {/if}
  <div class="component">
    <SpaceHeader model={navigatorModel} space={currentSpace} />
    {#if navigatorModel}
      <Component is={navigatorModel.spaceView} props={{ currentSpace: currentSpace }} />
    {/if}
  </div>
  {#if navigatorModel && navigatorModel.editComponent && itemId}
    <div class="aside">
      <Component is={navigatorModel.editComponent} props={{ id: itemId }} />
    </div>
  {/if}
</div>
<Modal />

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
    }

    .aside {
      @include panel(var(--theme-bg-color));
      min-width: 400px;
      max-width: 400px;
      margin-right: 20px;
      padding: 20px;
    }
  }
</style>
