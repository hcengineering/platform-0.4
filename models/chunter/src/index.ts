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

import type { Channel, ChannelNotificationSchema, Comment, CommentRef, Message } from '@anticrm/chunter'
import { Domain, FullRefString, PresentationMode, Ref } from '@anticrm/core'
import { Builder, Model } from '@anticrm/model'
import core, { MARKDOWN_MENTION_PATTERN, MARKDOWN_REFERENCE_PATTERN, TDoc, TSpace } from '@anticrm/model-core'
import workbench from '@anticrm/model-workbench'
import { Application, SpacesNavModel } from '@anticrm/workbench'
import chunter from './plugin'
import notification from '@anticrm/notification'

const DOMAIN_CHUNTER = 'chunter' as Domain

/**
 * @public
 */
@Model(chunter.class.Channel, core.class.Space)
export class TChannel extends TSpace implements Channel {
  direct!: boolean
  isChunterbot!: boolean

  topic!: string
  favourite!: boolean
  muted!: boolean
  notifications!: ChannelNotificationSchema
}

/**
 * @public
 */
@Model(chunter.class.Message, core.class.Doc, DOMAIN_CHUNTER)
export class TMessage extends TDoc implements Message {
  isChunterbot!: boolean
  message!: string
  comments!: CommentRef[]
}

/**
 * @public
 */
@Model(chunter.class.Comment, core.class.Doc, DOMAIN_CHUNTER)
export class TComment extends TDoc implements Comment {
  isChunterbot!: boolean
  replyOf!: FullRefString
  message!: string
}

/**
 * @public
 */
export function createModel (builder: Builder): void {
  builder.createModel(TChannel, TMessage, TComment)
  const directMessagesModel: SpacesNavModel<Channel> = {
    label: chunter.string.DirectMessages,
    spaceIcon: chunter.icon.Hashtag,
    spaceClass: chunter.class.Channel,
    spaceQuery: { direct: true, 'account.starred': { $ne: true } },
    addSpaceLabel: chunter.string.CreateDirectMessage,
    spaceItem: chunter.component.SpaceItem,
    spaceHeader: chunter.component.SpaceHeader,
    userSpace: {
      name: 'Chunterbot',
      description: '',
      topic: 'Your best friend here',
      members: [],
      private: true,
      direct: true,
      isChunterbot: true
    }
  }

  builder.createDoc<Application>(
    workbench.class.Application,
    {
      label: chunter.string.ApplicationLabelChunter,
      icon: chunter.icon.Chunter,
      navigatorModel: {
        specials: [
          {
            id: 'direct',
            label: chunter.string.MessagesSpecial,
            component: chunter.component.CreateMessage,
            icon: chunter.icon.Chunter
          },
          {
            id: 'threads',
            label: chunter.string.ThreadsSpecial,
            component: chunter.component.ThreadsView,
            icon: chunter.icon.Hashtag
          }
        ],
        spaces: [
          {
            label: chunter.string.Starred,
            hideIfEmpty: true,
            spaceIcon: chunter.icon.Hashtag,
            spaceClass: chunter.class.Channel,
            spaceQuery: { 'account.starred': true },
            addSpaceLabel: chunter.string.CreateChannel,
            spaceItem: chunter.component.SpaceItem,
            spaceHeader: chunter.component.SpaceHeader
          },
          {
            label: chunter.string.Channels,
            spaceIcon: chunter.icon.Hashtag,
            spaceClass: chunter.class.Channel,
            spaceQuery: { direct: false, 'account.starred': { $ne: true } },
            addSpaceLabel: chunter.string.CreateChannel,
            createComponent: chunter.component.CreateChannel,
            spaceItem: chunter.component.SpaceItem,
            spaceHeader: chunter.component.SpaceHeader
          },
          directMessagesModel
        ],
        spaceView: chunter.component.ChannelView
      }
    },
    chunter.app.Chunter as Ref<Application>
  )

  // Threads presenter
  builder.createDoc(
    core.class.DocumentPresenter,
    {
      objectClass: chunter.class.Message,
      presentation: [
        {
          description: '',
          mode: PresentationMode.Edit,
          component: chunter.component.ThreadsView
        }
      ]
    },
    chunter.presenter.Threads
  )

  builder.createDoc(
    chunter.class.Channel,
    {
      name: 'general',
      description: 'General Channel',
      private: false,
      members: [],
      direct: false
    },
    chunter.channel.General
  )
  builder.createDoc(
    chunter.class.Channel,
    {
      name: 'random',
      description: 'Random Talks',
      private: false,
      members: [],
      direct: false
    },
    chunter.channel.Random
  )

  // D E R I V E D   D A T A
  builder.createDoc(
    core.class.DerivedDataDescriptor,
    {
      sourceClass: chunter.class.Message,
      targetClass: core.class.Reference,
      rules: [
        {
          sourceField: 'message',
          targetField: 'link',
          pattern: {
            pattern: MARKDOWN_REFERENCE_PATTERN.source,
            multDoc: true
          }
        }
      ]
    },
    chunter.dd.MessageReferences
  )
  builder.createDoc(
    core.class.DerivedDataDescriptor,
    {
      sourceClass: chunter.class.Comment,
      targetClass: core.class.Reference,
      rules: [
        {
          sourceField: 'message',
          targetField: 'link',
          pattern: {
            pattern: MARKDOWN_REFERENCE_PATTERN.source,
            multDoc: true
          }
        }
      ]
    },
    chunter.dd.CommentReferences
  )
  builder.createDoc(
    core.class.DerivedDataDescriptor,
    {
      sourceClass: chunter.class.Comment,
      targetClass: chunter.class.Message,
      collections: [
        {
          sourceField: 'replyOf',
          targetField: 'comments',
          rules: [
            {
              sourceField: 'modifiedBy',
              targetField: 'userId'
            },
            {
              sourceField: 'modifiedOn',
              targetField: 'lastModified'
            }
          ]
        }
      ]
    },
    chunter.dd.ReplyOf
  )

  builder.createDoc(
    core.class.DerivedDataDescriptor,
    {
      sourceClass: chunter.class.Message,
      targetClass: notification.class.SpaceNotifications,
      collections: [
        {
          sourceField: 'message',
          targetField: 'notificatedObjects',
          sourceFieldPattern: {
            pattern: MARKDOWN_MENTION_PATTERN.source,
            multDoc: true,
            group: 1
          }
        }
      ]
    },
    chunter.dd.MessageSpaceNotifications
  )

  builder.createDoc(
    core.class.DerivedDataDescriptor,
    {
      sourceClass: chunter.class.Comment,
      targetClass: notification.class.SpaceNotifications,
      collections: [
        {
          sourceField: 'message',
          targetField: 'notificatedObjects',
          sourceFieldPattern: {
            pattern: MARKDOWN_MENTION_PATTERN.source,
            multDoc: true,
            group: 1
          }
        }
      ]
    },
    chunter.dd.CommentSpaceNotifications
  )
}
