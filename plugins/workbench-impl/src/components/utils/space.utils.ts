import type { SpacesNavModel } from '@anticrm/workbench'
import type { Account, Ref, Space } from '@anticrm/core'
import core from '@anticrm/core'

export function buildUserSpace (account: Ref<Account>, model?: SpacesNavModel): Space | undefined {
  if (model?.userSpace === undefined) {
    return undefined
  }

  return {
    _id: account.toString() as Ref<Space>,
    _class: model.spaceClass,
    space: core.space.Model,
    createOn: Date.now(),
    modifiedOn: Date.now(),
    modifiedBy: account,
    ...model.userSpace,
    members: [account]
  }
}
