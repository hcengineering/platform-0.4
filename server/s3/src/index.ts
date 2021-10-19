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
import https from 'https'
import sharp from 'sharp'

/**
 * @public
 */
export type Body = Buffer | Uint8Array | Blob

/**
 * @public
 */
export interface File {
  body: Buffer
  type?: string
}

/**
 * @public
 */
export class S3Storage {
  private readonly client: S3
  private readonly bucket: string

  private constructor (accessKey: string, secret: string, endpoint: string, bucket: string, ca?: string) {
    this.bucket = bucket
    this.client = new S3({
      httpOptions: ca !== undefined ? { agent: new https.Agent({ ca }) } : undefined,
      accessKeyId: accessKey,
      secretAccessKey: secret,
      endpoint: endpoint,
      s3BucketEndpoint: true,
      s3ForcePathStyle: true,
      sslEnabled: true,
      signatureVersion: 'v4'
    })
  }

  static async create (
    accessKey: string,
    secret: string,
    endpoint: string,
    bucket: string,
    ca?: string
  ): Promise<S3Storage> {
    const storage = new S3Storage(accessKey, secret, endpoint, bucket, ca)
    await storage.createBucket()
    return storage
  }

  private async createBucket (): Promise<void> {
    return await new Promise((resolve, reject) => {
      this.client.createBucket({ Bucket: this.bucket }, (err, data) => {
        console.info(err)
        if (err != null && err.code !== 'BucketAlreadyOwnedByYou') {
          reject(err.message)
          return
        }
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

  async getFile (key: string): Promise<File | undefined> {
    const params = {
      Bucket: this.bucket,
      Key: key
    }
    try {
      const response = await this.client.getObject(params).promise()
      return {
        body: response.Body as Buffer,
        type: response.Metadata?.['content-type']
      }
    } catch (error: any) {
      if (error.statusCode === 404) return undefined
      throw error
    }
  }

  async uploadFile (key: string, file: File): Promise<void> {
    const params = {
      Bucket: this.bucket,
      Key: key,
      ContentType: file.type,
      Body: file.body
    }
    await this.client.upload(params).promise()
  }

  async getImage (key: string, width: number): Promise<File | undefined> {
    const image = await this.getFile(key + width.toString())
    if (image !== undefined) return image
    const file = await this.getFile(key)
    if (file === undefined) return undefined
    const buffer = await sharp(file.body).resize({ width, withoutEnlargement: true }).toBuffer()
    const res = {
      body: buffer,
      type: file.type
    }
    await this.uploadFile(key + width.toString(), res)
    return res
  }
}
