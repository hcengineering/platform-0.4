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
  import {
    EditBox,
    Dialog,
    TextArea,
    ToggleWithLabel,
    Section,
    IconFile,
    IconComments,
    UserBox,
    Grid
  } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'

  import task from '../plugin'
  import core from '@anticrm/core'
  import type { Account, Ref } from '@anticrm/core'

  let name: string = ''
  let description: string = ''
  let isPrivate: boolean = false
  let members: Ref<Account>[] = []
  let users: Account[] = []
  let newMember: Ref<Account> | undefined
  $: if (newMember !== undefined) {
    members.push(newMember)
    members = members
    newMember = undefined
  }

  const client = getClient()

  function createProject () {
    client.createDoc(task.class.Project, core.space.Model, {
      name,
      description,
      private: isPrivate,
      members: members
    })
  }

  function filterMembers (): void {
    members = members.filter((m) => m !== undefined)
  }

  function getAvaibleMembers (members: Ref<Account>[], member?: Ref<Account>): Account[] {
    return member === undefined
      ? users.filter((p) => !members.includes(p._id))
      : users.filter((p) => !members.includes(p._id) || member === p._id)
  }

  async function getUsers (): Promise<void> {
    users = await client.findAll(core.class.Account, {})
  }
</script>

<Dialog label={task.string.CreateProject} okLabel={task.string.CreateProject} okAction={createProject} on:close>
  <Section label={task.string.GeneralInformation} icon={IconFile}>
    <Grid column={1}>
      <EditBox label={task.string.ProjectName} bind:value={name} />
      <TextArea label={task.string.ProjectDescription} bind:value={description} />
      <ToggleWithLabel
        label={task.string.MakePrivate}
        description={task.string.MakePrivateDescription}
        bind:on={isPrivate}
      />
    </Grid>
  </Section>
  <Section label={task.string.ProjectMembers} icon={IconComments}>
    {#await getUsers() then users}
      <Grid column={1}>
        {#each members as member}
          <UserBox
            bind:selected={member}
            users={getAvaibleMembers(members, member)}
            title={task.string.IviteMember}
            label={task.string.IviteMember}
            showSearch
            on:change={() => {
              filterMembers()
            }}
          />
        {/each}
        {#if getAvaibleMembers(members).length}
          <UserBox
            bind:selected={newMember}
            users={getAvaibleMembers(members)}
            title={task.string.IviteMember}
            label={task.string.IviteMember}
            showSearch
          />
        {/if}
      </Grid>
    {/await}
  </Section>
</Dialog>
