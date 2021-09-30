//
// Copyright © 2021 Anticrm Platform Contributors.
//
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
//

import { S3 } from 'aws-sdk'

/**
 * @public
 */
export type Body = Buffer | Uint8Array | Blob

/**
 * @public
 */
export class S3Storage {
  private readonly client: S3
  private readonly bucket: string

  private constructor (accessKey: string, secret: string, endpoint: string, bucket: string) {
    this.bucket = bucket
    this.client = new S3({
      accessKeyId: accessKey,
      secretAccessKey: secret,
      endpoint: endpoint,
      s3BucketEndpoint: true,
      s3ForcePathStyle: true,
      signatureVersion: 'v4'
    })
  }

  static async create (accessKey: string, secret: string, endpoint: string, bucket: string): Promise<S3Storage> {
    const storage = new S3Storage(accessKey, secret, endpoint, bucket)
    await storage.createBucket()
    return storage
  }

  private async createBucket (): Promise<void> {
    return await new Promise((resolve, reject) => {
      this.client.createBucket({ Bucket: this.bucket }, () => {
        resolve()
      })
    })
  }

  async remove (key: string): Promise<string> {
    const params = {
      Bucket: this.bucket,
      Key: key
    }
    await this.client.deleteObject(params).promise()
    return key
  }

  async getUploadLink (key: string, type: string): Promise<string> {
    const params = {
      Expires: 300,
      Bucket: this.bucket,
      Key: key,
      ContentType: type
    }
    return await this.client.getSignedUrlPromise('putObject', params)
  }

  async getDownloadLink (key: string, filename: string): Promise<string> {
    const params = {
      Expires: 300,
      Bucket: this.bucket,
      Key: key,
      ResponseContentDisposition: `attachment; filename =${filename}`
    }
    return await this.client.getSignedUrlPromise('getObject', params)
  }
}
