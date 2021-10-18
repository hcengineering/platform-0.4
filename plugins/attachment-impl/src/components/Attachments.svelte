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
  import type { Class, Doc, Ref, Space } from '@anticrm/core'
  import type { QueryUpdater } from '@anticrm/presentation'
  import { IconAdd, Label, showPopup } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import attachment from '@anticrm/attachment'
  import type { Attachment } from '@anticrm/attachment'
  import AddAttachment from './AddAttachment.svelte'
  import AttachmentView from './Attachment.svelte'
  import AttachmentViewer from './AttachmentViewer.svelte'

  export let objectId: Ref<Doc>
  export let space: Ref<Space>
  export let objectClass: Ref<Class<Doc>>
  export let editable: boolean = false
  const client = getClient()
  let items: Array<Attachment> = []

  let lq: QueryUpdater<Attachment> | undefined
  $: lq = client.query(lq, attachment.class.Attachment, { objectId: objectId }, (result) => {
    items = result
  })

  function upload () {
    showPopup(AddAttachment, { objectId: objectId, objectClass: objectClass, space: space })
  }

  function open (item: Attachment): void {
    showPopup(AttachmentViewer, { item: item })
  }
</script>

<div class="list">
  {#each items as item (item._id)}
    <div class="list-item">
      <AttachmentView
        {item}
        on:click={() => {
          open(item)
        }}
      />
    </div>
  {/each}
  {#if editable}
    <div class="add-item" on:click={upload}>
      <div class="icon"><div><IconAdd /></div></div>
      <div class="label"><Label label={attachment.string.AddAttachment} /></div>
    </div>
  {/if}
</div>

<style lang="scss">
  .list {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    max-width: 100%;
    margin: 0 16px;

    .list-item + .list-item {
      margin-top: 10px;
      margin-bottom: 10px;
    }

    .add-item {
      display: flex;
      align-items: center;
      cursor: pointer;

      .icon {
        opacity: 0.6;
        width: 32px;
        height: 32px;
        border-radius: 25%;
        background-color: var(--theme-button-bg-enabled);
        border-color: var(--theme-button-border);
        display: flex;

        div {
          margin: auto;
        }
      }
      .label {
        margin-left: 16px;
        color: var(--theme-content-color);
      }

      &:hover {
        .icon {
          opacity: 1;
        }
        .label {
          color: var(--theme-caption-color);
        }
      }
    }
  }
</style>
