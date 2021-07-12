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
  import { EditBox, TextArea, Dialog, ToggleWithLabel } from '@anticrm/ui'

  import { getClient } from '@anticrm/workbench'

  import chunter from '../plugin'
  import core from '@anticrm/core'

  const dispatch = createEventDispatcher()

  let name: string = ''
  let description: string = ''

  const client = getClient()

  function createChannel () {
    client.createDoc(chunter.class.Channel, core.space.Model, {
      name,
      description,
      private: false,
      members: []
    })
  }
</script>

<Dialog
  label={chunter.string.CreateChannel}
  okLabel={chunter.string.CreateChannel}
  okAction={createChannel}
  on:close={() => {
    dispatch('close')
  }}
>
  <div class="content">
    <div class="row"><EditBox label={chunter.string.ChannelName} bind:value={name} /></div>
    <div class="row"><TextArea label={chunter.string.ChannelDescription} bind:value={description} /></div>
    <div class="row">
      <ToggleWithLabel label={chunter.string.MakePrivate} description={chunter.string.MakePrivateDescription} />
    </div>
  </div>
</Dialog>

<style lang="scss">
  .content {
    display: grid;
    overflow-y: auto;
    height: 100%;
    grid-template-columns: 1fr 1fr;
    row-gap: 20px;

    .row {
      grid-column-start: 1;
      grid-column-end: 3;
    }
  }
</style>
