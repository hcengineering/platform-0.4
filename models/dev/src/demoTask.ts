import core, { Account, DerivedDataDescriptor, Doc, generateId, Ref, ShortRef, Space } from '@anticrm/core'
import { Builder } from '@anticrm/model'
import { component, Component } from '@anticrm/status'
import { Project, CheckListItem, Task, TaskStatuses } from '@anticrm/task'
import task from '@anticrm/task-impl/src/plugin'
import chunter from '@anticrm/chunter-impl/src/plugin'
import faker from 'faker'

const demoIds = component('demo-task' as Component, {
  project: {
    DemoProject: '' as Ref<Project>
  }
})

export function demoTask (builder: Builder): void {
  builder.createDoc(
    task.class.Project,
    {
      name: 'PL-DEMO',
      description: 'Demo Task project',
      members: [],
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
      { space: demoIds.project.DemoProject }
    )

    const checkItems: CheckListItem[] = []
    for (let i = 0; i < faker.datatype.number(10); i++) {
      checkItems.push({
        description: `do ${faker.commerce.productDescription()}`,
        done: faker.datatype.boolean()
      })
    }

    const commentSpaceId: Ref<Space> = generateId()
    builder.createDoc(
      core.class.Space,
      {
        name: `${shortRefId} comments`,
        description: `${shortRefId} comments`,
        members: [core.account.System],
        private: false
      },
      commentSpaceId
    )

    for (let i = 0; i < faker.datatype.number(10); i++) {
      builder.createDoc(
        chunter.class.Message,
        {
          message: faker.lorem.paragraphs(3)
        },
        undefined,
        {
          space: commentSpaceId,
          modifiedBy: faker.internet.exampleEmail() as Ref<Account>
        }
      )
    }

    builder.createDoc(
      task.class.Task,
      {
        name: `Do ${faker.commerce.productName()}`,
        description: `do ${faker.commerce.productDescription()}`,
        status: faker.random.arrayElement([TaskStatuses.Open, TaskStatuses.InProgress, TaskStatuses.Closed]),
        shortRefId: shortRefId,
        checkItems: checkItems,
        commentSpace: commentSpaceId
      },
      id,
      { space: demoIds.project.DemoProject }
    )
  }
}
