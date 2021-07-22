import core from '@anticrm/core'
import { Builder } from '@anticrm/model'

export function demoAccount (builder: Builder): void {
  builder.createDoc(
    core.class.Account,
    {
      name: 'System user'
    },
    core.account.System
  )
}
