import { DeferredPromise, generateId } from '@anticrm/core'
import type { UIComponent } from '@anticrm/status'
import { writable } from 'svelte/store'
import type { PopupAlignment } from './types'

export interface PopupInstance {
  // Immidiate close of control
  close: () => void
  // Return a control bind.
  bind: Promise<any>
  // Will be resolved on popup close
  hide: Promise<void>
}

interface PopupInstanceImpl extends PopupInstance {
  id: string
  is: UIComponent
  props: any
  element?: PopupAlignment
  onClose?: (result: any) => void
  hidePromise: DeferredPromise<void>
  bindPromise: DeferredPromise<any>
  overrideOverlay?: boolean
}

export const popupstore = writable<PopupInstanceImpl[]>([])

export function showPopup (
  component: UIComponent,
  props: any,
  element?: PopupAlignment,
  onClose?: (result: any) => void,
  overrideOverlay?: boolean
): PopupInstance {
  const hidePromise = new DeferredPromise<void>()
  const bindPromise = new DeferredPromise<void>()
  const id = generateId()
  const data: PopupInstanceImpl = {
    id,
    is: component,
    props,
    element,
    onClose,
    hidePromise,
    bindPromise,
    close: () => {
      doClose(id)
    },
    bind: bindPromise.promise,
    hide: hidePromise.promise,
    overrideOverlay
  }

  popupstore.update((popups) => {
    popups.push(data)
    return popups
  })
  return data
}

export function closePopup (): void {
  doClose()
}

function doClose (id?: string): void {
  popupstore.update((popups) => {
    const pp = popups.pop()
    if (pp !== undefined && id !== undefined && pp?.id !== id) {
      console.error(new Error(`Cannot close popup with id: ${id}`))
      popups.push(pp)
      return popups
    }
    pp?.hidePromise.resolve()
    return popups
  })
}
