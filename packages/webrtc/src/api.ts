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

import { IceCandidate } from 'kurento-client'

import { Request, Response } from '@anticrm/rpc'

export const enum ReqMethod {
  Join = 'join',
  Leave = 'leave',
  Transmit = 'transmit',
  InitScreenSharing = 'init-screen-sharing',
  StopScreenSharing = 'stop-screen-sharing',
  PeerUpdate = 'peer-update'
}

export const enum NotificationMethod {
  PeerJoined = 'participant-joined',
  PeerLeft = 'participant-left',
  PeerUpdated = 'peer-updated',
  ICECandidate = 'ice-candidate',
  ScreenSharingStarted = 'screen-sharing-started',
  ScreenSharingFinished = 'screen-sharing-finished',
}

export type ReqID = string | number | undefined
type InternalID = string

export interface Peer {
  internalID: InternalID
  muted: boolean
  camEnabled: boolean
}

const screenSuffix = '-screen'
export const makeScreenID = (id: InternalID): InternalID => `${id}${screenSuffix}`
export const getScreenOwner = (id: InternalID): InternalID => id.slice(0, -screenSuffix.length)
export const isScreenID = (id: InternalID): boolean => id.endsWith(screenSuffix)

export class JoinReq extends Request<[{ room: string, peer: { muted: boolean, camEnabled: boolean } }], ReqMethod.Join> {}
export class LeaveReq extends Request<[], ReqMethod.Leave> {}
export class PeerUpdateReq extends Request<[Partial<Omit<Peer, 'internalID'>>], ReqMethod.PeerUpdate> {}
export class TransmitReq extends Request<
[{
  peerID: InternalID
  sdp: string
}],
ReqMethod.Transmit
> {}
export class InitScreenSharingReq extends Request<[], ReqMethod.InitScreenSharing> {}
export class StopScreenSharingReq extends Request<[], ReqMethod.StopScreenSharing> {}
export type ClientICECandNotification = Request<[{
  peerID: InternalID
  candidate: IceCandidate
}], NotificationMethod.ICECandidate>

export type JoinResp = Response<{
  peers: Peer[]
  me: Peer
  screen?: {
    peer: Peer
    owner: string
  }
}>
export type UpdatePeerResp = Response<{
  peer: Peer
}>
export type LeaveResp = Response<boolean>
export type TransmitResp = Response<{
  sdp: string
}>
export type InitScreenSharingResp = Response<{
  peerID: InternalID
}>
export type StopScreenSharingResp = Response<boolean>

export type PeerJoinedNotification = Response<{
  notification: NotificationMethod.PeerJoined
  params: {
    peer: Peer
  }
}>
export type PeerLeftNotification = Response<{
  notification: NotificationMethod.PeerLeft
  params: {
    peerID: InternalID
  }
}>
export type ScreenSharingStartedNotification = Response<{
  notification: NotificationMethod.ScreenSharingStarted
  params: {
    peerID: InternalID
    owner: InternalID
  }
}>
export type ScreenSharingFinishedNotification = Response<{
  notification: NotificationMethod.ScreenSharingFinished
}>
export type ServerICECandNotification = Response<{
  notification: NotificationMethod.ICECandidate
  params: {
    peerID: InternalID
    candidate: IceCandidate
  }
}>
export type PeerUpdatedNotification = Response<{
  notification: NotificationMethod.PeerUpdated
  params: {
    peer: Peer
  }
}>

export type RequestMsg =
  | JoinReq
  | PeerUpdateReq
  | LeaveReq
  | TransmitReq
  | InitScreenSharingReq
  | StopScreenSharingReq
export type IncomingNotifications =
  | ClientICECandNotification
export type Incoming =
  | RequestMsg
  | IncomingNotifications

export type ResponseMsg =
  | JoinResp
  | UpdatePeerResp
  | LeaveResp
  | TransmitResp
  | InitScreenSharingResp
  | StopScreenSharingResp
export type OutgoingNotifications =
  | PeerJoinedNotification
  | PeerUpdatedNotification
  | PeerLeftNotification
  | ScreenSharingStartedNotification
  | ScreenSharingFinishedNotification
  | ServerICECandNotification
export type Outgoing =
  | ResponseMsg
  | OutgoingNotifications
