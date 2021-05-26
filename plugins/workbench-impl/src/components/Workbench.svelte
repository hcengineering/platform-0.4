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
  import Status from './icons/Status.svelte'
  import MoreH from './icons/MoreH.svelte'
  import Search from './icons/Search.svelte'
  import Add from './icons/Add.svelte'
  import AppItem from './AppItem.svelte'
  import Applications from './Applications.svelte'
  import NavHeader from './NavHeader.svelte'
  import NavItem from './NavItem.svelte'
  import NavSubitem from './NavSubitem.svelte'
  import AppHeader from './AppHeader.svelte'
  import AsideHeader from './AsideHeader.svelte'
  import avatar from '../../img/avatar.png'

  let wide: boolean = false
</script>

<div class="container">
  <div class="applications" class:wide={wide}>
    <div class="statusButton">
      <AppItem {wide} on:click={() => { wide = !wide }}>
        <svelte:component this={Status} size="32" slot="icon"/>
        <svelte:fragment slot="caption">
          <div class="title-group">
            Voltron
            <div class="icon">
              <svelte:component this={MoreH} size="16"/>
            </div>
          </div>
        </svelte:fragment>
      </AppItem>
    </div>
    <div class="app-group">
      <Applications active="home" {wide}/>
    </div>
    <div class="footer">
      <div class="profile">
        <AppItem {wide} status="active" selected>
          <img slot="icon" class="avatar" src={avatar} alt="Profile"/>
          <svelte:fragment slot="caption">Tim Ferris</svelte:fragment>
        </AppItem>
      </div>
      <div class="tool">
        <AppItem {wide}>
          <svelte:component this={Add} size="32" slot="icon"/>
          <svelte:fragment slot="caption">Create</svelte:fragment>
        </AppItem>
      </div>
      <div class="tool">
        <AppItem {wide}>
          <svelte:component this={Search} size="32" slot="icon"/>
          <svelte:fragment slot="caption">Search</svelte:fragment>
        </AppItem>
      </div>
      <div class="separator"/>
    </div>
  </div>

  <div class="navigator">
    <NavHeader/>
    <NavItem icon="thread" title="Threads"/>
    <NavItem icon="mention" title="Mentions" counter="8"/>
    <div class="separator"></div>
    <NavItem icon="arrow" group title="Starred">
      <NavSubitem title="project / channel"/>
      <NavSubitem locked title="project / channel"/>
      <NavSubitem type="user" img="tim" title="person" counter="2"/>
    </NavItem>
    <NavItem icon="arrow" group title="Channels" state="expanded">
      <NavSubitem title="random"/>
      <NavSubitem title="general"/>
      <NavSubitem title="achievements"/>
      <NavSubitem title="boring project"/>
      <NavSubitem title="fun project" locked/>
      <NavSubitem title="secret project" locked/>
    </NavItem>
    <NavItem icon="arrow" group title="Messages">
      <NavSubitem type="user" img="tim" title="Tim Ferris" counter="8"/>
      <NavSubitem type="user" img="chen" title="Rosamund Chen"/>
      <NavSubitem type="user" img="elon" title="Elon Musk"/>
    </NavItem>
  </div>
  <div class="component">
    <AppHeader title="boring project" subtitle="27 members"/>
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

  @mixin divider($margin) {
    height: 1px;
    min-height: 1px;
    margin: $margin;
    background-color: var(--theme-menu-divider);
  }

  .container {
    display: flex;
    flex-direction: row;
    height: 100%;
    padding-bottom: 20px;

    .applications {
      @include panel('transparent');
      justify-content: space-between;
      padding-left: 16px;
      width: 80px;
      min-width: 80px;
      transition: all .3s ease;

      .statusButton {
        margin-top: 24px;
        margin-bottom: 8px;
        .title-group {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-right: 12px;
          font-size: 16px;
          color: var(--theme-caption-color);
          .icon {
            width: 16px;
            height: 16px;
            opacity: 0;
          }
        }
        &:hover .title-group .icon {
          opacity: .4;
          &:hover {
            opacity: .8;
          }
        }
      }
      .app-group {
        margin-right: 4px;
        flex-grow: 1;
        overflow: hidden;
      }
      .footer {
        display: flex;
        flex-direction: column-reverse;
        .profile {
          margin-top: 10px;
          margin-bottom: 24px;
          .avatar {
            width: 36px;
            height: 36px;
          }
        }
        .tool {
          height: 48px;
        }
        .tool + .tool {
          margin-bottom: 4px;
        }
        .separator {
          @include divider(8px 16px 8px 0px);
        }
      }
    }
    .wide {
      width: 280px;
      min-width: 280px;
      .app-group {
        overflow: auto;
      }
    }

    .navigator {
      @include panel(var(--theme-bg-color));
      width: 280px;
      min-width: 280px;
      margin-right: 20px;

      .separator {
        @include divider(24px 0);
      }
    }

    .component {
      @include panel(var(--theme-bg-color));
      flex-grow: 1;
      margin-right: 20px;
    }

    .aside {
      @include panel(var(--theme-bg-color));
      min-width: 400px;
      margin-right: 20px;
    }
  }
</style>