import { Action, Context } from '@anticrm/action'
import type { ExecutionContext as CompleteExecutionContext } from '@anticrm/action-plugin'
import type { Doc } from '@anticrm/core'
import { getResource } from '@anticrm/platform'
import { Resource } from '@anticrm/status'

import { Service } from './service'

type ExecutionContext = Omit<CompleteExecutionContext, keyof Doc>

export async function exec (
  { program, labelMap }: Action,
  svc: Service,
  ctx: ExecutionContext = { stack: [], counter: [0] },
  parentCnt: number[] = []
): Promise<void> {
  const stack = [...ctx.stack]
  let counter = ctx.counter[0]

  while (counter < program.length) {
    const atom = program[counter]
    let recur = false

    const atomCtx: Context = {
      recur: async (ret) => {
        stack.push(ret)
        await svc.commit()
        await svc.saveContext({ stack, counter: [...parentCnt, counter] })

        recur = true
      },
      pop: () => stack.pop(),
      push: (item: any) => stack.push(item),
      create: svc.create.bind(svc),
      update: svc.update.bind(svc),
      subscribe: svc.subscribe.bind(svc),
      findAll: svc.findAll.bind(svc)
    }

    if (atom._type === 'goto') {
      const ret = await atom.cond(atomCtx)

      if (recur) {
        continue
      }

      counter = ret ? (labelMap.get(atom.label)) ?? counter + 1 : counter + 1
    }

    if (atom._type === 'fn') {
      const ret = await atom.fn(atomCtx)

      if (recur) {
        continue
      }

      if (ret !== undefined) {
        stack.push(ret)
      }
      counter++
    }

    if (atom._type === 'action') {
      const [, ...restCntrs] = ctx.counter
      const action = await getResource(atom.action as Resource<Action>)

      if (action === undefined) {
        throw Error(`Unable to resolve action: ${atom.action}`)
      }

      const ret = await exec(action, svc, { stack, counter: restCntrs.length > 0 ? restCntrs : [0] }, [
        ...parentCnt,
        counter
      ])

      stack.push(ret)
      counter++
    }

    await svc.commit()
    await svc.saveContext({ stack, counter: [...parentCnt, counter] })
  }
}
