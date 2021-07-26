import { Account, Class, ClassifierKind, Data, Doc, Domain, DOMAIN_MODEL, Obj, Ref } from '../classes'
import core from '../component'
import { DOMAIN_REFERENCES } from '../reference'
import { DOMAIN_TX, Tx, TxCreateDoc } from '../tx'
import { generateId } from '../utils'

/**
 * @internal
 */
export function _createClass<T extends Class<Obj>> (_id: Ref<T>, cl: Omit<Data<T>, 'kind'>, domain?: Domain): Tx {
  const result: TxCreateDoc<Doc> = {
    _id: generateId(),
    _class: core.class.TxCreateDoc,
    objectId: _id,
    objectClass: core.class.Class,
    attributes: {
      kind: ClassifierKind.CLASS,
      domain: domain ?? DOMAIN_MODEL,
      ...cl
    },
    modifiedBy: 'model' as Ref<Account>,
    modifiedOn: Date.now(),
    objectSpace: core.space.Model,
    space: core.space.Model
  }
  return result
}

/**
 * @internal
 */
export function _createDoc<T extends Doc> (_class: Ref<Class<T>>, attributes: Data<T>, id?: Ref<T>): Tx {
  const tx: TxCreateDoc<T> = {
    _id: generateId(),
    _class: core.class.TxCreateDoc,
    space: core.space.Tx,
    modifiedBy: core.account.System,
    modifiedOn: Date.now(),
    objectId: id ?? generateId(),
    objectClass: _class,
    objectSpace: core.space.Model,
    attributes
  }
  return tx
}

/**
 * Generate minimal model for testing purposes.
 * @returns R
 * @internal
 */
export function _genMinModel (): Tx[] {
  const txes = []
  // Fill Tx'es with basic model classes.
  txes.push(_createClass(core.class.Obj, {}))
  txes.push(_createClass(core.class.Doc, { extends: core.class.Obj }))
  txes.push(_createClass(core.class.Class, { extends: core.class.Doc }))
  txes.push(_createClass(core.class.Space, { extends: core.class.Doc }))
  txes.push(_createClass(core.class.Account, { extends: core.class.Doc }))
  txes.push(_createClass(core.class.Reference, { extends: core.class.Doc }, DOMAIN_REFERENCES))
  txes.push(_createClass(core.class.DerivedData, { extends: core.class.Doc }))
  txes.push(_createClass(core.class.DerivedDataDescriptor, { extends: core.class.Doc }))
  txes.push(_createClass(core.class.Title, { extends: core.class.DerivedData }))
  txes.push(_createClass(core.class.ShortRef, { extends: core.class.Doc }, DOMAIN_REFERENCES))

  txes.push(_createClass(core.class.Tx, { extends: core.class.Doc }, DOMAIN_TX))
  txes.push(_createClass(core.class.TxCreateDoc, { extends: core.class.Tx }, DOMAIN_TX))
  txes.push(_createClass(core.class.TxUpdateDoc, { extends: core.class.Tx }, DOMAIN_TX))
  txes.push(_createClass(core.class.TxRemoveDoc, { extends: core.class.Tx }, DOMAIN_TX))

  const u1 = 'User1' as Ref<Account>
  const u2 = 'User2' as Ref<Account>
  txes.push(
    _createDoc(core.class.Account, {}, u1),
    _createDoc(core.class.Account, {}, u2),
    _createDoc(core.class.Space, {
      name: 'Sp1',
      description: '',
      private: false,
      members: [u1, u2]
    }),
    _createDoc(core.class.Space, {
      name: 'Sp2',
      description: '',
      private: false,
      members: [u1]
    })
  )
  return txes
}

export { _createTestTxAndDocStorage } from './txmodel'