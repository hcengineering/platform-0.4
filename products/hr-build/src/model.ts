import { Builder } from '@anticrm/model'

import { createModel as coreModel } from '@anticrm/model-core'
import { createModel as workbenchModel } from '@anticrm/model-workbench'
import { createModel as chunterModel } from '@anticrm/model-chunter'
import { createModel as fsmModel } from '@anticrm/model-fsm'
import { createModel as taskModel } from '@anticrm/model-task'
// import { createModel as meetingModel } from '@anticrm/model-meeting'
import { createModel as recruitingModel } from '@anticrm/model-recruiting'
import { createModel as calendarModel } from '@anticrm/model-calendar'
import { createModel as notificationModel } from '@anticrm/model-notification'

/**
 * @public
 */
const builder = new Builder()

coreModel(builder)
workbenchModel(builder)
chunterModel(builder)
fsmModel(builder)
recruitingModel(builder)
taskModel(builder)
// meetingModel(builder)
calendarModel(builder)
notificationModel(builder)

export default builder
