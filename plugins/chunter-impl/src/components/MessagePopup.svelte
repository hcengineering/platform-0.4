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
  import type { MessageBookmark, WithMessage } from '@anticrm/chunter'
  import chunter from '@anticrm/chunter'
  import { IconEdit, PopupItem, PopupWrap } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import { createEventDispatcher } from 'svelte'
  import { newAllBookmarksQuery } from '../bookmarks'

  export let message: WithMessage
  export let maxHeight: number | undefined = undefined

  const client = getClient()
  const dispatch = createEventDispatcher()
  let bookmark: MessageBookmark | undefined

  newAllBookmarksQuery(client, (result) => {
    bookmark = result.find((p) => p.message === message._id && p?.channelPin === true)
  })

  const pinChannel = () => {
    if (message === undefined) {
      return
    }
    if (bookmark !== undefined) {
      if (bookmark.modifiedBy === client.accountId()) {
        client.removeDoc(bookmark._class, bookmark.space, bookmark._id)
      }
    } else {
      client.createDoc(chunter.class.Bookmark, message.space, {
        message: message._id,
        channelPin: true
      })
    }
    dispatch('close')
  }
</script>

<PopupWrap {maxHeight}>
  <PopupItem title={chunter.string.CopyLink} action={() => {}} />
  {#if bookmark === undefined || bookmark.modifiedBy === client.accountId()}
    <PopupItem
      title={bookmark === undefined ? chunter.string.ChannelPin : chunter.string.ChannelUnPin}
      action={pinChannel}
    />
  {/if}
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
