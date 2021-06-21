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
  getEnclosingWhitespace: (text: string) => { leading: string, trailing: string }
}

type NodeProcessor = (state: IState, node: MessageNode, parent: MessageNode, index: number) => void

// *************************************************************

function backticksFor (node: MessageNode, side: any): string {
  const ticks = /`+/g
  let m: RegExpExecArray | null
  let len = 0
  if (node.type === MessageNodeType.text) {
    while ((m = ticks.exec(node.text ?? '')) !== null) len = Math.max(len, m[0].length)
  }
  let result = len > 0 && side > 0 ? ' `' : '`'
  for (let i = 0; i < len; i++) {
    result += '`'
  }
  if (len > 0 && side < 0) {
    result += ' '
  }
  return result
}

function isPlainURL (link: MessageMark, parent: MessageNode, index: number, side: number): boolean {
  const attrs = markAttrs(link)
  if (attrs.title !== undefined || !/^\w+:/.test(attrs.href)) return false

  const parentContent = messageContent(parent)
  const content = parentContent[index + (side < 0 ? -1 : 0)]
  const marks = [...(content?.marks ?? [])]

  if (content?.type !== MessageNodeType.text || content?.text !== attrs.href || marks[marks.length - 1] !== link) {
    return false
  }
  if (index === (side < 0 ? 1 : parentContent.length - 1)) return true
  const next = parentContent[index + (side < 0 ? -2 : 1)]
  return !isInSet(link, [...(next.marks ?? [])])
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
        state.write('\\\n')
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
      return backticksFor(messageContent(parent)[index], -1)
    },
    close: (state, mark, parent, index) => {
      return backticksFor(messageContent(parent)[index - 1], 1)
    },
    mixable: false,
    expelEnclosingWhitespace: false,
    escape: false
  }
}

export class MarkdownState implements IState {
  nodes: { [key: string]: NodeProcessor }
  marks: { [key: string]: MarkProcessor }
  delim: string
  out: string
  closed: boolean
  closedNode?: MessageNode
  inTightList: boolean
  options: any

  constructor (nodes: any = storeNodes, marks: any = storeMarks, options: any = {}) {
    this.nodes = nodes
    this.marks = marks
    this.delim = this.out = ''
    this.closed = false
    this.inTightList = false

    this.options = options ?? {}
    if (typeof this.options.tightLists === 'undefined') {
      this.options.tightLists = false
    }
  }

  flushClose (size: number): void {
    if (this.closed) {
      if (!this.atBlank()) this.out += '\n'
      if (size == null) size = 2
      if (size > 1) {
        let delimMin = this.delim
        const trim = /\s+$/.exec(delimMin)
        if (trim !== null) delimMin = delimMin.slice(0, delimMin.length - trim[0].length)
        for (let i = 1; i < size; i++) this.out += delimMin + '\n'
      }
      this.closed = false
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
    if (typeof parent === 'number') throw new Error('!')
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

  // :: (Node)
  // Render the contents of `parent` as inline content.
  renderInline (parent: MessageNode): void {
    const active: MessageMark[] = []
    let trailing = ''
    const progress = (node: MessageNode | undefined, index: number): void => {
      let marks: MessageMark[] = node?.marks ?? []

      if (node !== undefined && node.type === MessageNodeType.hard_break) {
        marks = marks.filter((m: MessageMark) => {
          if (index + 1 === parent.content?.length) {
            return false
          }
          if (parent.content !== undefined) {
            const next = parent.content[index + 1]
            return (
              isInSet(m, next?.marks ?? []) &&
              (next.type !== MessageNodeType.text || (next.text !== undefined && /\S/.test(next.text)))
            )
          } else {
            return false
          }
        })
      }

      let leading = trailing
      trailing = ''
      // If whitespace has to be expelled from the node, adjust
      // leading and trailing accordingly.
      if (
        node !== undefined &&
        node.type === MessageNodeType.text &&
        marks.some((mark: MessageMark) => {
          const info = this.marks[mark.type]
          return info?.expelEnclosingWhitespace
        }) &&
        node.text !== undefined
      ) {
        const ex = /^(\s*)(.*?)(\s*)$/m.exec(node.text)
        if (ex !== null) {
          const [_, lead, inner, trail] = ex // eslint-disable-line
          leading += lead
          trailing = trail
          if (lead !== '' || trail !== '') {
            node = inner !== undefined ? { ...node, text: inner } : undefined
            if (node === undefined) marks = active
          }
        }
      }

      const inner: MessageMark | undefined = marks.length > 0 ? marks[marks.length - 1] : undefined
      const noEsc = inner !== undefined && !this.marks[inner.type].escape
      const len = marks.length - (noEsc ? 1 : 0)

      // Try to reorder 'mixable' marks, such as em and strong, which
      // in Markdown may be opened and closed in different order, so
      // that order of the marks for the token matches the order in
      // active.

      // eslint-disable-next-line
      outer: for (let i = 0; i < len; i++) {
        const mark = marks[i]
        if (!this.marks[mark.type].mixable) break
        for (let j = 0; j < active.length; j++) {
          const other = active[j]
          if (!this.marks[other.type].mixable) break
          if (markEq(mark, other)) {
            if (i > j) {
              marks = marks
                .slice(0, j)
                .concat(mark)
                .concat(marks.slice(j, i))
                .concat(marks.slice(i + 1, len))
            } else if (j > i) {
              marks = marks
                .slice(0, i)
                .concat(marks.slice(i + 1, j))
                .concat(mark)
                .concat(marks.slice(j, len))
            }
            continue outer // eslint-disable-line
          }
        }
      }

      // Find the prefix of the mark set that didn't change
      let keep = 0
      while (keep < Math.min(active.length, len) && markEq(marks[keep], active[keep])) {
        ++keep
      }

      // Close the marks that need to be closed
      while (keep < active.length) {
        const mark = active.pop()
        if (mark !== undefined) {
          this.text(this.markString(mark, false, parent, index), false)
        }
      }

      // Output any previously expelled trailing whitespace outside the marks
      if (leading !== '') this.text(leading)

      // Open the marks that need to be opened
      if (node !== undefined) {
        while (active.length < len) {
          const add = marks[active.length]
          active.push(add)
          this.text(this.markString(add, true, parent, index), false)
        }

        // Render the node. Special case code marks, since their content
        // may not be escaped.
        if (inner !== undefined && noEsc && node.type === MessageNodeType.text) {
          this.text(
            this.markString(inner, true, parent, index) +
              (node?.text as string) +
              this.markString(inner, false, parent, index + 1),
            false
          )
        } else {
          this.render(node, parent, index)
        }
      }
    }
    messageContent(parent).forEach(progress)
    progress(undefined, 0)
  }

  // :: (Node, string, (number) → string)
  // Render a node's content as a list. `delim` should be the extra
  // indentation added to all lines except the first in an item,
  // `firstDelim` is a function going from an item index to a
  // delimiter for the first line of the item.
  renderList (node: MessageNode, delim: string, firstDelim: FirstDelim): void {
    if (this.closed && this.closedNode?.type === node.type) {
      this.flushClose(3)
    } else if (this.inTightList) this.flushClose(1)

    const isTight: boolean =
      node.attrs !== undefined && (typeof node.attrs.tight !== 'undefined' ? node.attrs.tight : this.options.tightLists)
    const prevTight = this.inTightList
    this.inTightList = isTight

    messageContent(node).forEach((child: MessageNode, i: number) => {
      if (i > 0 && isTight) this.flushClose(1)
      this.wrapBlock(delim, firstDelim(i), node, () => this.render(child, node, i))
    })
    this.inTightList = prevTight
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
    const wrap = !str.includes('"') ? '""' : !str.includes("'") ? "''" : '()'
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

  // :: (string) → { leading: ?string, trailing: ?string }
  // Get leading and trailing whitespace from a string. Values of
  // leading or trailing property of the return object will be undefined
  // if there is no match.
  getEnclosingWhitespace (text: string): { leading: string, trailing: string } {
    return {
      leading: (text.match(/^(\s+)/) ?? [])[0],
      trailing: (text.match(/(\s+)$/) ?? [])[0]
    }
  }
}
