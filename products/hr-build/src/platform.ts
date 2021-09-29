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

import core from '@anticrm/plugin-core'
import { addLocation } from '@anticrm/platform'
import { PlatformConfiguration } from './config'

import '@anticrm/notification'
import '@anticrm/presentation'

import action from '@anticrm/action-plugin'
import calendar from '@anticrm/calendar'
import chunter from '@anticrm/chunter'
import fsm from '@anticrm/fsm'
import login from '@anticrm/login'
import meeting from '@anticrm/meeting'
import recruiting from '@anticrm/recruiting'
import task from '@anticrm/task'
import workbench from '@anticrm/workbench'

import '@anticrm/workbench-assets'
import '@anticrm/calendar-assets'
import '@anticrm/chunter-assets'
import '@anticrm/login-assets'
import '@anticrm/meeting-assets'
import '@anticrm/recruiting-assets'
import '@anticrm/task-assets'
import '@anticrm/ui-assets'

export function configurePlatform (config: PlatformConfiguration): void {
  // This one is just to name core as core.
  void import(/* webpackChunkName: "core" */ '@anticrm/core')

  addLocation(core, async () => await import(/* webpackChunkName: "plugin-core" */ '@anticrm/plugin-core-impl'))

  addLocation(login, async () => await import(/* webpackChunkName: "login" */ '@anticrm/login-impl'))
  addLocation(workbench, async () => await import(/* webpackChunkName: "workbench" */ '@anticrm/workbench-impl'))
  addLocation(fsm, async () => await import(/* webpackChunkName: "fsm" */ '@anticrm/fsm-impl'))
  addLocation(action, async () => await import(/* webpackChunkName: "action" */ '@anticrm/action-impl'))

  if (config.chunter) {
    addLocation(chunter, async () => {
      return await import(/* webpackChunkName: "chunter" */ '@anticrm/chunter-impl')
    })
  }
  if (config.tasks) {
    addLocation(task, async () => {
      return await import(/* webpackChunkName: "task" */ '@anticrm/task-impl')
    })
  }

  if (config.recrutting) {
    addLocation(recruiting, async () => {
      return await import(/* webpackChunkName: "recruiting" */ '@anticrm/recruiting-impl')
    })
  }

  if (config.calendar) {
    addLocation(calendar, async () => {
      return await import(/* webpackChunkName: "calendar" */ '@anticrm/calendar-impl')
    })
  }

  if (config.meeting) {
    addLocation(meeting, async () => {
      return await import(/* webpackChunkName: "meeting" */ '@anticrm/meeting-impl')
    })
  }
}
