import { Account, Class, Collection, Data, Doc, Emb, Obj, Ref, Space } from '@anticrm/core'
import { Component, component } from '../../../../packages/core/node_modules/@anticrm/status/lib'

export interface TaskComment extends Emb {
  message: string
  author: string
  date: Date
}

export enum TaskStatus {
  Open,
  Close,
  Resolved = 100,
  InProgress
}

export enum TaskReproduce {
  Always='always',
  Rare='rare',
  Sometimes='sometimes'
}

export interface Task extends Doc {
  name: string
  description: string
  rate?: number
  comments?: Collection<TaskComment>
  eta?: TaskEstimate
  status?: TaskStatus
  reproduce?: TaskReproduce
}

/**
   * Define ROM and Estimated Time to arrival
   */
export interface TaskEstimate extends Obj {
  rom: number // in hours
  eta: number // in hours
}

export interface TaskMixin extends Task {
  textValue?: string
}

export interface TaskWithSecond extends Task {
  secondTask: string | null
}

export const taskIds = component('core' as Component, {
  class: {
    Task: '' as Ref<Class<Task>>,
    TaskEstimate: '' as Ref<Class<TaskEstimate>>,
    TaskComment: '' as Ref<Class<TaskComment>>
  }
  //   mixin: {
  //     TaskMixin: '' as Ref<Mixin<TaskMixin>>
  //   },
//   enum: {
//     TaskStatus: '' as Ref<Enum<TaskStatus>>,
//     TaskReproduce: '' as Ref<Enum<TaskReproduce>>
//   }
})

/**
   * Create a random task with name specified
   * @param name
   */
export function createTask (name: string, rate: number, description: string): Data<Task> {
  return {
    name,
    description,
    rate
  }
}

export const doc1: Task = {
  _id: 'd1' as Ref<Task>,
  _class: taskIds.class.Task,
  name: 'my-space',
  description: 'some-value',
  rate: 20,
  modifiedBy: 'user' as Ref<Account>,
  modifiedOn: 10,
  space: '' as Ref<Space>
}
