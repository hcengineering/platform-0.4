/* eslint-disable @typescript-eslint/no-non-null-assertion */
//
// Copyright © 2020 Anticrm Platform Contributors.
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
import { S3Storage } from '../index'
import * as fs from 'fs'
import * as http from 'http'
import * as url from 'url'
import { DownloadFile, RemoveFile, UploadFile } from '@anticrm/core'

describe('s3', () => {
  const accessKey: string = process.env.S3_ACCESS_KEY ?? 'minioadmin'
  const secret: string = process.env.S3_SECRET ?? 'minioadmin'
  const endpoit: string = process.env.S3_URI ?? 'http://127.0.0.1:9000'
  let client: S3Storage
  const bucket = 'bucket'
  const fileName = 'testFile'

  afterAll(() => {
    fs.unlinkSync(`./${fileName}`)
    fs.unlinkSync('./resultFile')
  })

  it('check storage', async (done) => {
    client = await S3Storage.create(accessKey, secret, endpoit, bucket)
    expect.assertions(4)
    fs.writeFileSync(fileName, 'testText')
    const file = fs.readFileSync(`./${fileName}`)
    const uploadParam: UploadFile = {
      type: 'Upload',
      fileType: '',
      key: fileName
    }
    const uploadLink = await client.file(uploadParam)
    const path = new url.URL(uploadLink)
    expect(uploadLink.length).toBeGreaterThan(0)

    const options: http.RequestOptions = {
      host: path.hostname,
      path: path.pathname + path.search,
      port: path.port,
      method: 'PUT',
      headers: {
        'Content-Length': Buffer.byteLength(file)
      }
    }
    const downloadParam: DownloadFile = {
      type: 'Download',
      fileName: 'simple',
      key: fileName
    }
    const downloadLink = await client.file(downloadParam)
    const req = http.request(options, (res) => {
      expect(downloadLink.length).toBeGreaterThan(0)
      const resultStream = fs.createWriteStream('resultFile')
      const getLink = new url.URL(downloadLink)
      const getOptions: http.RequestOptions = {
        host: getLink.hostname,
        path: getLink.pathname + getLink.search,
        port: getLink.port,
        method: 'GET'
      }
      http.get(getOptions, (response) => {
        expect(response.statusCode).toEqual(200)
        const stream = response.pipe(resultStream)
        stream.on('finish', () => {
          const downloadedFile = fs.readFileSync('resultFile')
          expect(downloadedFile).toEqual(file)
          done()
        })
      })
    })

    req.write(file)
    req.end()
  })

  it('check remove', async (done) => {
    expect.assertions(1)
    client = await S3Storage.create(accessKey, secret, endpoit, bucket)
    const param: RemoveFile = {
      type: 'Remove',
      key: fileName
    }
    await client.file(param)
    const downloadParam: DownloadFile = {
      type: 'Download',
      fileName: 'simple',
      key: fileName
    }
    const downloadLink = await client.file(downloadParam)
    const getLink = new url.URL(downloadLink)
    const getOptions: http.RequestOptions = {
      host: getLink.hostname,
      path: getLink.pathname + getLink.search,
      port: getLink.port,
      method: 'GET'
    }
    http.get(getOptions, (response) => {
      expect(response.statusCode).not.toEqual(200)
      done()
    })
  })
})
