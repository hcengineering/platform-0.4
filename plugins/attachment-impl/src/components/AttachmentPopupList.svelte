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
  import attachment, { UploadAttachment } from '@anticrm/attachment'
  import { Label } from '@anticrm/ui'
  import AttachmentList from './AttachmentList.svelte'

  export let items: Array<UploadAttachment> = []
</script>

<div class="container">
  <div class="bg" />
  <div class="header">
    <Label label={attachment.string.Attachments} />
    ({items.length})
  </div>
  <AttachmentList {items} />
</div>

<style lang="scss">
  .container {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 320px;
    min-width: 320px;
    max-width: 320px;
    border-radius: 20px;
    padding: 24px;

    .header {
      color: var(--theme-caption-color);
      font-weight: 500;
    }

    .bg {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      background-color: var(--theme-card-bg);
      border-radius: 20px;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      box-shadow: var(--theme-card-shadow);
      z-index: -1;
    }
  }
</style>
