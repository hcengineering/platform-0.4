import chunter, { Channel, Comment, Message, MessageBookmark } from '@anticrm/chunter'
import core, { Account, getFullRef, Ref } from '@anticrm/core'
import { component, Component } from '@anticrm/status'
import type { Task } from '@anticrm/task'
import faker from 'faker'
import { accountIds } from './demoAccount'
import { createAttachment } from './demoAttachment'
import { DemoBuilder } from './model'

const demoIds = component('demo-channel' as Component, {
  channel: {
    DemoChannel: '' as Ref<Channel>
  }
})

/**
 * @public
 */
export async function demoChunter (builder: DemoBuilder, tasks: Task[], dmc = 3, ri = 100): Promise<void> {
  const members: Ref<Account>[] = [core.account.System, ...accountIds]
  await builder.createDoc(
    chunter.class.Channel,
    {
      name: 'PL-CHANNEL',
      description: 'Demo Channel',
      members: members,
      direct: false,
      private: false
    },
    demoIds.channel.DemoChannel,
    {
      space: core.space.Model
    }
  )

  // Create few direct message spaces
  for (let i = 0; i < dmc; i++) {
    let ms = faker.random.arrayElements(members, faker.datatype.number(members.length) + 1)
    if (!ms.includes(core.account.System)) {
      ms = [core.account.System, ...ms]
    }
    await builder.createDoc(
      chunter.class.Channel,
      {
        name: 'direct-message',
        description: 'My direct mesage',
        members: ms,
        direct: true,
        private: true
      },
      `dmc-${i}` as Ref<Channel>
    )
  }

  const cii = [2, 0, 4, 7, 20, 30, 1, 2, 3, 1]
  let cind = 0
  for (let i = 0; i < ri; i++) {
    if (i % 500 === 0) {
      console.info('message creation', i, ri)
    }
    const msgId: Ref<Message> = `mid-${i}` as Ref<Message>
    const ci = cii[i % cii.length]
    for (let j = 0; j < ci; j++) {
      const userId = faker.random.arrayElement(accountIds)
      const cid: Ref<Comment> = `cid-${cind++}` as Ref<Comment>
      await builder.createDoc(
        chunter.class.Comment,
        {
          replyOf: getFullRef(msgId, chunter.class.Message),
          message: faker.lorem.paragraphs(2)
        },
        cid,
        {
          space: demoIds.channel.DemoChannel,
          modifiedOn: Date.now(),
          createOn: Date.now(),
          modifiedBy: userId
        }
      )
    }

    let msgText = faker.lorem.paragraphs(3)

    if (i === ri - 1) {
      // Last message
      msgText = faker.lorem.paragraphs(1)
      msgText += ` Hello [${tasks[0].shortRefId as string}](ref://task.Task#${tasks[0]._id})`
      msgText += ` Hello2 [${tasks[1].shortRefId as string}](ref://task.Task#${tasks[1]._id})`
      msgText += faker.lorem.paragraphs(1)
    }

    if (i === ri - 2) {
      // Last message
      msgText = faker.lorem.paragraphs(1)
      msgText += ' Youtube Page [Demo page](https://www.youtube.com/watch?v=LXb3EKWsInQ)'
      msgText += faker.lorem.paragraphs(1)
    }

    if (i === ri - 3) {
      // Last message
      msgText = faker.lorem.paragraphs(1)
      msgText += ' Github link [#261](https://github.com/hardcoreeng/platform/issues/261)'
      msgText += faker.lorem.paragraphs(1)
    }

    if (i === ri - 4) {
      const attachment = await createAttachment(msgId, chunter.class.Message, builder, 1)
      msgText = faker.lorem.paragraphs(1)
      msgText += ` [${attachment.name}](${attachment.url})`
    }

    if (i === ri - 5) {
      const attachment = await createAttachment(msgId, chunter.class.Message, builder, 2)
      msgText = faker.lorem.paragraphs(1)
      msgText += ` [${attachment.name}](${attachment.url})`
    }

    if (i === ri - 6) {
      const attachment = await createAttachment(msgId, chunter.class.Message, builder, 3)
      msgText = faker.lorem.paragraphs(1)
      msgText += ` [${attachment.name}](${attachment.url})`
    }

    await builder.createDoc(
      chunter.class.Message,
      {
        message: msgText,
        comments: []
      },
      msgId,
      {
        space: demoIds.channel.DemoChannel,
        modifiedBy: faker.random.arrayElement(accountIds),
        modifiedOn: Date.now(),
        createOn: Date.now()
      }
    )

    if (i % 3 === 0) {
      await builder.createDoc(
        chunter.class.Bookmark,
        {
          message: msgId,
          channelPin: true
        },
        `${msgId}pin${i}` as Ref<MessageBookmark>,
        {
          space: demoIds.channel.DemoChannel,
          modifiedBy: i % 2 === 0 ? faker.random.arrayElement(accountIds) : core.account.System,
          modifiedOn: Date.now(),
          createOn: Date.now()
        }
      )
    }
  }
}
