//
// Copyright © 2021 Anticrm Platform Contributors.
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

type Task<T> = () => Promise<T>

export class TaskQueue {
  private readonly queue: Array<Task<any>> = []
  private inProgress = false

  async add<T> (task: Task<T>): Promise<T> {
    const ret = new Promise<T>((resolve, reject) => {
      this.queue
        .push(async () => {
          await task()
            .then(resolve)
            .catch(reject)
        })
    })

    await this.dequeue()

    return await ret
  }

  async dequeue (): Promise<void> {
    if (this.inProgress) {
      return
    }

    const task = this.queue.shift()

    if (task === undefined) {
      return
    }

    this.inProgress = true
    await task()
    this.inProgress = false

    await this.dequeue()
  }
}
