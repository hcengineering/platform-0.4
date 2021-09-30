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
import attachment from '@anticrm/attachment'
import { Ref, Space } from '@anticrm/core'
import { getMetadata } from '@anticrm/platform'
import { PlatformError, Status, Severity } from '@anticrm/status'

export { default as Attachments } from './components/Attachments.svelte'

export default async (): Promise<AttachmentService> => {
  const fileServerURL = getMetadata(attachment.metadata.FilesUrl) ?? ''
  if (fileServerURL === '') {
    throw new PlatformError(new Status(Severity.ERROR, attachment.status.NoFileServerUri, {}))
  }
  const url = fileServerURL + '/file'

  async function upload (
    file: File,
    key: string,
    space: Ref<Space>,
    progressCallback?: (progress: number) => void
  ): Promise<void> {
    const params = {
      key,
      space,
      type: file.type
    }
    const req = await fetch(url, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json;charset=utf-8'
      },
      body: JSON.stringify(params)
    })
    const result = await req.text()
    await uploadToServer(result, file, progressCallback)
  }

  async function uploadToServer (
    url: string,
    file: File,
    progressCallback?: (progress: number) => void
  ): Promise<XMLHttpRequest> {
    return await new Promise(function (resolve, reject) {
      const xhr = new XMLHttpRequest()

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            resolve(xhr)
          } else {
            reject(xhr)
          }
        }
      }

      if (progressCallback != null) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / file.size) * 100
            progressCallback(percentComplete)
          }
        }
      }

      xhr.open('PUT', url)
      xhr.send(file)
    })
  }

  async function remove (key: string, space: Ref<Space>): Promise<void> {
    const params = {
      key,
      space
    }
    await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json;charset=utf-8'
      },
      body: JSON.stringify(params)
    })
  }

  function generateLink (key: string, space: Ref<Space>, name: string, format: string): string {
    const regex = RegExp(`${format}$`)
    const downloadName = regex.test(name) ? name : name + '.' + format
    return `${url}/${space}/${key}/${downloadName}`
  }

  async function authorize (token: string): Promise<void> {
    await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        Token: token
      }
    })
  }

  return {
    upload,
    remove,
    generateLink,
    authorize
  }
}
