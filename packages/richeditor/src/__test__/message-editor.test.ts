import { MessageNode, parseMessage, serializeMessage } from '@anticrm/text'
import { afterEach, describe, expect, it } from '@jest/globals'
import { cleanup, render } from '@testing-library/svelte'
import { EditorState, Transaction } from 'prosemirror-state'
import { schema } from '../internal/schema'
import MessageEditor from '../MessageEditor.svelte'
import { createTextTransform, ItemRefefence } from '../transform'

describe('message editor tests', () => {
  afterEach(() => {
    cleanup()
  }) // Default on import: runs it after each test.
  it('test component show our message', () => {
    const doc = parseMessage('Hello World!')
    const result = render(MessageEditor, {
      content: doc,
      hoverMessage: 'my-hover'
    })
    const e1 = result.getByTestId('editor-root')

    expect(e1.innerHTML).toContain('<p>Hello World!</p>')
  })

  it('test component hover', async () => {
    const result = render(MessageEditor, {
      content: parseMessage('qwe')
    })
    await result.component.$set({ hoverMessage: 'my-hover' })
    result.component.emitStyleEvent()

    expect(result.container.innerHTML.indexOf('my-hover')).toEqual(-1)
    await result.component.$set({ content: parseMessage('') })
    expect(result.container.innerHTML).toContain('my-hover')
  })

  it('test state transformation', async () => {
    const msg = parseMessage('qwe [[Welcome]] [My Ref](ref://my.class#ae12ae)')

    const tr = createTextTransform(
      async (text: string): Promise<ItemRefefence[]> => {
        return [{ id: text, class: 'my-ref' }]
      }
    )

    const state = EditorState.fromJSON(
      {
        schema,
        plugins: []
      },
      {
        doc: msg,
        selection: {
          type: 'text',
          head: 0,
          anchor: 0
        }
      }
    )

    const trs = await tr(state)
    expect(trs).not.toBeNull()
    const newState = state.apply(trs as Transaction)

    const jsonDoc = newState.toJSON().doc as MessageNode

    const newMsg = serializeMessage(jsonDoc)

    const trs2 = await tr(newState)
    const newState2 = newState.apply(trs2 as Transaction)

    const jsonDoc2 = newState2.toJSON().doc as MessageNode
    const newMsg2 = serializeMessage(jsonDoc2)

    console.log(msg, newMsg, newMsg2)
    expect(newMsg).toEqual(
      'qwe [Welcome](ref://my-ref#Welcome) [My Ref](ref://my.class#ae12ae)'
    )
    expect(newMsg).toEqual(newMsg2)
  })

  it('test state transformation', async () => {
    const msg = parseMessage('qwe [[Welcome]] [My Ref](ref://my.class#ae12ae)')

    const tr = createTextTransform(
      async (text: string): Promise<ItemRefefence[]> => {
        return [
          { id: text, class: 'my-ref' },
          { id: 'qwe', class: 'my-ref2' }
        ]
      }
    )

    const state = EditorState.fromJSON(
      {
        schema,
        plugins: []
      },
      {
        doc: msg,
        selection: {
          type: 'text',
          head: 0,
          anchor: 0
        }
      }
    )

    const trs = await tr(state)
    expect(trs).not.toBeNull()
    const newState = state.apply(trs as Transaction)

    const jsonDoc = newState.toJSON().doc as MessageNode

    const newMsg = serializeMessage(jsonDoc)

    const trs2 = await tr(newState)
    const newState2 = newState.apply(trs2 as Transaction)

    const jsonDoc2 = newState2.toJSON().doc as MessageNode
    const newMsg2 = serializeMessage(jsonDoc2)

    console.log(msg, newMsg, newMsg2)
    expect(newMsg).toEqual(
      'qwe [Welcome](ref://my-ref#Welcome) [My Ref](ref://my.class#ae12ae)'
    )
    expect(newMsg).toEqual(newMsg2)
  })
})
