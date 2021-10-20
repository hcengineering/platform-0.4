import { isInSet, markAttrs, markEq, traverseMarks } from './marks'
import { MessageMark, MessageMarkType, MessageNode, MessageNodeType } from './model'
import { messageContent, nodeAttrs } from './node'

type FirstDelim = (i: number) => string
interface IState {
  wrapBlock: (delim: string, firstDelim: string | null, node: MessageNode, f: () => void) => void
  flushClose: (size: number) => void
  atBlank: () => void
  ensureNewLine: () => void
  write: (content: string) => void
  closeBlock: (node: any) => void
  text: (text: string, escape?: boolean) => void
  render: (node: MessageNode, parent: MessageNode, index: number) => void
  renderContent: (parent: MessageNode) => void
  renderInline: (parent: MessageNode) => void
  renderList: (node: MessageNode, delim: string, firstDelim: FirstDelim) => void
  esc: (str: string, startOfLine?: boolean) => string
  quote: (str: string) => string
  repeat: (str: string, n: number) => string
  markString: (mark: MessageMark, open: boolean, parent: MessageNode, index: number) => string
}

type NodeProcessor = (state: IState, node: MessageNode, parent: MessageNode, index: number) => void

interface InlineState {
  active: MessageMark[]
  trailing: string
  parent: MessageNode
  node?: MessageNode
  marks: MessageMark[]
}

// *************************************************************

function backticksFor (side: boolean): string {
  return side ? '`' : '`'
}

const URIHelper = {
  isNotText (
    parentContent: MessageNode[],
    attrs: { [key: string]: string },
    index: number,
    side: number,
    link: MessageMark
  ): boolean {
    const content = parentContent[index + (side < 0 ? -1 : 0)]
    const marks = [...(content?.marks ?? [])]
    return content?.type !== MessageNodeType.text || content?.text !== attrs.href || marks[marks.length - 1] !== link
  },

  isNotURL (attrs: { [key: string]: string }): boolean {
    return attrs.title !== undefined || !/^\w+:/.test(attrs.href)
  },

  getURINext (parentContent: MessageNode[], index: number, side: number): MessageNode {
    return parentContent[index + (side < 0 ? -2 : 1)]
  },

  isLast (index: number, side: number, len: number): boolean {
    return index === (side < 0 ? 1 : len - 1)
  }
}

function isPlainURL (link: MessageMark, parent: MessageNode, index: number, side: number): boolean {
  const attrs = markAttrs(link)
  const parentContent = messageContent(parent)
  const invalid = URIHelper.isNotURL(attrs) || URIHelper.isNotText(parentContent, attrs, index, side, link)
  return (
    !invalid &&
    (URIHelper.isLast(index, side, parentContent.length) ||
      !isInSet(link, URIHelper.getURINext(parentContent, index, side).marks ?? []))
  )
}

// *************************************************************

export const storeNodes: { [key: string]: NodeProcessor } = {
  blockquote: (state, node) => {
    state.wrapBlock('> ', null, node, () => state.renderContent(node))
  },
  code_block: (state, node) => {
    state.write('```' + (nodeAttrs(node).params ?? '') + '\n')
    // TODO: Check for node.textContent
    state.renderInline(node)
    // state.text(node.text ?? '', false)
    state.ensureNewLine()
    state.write('```')
    state.closeBlock(node)
  },
  heading: (state, node) => {
    const attrs = nodeAttrs(node)
    state.write(state.repeat('#', attrs.level !== undefined ? Number(attrs.level) : 1) + ' ')
    state.renderInline(node)
    state.closeBlock(node)
  },
  horizontal_rule: (state, node) => {
    state.write(nodeAttrs(node).markup ?? '---')
    state.closeBlock(node)
  },
  bullet_list: (state, node) => {
    state.renderList(node, '  ', () => (nodeAttrs(node).bullet ?? '*') + ' ')
  },
  ordered_list: (state, node) => {
    let start = 1
    if (nodeAttrs(node).order !== undefined) {
      start = Number(nodeAttrs(node).order)
    }
    const maxW = String(start + messageContent(node).length - 1).length
    const space = state.repeat(' ', maxW + 2)
    state.renderList(node, space, (i: number) => {
      const nStr = String(start + i)
      return state.repeat(' ', maxW - nStr.length) + nStr + '. '
    })
  },
  list_item: (state, node) => {
    state.renderContent(node)
  },
  paragraph: (state, node) => {
    state.renderInline(node)
    state.closeBlock(node)
  },

  image: (state, node) => {
    const attrs = nodeAttrs(node)
    state.write(
      '![' +
        state.esc(attrs.alt ?? '') +
        '](' +
        state.esc(attrs.src) +
        (attrs.title !== undefined ? ' ' + state.quote(attrs.title) : '') +
        ')'
    )
  },
  hard_break: (state, node, parent, index) => {
    const content = messageContent(parent)
    for (let i = index + 1; i < content.length; i++) {
      if (content[i].type !== node.type) {
        state.write('\n')
        return
      }
    }
  },
  text: (state, node) => {
    // Check if test has reference mark, in this case we need to remove [[]]
    let txt = node.text ?? ''

    traverseMarks(node, (m) => {
      if (m.type === MessageMarkType.reference) {
        if (txt.startsWith('[[') && txt.endsWith(']]')) {
          txt = txt.substring(2, txt.length - 2)
        }
      }
    })
    state.text(txt)
  }
}

interface MarkProcessor {
  open: ((_state: IState, mark: MessageMark, parent: MessageNode, index: number) => string) | string
  close: ((_state: IState, mark: MessageMark, parent: MessageNode, index: number) => string) | string
  mixable: boolean
  expelEnclosingWhitespace: boolean
  escape: boolean
}

export const storeMarks: { [key: string]: MarkProcessor } = {
  em: {
    open: '*',
    close: '*',
    mixable: true,
    expelEnclosingWhitespace: true,
    escape: true
  },
  strong: {
    open: '**',
    close: '**',
    mixable: true,
    expelEnclosingWhitespace: true,
    escape: true
  },
  link: {
    open: (state, mark, parent, index) => {
      return isPlainURL(mark, parent, index, 1) ? '<' : '['
    },
    close: (state, mark, parent, index) => {
      return isPlainURL(mark, parent, index, -1)
        ? '>'
        : '](' +
            state.esc(mark.attrs.href) +
            (mark.attrs.title !== undefined ? ' ' + state.quote(mark.attrs.title) : '') +
            ')'
    },
    mixable: false,
    expelEnclosingWhitespace: false,
    escape: true
  },
  reference: {
    open: (state, mark, parent, index) => {
      return isPlainURL(mark, parent, index, 1) ? '<' : '['
    },
    close: (state, mark, parent, index) => {
      return isPlainURL(mark, parent, index, -1)
        ? '>'
        : '](ref://' + state.esc(mark.attrs.class).replace('class:', '') + '#' + state.esc(mark.attrs.id) + ')'
    },
    mixable: false,
    expelEnclosingWhitespace: false,
    escape: true
  },
  code: {
    open: (state, mark, parent, index) => {
      return backticksFor(false)
    },
    close: (state, mark, parent, index) => {
      return backticksFor(true)
    },
    mixable: false,
    expelEnclosingWhitespace: false,
    escape: false
  }
}

export interface StateOptions {
  tightLists: boolean
}
export class MarkdownState implements IState {
  nodes: { [key: string]: NodeProcessor }
  marks: { [key: string]: MarkProcessor }
  delim: string
  out: string
  closed: boolean
  closedNode?: MessageNode
  inTightList: boolean
  options: StateOptions

  constructor (nodes = storeNodes, marks = storeMarks, options: StateOptions = { tightLists: false }) {
    this.nodes = nodes
    this.marks = marks
    this.delim = this.out = ''
    this.closed = false
    this.inTightList = false

    this.options = options
  }

  flushClose (size: number): void {
    if (this.closed) {
      if (!this.atBlank()) this.out += '\n'
      if (size > 1) {
        this.addDelim(size)
      }
      this.closed = false
    }
  }

  private addDelim (size: number): void {
    let delimMin = this.delim
    const trim = /\s+$/.exec(delimMin)
    if (trim !== null) {
      delimMin = delimMin.slice(0, delimMin.length - trim[0].length)
    }
    for (let i = 1; i < size; i++) {
      this.out += delimMin + '\n'
    }
  }

  wrapBlock (delim: string, firstDelim: string | null, node: MessageNode, f: () => void): void {
    const old = this.delim
    this.write(firstDelim ?? delim)
    this.delim += delim
    f()
    this.delim = old
    this.closeBlock(node)
  }

  atBlank (): boolean {
    return /(^|\n)$/.test(this.out)
  }

  // :: ()
  // Ensure the current content ends with a newline.
  ensureNewLine (): void {
    if (!this.atBlank()) this.out += '\n'
  }

  // :: (?string)
  // Prepare the state for writing output (closing closed paragraphs,
  // adding delimiters, and so on), and then optionally add content
  // (unescaped) to the output.
  write (content: string): void {
    this.flushClose(2)
    if (this.delim !== undefined && this.atBlank()) this.out += this.delim
    if (content.length > 0) this.out += content
  }

  // :: (Node)
  // Close the block for the given node.
  closeBlock (node: MessageNode): void {
    this.closedNode = node
    this.closed = true
  }

  // :: (string, ?bool)
  // Add the given text to the document. When escape is not `false`,
  // it will be escaped.
  text (text: string, escape = false): void {
    const lines = text.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const startOfLine = this.atBlank() || this.closed
      this.write('')
      this.out += escape ? this.esc(lines[i], startOfLine) : lines[i]
      if (i !== lines.length - 1) this.out += '\n'
    }
  }

  // :: (Node)
  // Render the given node as a block.
  render (node: MessageNode, parent: MessageNode, index: number): void {
    if (this.nodes[node.type] === undefined) {
      throw new Error('Token type `' + node.type + '` not supported by Markdown renderer')
    }
    this.nodes[node.type](this, node, parent, index)
  }

  // :: (Node)
  // Render the contents of `parent` as block nodes.
  renderContent (parent: MessageNode): void {
    messageContent(parent).forEach((node: MessageNode, i: number) => this.render(node, parent, i))
  }

  reorderMixableMark (state: InlineState, mark: MessageMark, i: number, len: number): void {
    for (let j = 0; j < state.active.length; j++) {
      const other = state.active[j]
      if (!this.marks[other.type].mixable || this.checkSwitchMarks(i, j, state, mark, other, len)) {
        break
      }
    }
  }

  reorderMixableMarks (state: InlineState, len: number): void {
    // Try to reorder 'mixable' marks, such as em and strong, which
    // in Markdown may be opened and closed in different order, so
    // that order of the marks for the token matches the order in
    // active.

    for (let i = 0; i < len; i++) {
      const mark = state.marks[i]
      if (!this.marks[mark.type].mixable) break
      this.reorderMixableMark(state, mark, i, len)
    }
  }

  private checkSwitchMarks (
    i: number,
    j: number,
    state: InlineState,
    mark: MessageMark,
    other: MessageMark,
    len: number
  ): boolean {
    if (!markEq(mark, other) || i === j) {
      return false
    }
    this.switchMarks(i, j, state, mark, len)
    return true
  }

  private switchMarks (i: number, j: number, state: InlineState, mark: MessageMark, len: number): void {
    if (i > j) {
      state.marks = state.marks
        .slice(0, j)
        .concat(mark)
        .concat(state.marks.slice(j, i))
        .concat(state.marks.slice(i + 1, len))
    }
    if (j > i) {
      state.marks = state.marks
        .slice(0, i)
        .concat(state.marks.slice(i + 1, j))
        .concat(mark)
        .concat(state.marks.slice(j, len))
    }
  }

  renderNodeInline (state: InlineState, index: number): void {
    state.marks = state.node?.marks ?? []
    this.updateHardBreakMarks(state, index)

    const leading = this.adjustLeading(state)

    const inner: MessageMark | undefined = state.marks.length > 0 ? state.marks[state.marks.length - 1] : undefined
    const noEsc = inner !== undefined && !this.marks[inner.type].escape
    const len = state.marks.length - (noEsc ? 1 : 0)

    this.reorderMixableMarks(state, len)

    // Find the prefix of the mark set that didn't change
    this.checkCloseMarks(state, len, index)

    // Output any previously expelled trailing whitespace outside the marks
    if (leading !== '') this.text(leading)

    // Open the marks that need to be opened
    this.checkOpenMarks(state, len, index, inner, noEsc)
  }

  private checkOpenMarks (
    state: InlineState,
    len: number,
    index: number,
    inner: MessageMark | undefined,
    noEsc: boolean
  ): void {
    if (state.node !== undefined) {
      this.updateActiveMarks(state, len, index)

      // Render the node. Special case code marks, since their content
      // may not be escaped.
      if (this.isNoEscapeRequire(state.node, inner, noEsc, state)) {
        this.renderMarkText(inner as MessageMark, state, index)
      } else {
        this.render(state.node, state.parent, index)
      }
    }
  }

  private isNoEscapeRequire (
    node: MessageNode,
    inner: MessageMark | undefined,
    noEsc: boolean,
    state: InlineState
  ): boolean {
    return inner !== undefined && noEsc && node.type === MessageNodeType.text
  }

  private renderMarkText (inner: MessageMark, state: InlineState, index: number): void {
    this.text(
      this.markString(inner, true, state.parent, index) +
        (state.node?.text as string) +
        this.markString(inner, false, state.parent, index + 1),
      false
    )
  }

  private updateActiveMarks (state: InlineState, len: number, index: number): void {
    while (state.active.length < len) {
      const add = state.marks[state.active.length]
      state.active.push(add)
      this.text(this.markString(add, true, state.parent, index), false)
    }
  }

  private checkCloseMarks (state: InlineState, len: number, index: number): void {
    let keep = 0
    while (keep < Math.min(state.active.length, len) && markEq(state.marks[keep], state.active[keep])) {
      ++keep
    }

    // Close the marks that need to be closed
    while (keep < state.active.length) {
      const mark = state.active.pop()
      if (mark !== undefined) {
        this.text(this.markString(mark, false, state.parent, index), false)
      }
    }
  }

  private adjustLeading (state: InlineState): string {
    let leading = state.trailing
    state.trailing = ''
    // If whitespace has to be expelled from the node, adjust
    // leading and trailing accordingly.
    const node = state?.node
    if (this.isText(node) && this.isMarksHasExpelEnclosingWhitespace(state)) {
      const match = /^(\s*)(.*?)(\s*)$/m.exec(node?.text ?? '')
      if (match !== null) {
        const [leadMatch, innerMatch, trailMatch] = [match[1], match[2], match[3]]
        leading += leadMatch
        state.trailing = trailMatch
        this.adjustLeadingTextNode(leadMatch, trailMatch, state, innerMatch, node as MessageNode)
      }
    }
    return leading
  }

  private isMarksHasExpelEnclosingWhitespace (state: InlineState): boolean {
    return state.marks.some((mark) => this.marks[mark.type]?.expelEnclosingWhitespace)
  }

  private adjustLeadingTextNode (
    lead: string,
    trail: string,
    state: InlineState,
    inner: string,
    node: MessageNode
  ): void {
    if (lead !== '' || trail !== '') {
      state.node = inner !== undefined ? { ...node, text: inner } : undefined
      if (state.node === undefined) {
        state.marks = state.active
      }
    }
  }

  private updateHardBreakMarks (state: InlineState, index: number): void {
    if (state.node !== undefined && state.node.type === MessageNodeType.hard_break) {
      state.marks = this.filterHardBreakMarks(state.marks, index, state)
    }
  }

  private filterHardBreakMarks (marks: MessageMark[], index: number, state: InlineState): MessageMark[] {
    const content = state.parent.content ?? []
    const next = content[index + 1]
    if (!this.isHardbreakText(next)) {
      return []
    }
    return marks.filter((m) => isInSet(m, next.marks ?? []))
  }

  private isHardbreakText (next?: MessageNode): boolean {
    return (
      next !== undefined && (next.type !== MessageNodeType.text || (next.text !== undefined && /\S/.test(next.text)))
    )
  }

  private isText (node?: MessageNode): boolean {
    return node !== undefined && node.type === MessageNodeType.text && node.text !== undefined
  }

  // :: (Node)
  // Render the contents of `parent` as inline content.
  renderInline (parent: MessageNode): void {
    const state: InlineState = { active: [], trailing: '', parent, marks: [] }
    messageContent(parent).forEach((nde, index) => {
      state.node = nde
      this.renderNodeInline(state, index)
    })
    state.node = undefined
    this.renderNodeInline(state, 0)
  }

  // :: (Node, string, (number) → string)
  // Render a node's content as a list. `delim` should be the extra
  // indentation added to all lines except the first in an item,
  // `firstDelim` is a function going from an item index to a
  // delimiter for the first line of the item.
  renderList (node: MessageNode, delim: string, firstDelim: FirstDelim): void {
    this.flushListClose(node)

    const isTight: boolean =
      node.attrs !== undefined &&
      (typeof node.attrs.tight !== 'undefined' ? node.attrs.tight === 'true' : this.options.tightLists)
    const prevTight = this.inTightList
    this.inTightList = isTight

    messageContent(node).forEach((child, i) => this.renderListItem(node, child, i, isTight, delim, firstDelim))
    this.inTightList = prevTight
  }

  renderListItem (
    node: MessageNode,
    child: MessageNode,
    i: number,
    isTight: boolean,
    delim: string,
    firstDelim: FirstDelim
  ): void {
    if (i > 0 && isTight) this.flushClose(1)
    this.wrapBlock(delim, firstDelim(i), node, () => this.render(child, node, i))
  }

  private flushListClose (node: MessageNode): void {
    if (this.closed && this.closedNode?.type === node.type) {
      this.flushClose(3)
    } else if (this.inTightList) {
      this.flushClose(1)
    }
  }

  // :: (string, ?bool) → string
  // Escape the given string so that it can safely appear in Markdown
  // content. If `startOfLine` is true, also escape characters that
  // has special meaning only at the start of the line.
  esc (str: string, startOfLine = false): string {
    if (str == null) {
      return ''
    }
    str = str.replace(/[`*\\~\[\]]/g, '\\$&') // eslint-disable-line
    if (startOfLine) {
      str = str.replace(/^[:#\-*+]/, '\\$&').replace(/^(\d+)\./, '$1\\.')
    }
    return str
  }

  quote (str: string): string {
    const wrap = !(str?.includes('"') ?? false) ? '""' : !(str?.includes("'") ?? false) ? "''" : '()'
    return wrap[0] + str + wrap[1]
  }

  // :: (string, number) → string
  // Repeat the given string `n` times.
  repeat (str: string, n: number): string {
    let out = ''
    for (let i = 0; i < n; i++) out += str
    return out
  }

  // : (Mark, bool, string?) → string
  // Get the markdown string for a given opening or closing mark.
  markString (mark: MessageMark, open: boolean, parent: MessageNode, index: number): string {
    const info = this.marks[mark.type]
    const value = open ? info.open : info.close
    return typeof value === 'string' ? value : value(this, mark, parent, index) ?? ''
  }
}
