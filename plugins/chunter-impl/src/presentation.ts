import attachment from '@anticrm/attachment'
import core, { Class, Doc, PresentationFormat, PresentationMode, Ref } from '@anticrm/core'
import { getMetadata, getResource } from '@anticrm/platform'
import { PresentationClient } from '@anticrm/presentation'
import { parseLocation, Router } from '@anticrm/router'
import type { AnyComponent } from '@anticrm/status'
import { ItemRefefence } from '@anticrm/ui'
import { showSideDocument } from '@anticrm/workbench'
import { DocumentReference, ExternalReference, MessageReference, ReferenceKind } from './messages'
import chunter from './plugin'

const filesUrl = getMetadata(attachment.metadata.FilesUrl)
const filesHost = filesUrl !== undefined ? new URL(filesUrl).host : ''

export interface PresentationResult {
  component: AnyComponent
  props: Record<string, any>
}
export async function findPresentation (
  client: PresentationClient,
  reference: MessageReference,
  mode: PresentationMode
): Promise<PresentationResult | undefined> {
  if (reference.kind === ReferenceKind.Document) {
    return await findDocumentPresentation(client, reference as DocumentReference, mode)
  }
  if (reference.kind === ReferenceKind.External) {
    return await findExternalPresentation(client, reference as ExternalReference, mode)
  }
  return undefined
}

async function findExternalPresentation (
  client: PresentationClient,
  reference: ExternalReference,
  mode: PresentationMode
): Promise<PresentationResult | undefined> {
  if (reference.href !== '') {
    try {
      const url = new URL(reference.href)

      let result: PresentationResult | undefined

      const r = new Router<any>({
        patternText: '(www.)?youtube.(com|ru)', //
        defaults: {},
        matcher: () => {
          result = {
            component: chunter.component.OembedPreview,
            props: { href: url, title: reference.title, oembedHost: 'https://www.youtube.com/oembed' }
          }
        }
      })

      // Github issues
      r.addRoute<any>(
        '(www.)?github.com/:organization/:project/issues/:issueNumber',
        (match) => {
          result = {
            component: chunter.component.GithubIssuePreview,
            props: { ...match, href: reference.href }
          }
        },
        {}
      )

      // internal attachments
      r.addRoute<any>(filesHost, (match) => {
        result = {
          component: attachment.component.AttachmentPreview,
          props: { href: reference.href }
        }
      })

      const loc = parseLocation({ pathname: url.host + url.pathname, search: url.search, hash: url.hash })
      r.update(loc)
      return result
    } catch (e) {
      // Ignore invalid case variant.
    }
  }
  return undefined
}

async function findDocumentPresentation (
  client: PresentationClient,
  reference: DocumentReference,
  mode: PresentationMode
): Promise<PresentationResult | undefined> {
  const presenters = await client.findAll(core.class.DocumentPresenter, { objectClass: reference.objectClass })
  if (presenters.length === 0) return undefined
  const component = presenters
    .map((p) => p.presentation)
    .reduce(combinePresentation)
    .filter((f) => f.mode === mode)
    .map((f) => f.component)
    .shift()

  return makeResult(component, reference)
}
function makeResult (component: AnyComponent | undefined, reference: DocumentReference): PresentationResult | undefined {
  return component !== undefined ? { component, props: reference } : undefined
}

function combinePresentation (
  previousValue: PresentationFormat[],
  newValue: PresentationFormat[]
): PresentationFormat[] {
  return [...previousValue, ...newValue]
}

export async function showReferencedDocument (client: PresentationClient, doc: ItemRefefence): Promise<void> {
  const p = await client.findAll(core.class.DocumentPresenter, { objectClass: doc.class as Ref<Class<Doc>> })
  if (p.length > 0) {
    for (const pr of p) {
      if (pr.linkHandler !== undefined) {
        const handler = await getResource(pr.linkHandler)
        if (handler !== undefined) {
          await handler(doc.class as Ref<Class<Doc>>, doc.id as Ref<Doc>)
          return
        }
      }
    }
  }
  showSideDocument({ _id: doc.id as Ref<Doc>, _class: doc.class as Ref<Class<Doc>> })
}
