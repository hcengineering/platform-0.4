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
import { S3Storage } from '..'
import * as fs from 'fs'
import * as http from 'http'
import * as url from 'url'
import { generateId } from '@anticrm/core'

describe('s3', () => {
  const accessKey: string = process.env.S3_ACCESS_KEY ?? 'minioadmin'
  const secret: string = process.env.S3_SECRET ?? 'minioadmin'
  const endpoit: string = process.env.S3_URI ?? 'http://localhost:9000'
  let client: S3Storage
  const bucket = 'bucket' + generateId()

  it('check storage', async (done) => {
    client = await S3Storage.create(accessKey, secret, endpoit, bucket)
    expect.assertions(4)
    const testId = generateId()
    const fileName = 'testFile' + testId
    const resultFile = 'resultFile' + testId
    fs.writeFileSync(fileName, 'testText')
    const file = fs.readFileSync(`./${fileName}`)
    const uploadLink = await client.getUploadLink(fileName, '')
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
    const downloadLink = await client.getDownloadLink(fileName, 'simple')
    const req = http.request(options, (res) => {
      expect(downloadLink.length).toBeGreaterThan(0)
      const resultStream = fs.createWriteStream(resultFile)
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
          const downloadedFile = fs.readFileSync(resultFile)
          expect(downloadedFile).toEqual(file)
          // eslint-disable-next-line
          client.remove(fileName)
          fs.unlinkSync(`./${fileName}`)
          fs.unlinkSync(`./${resultFile}`)
          done()
        })
      })
    })

    req.write(file)
    req.end()
  })

  it('check download file', async (done) => {
    const fileName = 'testFile2' + generateId()
    client = await S3Storage.create(accessKey, secret, endpoit, bucket)
    expect.assertions(2)
    fs.writeFileSync(fileName, 'testText')
    const file = fs.readFileSync(`./${fileName}`)
    const uploadLink = await client.getUploadLink(fileName, '')
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

    const req = http.request(options, () => {
      // eslint-disable-next-line
      void client.getFile(fileName).then((res) => {
        expect(res?.body).toEqual(file)
        fs.unlinkSync(`./${fileName}`)
        // eslint-disable-next-line
        client.remove(fileName)
        done()
      })
    })
    req.write(file)
    req.end()
  })

  it('check get image', async (done) => {
    expect.assertions(3)
    client = await S3Storage.create(accessKey, secret, endpoit, bucket)
    const image = fs.readFileSync('./src/__tests__/testImage.jpg')
    const testId = generateId()
    const fileName = 'testImage' + testId
    const uploadLink = await client.getUploadLink(fileName, 'image/jpeg')
    const path = new url.URL(uploadLink)

    const options: http.RequestOptions = {
      host: path.hostname,
      path: path.pathname + path.search,
      port: path.port,
      method: 'PUT',
      headers: {
        'Content-Length': Buffer.byteLength(image)
      }
    }

    const notFoundFile = await client.getImage(fileName, 100)
    expect(notFoundFile).toBeUndefined()

    const req = http.request(options, () => {
      // eslint-disable-next-line
      void client.getImage(fileName, 100).then(async (file) => {
        const hashedFile = await client.getImage(fileName, 100)
        expect(file).toEqual(hashedFile)
        const bigFile = await client.getImage(fileName, 200)
        expect(file).not.toEqual(bigFile)
        await client.remove(fileName)
        await client.remove(fileName + '100')
        await client.remove(fileName + '200')
        done()
      })
    })
    req.write(image)
    req.end()
  })

  it('check remove', async (done) => {
    expect.assertions(1)
    const testId = generateId()
    const fileName = 'testFile' + testId
    client = await S3Storage.create(accessKey, secret, endpoit, bucket)
    fs.writeFileSync(fileName, 'testText')
    const file = fs.readFileSync(`./${fileName}`)
    const uploadLink = await client.getUploadLink(fileName, '')
    const path = new url.URL(uploadLink)
    const options: http.RequestOptions = {
      host: path.hostname,
      path: path.pathname + path.search,
      port: path.port,
      method: 'PUT',
      headers: {
        'Content-Length': Buffer.byteLength(file)
      }
    }
    const downloadLink = await client.getDownloadLink(fileName, 'simple')
    const req = http.request(options, (res) => {
      // eslint-disable-next-line
      void client.remove(fileName).then(() => {
        const getLink = new url.URL(downloadLink)
        const getOptions: http.RequestOptions = {
          host: getLink.hostname,
          path: getLink.pathname + getLink.search,
          port: getLink.port,
          method: 'GET'
        }
        http.get(getOptions, (response) => {
          expect(response.statusCode).not.toEqual(200)
          fs.unlinkSync(`./${fileName}`)
          done()
        })
      })
    })

    req.write(file)
    req.end()
  })

  it('fictive ca test', async () => {
    // eslint-disable-next-line
    expect(() => S3Storage.create(accessKey, secret, endpoit, bucket, 'will be ignored for http')).rejects.toThrow()
  })
})
