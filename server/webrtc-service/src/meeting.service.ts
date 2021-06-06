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

import KurentoClient, { MediaPipeline } from 'kurento-client'

import {
  getScreenOwner,
  Incoming,
  isScreenID,
  makeScreenID,
  NotificationMethod,
  Outgoing,
  Peer,
  ReqMethod,
  ResponseMsg,
  TaskQueue
} from '@anticrm/webrtc'

import { Session } from './session'

const isDefined = <T> (x: T | undefined | null): x is T => x !== undefined && x !== null

interface Room {
  pipeline: MediaPipeline
  peers: Set<Peer>
  screenSession?: Session
}
export default class {
  private nextID = 0
  private readonly kurento = KurentoClient('ws://359.rocks:8888/kurento')

  private readonly rooms: Map<string, Room> = new Map()

  private readonly peers: Map<string, {session: Session, roomID: string}> = new Map()
  private readonly actionQueue = new TaskQueue()

  private closed = false

  private readonly forEachSession = (fn: (s: Session) => void, peers: Peer[]): void =>
    peers
      .map(x => this.peers.get(x.internalID))
      .filter(isDefined)
      .map(x => x.session)
      .forEach(fn)

  private async join (peer: Peer, roomID: string, send: (msg: Outgoing) => void): Promise<Room> {
    const room = this.rooms.get(roomID) ?? {
      pipeline: await this.kurento.then(async (c) => await c.create('MediaPipeline')),
      peers: new Set()
    }

    this.rooms.set(roomID, room)

    const session = new Session(peer.internalID, room.pipeline, send)

    this.peers.set(peer.internalID, { session, roomID })

    this.forEachSession(
      (s) => s.send({
        result: {
          notification: NotificationMethod.PeerJoined,
          params: {
            peer
          }
        }
      }),
      [...room.peers]
    )

    room.peers.add(peer)

    return room
  }

  private async initScreenSharing (peer: Peer, send: (msg: Outgoing) => void): Promise<void> {
    const roomID = this.peers.get(peer.internalID)?.roomID ?? ''
    const room = this.rooms.get(roomID)

    if (room === undefined) {
      throw Error('Room is not found')
    }

    if (room.screenSession !== undefined) {
      throw Error('Screen session is already launched')
    }

    const session = new Session(makeScreenID(peer.internalID), room.pipeline, send)

    room.screenSession = session

    this.forEachSession(
      (s) => s.send({
        result: {
          notification: NotificationMethod.ScreenSharingStarted,
          params: {
            owner: peer.internalID
          }
        }
      }),
      [...room.peers]
        .filter(x => x.internalID !== peer.internalID)
    )
  }

  private async stopScreenSharing (peer: Peer): Promise<void> {
    const roomID = this.peers.get(peer.internalID)?.roomID ?? ''
    const room = this.rooms.get(roomID)

    if (room === undefined) {
      throw Error('Room is not found')
    }

    if (room.screenSession === undefined) {
      throw Error('Screen session does not exist')
    }

    if (getScreenOwner(room.screenSession.name) !== peer.internalID) {
      throw Error('Permission denied')
    }

    await room.screenSession.close()

    this.forEachSession(
      (s) => {
        room.screenSession !== undefined && s.cancelVideoTransmission(room.screenSession.name)
        s.send({
          result: {
            notification: NotificationMethod.ScreenSharingFinished
          }
        })
      },
      [...room.peers]
        .filter(x => x.internalID !== peer.internalID)
    )

    room.screenSession = undefined
  }

  private async leave (peer: Peer): Promise<void> {
    const client = this.peers.get(peer.internalID)
    if (client === undefined) {
      return
    }

    const roomEntry = [...this.rooms.entries()].find(([, x]) => x.peers.has(peer))
    if (roomEntry === undefined) {
      return
    }

    const [roomID, room] = roomEntry

    if (room.screenSession !== undefined && getScreenOwner(room.screenSession.name) === peer.internalID) {
      await this.stopScreenSharing(peer)
    }

    await client.session.close()
    this.peers.delete(peer.internalID)

    room.peers.delete(peer)

    if (room.peers.size === 0) {
      this.rooms.delete(roomID)
      await room.pipeline.release()

      return
    }

    this.forEachSession(
      (s) => {
        s.send({
          result: {
            notification: NotificationMethod.PeerLeft,
            params: {
              peer
            }
          }
        })

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        s.cancelVideoTransmission(peer.internalID)
      },
      [...room.peers]
    )
  }

  async close (): Promise<void> {
    this.closed = true

    await Promise.all(
      [...this.rooms.values()]
        .flatMap(room => [...room.peers].map(async (x) => await this.leave(x)))
    )

    this.peers.clear()
    this.rooms.clear()

    const kurento = await this.kurento
    kurento.close()
  }

  private getID (): string {
    return `${this.nextID++}`
  }

  onNewClient (
    send: (msg: any) => void
  ): {
      onWSMsg: (msg: Incoming) => Promise<ResponseMsg['result']>
      onClose: () => Promise<void>
    } {
    const peer = {
      internalID: this.getID()
    }

    return {
      onWSMsg: async (msg: Incoming) => {
        if (this.closed) {
          throw Error('Meeting service is closed')
        }

        const internalPeer = this.peers.get(peer.internalID)
        const session = internalPeer?.session

        if (msg.method === ReqMethod.Join) {
          if (session !== undefined) {
            throw Error(`Already joined to the room: ${internalPeer?.roomID ?? ''}`)
          }

          const roomID = msg.params[0].room

          const room = await this.actionQueue
            .add(async () => await this.join(peer, roomID, send))

          return {
            peers: [...room.peers]
              .filter(x => x.internalID !== peer.internalID),
            me: peer,
            screen: (room.screenSession !== undefined)
              ? {
                  internalID: room.screenSession.name
                }
              : undefined
          }
        }

        if (session === undefined) {
          throw Error('Peer session does not exist')
        }

        if (msg.method === ReqMethod.InitScreenSharing) {
          await this.actionQueue
            .add(async () => await this.initScreenSharing(peer, send))

          return true
        }

        if (msg.method === ReqMethod.StopScreenSharing) {
          await this.actionQueue
            .add(async () => await this.stopScreenSharing(peer))

          return true
        }

        if (msg.method === NotificationMethod.ICECandidate) {
          const isScreenOwner = makeScreenID(peer.internalID) === msg.params[0].peerID

          if (isScreenOwner) {
            const screenSession = this.rooms.get(this.peers.get(peer.internalID)?.roomID ?? '')?.screenSession

            if (screenSession === undefined) {
              throw Error('Screen session is missing')
            }

            await screenSession.addICECandidate(msg.params[0].candidate, msg.params[0].peerID)
          } else {
            await session.addICECandidate(msg.params[0].candidate, msg.params[0].peerID)
          }

          return
        }

        if (msg.method === ReqMethod.Transmit) {
          const isScreen = isScreenID(msg.params[0].peerID)
          const actualID = isScreen
            ? getScreenOwner(msg.params[0].peerID)
            : msg.params[0].peerID

          const targetClient = this.peers.get(actualID)

          if (targetClient === undefined) {
            throw Error('Missing peer')
          }

          const targetSession = isScreen
            ? this.rooms.get(targetClient.roomID ?? '')?.screenSession
            : targetClient.session

          if (targetSession === undefined) {
            throw Error('Missing session')
          }

          const srcSession = makeScreenID(peer.internalID) === msg.params[0].peerID
            ? targetSession
            : session

          const sdp = await srcSession.initVideoTransmission(targetSession, msg.params[0].sdp)
          return {
            sdp
          }
        }

        if (msg.method === ReqMethod.Leave) {
          await this.actionQueue
            .add(async () => await this.leave(peer))

          return true
        }

        throw Error('Unknown rpc method')
      },
      onClose: async () => {
        await this.actionQueue
          .add(async () => await this.leave(peer))
      }
    }
  }
}
