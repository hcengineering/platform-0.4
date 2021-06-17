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

import type { MediaPipeline } from 'kurento-client'

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

import { makeKurento } from './kurento.client'
import { Session } from './session'

const isDefined = <T> (x: T | undefined | null): x is T => x !== undefined && x !== null

interface Room {
  pipeline: MediaPipeline
  peers: Set<Peer['internalID']>
  screenSession?: Session
}
export default class {
  private nextID = 0
  private readonly kurento = makeKurento('ws://359.rocks:8888/kurento')

  private readonly rooms: Map<string, Room> = new Map()

  private readonly peers: Map<Peer['internalID'], {peer: Peer, session: Session, roomID: string}> = new Map()
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

    this.peers.set(peer.internalID, { session, roomID, peer })

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
        .map(x => this.peers.get(x)?.peer)
        .filter(isDefined)
    )

    room.peers.add(peer.internalID)

    return room
  }

  private async initScreenSharing (id: Peer['internalID'], send: (msg: Outgoing) => void): Promise<void> {
    const roomID = this.peers.get(id)?.roomID ?? ''
    const room = this.rooms.get(roomID)

    if (room === undefined) {
      throw Error('Room is not found')
    }

    if (room.screenSession !== undefined) {
      throw Error('Screen session is already launched')
    }

    const session = new Session(makeScreenID(id), room.pipeline, send)

    room.screenSession = session

    this.forEachSession(
      (s) => s.send({
        result: {
          notification: NotificationMethod.ScreenSharingStarted,
          params: {
            owner: id
          }
        }
      }),
      [...room.peers]
        .filter(x => x !== id)
        .map(x => this.peers.get(x)?.peer)
        .filter(isDefined)
    )
  }

  private async stopScreenSharing (id: Peer['internalID']): Promise<void> {
    const roomID = this.peers.get(id)?.roomID ?? ''
    const room = this.rooms.get(roomID)

    if (room === undefined) {
      throw Error('Room is not found')
    }

    if (room.screenSession === undefined) {
      throw Error('Screen session does not exist')
    }

    if (getScreenOwner(room.screenSession.name) !== id) {
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
        .filter(x => x !== id)
        .map(x => this.peers.get(x)?.peer)
        .filter(isDefined)
    )

    room.screenSession = undefined
  }

  private async leave (id: Peer['internalID']): Promise<void> {
    const client = this.peers.get(id)
    if (client === undefined) {
      return
    }

    const roomEntry = [...this.rooms.entries()].find(([, x]) => x.peers.has(id))
    if (roomEntry === undefined) {
      return
    }

    const [roomID, room] = roomEntry

    if (room.screenSession !== undefined && getScreenOwner(room.screenSession.name) === id) {
      await this.stopScreenSharing(id)
    }

    await client.session.close()
    this.peers.delete(id)

    room.peers.delete(id)

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
              peerID: id
            }
          }
        })

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        s.cancelVideoTransmission(id)
      },
      [...room.peers]
        .map(x => this.peers.get(x)?.peer)
        .filter(isDefined)
    )
  }

  private async peerUpdated (updatedPeer: Partial<Omit<Peer, 'internalID'>> & {internalID: Peer['internalID']}): Promise<Peer> {
    const peer = this.peers.get(updatedPeer.internalID)
    const room = this.rooms.get(peer?.roomID ?? '')

    if (peer === undefined || room === undefined) {
      throw Error(`Peer is not found: '${updatedPeer.internalID}'`)
    }

    const actualPeer = {
      ...peer.peer,
      ...updatedPeer
    }

    this.peers.set(updatedPeer.internalID, {
      ...peer,
      peer: actualPeer
    })

    this.forEachSession(
      (s) => s.send({
        result: {
          notification: NotificationMethod.PeerUpdated,
          params: {
            peer: actualPeer
          }
        }
      }),
      [...room.peers]
        .map(x => this.peers.get(x)?.peer)
        .filter(isDefined)
    )

    return actualPeer
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
    const internalID = this.getID()

    return {
      onWSMsg: async (msg: Incoming): Promise<ResponseMsg['result']> => {
        if (this.closed) {
          throw Error('Meeting service is closed')
        }

        const internalPeer = this.peers.get(internalID)
        const session = internalPeer?.session

        if (msg.method === ReqMethod.Join) {
          if (session !== undefined) {
            throw Error(`Already joined to the room: ${internalPeer?.roomID ?? ''}`)
          }

          const roomID = msg.params[0].room

          const room = await this.actionQueue
            .add(async () => await this.join(
              {
                internalID,
                ...msg.params[0].peer
              },
              roomID,
              send)
            )

          return {
            peers: [...room.peers]
              .filter(x => x !== internalID)
              .map(x => this.peers.get(x)?.peer)
              .filter(isDefined),
            me: {
              internalID,
              camEnabled: msg.params[0].peer.camEnabled,
              muted: msg.params[0].peer.muted
            },
            screen: (room.screenSession !== undefined)
              ? {
                  internalID: room.screenSession.name,
                  muted: true,
                  camEnabled: true
                }
              : undefined
          }
        }

        if (session === undefined) {
          throw Error('Peer session does not exist')
        }

        if (msg.method === ReqMethod.InitScreenSharing) {
          await this.actionQueue
            .add(async () => await this.initScreenSharing(internalID, send))

          return true
        }

        if (msg.method === ReqMethod.StopScreenSharing) {
          await this.actionQueue
            .add(async () => await this.stopScreenSharing(internalID))

          return true
        }

        if (msg.method === NotificationMethod.ICECandidate) {
          const isScreenOwner = makeScreenID(internalID) === msg.params[0].peerID

          if (isScreenOwner) {
            const screenSession = this.rooms.get(this.peers.get(internalID)?.roomID ?? '')?.screenSession

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

          const srcSession = makeScreenID(internalID) === msg.params[0].peerID
            ? targetSession
            : session

          const sdp = await srcSession.initVideoTransmission(targetSession, msg.params[0].sdp)
          return {
            sdp
          }
        }

        if (msg.method === ReqMethod.PeerUpdate) {
          const updatedPeer = {
            internalID,
            ...msg.params[0]
          }

          return {
            peer: await this.actionQueue
              .add(async () => await this.peerUpdated(updatedPeer))
          }
        }

        if (msg.method === ReqMethod.Leave) {
          await this.actionQueue
            .add(async () => await this.leave(internalID))

          return true
        }

        throw Error('Unknown rpc method')
      },
      onClose: async () => {
        await this.actionQueue
          .add(async () => await this.leave(internalID))
      }
    }
  }
}
