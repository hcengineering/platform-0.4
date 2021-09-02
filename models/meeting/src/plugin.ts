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

import meeting, { RoomSpace } from '@anticrm/meeting'
import type { IntlString, Resource } from '@anticrm/status'
import { mergeIds } from '@anticrm/status'
import { Application } from '@anticrm/workbench'
import { Ref } from '@anticrm/core'

export default mergeIds(meeting, {
  string: {
    ApplicationLabelMeeting: '' as IntlString,
    CreateChannel: '' as IntlString
  },
  component: {
    CreateChannel: '' as Resource<any>,
    WorkspaceComponent: '' as Resource<any>
  },
  app: {
    Meeting: '' as Ref<Application>
  },
  room: {
    Kitchen: '' as Ref<RoomSpace>
  }
})
