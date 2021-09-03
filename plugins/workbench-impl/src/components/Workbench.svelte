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
  import type { Space } from '@anticrm/core'
  import core, { matchDocument } from '@anticrm/core'
  import { PresentationClient, QueryUpdater } from '@anticrm/presentation'
  import type { IntlString } from '@anticrm/status'
  import { Component, Splitter } from '@anticrm/ui'
  import { newRouter } from '@anticrm/ui'
  import type { NavigatorModel, SpacesNavModel, WorkbenchRoute } from '@anticrm/workbench'
  import workbench from '@anticrm/workbench'
  import { setContext } from 'svelte'
  import ActivityStatus from './ActivityStatus.svelte'
  import Applications from './Applications.svelte'
  import Modal from './Modal.svelte'
  import NavHeader from './NavHeader.svelte'
  import Navigator from './Navigator.svelte'
  import Profile from './Profile.svelte'
  import SpaceHeader from './SpaceHeader.svelte'

  export let client: PresentationClient

  setContext(workbench.context.Client, client)

  const UndefinedApp = 'undefined' as IntlString
  let currentAppLabel: IntlString = UndefinedApp

  let currentSpace: Space | undefined
  let navigatorModel: NavigatorModel | undefined
  let spaceModel: SpacesNavModel | undefined

  let currentSpecial: number = -1

  let currentRoute: WorkbenchRoute = {}

  const router = newRouter<WorkbenchRoute>(
    '?app&space&itemId',
    (match) => {
      if (currentRoute?.app !== undefined && currentRoute?.app !== match.app) {
        // Remove itemId if app is switched
        match.itemId = undefined
        match.space = undefined
        router.navigate({ itemId: undefined, space: undefined })
      }
      currentRoute = match
      currentSpecial = -1
    },
    {}
  )

  function updateSpaceModel (space: Space, navigatorModel: NavigatorModel): SpacesNavModel | undefined {
    for (const sm of navigatorModel.spaces ?? []) {
      if (sm.spaceClass === space._class && matchDocument(space, sm.spaceQuery ?? {})) {
        // TODO: Add inheritance check.
        // We have space model matched, check query
        return sm
      }
    }
  }
  $: client.findAll(workbench.class.Application, { _id: currentRoute.app }).then((results) => {
    const result = results.shift()

    currentAppLabel = result?.label ?? UndefinedApp
    navigatorModel = result?.navigatorModel

    if (result !== undefined && currentRoute.app === undefined) {
      router.navigate({ app: result._id })
    }
  })

  let spaceQuery: QueryUpdater<Space> | undefined
  $: if (currentRoute.space && navigatorModel) {
    spaceQuery = client.query<Space>(spaceQuery, core.class.Space, { _id: currentRoute.space }, (result) => {
      currentSpace = result[0]

      // Find a space model
      if (navigatorModel !== undefined) {
        spaceModel = updateSpaceModel(result[0], navigatorModel)
      }
    })
  }

  let compHTML: HTMLElement
  let asideHTML: HTMLElement
  $: {
    if (asideHTML) {
      if (compHTML) compHTML.style.marginRight = '0'
    } else {
      if (compHTML) compHTML.style.marginRight = '20px'
    }
  }
</script>

<svg class="mask">
  <clipPath id="notify">
    <path d="M0,0v50h50V0H0z M32,24.5c-3.6,0-6.5-2.9-6.5-6.5s2.9-6.5,6.5-6.5s6.5,2.9,6.5,6.5S35.6,24.5,32,24.5z" />
  </clipPath>
</svg>
<div class="container">
  <div class="applications">
    <ActivityStatus status="active" />
    <Applications active={currentRoute.app} />
    <div class="profile">
      <Profile on:logout />
    </div>
  </div>
  {#if navigator}
    <div class="navigator">
      <NavHeader title={navigatorModel?.navTitle ?? currentAppLabel ?? UndefinedApp} />
      <Navigator model={navigatorModel} bind:special={currentSpecial} />
    </div>
  {/if}
  <div bind:this={compHTML} class="component">
    {#if navigatorModel && currentSpecial === -1}
      {#if spaceModel}
        <SpaceHeader model={navigatorModel} space={currentSpace} {spaceModel} />
      {/if}
      <Component is={navigatorModel.spaceView} props={{ currentSpace: currentRoute.space }} />
    {:else if navigatorModel && navigatorModel.specials && currentSpecial !== -1}
      <Component is={navigatorModel.specials[currentSpecial].component} />
    {/if}
  </div>
  {#if navigatorModel && navigatorModel.editComponent && currentRoute.itemId}
    <Splitter prevDiv={compHTML} nextDiv={asideHTML} />
    <div bind:this={asideHTML} class="aside">
      <Component is={navigatorModel.editComponent} props={{ id: currentRoute.itemId }} />
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
      min-width: 400px;
      flex-grow: 1;
      margin-right: 20px;
    }

    .aside {
      @include panel(var(--theme-bg-color));
      min-width: 400px;
      margin-right: 20px;
      padding: 20px;
    }
  }
</style>
