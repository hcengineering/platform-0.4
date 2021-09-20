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

import { Class, Doc, Domain, Ref } from '@anticrm/core'
import { Builder, Model } from '@anticrm/model'
import core, { TDoc } from '@anticrm/model-core'
import attachment, { Attachment } from '@anticrm/attachment'

const DOMAIN_ATTACHMENT = 'attachment' as Domain

/**
 * @public
 */
@Model(attachment.class.Attachment, core.class.Doc, DOMAIN_ATTACHMENT)
export class TAttachment extends TDoc implements Attachment {
  objectId!: Ref<Doc>
  objectClass!: Ref<Class<Doc>>
  name!: string
  format!: string
  size!: number
}

/**
 * @public
 */
export function createModel (builder: Builder): void {
  builder.createModel(TAttachment)
}
