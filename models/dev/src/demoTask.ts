import chunter, { Comment } from '@anticrm/chunter'
import core, { Account, DerivedDataDescriptor, Doc, getFullRef, Ref, ShortRef } from '@anticrm/core'
import { component, Component } from '@anticrm/status'
import task, { CheckListItem, Project, Task, TaskStatuses } from '@anticrm/task'
import faker from 'faker'
import { accountIds } from './demoAccount'
import { DemoBuilder } from './model'

const demoIds = component('demo-task' as Component, {
  project: {
    DemoProject: '' as Ref<Project>
  }
})

/**
 * @public
 */
export async function demoTask (builder: DemoBuilder, taskCount = 7): Promise<Task[]> {
  const members: Ref<Account>[] = [core.account.System, ...accountIds]

  console.error('generate demo project')
  await builder.createDoc(
    task.class.Project,
    {
      name: 'PL-DEMO',
      description: 'Demo Task project',
      members: members,
      private: false
    },
    demoIds.project.DemoProject,
    {
      space: core.space.Model
    }
  )

  const sTasks = [1, 4, 2, 0, 10, 1, 5]
  const sComments = [2, 5, 1, 0, 2, 0, 3]
  const DESCRIPTOR_SHORTREF = '#shortRef' as Ref<DerivedDataDescriptor<Doc, ShortRef>>
  const tasks: Task[] = []
  let commentIds = 0
  for (let i = 0; i < taskCount; i++) {
    if (i % 500 === 0) {
      console.info('task creation', i, taskCount)
    }
    const id: Ref<Task> = `tid-${i}` as Ref<Task>
    const shortRefId: Ref<ShortRef> = `TSK-${i}` as Ref<ShortRef>
    // Create short references
    await builder.createDoc(
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
        modifiedOn: Date.now(),
        createOn: Date.now()
      }
    )

    const checkItems: CheckListItem[] = []
    for (let j = 0; j < sTasks[i % sTasks.length]; j++) {
      checkItems.push({
        description: `do ${faker.commerce.productDescription()}`,
        done: faker.datatype.boolean()
      })
    }

    for (let j = 0; j < sComments[i % sComments.length]; j++) {
      const commentId = `t-cid-${commentIds++}` as Ref<Comment>
      const userId = faker.random.arrayElement(accountIds)
      await builder.createDoc(
        chunter.class.Comment,
        {
          message: faker.lorem.paragraphs(3),
          replyOf: getFullRef(id, task.class.Task)
        },
        commentId,
        {
          space: demoIds.project.DemoProject,
          modifiedBy: userId,
          modifiedOn: Date.now(),
          createOn: Date.now()
        }
      )
    }

    tasks.push(
      await builder.createDoc<Task>(
        task.class.Task,
        {
          name: `Do ${faker.commerce.productName()}`,
          description: `do ${faker.commerce.productDescription()}`,
          status: faker.random.arrayElement([TaskStatuses.Open, TaskStatuses.InProgress, TaskStatuses.Closed]),
          shortRefId: shortRefId,
          checkItems: checkItems,
          assignee: faker.random.arrayElement(members),
          comments: [],
          dueTo: faker.date.soon()
        },
        id,
        { space: demoIds.project.DemoProject }
      )
    )
  }
  return tasks
}
