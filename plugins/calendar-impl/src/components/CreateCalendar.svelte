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
  import type { Doc } from '@anticrm/core'
  import { EditBox, Dialog, ToggleWithLabel, TextArea } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import calendar from '@anticrm/calendar'
  import type { Calendar } from '@anticrm/calendar'

  const client = getClient()

  const space: Omit<Calendar, keyof Doc> = {
    name: '',
    description: '',
    private: false,
    members: [client.accountId()]
  }

  async function createCalendar () {
    await client.createDoc(calendar.class.Calendar, core.space.Model, space)
  }
</script>

<Dialog label={calendar.string.AddCalendar} okLabel={calendar.string.AddCalendar} okAction={createCalendar} on:close>
  <div class="content">
    <EditBox label={calendar.string.Name} bind:value={space.name} />
    <TextArea label={calendar.string.Description} bind:value={space.description} />
    <ToggleWithLabel
      label={calendar.string.MakePrivate}
      description={calendar.string.MakePrivateDescription}
      bind:on={space.private}
    />
  </div>
</Dialog>

<style lang="scss">
  .content {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
</style>
