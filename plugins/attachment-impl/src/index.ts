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
import { Class, Doc, generateId, getFullRef, Ref, Space, Storage, TxOperations } from '@anticrm/core'
import { getMetadata, setResource } from '@anticrm/platform'
import { PlatformError, Status, Severity } from '@anticrm/status'
import Attachments from './components/Attachments.svelte'
import AttachmentPreview from './components/AttachmentPreview.svelte'
import AttachmentList from './components/AttachmentList.svelte'
import AvatarEditor from './components/AvatarEditor.svelte'
import AttachmentsTableCell from './components/AttachmentsTableCell.svelte'
import mime from 'mime'

// use for attachment-dev only
export { default as Attachments } from './components/Attachments.svelte'
export { default as AttachmentList } from './components/AttachmentList.svelte'
export { default as AttachmentView } from './components/AttachmentView.svelte'
export { default as AttachmentViewer } from './components/AttachmentViewer.svelte'
export { default as AvatarEditor } from './components/AvatarEditor.svelte'
export { default as AttachmentsTableCell } from './components/AttachmentsTableCell.svelte'

export default async (): Promise<AttachmentService> => {
  setResource(attachment.component.Attachments, Attachments)
  setResource(attachment.component.AttachmentList, AttachmentList)
  setResource(attachment.component.AttachmentPreview, AttachmentPreview)
  setResource(attachment.component.AvatarEditor, AvatarEditor)
  setResource(attachment.component.AttachmentsTableCell, AttachmentsTableCell)
  const fileServerURL = getMetadata(attachment.metadata.FilesUrl) ?? ''
  if (fileServerURL === '') {
    throw new PlatformError(new Status(Severity.ERROR, attachment.status.NoFileServerUri, {}))
  }
  const url = fileServerURL + '/file'

  async function upload (
    file: File,
    key: string,
    space: Ref<Space>,
    progressCallback?: (progress: number) => void,
    uploadCallback?: () => void
  ): Promise<() => void> {
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
    return uploadToServer(result, file, progressCallback, uploadCallback)
  }

  function uploadToServer (
    url: string,
    file: File,
    progressCallback?: (progress: number) => void,
    uploadCallback?: () => void
  ): () => void {
    const xhr = new XMLHttpRequest()

    if (progressCallback !== undefined) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / file.size) * 100
          progressCallback(percentComplete)
        }
      }
    }

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        if (uploadCallback !== undefined) {
          uploadCallback()
        }
      }
    }

    xhr.open('PUT', url, true)
    xhr.send(file)
    return () => {
      xhr.abort()
    }
  }

  async function remove (key: string, space: Ref<Space>): Promise<void> {
    const params = {
      key,
      space
    }
    await fetch(url, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json;charset=utf-8'
      },
      body: JSON.stringify(params)
    })
  }

  function generateLink (key: string, space: Ref<Space>, name: string, format: string): string {
    const nameFormat = nameToFormat(name)
    const downloadName = nameFormat === format ? name : name + '.' + format
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
    let item: UploadAttachment
    // eslint-disable-next-line prefer-const
    item = {
      objectClass: objectClass,
      objectId: objectId,
      name: file.name,
      size: file.size,
      format: format,
      mime: type,
      url: encodeURI(generateLink(key, space, file.name, format)),
      attachTo: getFullRef(objectId, objectClass),
      space: space,
      modifiedBy: client.accountId(),
      modifiedOn: Date.now(),
      createOn: Date.now(),
      _class: attachment.class.Attachment,
      _id: key,
      progress: 1,
      abort: () => {}
    }
    item.abort = await upload(
      file,
      key,
      space,
      (progress: number) => {
        progressCallback?.(item, progress)
      },
      () => {
        // eslint-disable-next-line
        void client.createDoc(
          attachment.class.Attachment,
          space,
          {
            objectClass: item.objectClass,
            objectId: item.objectId,
            name: item.name,
            attachTo: item.attachTo,
            size: item.size,
            format: item.format,
            mime: item.mime,
            url: item.url
          },
          item._id
        )
      }
    )
    return item
  }

  return {
    remove,
    authorize,
    createAttachment
  }
}
