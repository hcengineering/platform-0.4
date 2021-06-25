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

import type { Ref, Doc, Domain } from '@anticrm/core'
import { Builder, Model } from '@anticrm/model'

import { TSpace, TDoc } from '@anticrm/model-core'
import type { Channel, Message, Comment } from '@anticrm/chunter'

import workbench from '@anticrm/model-workbench'
import core from '@anticrm/model-core'
import chunter from './plugin'

const DOMAIN_CHUNTER = 'chunter' as Domain

@Model(chunter.class.Channel, core.class.Space)
export class TChannel extends TSpace implements Channel {}

@Model(chunter.class.Message, core.class.Doc, DOMAIN_CHUNTER)
export class TMessage extends TDoc implements Message {
  message!: string
  replyCount!: number
}

@Model(chunter.class.Comment, core.class.Doc, DOMAIN_CHUNTER)
export class TComment extends TDoc implements Comment {
  replyOf!: Ref<Message>
  message!: string
}

export function createModel(builder: Builder) {
  builder.createModel(TChannel)
  builder.createDoc(workbench.class.Application, {
    label: chunter.string.ApplicationLabelChunter,
    icon: chunter.icon.Chunter,
    navigatorModel: {
      spaces: [
        {
          label: chunter.string.Channels,
          spaceIcon: chunter.icon.Hashtag,
          spaceClass: chunter.class.Channel,
          addSpaceLabel: chunter.string.CreateChannel,
          createComponent: chunter.component.CreateChannel
        }
      ],
      spaceView: chunter.component.ChannelView
    }
  })
  builder.createDoc(chunter.class.Channel, {
    name: 'general',
    description: 'General Channel',
    private: false,
    members: []
  })
  builder.createDoc(chunter.class.Channel, {
    name: 'random',
    description: 'Random Talks',
    private: false,
    members: []
  })
}
