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
import { MessageNode, MessageNodeType, parseMessageMarkdown, parseMessage, serializeMessage } from '..'
import { MessageMarkType } from '../model'
import { traverseAllMarks, traverseMessage } from '../node'
import { MarkdownState } from '../serializer'

describe('server', () => {
  it('Check reference output', () => {
    const t1 =
      '{"content":[{"content":[{"text":"Hello ","type":"text"},{"marks":[{"attrs":{"class":"class:chunter.Page","id":"5f8043dc1b592de172c26181"},"type":"reference"}],"text":"[[Page1]]","type":"text"},{"text":" and ","type":"text"},{"marks":[{"attrs":{"class":"Page","id":null},"type":"reference"}],"text":"[[Page3]]","type":"text"}],"type":"paragraph"}],"type":"doc"}'
    const msg = serializeMessage(JSON.parse(t1) as MessageNode)

    expect(msg).toEqual('Hello [Page1](ref://chunter.Page#5f8043dc1b592de172c26181) and [Page3](ref://Page#)')
  })
  it('Check reference conversion', () => {
    const t1 =
      '{"content":[{"content":[{"text":"Hello ","type":"text"},{"marks":[{"attrs":{"class":"class:chunter.Page","id":"5f8043dc1b592de172c26181"},"type":"reference"}],"text":"[[Page1]]","type":"text"},{"text":" and ","type":"text"},{"marks":[{"attrs":{"class":"Page","id":null},"type":"reference"}],"text":"[[Page3]]","type":"text"}],"type":"paragraph"}],"type":"doc"}'
    const msg = serializeMessage(JSON.parse(t1) as MessageNode)
    const parsed = parseMessage(msg, true)

    const pm = JSON.stringify(parsed)
    console.log(pm)
    expect((parsed as any).content[0].content[1].text).toEqual('[[Page1]]')
    expect((parsed as any).content[0].content[3].text).toEqual('[[Page3]]')
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
    const msg = parseMessage(t1)
    expect(msg.type).toEqual(MessageNodeType.doc)

    const md = serializeMessage(msg)

    expect(md).toEqual(t1)

    const msg2 = parseMessageMarkdown(undefined)
    expect(msg2.type).toEqual(MessageNodeType.doc)
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
    const t1 = "```\n# code block\nprint '3 backticks or'\nprint 'indent 4 spaces'\n```"
    const msg = parseMessageMarkdown(t1)
    expect(msg.type).toEqual(MessageNodeType.doc)
    expect(msg.content?.[0].type).toEqual(MessageNodeType.code_block)

    const md = serializeMessage(msg)

    expect(md).toEqual(t1)
  })

  it('Check inline block', () => {
    const t1 = 'Hello `Some code` block'
    const msg = parseMessageMarkdown(t1)
    expect(msg.type).toEqual(MessageNodeType.doc)
    expect(msg.content?.[0].type).toEqual(MessageNodeType.paragraph)
    expect(msg.content?.[0].content?.length).toEqual(3)
    expect(msg.content?.[0].content?.[1].marks?.[0].type).toEqual(MessageMarkType.code)

    const md = serializeMessage(msg)

    expect(md).toEqual(t1)
  })

  it('Check underline heading rule', () => {
    const t1 = 'Hello\n---\nSome text'
    const msg = parseMessageMarkdown(t1)
    expect(msg.type).toEqual(MessageNodeType.doc)

    const md = serializeMessage(msg)

    expect(md).toEqual('## Hello\n\nSome text')
  })

  it('Check horizontal line', () => {
    const t1 = 'Hello\n\n---\n\nSome text'
    const msg = parseMessageMarkdown(t1)
    expect(msg.type).toEqual(MessageNodeType.doc)
    expect(msg.content?.length).toEqual(3)
    expect(msg.content?.[1].type).toEqual(MessageNodeType.horizontal_rule)

    const md = serializeMessage(msg)

    expect(md).toEqual(t1)
  })

  it('Check big inline block', () => {
    const t1 = 'Hello ```Some code``` block'
    const msg = parseMessageMarkdown(t1)
    expect(msg.type).toEqual(MessageNodeType.doc)
    expect(msg.content?.[0].type).toEqual(MessageNodeType.paragraph)
    expect(msg.content?.[0].content?.length).toEqual(3)
    expect(msg.content?.[0].content?.[1].marks?.[0].type).toEqual(MessageMarkType.code)

    const md = serializeMessage(msg)

    expect(md).toEqual('Hello `Some code` block')
  })
  it('Check code block language', () => {
    const t1 = "```typescript\n# code block\nprint '3 backticks or'\nprint 'indent 4 spaces'\n```"
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
  it('check header hard_break serialize', () => {
    const doc: MessageNode = {
      type: MessageNodeType.doc,
      content: [
        {
          type: MessageNodeType.paragraph,
          content: [
            {
              type: MessageNodeType.text,
              text: '# Hello'
            },
            {
              type: MessageNodeType.hard_break
            },
            {
              type: MessageNodeType.text,
              text: 'World'
            }
          ]
        }
      ]
    }
    const md = serializeMessage(doc)
    expect(md).toEqual('# Hello\nWorld')
  })
  it('Check traverse', () => {
    const t1 = '**[link](foo) is bold**"'
    const msg = parseMessageMarkdown(t1)

    const nodes = []
    traverseMessage(msg, (node) => {
      nodes.push(node)
    })
    expect(nodes.length).toEqual(6)
    const marks = []
    traverseAllMarks(msg, (node, mark) => {
      marks.push(mark)
    })
    expect(marks.length).toEqual(3)
  })

  it('check serialize variant', () => {
    const node: MessageNode = {
      content: [
        {
          content: [
            {
              content: [
                {
                  content: [
                    { text: 'test1 ', type: MessageNodeType.text },
                    { text: undefined, type: MessageNodeType.hard_break },
                    {
                      text: 'Italic',
                      marks: [{ type: MessageMarkType.em, attrs: [] }],
                      type: MessageNodeType.text
                    }
                  ],
                  type: MessageNodeType.paragraph
                }
              ],
              type: MessageNodeType.list_item
            },
            {
              content: [
                {
                  content: [
                    { text: 'test2 ', type: MessageNodeType.text },
                    { text: 'BOLD', marks: [{ type: MessageMarkType.strong, attrs: [] }], type: MessageNodeType.text }
                  ],
                  type: MessageNodeType.paragraph
                }
              ],
              type: MessageNodeType.list_item
            }
          ],
          type: MessageNodeType.bullet_list
        }
      ],
      type: MessageNodeType.doc
    }
    const msg = serializeMessage(node)

    expect(msg).toEqual('* test1 \n  *Italic*\n\n* test2 **BOLD**')
  })
  it('check serialize throw unsupported', () => {
    const node: MessageNode = {
      content: [
        {
          content: [
            {
              content: [
                {
                  content: [
                    { text: 'test1 ', type: MessageNodeType.text },
                    { text: undefined, type: MessageNodeType.text },
                    { text: undefined, type: (MessageNodeType.text + 'qwe') as MessageNodeType },
                    { text: undefined, type: MessageNodeType.text }
                  ],
                  type: MessageNodeType.paragraph
                }
              ],
              type: MessageNodeType.list_item
            }
          ],
          type: MessageNodeType.bullet_list
        }
      ],
      type: MessageNodeType.doc
    }
    expect(() => serializeMessage(node)).toThrowError('Token type `textqwe` not supported by Markdown renderer')
  })

  it('check markdown state', () => {
    const st = new MarkdownState()

    st.text('qwe', true)
    expect(st.out).toEqual('qwe')
  })

  it('check markdown state', () => {
    const st = new MarkdownState()

    const o1 = st.quote("qwe'")
    const o2 = st.quote('qwe"')
    expect(o1).toEqual('"qwe\'"')
    expect(o2).toEqual("'qwe\"'")
  })

  it('check horizontal rule', () => {
    const node: MessageNode = {
      content: [
        {
          attrs: {},
          type: MessageNodeType.horizontal_rule
        }
      ],
      type: MessageNodeType.doc
    }
    expect(serializeMessage(node)).toEqual('---')
  })

  it('check code_text', () => {
    const node: MessageNode = {
      type: MessageNodeType.doc,
      content: [
        {
          type: MessageNodeType.paragraph,
          content: [
            {
              type: MessageNodeType.text,
              text: 'Link to '
            },
            {
              type: MessageNodeType.text,
              text: 'https://hardware.it',
              marks: [
                {
                  type: MessageMarkType.em,
                  attrs: {}
                },
                {
                  type: MessageMarkType.link,
                  attrs: {
                    title: 'Some title',
                    href: 'https://hardware.it'
                  }
                }
              ]
            }
          ]
        }
      ]
    }
    expect(serializeMessage(node)).toEqual('Link to *[https://hardware.it](https://hardware.it "Some title")*')
  })

  it('check swithc marks', () => {
    const node: MessageNode = {
      type: MessageNodeType.doc,
      content: [
        {
          type: MessageNodeType.paragraph,
          content: [
            {
              type: MessageNodeType.text,
              text: 'Link to ',
              marks: [
                {
                  type: MessageMarkType.strong,
                  attrs: {}
                }
              ]
            },
            {
              type: MessageNodeType.text,
              text: 'https://hardware.it',
              marks: [
                {
                  type: MessageMarkType.em,
                  attrs: {}
                },
                {
                  type: MessageMarkType.strong,
                  attrs: {}
                }
              ]
            }
          ]
        }
      ]
    }
    expect(serializeMessage(node)).toEqual('**Link to *https://hardware.it***')
  })
})
