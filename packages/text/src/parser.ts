import MarkdownIt = require('markdown-it')
import Token = require('markdown-it/lib/token')

import { MessageNode, MessageNodeType, MessageMarkType, MessageMark } from './model'
import { addToSet, removeFromSet, sameSet } from './marks'

interface ParsingBlockRule {
  block: MessageNodeType
  getAttrs?: (tok: Token) => { [key: string]: string }
  noCloseToken?: boolean
}

interface ParsingNodeRule {
  node: MessageNodeType
  getAttrs?: (tok: Token) => { [key: string]: string }
}

interface ParsingMarkRule {
  mark: MessageMarkType
  getAttrs?: (tok: Token) => { [key: string]: string }
  noCloseToken?: boolean
}

type HandlerRecord = (state: MarkdownParseState, tok: Token) => void
type HandlersRecord = Record<string, HandlerRecord>

// ****************************************************************
// Mark down parser
// ****************************************************************
function isText (a: MessageNode, b: MessageNode): boolean {
  return a.type === MessageNodeType.text && b.type === MessageNodeType.text
}
function maybeMerge (a: MessageNode, b: MessageNode): MessageNode | undefined {
  if (isText(a, b) && sameSet(a.marks, b.marks)) {
    return { ...a, text: (a.text ?? '') + (b.text ?? '') }
  }
  return undefined
}

interface StateElement {
  type: MessageNodeType
  content: MessageNode[]
  attrs: { [key: string]: string }
}

// Object used to track the context of a running parse.
class MarkdownParseState {
  stack: StateElement[]
  marks: MessageMark[]
  tokenHandlers: Record<string, (state: MarkdownParseState, tok: Token) => void>

  constructor (tokenHandlers: Record<string, (state: MarkdownParseState, tok: Token) => void>) {
    this.stack = [{ type: MessageNodeType.doc, attrs: {}, content: [] }]
    this.marks = []
    this.tokenHandlers = tokenHandlers
  }

  top (): StateElement | undefined {
    return this.stack[this.stack.length - 1]
  }

  push (elt: MessageNode): void {
    if (this.stack.length > 0) {
      const tt = this.top()
      tt?.content.push(elt)
    }
  }

  convertRef (m: MessageMark): MessageMark {
    const ref = (m.attrs.href ?? '') as string
    const refPrefix = 'ref://'
    const hashPos = ref.indexOf('#')
    if (ref.startsWith(refPrefix) && hashPos !== -1) {
      // Convert any url with ref to reference mark
      return {
        type: MessageMarkType.reference,
        attrs: {
          id: ref.substring(hashPos + 1),
          class: 'class:' + ref.substring(refPrefix.length, hashPos)
        }
      }
    }
    return m
  }

  // : (MessageMark[])
  // Convert linsk to references in case of ref:// schema.
  convertReferences (marks: MessageMark[]): MessageMark[] | undefined {
    let result: MessageMark[] | undefined
    for (let i = 0; i < marks.length; i++) {
      result = result ?? []
      const m = marks[i]
      if (m.type !== MessageMarkType.link) {
        result.push(m)
        continue
      }
      result.push(this.convertRef(m))
    }
    return result
  }

  mergeWithLast (nodes: MessageNode[], node: MessageNode): boolean {
    const last = nodes[nodes.length - 1]
    let merged: MessageNode | undefined
    if (last !== undefined && (merged = maybeMerge(last, node)) !== undefined) {
      nodes[nodes.length - 1] = merged
      return true
    }
    return false
  }

  // : (string)
  // Adds the given text to the current position in the document,
  // using the current marks as styling.
  addText (text?: string): void {
    const top = this.top()
    if (text === undefined || top === undefined) return

    const node: MessageNode = {
      type: MessageNodeType.text,
      text: text,
      marks: this.convertReferences(this.marks)
    }

    const nodes = top.content

    if (!this.mergeWithLast(nodes, node)) {
      nodes.push(node)
    }
  }

  // : (Mark)
  // Adds the given mark to the set of active marks.
  openMark (mark: MessageMark): void {
    this.marks = addToSet(mark, this.marks)
  }

  // : (Mark)
  // Removes the given mark from the set of active marks.
  closeMark (mark: MessageMarkType): void {
    this.marks = removeFromSet(mark, this.marks)
  }

  parseTokens (toks: Token[] | null): void {
    for (const tok of toks ?? []) {
      const handler = this.tokenHandlers[tok.type]
      if (handler === undefined) {
        throw new Error(`Token type '${String(tok.type)} not supported by Markdown parser`)
      }
      handler(this, tok)
    }
  }

  // : (NodeType, ?Object, ?[Node]) → ?Node
  // Add a node at the current position.
  addNode (type: MessageNodeType, attrs: { [key: string]: string }, content: MessageNode[] = []): MessageNode {
    const node: MessageNode = { type: type, content: content }

    if (Object.keys(attrs ?? {}).length > 0) {
      node.attrs = attrs
    }
    if (this.marks.length > 0) {
      node.marks = this.marks
    }
    this.push(node)
    return node
  }

  // : (NodeType, ?Object)
  // Wrap subsequent content in a node of the given type.
  openNode (type: MessageNodeType, attrs: { [key: string]: string }): void {
    this.stack.push({ type: type, attrs, content: [] })
  }

  // : () → ?Node
  // Close and return the node that is currently on top of the stack.
  closeNode (): MessageNode {
    if (this.marks.length > 0) this.marks = []
    const info = this.stack.pop()
    if (info !== undefined) {
      return this.addNode(info.type, info.attrs, info.content)
    }
    return { type: MessageNodeType.doc }
  }
}

function attrs (spec: ParsingBlockRule | ParsingMarkRule | ParsingNodeRule, token: Token): { [key: string]: string } {
  return spec.getAttrs?.(token) ?? {}
}

// Code content is represented as a single token with a `content`
// property in Markdown-it.
function noCloseToken (spec: ParsingBlockRule | ParsingMarkRule, type: string): boolean {
  return (spec.noCloseToken ?? false) || ['code_inline', 'code_block', 'fence'].indexOf(type) > 0
}

function withoutTrailingNewline (str: string): string {
  return str[str.length - 1] === '\n' ? str.slice(0, str.length - 1) : str
}

function addSpecBlock (
  handlers: HandlersRecord,
  spec: ParsingBlockRule,
  type: string,
  specBlock: MessageNodeType
): void {
  if (noCloseToken(spec, type)) {
    handlers[type] = newSimpleBlockHandler(specBlock, spec)
  } else {
    handlers[type + '_open'] = (state, tok) => state.openNode(specBlock, attrs(spec, tok))
    handlers[type + '_close'] = (state) => state.closeNode()
  }
}
function newSimpleBlockHandler (specBlock: MessageNodeType, spec: ParsingBlockRule): HandlerRecord {
  return (state, tok) => {
    state.openNode(specBlock, attrs(spec, tok))
    state.addText(withoutTrailingNewline(tok.content))
    state.closeNode()
  }
}

function addSpecMark (handlers: HandlersRecord, spec: ParsingMarkRule, type: string, specMark: MessageMarkType): void {
  if (noCloseToken(spec, type)) {
    handlers[type] = newSimpleMarkHandler(spec, specMark)
  } else {
    handlers[type + '_open'] = (state, tok) => state.openMark({ type: specMark, attrs: attrs(spec, tok) })
    handlers[type + '_close'] = (state) => state.closeMark(specMark)
  }
}
function newSimpleMarkHandler (spec: ParsingMarkRule, specMark: MessageMarkType): HandlerRecord {
  return (state: MarkdownParseState, tok: Token): void => {
    state.openMark({ attrs: attrs(spec, tok), type: specMark })
    state.addText(withoutTrailingNewline(tok.content))
    state.closeMark(specMark)
  }
}

function tokenHandlers (
  tokensBlock: { [key: string]: ParsingBlockRule },
  tokensNode: { [key: string]: ParsingNodeRule },
  tokensMark: { [key: string]: ParsingMarkRule }
): HandlersRecord {
  const handlers: HandlersRecord = {}

  Object.entries(tokensBlock).forEach(([type, spec]) => addSpecBlock(handlers, spec, type, spec.block))
  Object.entries(tokensNode).forEach(([type, spec]) => addSpecNode(handlers, type, spec))
  Object.entries(tokensMark).forEach(([type, spec]) => addSpecMark(handlers, spec, type, spec.mark))

  addTextHandlers(handlers)

  return handlers
}

function addTextHandlers (handlers: HandlersRecord): void {
  handlers.text = (state, tok) => state.addText(tok.content)
  handlers.inline = (state, tok) => state.parseTokens(tok.children)
  handlers.softbreak = handlers.softbreak ?? ((state) => state.addText('\n'))
}

function addSpecNode (handlers: HandlersRecord, type: string, spec: ParsingNodeRule): void {
  handlers[type] = (state: MarkdownParseState, tok: Token) => state.addNode(spec.node, attrs(spec, tok))
}

function tokAttrGet (token: Token, name: string): string | undefined {
  const attr = token.attrGet(name)
  if (attr === null) {
    return undefined
  }
}

function tokToAttrs (token: Token, ...names: string[]): Record<string, string> {
  const result: Record<string, string> = {}
  for (const name of names) {
    const attr = token.attrGet(name)
    if (attr !== null) {
      result[name] = attr
    }
  }
  return result
}

// ::- A configuration of a Markdown parser. Such a parser uses
const tokensBlock: { [key: string]: ParsingBlockRule } = {
  blockquote: { block: MessageNodeType.blockquote },
  paragraph: { block: MessageNodeType.paragraph },
  list_item: { block: MessageNodeType.list_item },
  bullet_list: { block: MessageNodeType.bullet_list },
  ordered_list: {
    block: MessageNodeType.ordered_list,
    getAttrs: (tok: Token) => ({ order: tokAttrGet(tok, 'start') ?? '1' })
  },
  heading: {
    block: MessageNodeType.heading,
    getAttrs: (tok: Token) => ({ level: tok.tag.slice(1) })
  },
  code_block: {
    block: MessageNodeType.code_block,
    noCloseToken: true
  },
  fence: {
    block: MessageNodeType.code_block,
    getAttrs: (tok: Token) => ({ params: tok.info ?? '' }),
    noCloseToken: true
  }
}
const tokensNode: { [key: string]: ParsingNodeRule } = {
  hr: { node: MessageNodeType.horizontal_rule },
  image: {
    node: MessageNodeType.image,
    getAttrs: (tok: Token) => {
      const result = tokToAttrs(tok, 'src', 'title', 'alt')
      if (tok.content !== '' && (result.alt === '' || result.alt == null)) {
        result.alt = tok.content
      }
      return result
    }
  },
  hardbreak: { node: MessageNodeType.hard_break }
}
const tokensMark: { [key: string]: ParsingMarkRule } = {
  em: { mark: MessageMarkType.em },
  strong: { mark: MessageMarkType.strong },
  link: {
    mark: MessageMarkType.link,
    getAttrs: (tok: Token) => tokToAttrs(tok, 'href', 'title')
  },
  code_inline: {
    mark: MessageMarkType.code,
    noCloseToken: true
  }
}

export class MarkdownParser {
  tokenizer: MarkdownIt
  tokenHandlers: Record<string, (state: MarkdownParseState, tok: Token) => void>

  constructor () {
    this.tokenizer = MarkdownIt('commonmark', { html: false })
    this.tokenHandlers = tokenHandlers(tokensBlock, tokensNode, tokensMark)
  }

  parse (text: string): MessageNode {
    const state = new MarkdownParseState(this.tokenHandlers)
    let doc: MessageNode

    state.parseTokens(this.tokenizer.parse(text, {}))
    do {
      doc = state.closeNode()
    } while (state.stack.length > 0)
    return doc
  }
}
