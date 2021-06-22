import { parseMessage } from '@anticrm/text'
import { afterEach, describe, expect, it } from '@jest/globals'
import { cleanup, render } from '@testing-library/svelte'
import MessageEditor from '../MessageEditor.svelte'

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
})
