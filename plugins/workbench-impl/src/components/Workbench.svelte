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
  import type { Ref, Space } from '@anticrm/core'
  import core, { matchDocument } from '@anticrm/core'
  import { PresentationClient, QueryUpdater } from '@anticrm/presentation'
  import type { IntlString } from '@anticrm/status'
  import { Component, TooltipInstance, Popup } from '@anticrm/ui'
  import { newRouter } from '@anticrm/ui'
  import type { Application, NavigatorModel, SpacesNavModel, WorkbenchRoute } from '@anticrm/workbench'
  import workbench from '@anticrm/workbench'
  import { setContext } from 'svelte'
  import ActivityStatus from './ActivityStatus.svelte'
  import Applications from './Applications.svelte'
  import Modal from './Modal.svelte'
  import NavHeader from './NavHeader.svelte'
  import Navigator from './Navigator.svelte'
  import Profile from './Profile.svelte'
  import SpaceHeader from './SpaceHeader.svelte'
  import { buildUserSpace } from './utils/space.utils'
  import type { SpaceNotifications } from '@anticrm/notification'
  import notification from '@anticrm/notification'
  import type { AnyComponent } from '@anticrm/status'
  import AsideDocument from './AsideDocument.svelte'

  export let client: PresentationClient
  let account = client.accountId()
  $: account = client.accountId()

  setContext(workbench.context.Client, client)

  const UndefinedApp = 'undefined' as IntlString
  let currentAppLabel: IntlString = UndefinedApp
  let notifications: Map<Ref<Space>, SpaceNotifications> = new Map<Ref<Space>, SpaceNotifications>()

  let currentSpace: Space | undefined
  let navigatorModel: NavigatorModel | undefined
  let spaceModel: SpacesNavModel | undefined

  let currentRoute: WorkbenchRoute = {}

  let aside: AsideDocument

  function updateApp (app?: Ref<Application>): void {
    if (currentRoute?.app !== undefined && currentRoute?.app !== app) {
      router.navigate({ space: undefined, special: undefined })
    }
    if (app !== currentRoute.app) {
      spaceModel = undefined
    }
  }

  const router = newRouter<WorkbenchRoute>('?app&space&browse&special', (match) => {
    updateApp(match.app)
    currentRoute = match
  })

  $: aside?.handleRoute(currentRoute.browse)

  function updateSpaceModel (space: Space, navigatorModel: NavigatorModel): SpacesNavModel | undefined {
    for (const sm of navigatorModel.spaces ?? []) {
      if (sm.spaceClass === space._class && matchDocument(space, sm.spaceQuery ?? {})) {
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
  let notificationQuery: QueryUpdater<SpaceNotifications> | undefined
  notificationQuery = client.query<SpaceNotifications>(
    notificationQuery,
    notification.class.SpaceNotifications,
    {},
    (result) => {
      notifications.clear()
      result.forEach((p) => {
        notifications.set(p.objectId as Ref<Space>, p)
      })
      notifications = notifications
    }
  )
  $: if (currentRoute.space && navigatorModel) {
    spaceQuery = client.query<Space>(spaceQuery, core.class.Space, { _id: currentRoute.space }, (result) => {
      const target = navigatorModel?.spaces.find((x) => x.userSpace !== undefined)
      currentSpace = currentRoute.space === account.toString() ? buildUserSpace(account, target) : result[0]

      // Find a space model
      if (navigatorModel !== undefined && currentSpace !== undefined) {
        spaceModel = updateSpaceModel(currentSpace, navigatorModel)
      }
    })
  }

  function specialComponent (id: string): AnyComponent | undefined {
    return navigatorModel?.specials?.find((x) => x.id === id)?.component
  }
  let compHTML: HTMLElement | undefined = undefined
</script>

<svg class="mask">
  <clipPath id="notify">
    <path d="M0,0v50h50V0H0z M32,24.5c-3.6,0-6.5-2.9-6.5-6.5s2.9-6.5,6.5-6.5s6.5,2.9,6.5,6.5S35.6,24.5,32,24.5z" />
  </clipPath>
</svg>
<div class="container">
  <div class="applications">
    <ActivityStatus status="active" />
    <Applications {notifications} active={currentRoute.app} />
    <div class="profile">
      <Profile on:logout />
    </div>
  </div>
  {#if navigator}
    <div class="navigator">
      <NavHeader title={navigatorModel?.navTitle ?? currentAppLabel ?? UndefinedApp} />
      <Navigator
        model={navigatorModel}
        special={currentRoute.special}
        {notifications}
        on:special={(detail) => {
          currentRoute.special = detail.detail
          router.navigate({ space: undefined, special: currentRoute.special })
        }}
      />
    </div>
  {/if}
  <div bind:this={compHTML} class="component">
    {#if navigatorModel && currentRoute.special === undefined}
      {#if spaceModel}
        <SpaceHeader space={currentSpace} {spaceModel} />
      {/if}
      {#if currentRoute.space}
        <Component
          is={navigatorModel.spaceView}
          props={{ currentSpace: currentRoute.space, notifications: notifications.get(currentRoute.space) }}
        />
      {/if}
    {:else if navigatorModel && navigatorModel.specials && currentRoute.special}
      <Component is={specialComponent(currentRoute.special)} />
    {/if}
  </div>
  <AsideDocument bind:this={aside} bind:compHTML bind:currentRoute bind:notifications />
</div>
<Modal />
<Popup />
<TooltipInstance />

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
      max-width: 280px;
      min-width: 200px;
      margin-right: 20px;
    }

    .component {
      @include panel(var(--theme-bg-color));
      min-width: 550px;
      flex-grow: 1;
      margin-right: 20px;
    }
  }
</style>
