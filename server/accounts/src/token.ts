import { decode, encode } from 'jwt-simple'
import { Ref, Account } from '@anticrm/core'

/**
 * Generate a server secret to be used to authenticate.
 * @param secret - a server secret used to encode token.
 * @param clientId - a count account id.
 * @returns A valid token.
 * @public
 */
export function generateToken (
  secret: string,
  accountId: string,
  workspaceId: string,
  details: any & { email: string }
): string {
  return encode({ accountId, workspaceId, details }, secret)
}

/**
 * @public
 */
export function decodeToken (
  secret: string,
  token: string
): { accountId: Ref<Account>, workspaceId: string, details: { email: string } } {
  return decode(token, secret)
}
