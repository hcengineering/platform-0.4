import { DeferredPromise } from '..'
import core from '../component'
import { Tx, txObjectClass } from '../tx'
describe('tx-tests', () => {
  it('should return object class', async () => {
    expect(
      txObjectClass({
        _class: core.class.TxUpdateDoc,
        objectClass: core.class.Title
      } as unknown as Tx)
    ).toEqual(core.class.Title)
  })
})

describe('utils-tests', () => {
  it('should convert toHex', async () => {
    const p = new DeferredPromise<void>()
    setTimeout(() => p.resolve())
    await p.promise
  })
})
