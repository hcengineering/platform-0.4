import { DerivedDataDescriptor } from '.'
import { Account, Class, Doc, Ref, Space } from './classes'
import core from './component'
import { Storage } from './storage'
import { Title } from './title'
import { TxCreateDoc } from './tx'
import { generateId } from './utils'

/**
 * A human document reference instance.
 * By adding a document reference inside a space,
 * we will have immutable link to required document.
 *
 * In case document is moved to separate space,
 * one more reference should be created for it.
 *
 * _id: is uniq short document reference in format '{namespace}-{counter}'
 * objectId - objectId we rererence to.
 * objectClass - object class we reference to.
 *
 * To create a new reference, we should create a document with _id={namespace}-{max(counter)+1}
 * If we failed we need to retry.
 */
export interface ShortRef extends Title {
  // _id - is an uniq short reference identifier.
  objectId: Ref<Doc> // <-- reference to source document.
  objectClass: Ref<Class<Doc>> // <-- source object class.
  namespace: string
  counter: number // An Id counter.
}

const DESCRIPTOR_SHORTREF = '#shortRef' as Ref<DerivedDataDescriptor<Doc, ShortRef>>
export async function createShortRef<T extends Doc> (
  storage: Storage,
  user: Ref<Account>,
  doc: T,
  namespace: string
): Promise<string | undefined> {
  let extraAdd = 0
  let prevId = -1
  while (true) {
    // We need to find just one object with maximum id.
    const refs = await storage.findAll<ShortRef>(
      core.class.ShortRef,
      { namespace },
      { limit: 1, sort: { counter: -1 } }
    )
    const counter = (refs[0] ?? { counter: 0 }).counter + 1 + extraAdd
    if (counter === prevId) {
      // Same Id second time and it was duplicate happened, increase and check one more time.
      extraAdd++
    }
    const shortId = `${namespace}-${counter}` as Ref<ShortRef>

    prevId = counter

    const objWithId = await storage.findAll(core.class.ShortRef, { _id: shortId }, { limit: 1 })
    if (objWithId.length > 0) {
      extraAdd += 1
      continue
    }
    const tx: TxCreateDoc<ShortRef> = {
      _id: generateId(),
      _class: core.class.TxCreateDoc,
      space: core.space.Tx,
      modifiedBy: user,
      modifiedOn: Date.now(),
      objectId: shortId,
      objectClass: core.class.ShortRef,
      objectSpace: doc.space,
      attributes: {
        descriptorId: DESCRIPTOR_SHORTREF,
        objectId,
        objectClass,
        namespace,
        counter,
        title: shortId
      }
    }
    try {
      await storage.tx(tx)
      return shortId
    } catch (err) {
      await checkErrorCode(err)
    }
  }
}

async function checkErrorCode (err: any): Promise<void> {
  if (err?.status?.code === core.status.ObjectAlreadyExists) {
    // Retry after timeout
    await randTimeout()
  } else {
    console.log(err)
    throw err
  }
}

async function randTimeout (): Promise<void> {
  return await new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, 5 + Math.round(100 * Math.random()))
  })
}
