<script lang="ts">
  import core, { Doc, DocumentPresenter, PresentationFormat, PresentationMode, Ref, Space } from '@anticrm/core'
  import { QueryUpdater } from '@anticrm/presentation'
  import { Component, getRouter, Splitter } from '@anticrm/ui'
  import { currentDocument, getClient } from '@anticrm/workbench'
  import type { WorkbenchRoute, DocumentSelection } from '@anticrm/workbench'
  import { onDestroy } from 'svelte'
  import { handleCurrentDocumentChange, updateCurrentDocument } from '../selection'
  import { SpaceLastViews } from '@anticrm/notification'

  const client = getClient()

  const router = getRouter<WorkbenchRoute>()

  export let compHTML: HTMLElement | undefined = undefined
  export let currentRoute: WorkbenchRoute
  export let spacesLastViews: Map<Ref<Space>, SpaceLastViews>

  let currentDocumentPresentation: QueryUpdater<DocumentPresenter<Doc>> | undefined = undefined
  let editPresenter: PresentationFormat | undefined
  let selectedDocument: DocumentSelection | undefined | null

  let asideHTML: HTMLElement | undefined = undefined
  let splitter: Splitter

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

  $: if (selectedDocument != null) {
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

  $: if (compHTML != null) {
    // Fix width, to prevent jumping of content.
    const compHTMLRect = compHTML.getBoundingClientRect()
    compHTML.style.width = `${compHTMLRect.width}px`
  }
  $: if (asideHTML != null) {
    // Fix width, to prevent jumping of content.
    const asideHTMLRect = asideHTML.getBoundingClientRect()
    asideHTML.style.width = `${asideHTMLRect.width}px`
  }
</script>

{#if editPresenter && selectedDocument}
  <Splitter bind:this={splitter} prevDiv={compHTML} nextDiv={asideHTML} />
  <div bind:this={asideHTML} class="aside">
    <Component
      is={editPresenter.component}
      props={{
        id: selectedDocument.document._id,
        _class: selectedDocument.document._class,
        spacesLastViews: spacesLastViews
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
