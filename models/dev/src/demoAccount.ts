import core, { Account, Ref } from '@anticrm/core'
import faker from 'faker'
import { DemoBuilder } from './model'

/**
 * @public
 */
export const accountIds: Ref<Account>[] = []

/**
 * @public
 */
export async function demoAccount (builder: DemoBuilder, accounts = 11): Promise<void> {
  await builder.createDoc(
    core.class.Account,
    {
      email: 'system',
      name: 'System user',
      avatar: faker.image.avatar()
    },
    core.account.System,
    {
      space: core.space.Model
    }
  )
  for (let i = 0; i < accounts; i++) {
    const accountId: Ref<Account> = `demo_account_id${i}` as Ref<Account>
    await builder.createDoc(
      core.class.Account,
      {
        email: faker.internet.email(),
        name: faker.internet.userName(),
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        avatar: faker.image.avatar()
      },
      accountId,
      {
        space: core.space.Model
      }
    )
    accountIds.push(accountId)
  }
}
