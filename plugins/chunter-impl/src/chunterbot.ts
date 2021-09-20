import type { Account } from '@anticrm/core'
import chunter from '@anticrm/chunter'

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export const chunterbotAcc = {
  _id: chunter.account.Chunterbot,
  name: 'Chunterbot',
  email: 'chunterbot@hc.engineering',
  avatar: 'https://robohash.org/chunterbot'
} as Account
