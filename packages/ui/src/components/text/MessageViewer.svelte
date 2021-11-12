<script lang="ts">
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

  import type { MessageNode } from '@anticrm/text'
  import type { Doc } from '@anticrm/core'

  import MessageViewerNode from './MessageViewerNode.svelte'

  export let message: MessageNode
  export let refAction: (doc: Pick<Doc, '_id' | '_class'>) => void = () => {}
</script>

<div class="message-viewer">
  <MessageViewerNode {message} {refAction} />
</div>

<style lang="scss">
  .message-viewer {
    min-width: 100px;
    overflow: auto;
    height: 100%;
    width: 100%;
    cursor: text;
    position: relative;

    :global {
      div {
        outline: none;
      }
      p:first-child {
        margin-top: 0px;
      }
      p:last-child {
        margin-bottom: 0px;
      }
    }
  }
</style>
