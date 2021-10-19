/**
 * @public
 */
export interface TrelloAttachment {
  id: string
  name: string
  url: string
  fileName: string
  idMember: string
}

/**
 * @public
 */
export interface TrelloCard {
  id: string // Card id
  idList: string // List id
  name: string
  pos: number
  closed: boolean
  attachments: TrelloAttachment[]
  idMembers: string[]
}

/**
 * @public
 */
export interface TrelloList {
  id: string
  closed: boolean
  name: string
  pos: number
}

/**
 * @public
 */
export interface TrelloBoard {
  id: string
  name: string
  cards: TrelloCard[]
  lists: TrelloList[]
  actions: TrelloAction[]
  members: TrelloMember[]
}

/**
 * @public
 */
export interface TrelloMember {
  id: string
  username: string
  status: string
  avatarUrl: string
  fullName: string
  confirmed: boolean
}

/**
 * @public
 */
export interface TrelloAction {
  id: string
  date: string
  idMemberCreator: string
  memberCreator?: {
    id: string
    avatarUrl: string
    fullName: string
    username: string
  }
  type:
  | 'updateCard'
  | 'addAttachmentToCard'
  | 'commentCard'
  | 'addMemberToCard'
  | 'deleteAttachmentFromCard'
  | 'createCard'
  | 'removeMemberFromCard'
  | 'updateList'
  | 'copyCard'
  | 'copyCommentCard'
  | 'deleteCard'

  data: {
    attachment?: {
      id: string
      name: string
      url: string
    }
    card?: {
      id: string
    }
    text?: string
    idMember?: string
    member?: {
      id: string
      name: string
    }
  }
}
