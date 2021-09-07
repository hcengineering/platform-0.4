//
// Copyright © 2020, 2021 Anticrm Platform Contributors.
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

import type { Account, Class, Doc, FullRefString, Ref, Space, Timestamp } from '@anticrm/core'
import type { Plugin, Service } from '@anticrm/platform'
import { plugin } from '@anticrm/platform'
import type { AnyComponent, Asset, IntlString } from '@anticrm/status'

export interface ChannelAccountPreferences {
  favourite: boolean
  muted: boolean
  notifications: ChannelNotificationSchema
}

export interface Channel extends Space {
  direct: boolean // <-- Identify if it is a direct messaging channel
  isChunterbot?: boolean

  topic?: string

  // Customizable fields.
  account?: ChannelAccountPreferences
}

export interface CommentRef {
  _id: Ref<Doc>
  userId: Ref<Account>
  lastModified: Timestamp
  createOn: Timestamp
}

export interface WithMessage extends Doc {
  isChunterbot?: boolean
  message: string
}

export interface Message extends WithMessage {
  comments?: CommentRef[]
}

export interface Comment extends WithMessage {
  replyOf: FullRefString
}

/**
 * @public
 */
export enum ChannelNotificationSchema {
  AllNewMessages,
  OnlyMentions,
  Nothing
}

export interface ChunterService extends Service {}

const PluginChunter = 'chunter' as Plugin<ChunterService>

export default plugin(
  PluginChunter,
  {},
  {
    app: {
      Chunter: '' as Ref<Doc>
    },
    class: {
      Channel: '' as Ref<Class<Channel>>,
      Message: '' as Ref<Class<Message>>,
      Comment: '' as Ref<Class<Comment>>
    },
    string: {
      Channels: '' as IntlString,
      DirectMessages: '' as IntlString,
      CreateChannel: '' as IntlString,
      CreateDirectMessage: '' as IntlString,
      ChannelName: '' as IntlString,
      ChannelDescription: '' as IntlString,
      MakePrivate: '' as IntlString,
      MakePrivateDescription: '' as IntlString,
      Thread: '' as IntlString,
      Replies: '' as IntlString,
      RepliesText: '' as IntlString,
      NewMessagePlaceholder: '' as IntlString,

      MessagesSpecial: '' as IntlString,
      ThreadsSpecial: '' as IntlString,

      UserTo: '' as IntlString,
      MessageTo: '' as IntlString,
      MessageToLabel: '' as IntlString,

      Starred: '' as IntlString
    },
    icon: {
      Chunter: '' as Asset,
      Hashtag: '' as Asset,
      Lock: '' as Asset
    },
    component: {
      ChannelView: '' as AnyComponent,
      ThreadsView: '' as AnyComponent,
      ReferenceInput: '' as AnyComponent,
      Channel: '' as AnyComponent
    }
  }
)
