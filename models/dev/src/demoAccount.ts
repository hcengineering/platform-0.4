import core, { Account, Ref } from '@anticrm/core'
import { Builder } from '@anticrm/model'
import faker from 'faker'

export const accountIds: Ref<Account>[] = []
export function demoAccount (builder: Builder): void {
  builder.createDoc(
    core.class.Account,
    {
      name: 'System user',
      avatar: faker.image.avatar()
    },
    core.account.System
  )
  for (let i = 0; i < 2 + faker.datatype.number(8); i++) {
    const accountId: Ref<Account> = faker.internet.exampleEmail() as Ref<Account>
    builder.createDoc(
      core.class.Account,
      {
        name: faker.internet.userName(),
        avatar: faker.image.avatar()
      },
      accountId
    )
    accountIds.push(accountId)
  }
}
