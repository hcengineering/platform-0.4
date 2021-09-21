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

import { Class, Doc, Ref } from '@anticrm/core'
import type { Plugin, Service } from '@anticrm/platform'
import { plugin } from '@anticrm/platform'
import type { IntlString } from '@anticrm/status'

export interface Attachment extends Doc {
  objectId: Ref<Doc>
  objectClass: Ref<Class<Doc>>
  name: string
  format: string
  size: number
}

export function nameToFormat (name: string): string {
  return name.slice((name.lastIndexOf(".") - 1 >>> 0) + 2)
}

export function sizeToString (size: number): string {
  const sizes = ['bytes', 'KB', 'MB', 'GB']
  let i = 0

  for (i = 0; i < sizes.length; i++) {
    if (size < 1024) break
    size = size / 1024
  }
  return size.toFixed(1) + ' ' + sizes[i]
}

export interface AttachmentService extends Service {}

const PluginAttachment = 'attachment' as Plugin<AttachmentService>

const attachment = plugin(
  PluginAttachment,
  {},
  {
    class: {
      Attachment: '' as Ref<Class<Attachment>>
    },
    string: {
      Attachment: '' as IntlString,
      Attachments: '' as IntlString,
      AddAttachment: '' as IntlString
    }
  }
)

export default attachment
