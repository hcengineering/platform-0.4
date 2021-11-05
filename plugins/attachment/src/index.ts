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

import { Class, Doc, DocumentPresenter, FullRefString, Ref, Space, Storage, TxOperations } from '@anticrm/core'
import type { Plugin, Service } from '@anticrm/platform'
import { plugin } from '@anticrm/platform'
import type { AnyComponent, IntlString, Metadata, StatusCode } from '@anticrm/status'

export interface Attachment extends Doc {
  attachTo: FullRefString
  name: string
  format: string
  mime: string
  url: string
  size: number
}

export interface UploadAttachment extends Attachment {
  progress: number
  abort: () => void
}

export function nameToFormat (name: string): string {
  return name.slice(((name.lastIndexOf('.') - 1) >>> 0) + 2)
}

export function sizeToString (size: number): string {
  const sizes = ['bytes', 'KiB', 'MiB', 'GiB']
  let i = 0

  for (i = 0; i < sizes.length; i++) {
    if (size < 1024) break
    size = size / 1024
  }
  return size.toFixed(1) + ' ' + sizes[i]
}

export interface AttachmentService extends Service {
  remove: (key: string, space: Ref<Space>) => Promise<void>
  authorize: (token: string) => Promise<void>
  createAttachment: (
    file: File,
    objectId: Ref<Doc>,
    objectClass: Ref<Class<Doc>>,
    space: Ref<Space>,
    client: Storage & TxOperations,
    progressCallback?: (item: UploadAttachment, progress: number) => void
  ) => Promise<UploadAttachment>
}

const PluginAttachment = 'attachment' as Plugin<AttachmentService>

const attachment = plugin(
  PluginAttachment,
  {},
  {
    class: {
      Attachment: '' as Ref<Class<Attachment>>
    },
    component: {
      Attachments: '' as AnyComponent,
      AttachmentPreview: '' as AnyComponent,
      AttachmentList: '' as AnyComponent,
      AvatarEditor: '' as AnyComponent,
      AttachmentsTableCell: '' as AnyComponent
    },
    string: {
      Attachment: '' as IntlString,
      Attachments: '' as IntlString,
      AddAttachment: '' as IntlString,
      PreviewNotAvailable: '' as IntlString
    },
    metadata: {
      FilesUrl: '' as Metadata<string>
    },
    status: {
      NoFileServerUri: '' as StatusCode
    },
    presenter: {
      AttachmentPresenter: '' as Ref<DocumentPresenter<Attachment>>
    }
  }
)

export default attachment
