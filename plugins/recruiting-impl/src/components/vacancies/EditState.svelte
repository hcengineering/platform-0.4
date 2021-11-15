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
  import { deepEqual } from 'fast-equals'
  import cloneDeep from 'lodash.clonedeep'
  import activity from '@anticrm/activity'
  import fsm from '@anticrm/fsm'
  import type { State } from '@anticrm/fsm'
  import type { Ref } from '@anticrm/core'
  import { getPlugin } from '@anticrm/platform'
  import type { QueryUpdater } from '@anticrm/presentation'
  import recruiting, { Applicant } from '@anticrm/recruiting'
  import ui, { Component, Dropdown, DropdownItem, EditBox, Grid, Panel, Button, Dialog } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import { createEventDispatcher } from 'svelte'
  import Color from './internal/Color.svelte'

  export let id: Ref<State>
  export let colors: string[]

  const dispatch = createEventDispatcher()

  const client = getClient()

  let prevState: State | undefined
  let state: State | undefined
  let stateQ: QueryUpdater<State> | undefined
  $: stateQ = client.query(stateQ, fsm.class.State, { _id: id }, (res) => {
    state = res[0]
    prevState = cloneDeep(state)
  })

  let isDeleteDisabled = true
  let applicantQ: QueryUpdater<Applicant> | undefined
  $: applicantQ = client.query(
    applicantQ,
    recruiting.class.Applicant,
    { state: id },
    (res) => {
      isDeleteDisabled = res.length > 0
    },
    { limit: 1 }
  )

  async function onUpdate () {
    if (state === undefined || prevState === undefined) {
      return
    }

    const b: any = state
    const a: any = prevState

    const keys = Object.keys(state)
    const update = keys.reduce((res, key) => (deepEqual(a[key], b[key]) ? res : { ...res, [key]: b[key] }), {})

    if (Object.getOwnPropertyNames(update).length === 0) {
      return
    }

    await client.updateDoc(fsm.class.State, a.space, a._id, update)
  }

  async function onRemove () {
    if (isDeleteDisabled || state === undefined) {
      return
    }

    const fsmP = await getPlugin(fsm.id)
    await fsmP.removeState(state)

    dispatch('close')
  }

  let colorItems: DropdownItem[] = []
  $: colorItems = colors.map((color) => ({
    id: color,
    props: {
      color
    }
  }))
</script>

{#if state !== undefined}
  <Dialog on:close withCancel={false} withOk={false}>
    <svelte:fragment slot="header">
      {state.name}
    </svelte:fragment>
    <Grid column={1}>
      <EditBox label={recruiting.string.Name} bind:value={state.name} focus on:blur={onUpdate} />
      <Dropdown
        label={recruiting.string.Color}
        component={Color}
        items={colorItems}
        bind:selected={state.color}
        on:change={onUpdate}
      />
      <Button label={ui.string.Remove} on:click={onRemove} disabled={isDeleteDisabled} />
    </Grid>
  </Dialog>
{/if}
