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
  import chunter from '@anticrm/chunter'
  import type { WithMessage } from '@anticrm/chunter'
  import { getClient } from '@anticrm/workbench'
  import { IconEdit, PopupWrap, PopupItem } from '@anticrm/ui'

  export let message: WithMessage
  export let maxHeight: number | undefined = undefined

  const client = getClient()
  const dispatch = createEventDispatcher()
</script>

<PopupWrap {maxHeight}>
  <PopupItem title={chunter.string.CopyLink} action={() => {}} />
  {#if message.modifiedBy === client.accountId()}
    <PopupItem
      component={IconEdit}
      title={chunter.string.EditMessage}
      action={() => {
        dispatch('close', 'edit')
      }}
    />
    <PopupItem title={chunter.string.DeleteMessage} action={() => {}} />
  {/if}
</PopupWrap>
