import { Builder } from '@anticrm/model'

import { config } from './config'

import { createModel as coreModel } from '@anticrm/model-core'
import { createModel as contactModel } from '@anticrm/model-contact'
import { createModel as workbenchModel } from '@anticrm/model-workbench'
import { createModel as chunterModel } from '@anticrm/model-chunter'
import { createModel as fsmModel } from '@anticrm/model-fsm'
import { createModel as taskModel } from '@anticrm/model-task'
import { createModel as meetingModel } from '@anticrm/model-meeting'
import { createModel as recruitingModel } from '@anticrm/model-recruiting'
import { createModel as calendarModel } from '@anticrm/model-calendar'
import { createModel as notificationModel } from '@anticrm/model-notification'
import { createModel as actionModel } from '@anticrm/model-action'
import { createModel as attachmentModel } from '@anticrm/model-attachment'

/**
 * @public
 */
const builder = new Builder()

coreModel(builder)
workbenchModel(builder)

actionModel(builder)

if (config.platform.chunter) {
  chunterModel(builder)
}
fsmModel(builder)
contactModel(builder)
if (config.platform.recrutting) {
  recruitingModel(builder)
}
if (config.platform.tasks) {
  taskModel(builder)
}
if (config.platform.meeting) {
  meetingModel(builder)
}
if (config.platform.calendar) {
  calendarModel(builder)
}
notificationModel(builder)
attachmentModel(builder)

export default builder
