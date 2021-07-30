import core, { Account, DerivedDataDescriptor, Doc, generateId, getFullRef, Ref, ShortRef } from '@anticrm/core'
import { Builder } from '@anticrm/model'
import { component, Component } from '@anticrm/status'
import { Project, CheckListItem, Task, TaskStatuses } from '@anticrm/task'
import task from '@anticrm/task-impl/src/plugin'
import faker from 'faker'
import chunter from '@anticrm/chunter-impl/src/plugin'
import { Comment } from '@anticrm/chunter'
import { accountIds } from './demoAccount'

const demoIds = component('demo-task' as Component, {
  project: {
    DemoProject: '' as Ref<Project>
  }
})

/**
 * @public
 */
export function demoTask (builder: Builder): void {
  const members: Ref<Account>[] = [core.account.System, ...accountIds]

  builder.createDoc(
    task.class.Project,
    {
      name: 'PL-DEMO',
      description: 'Demo Task project',
      members: members,
      private: false
    },
    demoIds.project.DemoProject
  )

  const taskCount = faker.datatype.number(20) + 10
  const DESCRIPTOR_SHORTREF = '#shortRef' as Ref<DerivedDataDescriptor<Doc, ShortRef>>
  for (let i = 0; i < taskCount; i++) {
    const id: Ref<Task> = generateId()
    const shortRefId: Ref<ShortRef> = `TSK-${i}` as Ref<ShortRef>
    // Create short references
    builder.createDoc(
      core.class.ShortRef,
      {
        title: `TSK-${i}`,
        objectClass: task.class.Task,
        objectId: id,
        descriptorId: DESCRIPTOR_SHORTREF,
        namespace: 'TSK',
        counter: i
      },
      shortRefId,
      {
        space: demoIds.project.DemoProject,
        modifiedOn: Date.now()
      }
    )

    const checkItems: CheckListItem[] = []
    for (let i = 0; i < faker.datatype.number(10); i++) {
      checkItems.push({
        description: `do ${faker.commerce.productDescription()}`,
        done: faker.datatype.boolean()
      })
    }

    const comments: Ref<Comment>[] = []

    for (let i = 0; i < faker.datatype.number(10); i++) {
      const commentId = generateId()
      builder.createDoc(
        chunter.class.Comment,
        {
          message: faker.lorem.paragraphs(3),
          replyOf: getFullRef(id, task.class.Task)
        },
        commentId,
        {
          space: demoIds.project.DemoProject,
          modifiedBy: faker.random.arrayElement(accountIds),
          modifiedOn: Date.now()
        }
      )
      comments.push(commentId as Ref<Comment>)
    }

    builder.createDoc(
      task.class.Task,
      {
        name: `Do ${faker.commerce.productName()}`,
        description: `do ${faker.commerce.productDescription()}`,
        status: faker.random.arrayElement([TaskStatuses.Open, TaskStatuses.InProgress, TaskStatuses.Closed]),
        shortRefId: shortRefId,
        checkItems: checkItems,
        assignee: faker.random.arrayElement(members),
        comments: comments,
        dueTo: faker.date.soon()
      },
      id,
      { space: demoIds.project.DemoProject }
    )
  }
}
