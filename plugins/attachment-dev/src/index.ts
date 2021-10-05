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

import type { AttachmentService } from '@anticrm/attachment'
import { Ref, Space } from '@anticrm/core'

export default async (): Promise<AttachmentService> => {
  const files: Map<string, File> = new Map<string, File>()
  async function upload (
    file: File,
    key: string,
    space: Ref<Space>,
    progressCallback?: (progress: number) => void
  ): Promise<() => void> {
    if (progressCallback != null) {
      progressCallback(100)
    }
    return await new Promise(function (resolve, reject) {
      files.set(key, file)
      resolve(() => {
        files.delete(key)
      })
    })
  }

  async function remove (key: string, space: Ref<Space>): Promise<void> {
    return await new Promise(function (resolve, reject) {
      files.delete(key)
      resolve()
    })
  }

  function generateLink (key: string, space: Ref<Space>, name: string, format: string): string {
    const item = files.get(key)
    if (item !== null) {
      return URL.createObjectURL(item)
    }
    return ''
  }

  async function authorize (token: string): Promise<void> {
    return await new Promise(function (resolve, reject) {
      resolve()
    })
  }

  return {
    upload,
    remove,
    generateLink,
    authorize
  }
}
