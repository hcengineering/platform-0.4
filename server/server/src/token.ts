import { decode, encode } from 'jwt-simple'
import { Ref, Account } from '@anticrm/core'

/**
 * Generate a server secret to be used to authenticate.
 * @param secret - a server secret used to encode token.
 * @param clientId - a count account id.
 * @returns A valid token.
 * @public
 */
export function generateToken (secret: string, accountId: string, workspaceId: string): string {
  return encode({ accountId, workspaceId }, secret)
}

/**
 * @public
 */
export interface AccountDetails {
  firstName?: string
  lastName?: string
  email: string
}

/**
 * @public
 */
export function decodeToken (secret: string, token: string): { accountId: Ref<Account>, workspaceId: string, details: AccountDetails } {
  return decode(token, secret)
}
