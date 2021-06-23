import { Doc, Domain, Hierarchy, Storage } from '@anticrm/core'
import { MongoClient } from 'mongodb'
import { DocStorage } from './storage'
import { TxStorage } from './tx'

/**
 * Manage mongo Connection and create required stores based on workspaceId
 */
export class MongoConnection {
  private readonly client: Promise<MongoClient>
  constructor (readonly mongodbUri: string) {
    this.client = MongoClient.connect(this.mongodbUri, { useUnifiedTopology: true })
  }

  public async createMongoTxStorage (workspaceId: string, hierarchy: Hierarchy): Promise<TxStorage> {
    const dbId = this.workspaceDb(workspaceId)
    const txCollection = (await this.client).db(dbId).collection('tx')
    return new TxStorage(txCollection, hierarchy)
  }

  public async createMongoDocStorage (workspaceId: string, hierarchy: Hierarchy): Promise<Storage> {
    const dbId = this.workspaceDb(workspaceId)
    return new DocStorage((await this.client).db(dbId), hierarchy)
  }

  /**
   * Drop domain documents from databse
   * @param domain - domain to be cleaned.
   */
  public async dropDomain (workspaceId: string, domain: Domain): Promise<void> {
    const dbId = this.workspaceDb(workspaceId)
    const db = (await this.client).db(dbId)
    await db.collection(domain as string).deleteMany({})
  }

  /**
   * Dump all documents from domain.
   */
  public async dumpDomain (workspaceId: string, domain: Domain): Promise<Doc[]> {
    const dbId = this.workspaceDb(workspaceId)
    const collection = (await this.client).db(dbId).collection(domain as string)
    return await collection.find({}).toArray()
  }

  /**
   * Drop a full database for workspace
   */
  public async dropWorkspace (workspaceId: string): Promise<void> {
    const dbId = this.workspaceDb(workspaceId)
    const db = (await this.client).db(dbId)
    await db.dropDatabase()
  }

  private workspaceDb (workspaceId: string): string | undefined {
    return 'ws-' + workspaceId
  }

  /**
   * Perform a shutdown of all stores accosiated with mongo db.
   */
  public async shutdown (): Promise<void> {
    await (await this.client).close()
  }
}
