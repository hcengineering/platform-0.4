import pem from 'pem'

/**
 * @public
 */
export interface SecurityOptions {
  cert: string
  key: string
  ca?: string
}

/**
 * @public
 */
export async function selfSignedAuth (): Promise<SecurityOptions> {
  return await new Promise<SecurityOptions>((resolve, reject) => {
    pem.createCertificate({ days: 365, selfSigned: true }, (err, keys) => {
      if (err != null) {
        reject(err)
        return
      }
      resolve({ key: keys.clientKey, cert: keys.certificate })
    })
  })
}
