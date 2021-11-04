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

import { addStringsLoader, loadMetadata, setMetadata } from '@anticrm/platform'
import workbench from '@anticrm/workbench'
import { applicationShortcutKey, defaultApplicationShortcutKey } from '@anticrm/ui'

const icons = require('../assets/icons.svg') // eslint-disable-line @typescript-eslint/no-var-requires
loadMetadata(workbench.icon, {
  Hashtag: `${icons}#hashtag`, // eslint-disable-line @typescript-eslint/restrict-template-expressions
  Lock: `${icons}#lock`, // eslint-disable-line @typescript-eslint/restrict-template-expressions
  Members: `${icons}#members` // eslint-disable-line @typescript-eslint/restrict-template-expressions
})

addStringsLoader(workbench.id, async (lang: string) => {
  return await import(`../lang/${lang}.json`)
})

setMetadata(applicationShortcutKey('workbench'), workbench.component.WorkbenchApp)
setMetadata(defaultApplicationShortcutKey(), 'workbench')
