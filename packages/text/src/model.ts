/**
 * @public
 */
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
/**
 * @public
 */
export enum MessageMarkType {
  link = 'link',
  em = 'em',
  strong = 'strong',
  code = 'code',
  reference = 'reference'
}
/**
 * @public
 */
export interface MessageMark {
  type: MessageMarkType
  attrs: { [key: string]: any } // A map of attributes
}
/**
 * @public
 */
export interface MessageNode {
  type: MessageNodeType
  content?: MessageNode[] // A list of child nodes
  marks?: MessageMark[]
  attrs?: { [key: string]: string }
  text?: string
}
/**
 * @public
 */
export function newMessageDocument (): MessageNode {
  return {
    type: MessageNodeType.doc,
    content: [{ type: MessageNodeType.paragraph }]
  }
}
/**
 * @public
 */
export interface LinkMark extends MessageMark {
  href: string
  title: string
}
/**
 * @public
 */
export interface ReferenceMark extends MessageMark {
  attrs: { id: string, class: string }
}
