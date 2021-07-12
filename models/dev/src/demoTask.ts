import core, { DerivedDataDescriptor, Doc, generateId, Ref, Title, ShortRef } from '@anticrm/core'
import { Builder } from '@anticrm/model'
import { component, Component } from '@anticrm/status'
import { Project } from '@anticrm/task'
import task, { Task, TaskStatus } from '@anticrm/task-impl/src/plugin'
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

  // Create title derived data
  const did: Ref<DerivedDataDescriptor<Doc, Title>> = generateId()
  builder.createDoc(
    core.class.DerivedDataDescriptor,
    {
      sourceClass: task.class.Task,
      targetClass: core.class.Title,
      initiValue: {},
      rules: [{ sourceField: 'name', targetField: 'title' }]
    },
    did
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

    builder.createDoc(
      task.class.Task,
      {
        name: `Do ${faker.commerce.productName()}`,
        description: `do ${faker.commerce.productDescription()}`,
        status: faker.random.arrayElement([
          TaskStatus.Open,
          TaskStatus.InProgress,
          TaskStatus.Closed,
          TaskStatus.Resolved
        ]),
        shortRefId: shortRefId
      },
      id,
      { space: demoIds.project.DemoProject }
    )
  }
}
