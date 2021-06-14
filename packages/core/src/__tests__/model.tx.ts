import { Tx } from '../tx'

const txImp = require('./model.tx.json') // eslint-disable-line @typescript-eslint/no-var-requires
const txs = txImp as unknown as Tx[]

export { txs as default }
