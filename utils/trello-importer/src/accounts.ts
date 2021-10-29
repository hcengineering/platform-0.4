import core, { Account, Client, generateDocumentDiff, Ref, Space, TxOperations } from '@anticrm/core'
import { TrelloBoard } from './trello'

export function getAccountName (name: string): {
  firstName: string
  lastName: string
  orig: string
} {
  const sp = name.trim().split(',')
  if (sp.length === 1) {
    const ss = (sp[0] ?? '').trim().split(' ')
    return { firstName: (ss[0] ?? '').trim(), lastName: (ss[1] ?? '').trim(), orig: name }
  }
  return {
    firstName: (sp[0] ?? '').trim(),
    lastName: (sp[1] ?? '').trim(),
    orig: name
  }
}

export async function createUpdateAccounts (
  client: Client & TxOperations,
  board: TrelloBoard,
  spaceRefs: Ref<Space>[]
): Promise<Map<string, Ref<Account>>> {
  const accounts = await client.findAll(core.class.Account, {})
  const allAccounts = new Map<Ref<Account>, Account>(Array.from(accounts).map((c) => [c._id, c]))

  const spaces = await client.findAll(core.class.Space, { _id: { $in: spaceRefs } })

  const membersMap = new Map<string, Ref<Account>>()

  const clientId = await client.accountId()
  for (const c of board.members) {
    const cid = c.username as Ref<Account>
    membersMap.set(c.id, cid)
    const { firstName, lastName } = getAccountName(c.fullName)

    console.log('update account', firstName, lastName, cid)

    const data: Account = {
      _id: cid,
      _class: core.class.Account,
      modifiedOn: Date.now(),
      modifiedBy: clientId,
      createOn: Date.now(),
      space: core.space.Model,
      // Data values
      name: c.username,
      firstName,
      lastName,
      avatar: `https://robohash.org/prefix${firstName}${lastName}?set=set4`,
      email: c.username
    }
    const cand = allAccounts.get(cid)
    if (cand === undefined) {
      // New candidate let's add it.
      await client.createDoc<Account>(core.class.Account, core.space.Model, data, cid)
    } else {
      // Perform update, in case values are different.
      for (const t of generateDocumentDiff([cand], [data])) {
        await client.tx(t)
      }
    }
    // Join selected spaces for selected accounts.
    for (const sp of spaces) {
      if (!Array.from(sp.members).includes(cid)) {
        await client.updateDoc(sp._class, sp.space, sp._id, {
          $push: { members: cid }
        })
      }
    }
  }
  return membersMap
}
