import core, { Account, generateId, Ref } from '@anticrm/core'
import { Builder } from '@anticrm/model'
import faker from 'faker'

export const accountIds: Ref<Account>[] = []
export function demoAccount (builder: Builder): void {
  builder.createDoc(
    core.class.Account,
    {
      name: 'System user'
    },
    core.account.System
  )
  for (let i = 0; i < 2 + faker.datatype.number(8); i++) {
    const accountId: Ref<Account> = generateId()
    builder.createDoc(
      core.class.Account,
      {
        name: faker.internet.exampleEmail() as Ref<Account>,
        avatar: faker.image.avatar()
      },
      accountId
    )
    accountIds.push(accountId)
  }
}
