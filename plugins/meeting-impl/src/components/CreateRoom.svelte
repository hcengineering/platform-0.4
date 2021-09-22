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
  import core from '@anticrm/core'
  import type { Data } from '@anticrm/core'
  import { getClient } from '@anticrm/workbench'
  import { EditBox, Dialog, Grid, TextArea, ToggleWithLabel } from '@anticrm/ui'
  import meeting from '@anticrm/meeting'
  import { RoomSpace } from '@anticrm/meeting'

  const client = getClient()
  const room: Data<RoomSpace> = {
    name: '',
    description: '',
    members: [client.accountId()],
    private: false
  }

  async function createRoom () {
    await client.createDoc(meeting.class.RoomSpace, core.space.Model, room)
  }
</script>

<Dialog label={meeting.string.CreateRoom} okLabel={meeting.string.CreateRoom} okAction={createRoom} on:close>
  <Grid column={1}>
    <EditBox label={meeting.string.Name} bind:value={room.name} />
    <TextArea label={meeting.string.Description} bind:value={room.description} />
    <ToggleWithLabel label={meeting.string.MakeRoomPrivate} bind:on={room.private} />
  </Grid>
</Dialog>
