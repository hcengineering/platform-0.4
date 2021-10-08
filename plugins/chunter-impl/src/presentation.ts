import core, { PresentationFormat, PresentationMode } from '@anticrm/core'
import { PresentationClient } from '@anticrm/presentation'
import type { AnyComponent } from '@anticrm/status'
import { DocumentReference, ExternalReference, MessageReference, ReferenceKind } from './messages'
import chunter from './plugin'
import { parseLocation, Router } from '@anticrm/router'

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
            props: { href: url, title: reference.title, oembedHost: 'http://www.youtube.com/oembed' }
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
