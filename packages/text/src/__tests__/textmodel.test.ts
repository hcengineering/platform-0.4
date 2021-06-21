//
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
//

/* eslint-env jest */
import { MessageNode, MessageNodeType, parseMessageMarkdown, serializeMessage } from '..'
import { MessageMarkType } from '../model'

describe('server', () => {
  it('Check reference output', () => {
    const t1 =
      '{"content":[{"content":[{"text":"Hello ","type":"text"},{"marks":[{"attrs":{"class":"class:chunter.Page","id":"5f8043dc1b592de172c26181"},"type":"reference"}],"text":"[[Page1]]","type":"text"},{"text":" and ","type":"text"},{"marks":[{"attrs":{"class":"Page","id":null},"type":"reference"}],"text":"[[Page3]]","type":"text"}],"type":"paragraph"}],"type":"doc"}'
    const msg = serializeMessage(JSON.parse(t1) as MessageNode)

    expect(msg).toEqual('Hello [Page1](ref://chunter.Page#5f8043dc1b592de172c26181) and [Page3](ref://Page#)')
  })
  it('check list with bold and italic', () => {
    const msg = serializeMessage(
      JSON.parse(
        '{"content": [{"content": [{"content": [{"content": [{"text": "test1 ", "type": "text"}, {"text": "Italic", "marks": [{"type": "em"}], "type": "text"}], "type": "paragraph"}], "type": "list_item"}, {"content": [{"content": [{"text": "test2 ", "type": "text"}, {"text": "BOLD", "marks": [{"type": "strong"}], "type": "text"}], "type": "paragraph"}], "type": "list_item"}], "type": "bullet_list"}], "type": "doc"}'
      ) as MessageNode
    )

    expect(msg).toEqual('* test1 *Italic*\n\n* test2 **BOLD**')
  })

  // Test parser

  it('Check parsing', () => {
    const t1 = 'Hello [Page1](ref://chunter.Page#5f8043dc1b592de172c26181) and [Page3](ref://Page#)'
    const msg = parseMessageMarkdown(t1)
    expect(msg.type).toEqual(MessageNodeType.doc)

    const md = serializeMessage(msg)

    expect(md).toEqual(t1)
  })

  it('Check parsing header', () => {
    const t1 = '# This is header'
    const msg = parseMessageMarkdown(t1)
    expect(msg.type).toEqual(MessageNodeType.doc)

    const md = serializeMessage(msg)

    expect(md).toEqual(t1)
  })
  it('Check parsing bullets', () => {
    const t1 = '* Section A\n  Some text\n\n* Section B\n  Some more text'
    const msg = parseMessageMarkdown(t1)
    expect(msg.type).toEqual(MessageNodeType.doc)

    const md = serializeMessage(msg)

    expect(md).toEqual(t1)
  })
  it('Check parsing bullets-2', () => {
    const t1 = '* Section A\n* Some section2'
    const msg = parseMessageMarkdown(t1)
    expect(msg.type).toEqual(MessageNodeType.doc)

    const md = serializeMessage(msg)

    expect(md).toEqual('* Section A\n\n* Some section2')
  })

  it('Check ordered list', () => {
    const t1 = '1. Section A\n   Some text\n\n2. Section B\n   Some more text'
    const msg = parseMessageMarkdown(t1)
    expect(msg.type).toEqual(MessageNodeType.doc)
    expect(msg.content?.[0].type).toEqual(MessageNodeType.ordered_list)
    expect(msg.content?.[0].content?.[0].type).toEqual(MessageNodeType.list_item)

    const md = serializeMessage(msg)

    expect(md).toEqual(t1)
  })

  it('Check styles', () => {
    const t1 = '**BOLD _ITALIC_ BOLD**'
    const msg = parseMessageMarkdown(t1)
    expect(msg.type).toEqual(MessageNodeType.doc)

    const md = serializeMessage(msg)

    expect(md).toEqual('**BOLD *ITALIC* BOLD**')
  })

  it('Check styles-2', () => {
    const t1 = '**BOLD *ITALIC* BOLD**'
    const msg = parseMessageMarkdown(t1)
    expect(msg.type).toEqual(MessageNodeType.doc)

    const md = serializeMessage(msg)

    expect(md).toEqual(t1)
  })

  it('Check styles-3', () => {
    const t1 = 'Some *EM **MORE EM***'
    const msg = parseMessageMarkdown(t1)
    expect(msg.type).toEqual(MessageNodeType.doc)
    expect(msg.content?.[0].type).toEqual(MessageNodeType.paragraph)
    expect(msg.content?.[0].content?.length).toEqual(4)
    expect(msg.content?.[0].content?.[2]?.marks?.length).toEqual(2)

    const md = serializeMessage(msg)

    expect(md).toEqual(t1)
  })

  it('Check images', () => {
    const t1 = 'Some text\nsome text ![This is Alt](http://url/a.png "This is title") Some text'
    const msg = parseMessageMarkdown(t1)
    expect(msg.type).toEqual(MessageNodeType.doc)
    expect(msg.content?.[0].content?.[1].type).toEqual(MessageNodeType.image)
    expect(msg.content?.[0].content?.[1].attrs?.src).toEqual('http://url/a.png')
    expect(msg.content?.[0].content?.[1].attrs?.title).toEqual('This is title')

    const md = serializeMessage(msg)

    expect(md).toEqual(t1)
  })

  it('Check block quite', () => {
    const t1 = '> Some quoted text\nand some more text'
    const msg = parseMessageMarkdown(t1)
    expect(msg.type).toEqual(MessageNodeType.doc)
    expect(msg.content?.[0].type).toEqual(MessageNodeType.blockquote)

    const md = serializeMessage(msg)

    expect(md).toEqual('> Some quoted text\n> and some more text')
  })

  it('Check block quite-2', () => {
    const t1 = '> Some quoted text\n> and some more text'
    const msg = parseMessageMarkdown(t1)
    expect(msg.type).toEqual(MessageNodeType.doc)
    expect(msg.content?.[0].type).toEqual(MessageNodeType.blockquote)

    const md = serializeMessage(msg)

    expect(md).toEqual(t1)
  })
  it('Check block quite-3', () => {
    const t1 = '> Some quoted text\n\nand some more text'
    const msg = parseMessageMarkdown(t1)
    expect(msg.type).toEqual(MessageNodeType.doc)
    expect(msg.content?.[0].type).toEqual(MessageNodeType.blockquote)

    const md = serializeMessage(msg)

    expect(md).toEqual(t1)
  })

  it('Check code block', () => {
    const t1 = '```\n# code block\nprint \'3 backticks or\'\nprint \'indent 4 spaces\'\n```'
    const msg = parseMessageMarkdown(t1)
    expect(msg.type).toEqual(MessageNodeType.doc)
    expect(msg.content?.[0].type).toEqual(MessageNodeType.code_block)

    const md = serializeMessage(msg)

    expect(md).toEqual(t1)
  })
  it('Check code block language', () => {
    const t1 = '```typescript\n# code block\nprint \'3 backticks or\'\nprint \'indent 4 spaces\'\n```'
    const msg = parseMessageMarkdown(t1)
    expect(msg.type).toEqual(MessageNodeType.doc)
    expect(msg.content?.[0].type).toEqual(MessageNodeType.code_block)

    const md = serializeMessage(msg)

    expect(md).toEqual(t1)
  })

  it('Check link', () => {
    const t1 = 'Some text [Link Alt](http://a.com) some more text'
    const msg = parseMessageMarkdown(t1)
    expect(msg.type).toEqual(MessageNodeType.doc)

    const md = serializeMessage(msg)

    expect(md).toEqual(t1)
  })
  it('Check link bold', () => {
    const t1 = '**[link](foo) is bold**"'
    const msg = parseMessageMarkdown(t1)
    expect(msg.type).toEqual(MessageNodeType.doc)
    expect(msg.content?.[0].content?.[1].marks?.[0]?.type).toEqual(MessageMarkType.strong)
    const md = serializeMessage(msg)

    expect(md).toEqual(t1)
  })

  it('Check overlapping inline marks', () => {
    const t1 = 'This is **strong *emphasized text with `code` in* it**'
    const msg = parseMessageMarkdown(t1)
    expect(msg.type).toEqual(MessageNodeType.doc)
    expect(msg.content?.[0].content?.length).toEqual(7)

    const md = serializeMessage(msg)

    expect(md).toEqual(t1)
  })
  it('Check emph url', () => {
    const t1 = 'Link to *<https://hardware.it>*'
    const msg = parseMessageMarkdown(t1)
    expect(msg.type).toEqual(MessageNodeType.doc)
    expect(msg.content?.[0].content?.length).toEqual(2)

    const md = serializeMessage(msg)

    expect(md).toEqual('Link to *<https://hardware.it](https://hardware.it)*')
  })
})
