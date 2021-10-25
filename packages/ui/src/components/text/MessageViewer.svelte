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

  import type { MessageMark, MessageNode, ReferenceMark, LinkMark } from '@anticrm/text'
  import { MessageMarkType, MessageNodeType } from '@anticrm/text'
  import MessageHeading from './MessageHeading.svelte'
  import type { ItemRefefence } from '../../types'

  export let message: MessageNode
  export let refAction: (doc: ItemRefefence) => void = () => {}

  let hrefVal: ItemRefefence = { class: '', id: '' }

  interface Style {
    bold: boolean
    italic: boolean
    strike: boolean
    code: boolean
    orderStart: number

    reference: {
      state: boolean
      _id: string
      _class: string
      resolved: boolean
    }
    link: {
      href: string
      title: string
      resolved: boolean
    }
  }
  function newStyle (): Style {
    return {
      bold: false,
      italic: false,
      strike: false,
      code: false,
      orderStart: 1,
      link: {
        resolved: false,
        href: '',
        title: ''
      },
      reference: {
        state: false,
        resolved: false,
        _id: '',
        _class: ''
      }
    }
  }

  $: style = computedStyle(message, message.marks || [])

  $: hrefVal = { class: style.reference._class, id: style.reference._id }

  function computedStyle (message: MessageNode, marks: MessageMark[]): Style {
    const result = newStyle()

    if (message.type === MessageNodeType.ordered_list) {
      result.orderStart = parseInt(message.attrs?.order ?? '1')
    }

    for (const mark of marks) {
      switch (mark.type) {
        case MessageMarkType.strong:
          result.bold = true
          break
        case MessageMarkType.code:
          result.code = true
          break
        case MessageMarkType.em:
          result.italic = true
          break
        case MessageMarkType.link:
          result.link.href = (mark as LinkMark).attrs.href
          result.link.title = (mark as LinkMark).attrs.title
          result.link.resolved = true
          break
        case MessageMarkType.reference: {
          const rm: ReferenceMark = mark as ReferenceMark
          result.reference.state = true
          result.reference._id = rm.attrs.id || ''
          result.reference._class = rm.attrs.class
          result.reference.resolved = result.reference._id !== ''
          break
        }
      }
    }
    return result
  }

  function messageContent (node?: MessageNode): MessageNode[] {
    return node?.content ?? []
  }
  function getHeadingLevel (message?: MessageNode): number {
    return parseInt(message?.attrs?.level ?? '1')
  }
</script>

{#if message.type === MessageNodeType.paragraph}
  <p>
    {#each messageContent(message) as c}
      <svelte:self message={c} {refAction} />
    {/each}
  </p>
{:else if message.type === MessageNodeType.text}
  <span
    class="text_block"
    class:bold={style.bold}
    class:code={style.code}
    class:italic={style.italic}
    class:resolved_reference={style.reference.resolved}
    class:link-text={style.reference.resolved}
    class:unknown_reference={style.reference.state && !style.reference.resolved}
  >
    {#if style.reference.state}
      <div
        on:click|preventDefault|stopPropagation={() => {
          refAction?.(hrefVal)
        }}
      >
        {message.text || ''}
      </div>
    {:else if style.link.resolved}
      <a class="resolved_link" href={style.link.href}>
        {message.text || ''}
      </a>
    {:else}
      {message.text || ''}
    {/if}
  </span>
{:else if message.type === MessageNodeType.list_item}
  <li>
    {#each messageContent(message) as c}
      <svelte:self message={c} {refAction} />
    {/each}
  </li>
{:else if message.type === MessageNodeType.doc}
  {#each messageContent(message) as c}
    <svelte:self message={c} {refAction} />
  {/each}
  <!---->
{:else if message.type === MessageNodeType.image}
  <img src={message.attrs?.src} alt={message.attrs?.alt} width={'400px'} />
{:else if message.type === MessageNodeType.ordered_list}
  <ol type="1" start={style.orderStart}>
    {#each messageContent(message) as c}
      <svelte:self message={c} {refAction} />
    {/each}
  </ol>
  <!---->
{:else if message.type === MessageNodeType.hard_break}
  <br />
  <!---->
{:else if message.type === MessageNodeType.heading}
  <MessageHeading level={getHeadingLevel(message)}>
    {#each messageContent(message) as c}
      <svelte:self message={c} {refAction} />
    {/each}
  </MessageHeading>
{:else if message.type === MessageNodeType.bullet_list}
  <ul>
    {#each messageContent(message) as c}
      <svelte:self message={c} {refAction} />
    {/each}
  </ul>
  <!---->
{/if}

<style lang="scss">
  .text_block {
    word-wrap: break-word;
    white-space: pre-wrap;
  }

  .bold {
    font-weight: bold;
  }

  .italic {
    font-style: italic;
  }

  .code {
    // border-radius: 5px;
    // -moz-border-radius: 5px;
    // -webkit-border-radius: 5px;
    background-color: #444444;
    // padding: 2px;
  }

  .resolved_link {
    padding: 0px 5px 0px 5px;
  }

  .resolved_reference {
    cursor: pointer;
    background-color: var(--theme-bg-accent-color);
    border-radius: 10px;
    padding: 2px;
    text-decoration-line: underline;
  }

  .unknown_reference {
    color: grey;
  }
</style>
