import { decode, encode } from 'jwt-simple'

/**
 * Generate a server secret to be used to authenticate.
 * @param {secret} - a server secret used to encode token.
 * @param {clientId} - a count account id.
 * @param {}
 * @returns A valid token.
 */
export function generateToken (secret: string, accountId: string, workspaceId: string): string {
  return encode({ accountId, workspaceId }, secret)
}
export function decodeToken (secret: string, token: string): { accountId: string, workspaceId: string } {
  return decode(token, secret)
}