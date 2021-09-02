//
// Copyright © 2020 Anticrm Platform Contributors.
//
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
//

import type { RecruitingService } from '@anticrm/recruiting'
import { setResource } from '@anticrm/platform'
import recruiting from '@anticrm/recruiting'
import calendar from '@anticrm/calendar'
import { Action } from '@anticrm/action'

const Factorial = new Action()
  .exec(async () => [20, 1])
  .exec(
    async (ctx) => {
      const [n, acc] = ctx.pop()

      await new Promise(resolve => setTimeout(resolve, 2000))

      return [n - 1, acc * n]
    },
    'fact'
  )
  .goto(
    'fact',
    async (ctx) => {
      const top = ctx.pop()
      ctx.push(top)

      return top[0] !== 0
    }
  )
  .exec(async (ctx) => {
    const [, acc] = ctx.pop()

    return acc
  })

const RecurFactorial = new Action()
  .exec(async () => [20, 1])
  .exec(
    async (ctx) => {
      const [n, acc] = ctx.pop()

      await new Promise(resolve => setTimeout(resolve, 2000))

      if (n === 0) {
        return acc
      }

      return await ctx.recur([n - 1, acc * n])
    }
  )

const Interview = new Action()
  .call(calendar.action.waitForEvent)

export default async (): Promise<RecruitingService> => {
  setResource(recruiting.action.Factorial, Factorial)
  setResource(recruiting.action.RecurFactorial, RecurFactorial)
  setResource(recruiting.action.Interview, Interview)
  return {}
}
