import { Channel, Comment, Message, CommentRef } from '@anticrm/chunter'
import chunter from '@anticrm/chunter-impl/src/plugin'
import core, { Account, generateId, Ref } from '@anticrm/core'
import { Builder } from '@anticrm/model'
import { component, Component } from '@anticrm/status'
import faker from 'faker'

const demoIds = component('demo-task' as Component, {
  project: {
    DemoChannel: '' as Ref<Channel>
  }
})

/**
 * @public
 */
export function demoChunter (builder: Builder): void {
  builder.createDoc(
    chunter.class.Channel,
    {
      name: 'PL-CHANNEL',
      description: 'Demo Channel',
      members: [core.account.System],
      private: false
    },
    demoIds.project.DemoChannel
  )

  const ri = faker.datatype.number(10) + 10

  for (let i = 0; i < ri; i++) {
    const msgId: Ref<Message> = generateId()
    const comments: CommentRef[] = []
    const ci = faker.datatype.number(15)
    for (let j = 0; j < ci; j++) {
      const userId = faker.internet.exampleEmail() as Ref<Account>
      const cid: Ref<Comment> = generateId()
      comments.push({ _id: cid, userId })
      builder.createDoc(
        chunter.class.Comment,
        {
          replyOf: msgId,
          message: faker.lorem.paragraphs(2)
        },
        cid,
        {
          space: demoIds.project.DemoChannel,
          modifiedBy: userId
        }
      )
    }

    builder.createDoc(
      chunter.class.Message,
      {
        message: faker.lorem.paragraphs(3),
        comments
      },
      msgId,
      {
        space: demoIds.project.DemoChannel,
        modifiedBy: faker.internet.exampleEmail() as Ref<Account>
      }
    )
  }
}
