/**
 * @public
 */
export interface TrelloCard {
  id: string // Card id
  idList: string // List id
  name: string
  pos: number
  closed: boolean
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
}
