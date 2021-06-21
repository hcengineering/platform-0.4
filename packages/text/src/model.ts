export enum MessageNodeType {
  doc = 'doc',
  paragraph = 'paragraph',
  blockquote = 'blockquote',
  horizontal_rule = 'horizontal_rule',
  heading = 'heading',
  code_block = 'code_block',
  text = 'text',
  image = 'image',
  hard_break = 'hard_break',
  ordered_list = 'ordered_list',
  bullet_list = 'bullet_list',
  list_item = 'list_item'
}

export enum MessageMarkType {
  link = 'link',
  em = 'em',
  strong = 'strong',
  code = 'code',
  reference = 'reference'
}

export interface MessageMark {
  type: MessageMarkType
  attrs: { [key: string]: any } // A map of attributes
}

export interface MessageNode {
  type: MessageNodeType
  content?: MessageNode[] // A list of child nodes
  marks?: MessageMark[]
  attrs?: { [key: string]: string }
  text?: string
}

export function newMessageDocument (): MessageNode {
  return {
    type: MessageNodeType.doc,
    content: [{ type: MessageNodeType.paragraph }]
  }
}

export interface LinkMark extends MessageMark {
  href: string
  title: string
}

export interface ReferenceMark extends MessageMark {
  attrs: { id: string, class: string }
}
