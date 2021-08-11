import { Channel, Comment, Message, CommentRef } from '@anticrm/chunter'
import chunter from '@anticrm/chunter'
import core, { Account, generateId, getFullRef, Ref } from '@anticrm/core'
import { Builder } from '@anticrm/model'
import { component, Component } from '@anticrm/status'
import faker from 'faker'
import { accountIds } from './demoAccount'

const demoIds = component('demo-task' as Component, {
  project: {
    DemoChannel: '' as Ref<Channel>
  }
})

/**
 * @public
 */
export function demoChunter (builder: Builder): void {
  const members: Ref<Account>[] = [core.account.System, ...accountIds]
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
      const userId = faker.random.arrayElement(accountIds)
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
          modifiedOn: Date.now(),
          createOn: Date.now(),
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
        modifiedBy: faker.random.arrayElement(accountIds),
        modifiedOn: Date.now(),
        createOn: Date.now()
      }
    )
  }
}
