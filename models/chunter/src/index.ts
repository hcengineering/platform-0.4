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

import type { Channel, Comment, Message, CommentRef } from '@anticrm/chunter'
import type { Domain, FullRefString, Ref } from '@anticrm/core'
import { Builder, Model } from '@anticrm/model'
import core, { MARKDOWN_REFERENCE_PATTERN, TDoc, TSpace } from '@anticrm/model-core'
import workbench from '@anticrm/model-workbench'
import { Application } from '../../../plugins/workbench/lib'
import chunter from './plugin'

const DOMAIN_CHUNTER = 'chunter' as Domain

/**
 * @public
 */
@Model(chunter.class.Channel, core.class.Space)
export class TChannel extends TSpace implements Channel {
  direct!: boolean
}

/**
 * @public
 */
@Model(chunter.class.Message, core.class.Doc, DOMAIN_CHUNTER)
export class TMessage extends TDoc implements Message {
  message!: string
  comments!: CommentRef[]
}

/**
 * @public
 */
@Model(chunter.class.Comment, core.class.Doc, DOMAIN_CHUNTER)
export class TComment extends TDoc implements Comment {
  replyOf!: FullRefString
  message!: string
}

/**
 * @public
 */
export function createModel (builder: Builder): void {
  builder.createModel(TChannel, TMessage, TComment)
  builder.createDoc<Application>(
    workbench.class.Application,
    {
      label: chunter.string.ApplicationLabelChunter,
      icon: chunter.icon.Chunter,
      navigatorModel: {
        specials: [
          {
            label: chunter.string.MessagesSpecial,
            component: chunter.component.CreateMessage,
            icon: chunter.icon.Chunter
          },
          {
            label: chunter.string.ThreadsSpecial,
            component: chunter.component.ThreadsView,
            icon: chunter.icon.Hashtag
          }
        ],
        spaces: [
          {
            label: chunter.string.Channels,
            spaceIcon: chunter.icon.Hashtag,
            spaceClass: chunter.class.Channel,
            spaceQuery: { direct: false },
            addSpaceLabel: chunter.string.CreateChannel,
            createComponent: chunter.component.CreateChannel
          },
          {
            label: chunter.string.DirectMessages,
            spaceIcon: chunter.icon.Hashtag,
            spaceClass: chunter.class.Channel,
            spaceQuery: { direct: true },
            showUsers: true,
            addSpaceLabel: chunter.string.CreateDirectMessage,
            createComponent: chunter.component.CreateMessage
          }
        ],
        spaceView: chunter.component.ChannelView,
        editComponent: chunter.component.ThreadsView
      }
    },
    chunter.app.Chunter as Ref<Application>
  )
  builder.createDoc(chunter.class.Channel, {
    name: 'general',
    description: 'General Channel',
    private: false,
    members: [],
    direct: false
  })
  builder.createDoc(chunter.class.Channel, {
    name: 'random',
    description: 'Random Talks',
    private: false,
    members: [],
    direct: false
  })

  // D E R I V E D   D A T A
  builder.createDoc(core.class.DerivedDataDescriptor, {
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
  })
  builder.createDoc(core.class.DerivedDataDescriptor, {
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
  })
  builder.createDoc(core.class.DerivedDataDescriptor, {
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
          }
        ]
      }
    ]
  })
}
