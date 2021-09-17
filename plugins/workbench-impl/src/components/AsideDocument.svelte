<script lang="ts">
  import core, { Doc, DocumentPresenter, PresentationFormat, PresentationMode, Ref, Space } from '@anticrm/core'
  import { QueryUpdater } from '@anticrm/presentation'
  import { Component, getRouter, Splitter } from '@anticrm/ui'
  import { currentDocument, getClient } from '@anticrm/workbench'
  import type { WorkbenchRoute, DocumentSelection } from '@anticrm/workbench'
  import { onDestroy } from 'svelte'
  import { handleCurrentDocumentChange, updateCurrentDocument } from '../selection'
  import { SpaceNotifications } from '@anticrm/notification'

  const client = getClient()

  const router = getRouter<WorkbenchRoute>()

  export let compHTML: HTMLElement | undefined = undefined
  export let currentRoute: WorkbenchRoute
  export let notifications: Map<Ref<Space>, SpaceNotifications>

  let currentDocumentPresentation: QueryUpdater<DocumentPresenter<Doc>> | undefined = undefined
  let editPresenter: PresentationFormat | undefined
  let selectedDocument: DocumentSelection | undefined

  let asideHTML: HTMLElement | undefined = undefined

  $: {
    if (asideHTML !== undefined) {
      if (compHTML !== undefined) compHTML.style.marginRight = '0'
    } else {
      if (compHTML !== undefined) compHTML.style.marginRight = '20px'
    }
  }

  onDestroy(
    currentDocument.subscribe((value) => {
      selectedDocument = value
    })
  )

  $: handleCurrentDocumentChange(client, selectedDocument, router, currentRoute)

  $: if (selectedDocument !== undefined) {
    currentDocumentPresentation = client.query<DocumentPresenter<Doc>>(
      currentDocumentPresentation,
      core.class.DocumentPresenter,
      { objectClass: selectedDocument.document._class },
      (pr) => {
        for (const p of pr) {
          for (const pp of p.presentation ?? []) {
            if (pp.mode === PresentationMode.Edit) {
              editPresenter = pp
            }
          }
        }
      }
    )
  }

  export function handleRoute (browse?: string): void {
    updateCurrentDocument(selectedDocument, client, browse)
  }
</script>

{#if editPresenter && selectedDocument}
  <Splitter prevDiv={compHTML} nextDiv={asideHTML} />
  <div bind:this={asideHTML} class="aside">
    <Component
      is={editPresenter.component}
      props={{
        id: selectedDocument.document._id,
        _class: selectedDocument.document._class,
        notifications: notifications
      }}
    />
  </div>
{/if}

<style lang="scss">
  @mixin panel($bg-color) {
    display: flex;
    flex-direction: column;
    height: 100%;
    border-radius: 20px;
    background-color: $bg-color;
  }

  .aside {
    @include panel(var(--theme-bg-color));
    min-width: 400px;
    margin-right: 20px;
    padding: 20px;
  }
</style>
