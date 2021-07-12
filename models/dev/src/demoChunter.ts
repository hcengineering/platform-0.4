import { Channel } from '@anticrm/chunter'
import chunter from '@anticrm/chunter-impl/src/plugin'
import { Account, Ref } from '@anticrm/core'
import { Builder } from '@anticrm/model'
import { component, Component } from '@anticrm/status'
import faker from 'faker'

const demoIds = component('demo-task' as Component, {
  project: {
    DemoChannel: '' as Ref<Channel>
  }
})
export function demoChunter (builder: Builder): void {
  builder.createDoc(
    chunter.class.Channel,
    {
      name: 'PL-CHANNEL',
      description: 'Demo Channel',
      members: [],
      private: false
    },
    demoIds.project.DemoChannel
  )

  const ri = faker.datatype.number(10) + 10

  for (let i = 0; i < ri; i++) {
    builder.createDoc(
      chunter.class.Message,
      {
        message: faker.lorem.paragraphs(3),
        replyCount: faker.datatype.number(10)
      },
      undefined,
      {
        space: demoIds.project.DemoChannel,
        modifiedBy: faker.internet.exampleEmail() as Ref<Account>
      }
    )
  }
}
