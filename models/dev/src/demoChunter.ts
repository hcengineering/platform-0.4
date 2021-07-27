import { Channel, Comment, Message, CommentRef } from '@anticrm/chunter'
import chunter from '@anticrm/chunter-impl/src/plugin'
import core, { Account, generateId, getFullRef, Ref } from '@anticrm/core'
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
  const members: Ref<Account>[] = []
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
    members.push(accountId)
  }
  members.push(core.account.System)

  builder.createDoc(
    chunter.class.Channel,
    {
      name: 'PL-CHANNEL',
      description: 'Demo Channel',
      members: members,
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
          replyOf: getFullRef(msgId, chunter.class.Message),
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
        modifiedBy: faker.random.arrayElement(members)
      }
    )
  }
}
