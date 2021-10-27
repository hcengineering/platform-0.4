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

import { Request, Response } from '@anticrm/rpc'

/**
 * @public
 */
export interface IceCandidate {
  candidate: string
  sdpMid: string
  sdpMLineIndex: number
}

/**
 * @public
 */
export enum ReqMethod {
  Join = 'join',
  Leave = 'leave',
  Transmit = 'transmit',
  InitScreenSharing = 'init-screen-sharing',
  StopScreenSharing = 'stop-screen-sharing',
  PeerUpdate = 'peer-update'
}

/**
 * @public
 */
export enum NotificationMethod {
  PeerJoined = 'participant-joined',
  PeerLeft = 'participant-left',
  PeerUpdated = 'peer-updated',
  ICECandidate = 'ice-candidate',
  ScreenSharingStarted = 'screen-sharing-started',
  ScreenSharingFinished = 'screen-sharing-finished'
}

/**
 * @public
 */
export type ReqID = string | number | undefined

/**
 * @public
 */
export type InternalID = string

/**
 * @public
 */
export interface Peer {
  internalID: InternalID
  muted: boolean
  camEnabled: boolean
}

const screenSuffix = '-screen'

/**
 * @public
 */
export const makeScreenID = (id: InternalID): InternalID => `${id}${screenSuffix}`
/**
 * @public
 */
export const getScreenOwner = (id: InternalID): InternalID => id.slice(0, -screenSuffix.length)
/**
 * @public
 */
export const isScreenID = (id: InternalID): boolean => id.endsWith(screenSuffix)

/**
 * @public
 */
export class JoinReq extends Request<
[{ room: string, peer: { muted: boolean, camEnabled: boolean } }],
ReqMethod.Join
> {}
/**
 * @public
 */
export class LeaveReq extends Request<[], ReqMethod.Leave> {}
/**
 * @public
 */
export class PeerUpdateReq extends Request<[Partial<Omit<Peer, 'internalID'>>], ReqMethod.PeerUpdate> {}
/**
 * @public
 */
export class TransmitReq extends Request<
[
  {
    peerID: InternalID
    sdp: string
  }
],
ReqMethod.Transmit
> {}

/**
 * @public
 */
export class InitScreenSharingReq extends Request<[], ReqMethod.InitScreenSharing> {}
/**
 * @public
 */
export class StopScreenSharingReq extends Request<[], ReqMethod.StopScreenSharing> {}
/**
 * @public
 */
export type ClientICECandNotification = Request<
[
  {
    peerID: InternalID
    candidate: IceCandidate
  }
],
NotificationMethod.ICECandidate
>

/**
 * @public
 */
export type JoinResp = Response<{
  peers: Peer[]
  me: Peer
  screen?: {
    peer: Peer
    owner: string
  }
}>

/**
 * @public
 */
export type UpdatePeerResp = Response<{
  peer: Peer
}>

/**
 * @public
 */
export type LeaveResp = Response<boolean>

/**
 * @public
 */
export type TransmitResp = Response<{
  sdp: string
}>

/**
 * @public
 */
export type InitScreenSharingResp = Response<{
  peerID: InternalID
}>

/**
 * @public
 */
export type StopScreenSharingResp = Response<boolean>

/**
 * @public
 */
export type PeerJoinedNotification = Response<{
  notification: NotificationMethod.PeerJoined
  params: {
    peer: Peer
  }
}>

/**
 * @public
 */
export type PeerLeftNotification = Response<{
  notification: NotificationMethod.PeerLeft
  params: {
    peerID: InternalID
  }
}>

/**
 * @public
 */
export type ScreenSharingStartedNotification = Response<{
  notification: NotificationMethod.ScreenSharingStarted
  params: {
    peerID: InternalID
    owner: InternalID
  }
}>

/**
 * @public
 */
export type ScreenSharingFinishedNotification = Response<{
  notification: NotificationMethod.ScreenSharingFinished
}>

/**
 * @public
 */
export type ServerICECandNotification = Response<{
  notification: NotificationMethod.ICECandidate
  params: {
    peerID: InternalID
    candidate: IceCandidate
  }
}>

/**
 * @public
 */
export type PeerUpdatedNotification = Response<{
  notification: NotificationMethod.PeerUpdated
  params: {
    peer: Peer
  }
}>

/**
 * @public
 */
export type RequestMsg = JoinReq | PeerUpdateReq | LeaveReq | TransmitReq | InitScreenSharingReq | StopScreenSharingReq
/**
 * @public
 */
export type IncomingNotifications = ClientICECandNotification
/**
 * @public
 */
export type Incoming = RequestMsg | IncomingNotifications

/**
 * @public
 */
export type ResponseMsg =
  | JoinResp
  | UpdatePeerResp
  | LeaveResp
  | TransmitResp
  | InitScreenSharingResp
  | StopScreenSharingResp

/**
 * @public
 */
export type OutgoingNotifications =
  | PeerJoinedNotification
  | PeerUpdatedNotification
  | PeerLeftNotification
  | ScreenSharingStartedNotification
  | ScreenSharingFinishedNotification
  | ServerICECandNotification

/**
 * @public
 */
export type Outgoing = ResponseMsg | OutgoingNotifications
