import { Account, Class, Doc, DOMAIN_MODEL, Ref } from './classes'
import core from './component'
import { Hierarchy } from './hierarchy'
import { Storage } from './storage'
import { Tx } from './tx'

/**
 * Will check if transactions is targer model domain, it could be system model
 * or user model.
 * @public
 */
export function isModelTx (tx: Tx): boolean {
  // We accept both model and account model spaces.
  return tx.objectSpace === core.space.Model
}

/**
 * Check if find operation is targeting model domain.
 * @public
 */
export function isModelFind<T extends Doc> (_class: Ref<Class<T>>, hierarchy: Hierarchy): boolean {
  return hierarchy.getDomain(_class) === DOMAIN_MODEL
}

/**
 * Find all system and user model transactions.
 * @public
 */
export async function findModelTxs (storage: Storage, accountId: Ref<Account>): Promise<Tx[]> {
  // We search for model object space.
  return await storage.findAll(core.class.Tx, { objectSpace: core.space.Model })
}
