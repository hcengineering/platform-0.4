import type { WithMessage } from '@anticrm/chunter'
import type { Account, Ref, Timestamp } from '@anticrm/core'

export interface MessageData {
  _id: Ref<WithMessage>
  message: string
  modifiedOn: Timestamp
  createOn: Timestamp
  modifiedBy: Ref<Account>
}
