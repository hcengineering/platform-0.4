<script lang="ts">
import { MessageNode } from '@anticrm/text'
import MessageEditor from '../MessageEditor.svelte'

export let content: MessageNode
export let hoverMessage: string = ''

let htmlEditor: MessageEditor

export function emitStyleEvent () {
  htmlEditor.emitStyleEvent()
}
</script>

<MessageEditor content="{content}" bind:this="{htmlEditor}">
  <div slot="hoverMessage" let:empty>
    {#if empty}
      {hoverMessage}
    {/if}
  </div>
</MessageEditor>
