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

import { Builder, Model } from '@anticrm/model'

import core, { TSpace } from '@anticrm/model-core'
import type { RoomSpace } from '@anticrm/meeting'

import workbench from '@anticrm/model-workbench'
import meeting from './plugin'

/**
 * @public
 */
@Model(meeting.class.RoomSpace, core.class.Space)
export class TRoom extends TSpace implements RoomSpace {}

/**
 * @public
 */
export function createModel (builder: Builder): void {
  builder.createModel(TRoom)
  builder.createDoc(workbench.class.Application, {
    label: meeting.string.ApplicationLabelMeeting,
    icon: meeting.icon.Meeting,
    navigatorModel: {
      spaces: [
        {
          label: meeting.string.Rooms,
          spaceIcon: meeting.icon.Hashtag,
          spaceClass: meeting.class.RoomSpace,
          addSpaceLabel: meeting.string.CreateChannel,
          createComponent: meeting.component.CreateChannel
        }
      ],
      spaceView: meeting.component.WorkspaceComponent
    }
  })
  builder.createDoc(meeting.class.RoomSpace, {
    name: 'Kitchen',
    description: 'Kitchen Talks',
    private: false,
    members: []
  })
}
