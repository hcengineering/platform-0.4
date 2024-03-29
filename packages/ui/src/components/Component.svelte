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
  import { createEventDispatcher } from 'svelte'
  import { getResource } from '@anticrm/platform'
  import type { AnyComponent, UIComponent } from '@anticrm/status'

  // import Icon from './Icon.svelte'
  import Spinner from './Spinner.svelte'
  import ErrorBoundary from './internal/ErrorBoundary'

  export let is: AnyComponent | UIComponent
  export let props: any = {}
  export let scrollable: boolean = false
  export let maxHeight: number = 0

  let componentInstance: any

  function asComponent (comp: AnyComponent | string): AnyComponent {
    return comp as AnyComponent
  }

  $: component = typeof is === 'string' ? getResource(asComponent(is)) : is

  $: {
    if (componentInstance) {
      dispatch('bindThis', componentInstance)
    }
  }

  const dispatch = createEventDispatcher()
</script>

{#await component}
  <div class="spinner-container"><div class="inner"><Spinner /></div></div>
{:then Ctor}
  <ErrorBoundary>
    <svelte:component
      this={Ctor}
      bind:this={componentInstance}
      {...props}
      {scrollable}
      {maxHeight}
      on:change
      on:open
      on:message
      on:close={(ev) => {
        dispatch('close', ev.detail)
      }}
    />
  </ErrorBoundary>
{:catch err}
  ERROR: {console.log(err, JSON.stringify(component))}
  {props}
  {err}
  <!-- <Icon icon={ui.icon.Error} size="32" /> -->
{/await}

<style lang="scss">
  .spinner-container {
    display: flex;
    height: 100%;
  }

  @keyframes makeVisible {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .spinner-container .inner {
    margin: auto;
    opacity: 0;
    animation-name: makeVisible;
    animation-duration: 0.25s;
    animation-delay: 0.1s;
  }
</style>
