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

import attachment, { AttachmentService, nameToFormat, UploadAttachmet } from '@anticrm/attachment'
import { Class, Doc, generateId, Ref, Space, Storage, TxOperations } from '@anticrm/core'
import { setResource } from '@anticrm/platform'
import { Attachments } from '@anticrm/attachment-impl'
import AttachmentPreview from './components/AttachmentPreview.svelte'
import mime from 'mime'

export default async (): Promise<AttachmentService> => {
  setResource(attachment.component.Attachments, Attachments)
  setResource(attachment.component.AttachmentPreview, AttachmentPreview)
  const files: Map<string, File> = new Map<string, File>()

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

  async function createAttachment (
    file: File,
    objectId: Ref<Doc>,
    objectClass: Ref<Class<Doc>>,
    space: Ref<Space>,
    client: Storage & TxOperations,
    progressCallback?: (progress: number) => void
  ): Promise<UploadAttachmet> {
    const type = mime.getType(file.name) ?? ''
    const format = nameToFormat(file.name)
    const key = (generateId() + '.' + format) as Ref<UploadAttachmet>
    files.set(key, file)
    const item = {
      objectClass: objectClass,
      objectId: objectId,
      name: file.name,
      size: file.size,
      format: format,
      mime: type,
      url: encodeURI(generateLink(key, space, file.name, format)),
      space: space,
      modifiedBy: client.accountId(),
      modifiedOn: Date.now(),
      createOn: Date.now(),
      _class: attachment.class.Attachment,
      _id: key,
      progress: 0,
      abort: () => {}
    }
    item.abort = () => {
      files.delete(key)
    }
    if (progressCallback !== undefined) {
      progressCallback(100)
    }
    return item
  }

  return {
    remove,
    authorize,
    createAttachment
  }
}
