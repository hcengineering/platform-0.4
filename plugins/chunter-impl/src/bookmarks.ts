import chunter, { MessageBookmark } from '@anticrm/chunter'
import { generateId } from '@anticrm/core'
import { PresentationClient } from '@anticrm/presentation'
import { getContext, onDestroy, setContext } from 'svelte'

export type BookmarkHandler = (bookmarks: MessageBookmark[], bookmark?: MessageBookmark) => void

interface BookmarkHandleQuery {
  hid: string
  handler: BookmarkHandler
}
interface BookmarkQuery {
  handlers: BookmarkHandleQuery[]
  bookmarks: MessageBookmark[]
}

const BOOKMARK_QUERY = 'chunter-impl.bookmarks'

export function newAllBookmarksQuery (client: PresentationClient, handler: BookmarkHandler): void {
  let query: BookmarkQuery = getContext(BOOKMARK_QUERY)
  if (query !== undefined) {
    const hid = generateId()
    query.handlers.push({ hid: hid, handler })
    onDestroy(() => {
      query.handlers = query.handlers.filter((h) => h.hid !== hid)
    })
    handler(query.bookmarks)
    return
  }

  query = {
    handlers: [],
    bookmarks: []
  }

  setContext(BOOKMARK_QUERY, query)

  const liveQuery = client.query(undefined, chunter.class.Bookmark, {}, (bookmarks) => {
    query.bookmarks = bookmarks
    for (const h of query.handlers) {
      h.handler(bookmarks)
    }
  })
  const hid = generateId()
  query.handlers.push({ hid: hid, handler })
  onDestroy(() => {
    liveQuery.unsubscribe()
  })
}
