import { setMetadata } from '@anticrm/platform'
import { applicationShortcutKey, defaultApplicationShortcutKey } from '@anticrm/ui'
import workbench from '.'

/**
 * @public
 */
export default function (): void {
  setMetadata(applicationShortcutKey('workbench'), workbench.component.WorkbenchApp)
  setMetadata(defaultApplicationShortcutKey(), 'workbench')
}
