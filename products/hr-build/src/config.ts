import { SecurityOptions } from '@anticrm/server'
import dotenv from 'dotenv'
import { existsSync, readFileSync } from 'fs'

if (existsSync('./config/config.env')) {
  console.info('Loading Configuration from file: ./config/config.env')
  dotenv.config({ path: './config/config.env' })
}

export interface PlatformConfiguration {
  chunter: boolean
  recrutting: boolean
  tasks: boolean
  calendar: boolean
  meeting: boolean

  accountsUri: string // Account registration/authentication URL
  clientUri: string // Client URL to connect for
  meetingsUri: string // Meeting URI
  fileServerUri: string // File server URI
}

export interface ProductConfiguration {
  webHost: string
  webPort: number
  appPort: number
  appSecret: string
  dbUri: string
  s3Uri: string
  s3AccessKey: string
  s3Secret: string
  workspace: string
  organization: string
  SECURITY_CERT_FILE: string
  SECURITY_KEY_FILE: string
  SECURITY_CA_FILE: string
  platform: PlatformConfiguration
}

export const config: ProductConfiguration = {
  webHost: process.env.WEB_HOST ?? 'localhost', // A public available host name
  webPort: parseInt(process.env.WEB_PORT ?? '8080'), // A public available host port

  appPort: parseInt(process.env.SERVER_PORT ?? '18080'),

  appSecret: process.env.SERVER_SECRET ?? 'secret',

  dbUri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017',
  s3Uri: process.env.S3_URI ?? 'https://127.0.0.1:9000',
  s3AccessKey: process.env.S3_ACCESS_KEY ?? 'minioadmin',
  s3Secret: process.env.S3_SECRET ?? 'minioadmin',

  workspace: process.env.WORKSPACE ?? 'workspace',
  organization: process.env.WORKSPACE_ORGANIZATION ?? 'workspace description',

  SECURITY_CERT_FILE: process.env.SECURITY_CERT_FILE ?? './cert.pem',
  SECURITY_KEY_FILE: process.env.SECURITY_KEY_FILE ?? './privkey.pem',
  SECURITY_CA_FILE: process.env.SECURITY_CA_FILE ?? './chain.pem',

  platform: {
    chunter: (process.env.SUPPORT_CHUNTER ?? 'true') === 'true',
    recrutting: (process.env.SUPPORT_RECRUTTING ?? 'true') === 'true',
    tasks: (process.env.SUPPORT_TASKS ?? 'true') === 'true',
    calendar: (process.env.SUPPORT_CALENDAR ?? 'true') === 'true',
    meeting: (process.env.SUPPORT_MEETING ?? 'true') === 'true',

    accountsUri: process.env.ACCOUNTS_URI ?? '',
    clientUri: process.env.CLIENT_URI ?? '',
    meetingsUri: process.env.MEETINGS_URI ?? '',
    fileServerUri: process.env.FILES_URI ?? ''
  }
}

export function readCertificates (): SecurityOptions {
  const filesExists = existsSync(config.SECURITY_CERT_FILE) && existsSync(config.SECURITY_KEY_FILE)
  if (!filesExists) {
    console.error(
      `Valid certificates are required for SSL/TLS.
                  Passed certificates: cert: ${config.SECURITY_CERT_FILE} key: ${config.SECURITY_KEY_FILE}\n
                  Could not continue...`
    )
    process.exit(1)
  }

  const certificate = readFileSync(config.SECURITY_CERT_FILE).toString()
  console.info('Running with certificate:', certificate)

  return {
    cert: certificate,
    key: readFileSync(config.SECURITY_KEY_FILE).toString(),
    ca: existsSync(config.SECURITY_CA_FILE) ? readFileSync(config.SECURITY_CA_FILE).toString() : undefined
  }
}
