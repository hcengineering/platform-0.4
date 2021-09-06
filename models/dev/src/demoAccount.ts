import core, { Account, Ref } from '@anticrm/core'
import { Builder } from '@anticrm/model'
import faker from 'faker'

export const accountIds: Ref<Account>[] = []
export function demoAccount (builder: Builder): void {
  builder.createDoc(
    core.class.Account,
    {
      email: 'system',
      name: 'System user',
      avatar: faker.image.avatar()
    },
    core.account.System
  )
  for (let i = 0; i < 11; i++) {
    const accountId: Ref<Account> = `demo_account_id${i}` as Ref<Account>
    builder.createDoc(
      core.class.Account,
      {
        email: faker.internet.email(),
        name: faker.internet.userName(),
        avatar: faker.image.avatar()
      },
      accountId
    )
    accountIds.push(accountId)
  }
}
