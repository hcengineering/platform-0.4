<script lang="ts">
import type { MessageNode } from '@anticrm/text'
import { deepEqual } from 'fast-equals'
import { history } from 'prosemirror-history'
import { keymap } from 'prosemirror-keymap'
import { MarkType } from 'prosemirror-model'
import { EditorState, Transaction, Plugin, PluginKey } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { createEventDispatcher, onMount } from 'svelte'
import type { EditorContentEvent } from './index'
import { Commands } from './internal/commands'
import { buildInputRules } from './internal/input_rules'
import { buildKeymap } from './internal/keymap'
import { schema } from './internal/schema'
import type { StateTransformer } from './transform'

const dispatch = createEventDispatcher()

// ********************************
// Properties
// ********************************
export let content: MessageNode
export let triggers: string[] = []
export let transformInjections: StateTransformer | undefined = undefined
export let enterNewLine: boolean = false
export let keydownHandler: ((event: KeyboardEvent) => boolean) | undefined

// ********************************
// Functionality
// ********************************
// Perform update of values are changed
$: updateValue(content)

// Internal variables
let view: EditorView
let state: EditorState
let root: HTMLElement

let rootElement: HTMLElement

let inputHeight: number

let isEmpty = true
let hasFocus = false

function checkEmpty (value: string): boolean {
  return value.length === 0 || value === '<p><br></p>' || value === '<p></p>'
}

function findCompletion (sel: any): {
  completionWord: string;
  completionEnd: string;
} {
  let completionWord = ''
  let completionEnd = ''

  if (sel.$from.nodeBefore !== null) {
    let val = sel.$from.nodeBefore.textContent
    let p = -1
    for (p = val.length - 1; p >= 0; p--) {
      if (val[p] === ' ' || val[p] === '\n') {
        // Stop on WS
        break
      }
      for (let ti = 0; ti < triggers.length; ti++) {
        const t = triggers[ti]
        const ss = val.substring(p, p + t.length)
        if (ss === t) {
          val = val.substring(p)
          break
        }
      }
    }
    completionWord = val
  }
  if (sel.$from.nodeAfter !== null) {
    completionEnd = sel.$from.nodeAfter.textContent
  }
  return {
    completionWord,
    completionEnd
  }
}

export function emitStyleEvent () {
  const sel = view.state.selection
  const { completionWord, completionEnd } = findCompletion(sel)

  const posAtWindow = view.coordsAtPos(sel.from - completionWord.length)

  const viewportOffset = rootElement.getBoundingClientRect()

  const cursor = {
    left: posAtWindow.left - viewportOffset.left,
    top: posAtWindow.top - viewportOffset.top,
    right: posAtWindow.right - viewportOffset.left,
    bottom: posAtWindow.bottom - viewportOffset.top
  }
  // The box in which the tooltip is positioned, to use as base

  const jsonDoc = view.state.toJSON().doc
  dispatch('content', jsonDoc as MessageNode)

  // Check types
  const marks = view.state.storedMarks || view.state.selection.$from.marks()

  const isBold = schema.marks.strong.isInSet(marks) != null
  const isItalic = schema.marks.em.isInSet(marks) != null

  isEmpty = checkEmpty(view.dom.innerHTML)

  const evt = {
    isEmpty: isEmpty,
    bold: isBold,
    isBoldEnabled: Commands.toggleStrong(view.state),
    italic: isItalic,
    isItalicEnabled: Commands.toggleItalic(view.state),
    cursor: {
      left: cursor.left,
      top: cursor.top,
      bottom: cursor.bottom,
      right: cursor.right
    },
    completionWord,
    completionEnd,
    selection: {
      from: sel.from,
      to: sel.to
    },
    inputHeight
  } as EditorContentEvent
  dispatch('styleEvent', evt)
}

const key = new PluginKey('focusPlugin')

const focusPlugin = new Plugin({
  key,
  state: {
    init () {
      return false // assume the view starts out without focus
    },
    apply (transaction, prevFocused) {
      // update plugin state when transaction contains the meta property
      // set by the focus/blur DOM event handlers
      const focused = transaction.getMeta(key)
      return typeof focused === 'boolean' ? focused : prevFocused
    }
  },
  props: {
    handleDOMEvents: {
      blur: () => {
        dispatch('blur')
        hasFocus = false
        return false
      },
      focus: () => {
        hasFocus = true
        return false
      }
    }
  }
})

const keyDownKey = new PluginKey('preventKeydownPlugin')
const keydownPlugin = new Plugin({
  key: keyDownKey,
  props: {
    handleKeyDown: (view, event) => {
      if (keydownHandler !== undefined) {
        return keydownHandler(event)
      }
      return false
    }
  }
})

function createState (doc: MessageNode): EditorState {
  const plugins = [
    history(),
    buildInputRules(),
    keydownPlugin,
    keymap(buildKeymap(!enterNewLine)),
    focusPlugin
  ]
  return EditorState.fromJSON(
    {
      schema,
      plugins
    },
    {
      doc: doc,
      selection: {
        type: 'text',
        head: 0,
        anchor: 0
      }
    }
  )
}

//* ***************************************************************
// Initialization of prosemirror stuff.
//* ***************************************************************
rootElement = document.createElement('div')

state = createState(content)
let updateTimer: any
view = new EditorView(rootElement, {
  state,
  dispatchTransaction (transaction) {
    let newState = view.state.apply(transaction)

    if (updateTimer !== undefined) {
      clearInterval(updateTimer)
    }
    // Update
    updateTimer = setInterval(() => {
      // Check and update triggers to update content.
      if (transformInjections !== undefined) {
        const tr: Promise<Transaction | null> = transformInjections(newState)
        if (tr !== null) {
          tr.then((res) => {
            if (res !== null) {
              newState = newState.apply(res)
              view.updateState(newState)

              emitStyleEvent()
            }
          })
        }
      }
      clearInterval(updateTimer)
      updateTimer = undefined
    }, 200)

    view.updateState(newState)

    emitStyleEvent()
  }
})

onMount(() => {
  root.appendChild(rootElement)
})

function updateValue (content: MessageNode) {
  if (!deepEqual(content, view.state.toJSON().doc)) {
    const newState = createState(content)

    view.updateState(newState)
  }
  isEmpty = checkEmpty(view.dom.innerHTML)
}

export function insert (text: string, from: number, to: number): void {
  const t = view.state.tr.insertText(text, from, to)
  const st = view.state.apply(t)
  view.updateState(st)
  emitStyleEvent()
}

export function insertMark (
  text: string,
  from: number,
  to: number,
  mark: MarkType,
  attrs?: { [key: string]: any }
): void {
  // Ignore white spaces on end of text
  const markLen = text.trim().length
  const t = view.state.tr
    .insertText(text, from, to)
    .addMark(from, from + markLen, mark.create(attrs))
  const st = view.state.apply(t)
  view.updateState(st)
  emitStyleEvent()
}

// Some operations
export function toggleBold (): void {
  Commands.toggleStrong(view.state, view.dispatch)
  view.focus()
}

export function toggleItalic (): void {
  Commands.toggleItalic(view.state, view.dispatch)
  view.focus()
}

export function toggleUnOrderedList (): void {
  Commands.toggleUnOrdered(view.state, view.dispatch)
  view.focus()
}

export function toggleOrderedList (): void {
  Commands.toggleOrdered(view.state, view.dispatch)
  view.focus()
}

export function focus (): void {
  view.focus()
}
</script>

<div
  class="edit-box"
  bind:this="{root}"
  bind:clientHeight="{inputHeight}"
  on:click="{() => view.focus()}"
  data-testid="editor-root">
</div>
<div
  class="hover-message"
  style="{[
    `top:${-1 * inputHeight}px;`,
    `margin-bottom:${-1 * inputHeight}px;`,
    `height:${inputHeight}px;`
  ].join('')}">
  <slot name="hoverMessage" empty="{isEmpty}" hasFocus="{hasFocus}" />
</div>
<slot />

<style lang="scss">
:global {
  .ProseMirror {
    position: relative;
  }

  .ProseMirror {
    word-wrap: break-word;
    white-space: pre-wrap;
    //white-space: break-spaces;
    -webkit-font-variant-ligatures: none;
    font-variant-ligatures: none;
    font-feature-settings: "liga" 0; /* the above doesn't seem to work in Edge */
  }

  .ProseMirror pre {
    white-space: pre-wrap;
  }

  .ProseMirror li {
    position: relative;
  }

  .ProseMirror-hideselection *::selection {
    background: transparent;
  }

  .ProseMirror-hideselection *::-moz-selection {
    background: transparent;
  }

  .ProseMirror-hideselection {
    caret-color: transparent;
  }

  .ProseMirror-selectednode {
    outline: 2px solid #8cf;
  }

  /* Make sure li selections wrap around markers */

  li.ProseMirror-selectednode {
    outline: none;
  }

  li.ProseMirror-selectednode:after {
    content: "";
    position: absolute;
    left: -32px;
    right: -2px;
    top: -2px;
    bottom: -2px;
    border: 2px solid #8cf;
    pointer-events: none;
  }
}

.edit-box {
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
    reference {
      cursor: pointer;
      background-color: var(--theme-bg-accent-color);
      border-radius: 10px;
      padding: 2px;
      text-decoration-line: underline;
      display: inline-block;
    }
  }
}

.edit-box:focus {
  outline: none;
}

.hover-message {
  // position: relative;
  // top: 0px;
  pointer-events: none;
  user-select: none;
  // padding-left: 5px;
  // padding-top: 5px;
  color: var(--theme-content-trans-color);
  // background-color: red;
}
</style>
