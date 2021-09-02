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

import chunter, { Channel } from '@anticrm/chunter'
import type { IntlString, Resource } from '@anticrm/status'
import { mergeIds } from '@anticrm/status'
import { DerivedDataDescriptor, Doc, Ref } from '@anticrm/core'

/**
 * NOTICE:
 *
 * Contain copy of identifiers from chunter-impl, required to be compiled well without source dependencies.
 *
 * @public
 */
export default mergeIds(chunter, {
  component: {
    CreateChannel: '' as Resource<any>,
    CreateMessage: '' as Resource<any>,
    ChannelView: '' as Resource<any>,
    ThreadsView: '' as Resource<any>,
    AllThreadsView: '' as Resource<any>,
    SpaceItem: '' as Resource<any>,
    SpaceHeader: '' as Resource<any>
  },
  string: {
    ApplicationLabelChunter: '' as IntlString
  },
  channel: {
    General: '' as Ref<Channel>,
    Random: '' as Ref<Channel>
  },
  dd: {
    MessageReferences: '' as Ref<DerivedDataDescriptor<Doc, Doc>>,
    CommentReferences: '' as Ref<DerivedDataDescriptor<Doc, Doc>>,
    ReplyOf: '' as Ref<DerivedDataDescriptor<Doc, Doc>>
  }
})
