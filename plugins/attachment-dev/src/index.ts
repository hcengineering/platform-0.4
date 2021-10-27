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

import attachment, { AttachmentService, nameToFormat, UploadAttachment } from '@anticrm/attachment'
import { Class, Doc, generateId, Ref, Space, Storage, TxOperations } from '@anticrm/core'
import { setResource } from '@anticrm/platform'
import { Attachments, AttachmentList } from '@anticrm/attachment-impl'
import AttachmentPreview from './components/AttachmentPreview.svelte'
import mime from 'mime'

export default async (): Promise<AttachmentService> => {
  setResource(attachment.component.Attachments, Attachments)
  setResource(attachment.component.AttachmentPreview, AttachmentPreview)
  setResource(attachment.component.AttachmentList, AttachmentList)
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
    progressCallback?: (item: UploadAttachment, progress: number) => void
  ): Promise<UploadAttachment> {
    const type = mime.getType(file.name) ?? ''
    const format = nameToFormat(file.name)
    const key = (generateId() + '.' + format) as Ref<UploadAttachment>
    files.set(key, file)
    let item: UploadAttachment | undefined
    // eslint-disable-next-line prefer-const
    item = {
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
      progress: 1,
      abort: () => {
        files.delete(key)
      }
    }
    if (progressCallback !== undefined) {
      progressCallback(item, 50)
    }
    await client.createDoc(
      attachment.class.Attachment,
      space,
      {
        objectClass: item.objectClass,
        objectId: item.objectId,
        name: item.name,
        size: item.size,
        format: item.format,
        mime: item.mime,
        url: item.url
      },
      item._id
    )
    if (progressCallback !== undefined) {
      progressCallback(item, 100)
    }
    return item
  }

  return {
    remove,
    authorize,
    createAttachment
  }
}
