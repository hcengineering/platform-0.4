/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-floating-promises */
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

import { Readable, Writable, writable } from 'svelte/store'

import {
  TaskQueue,
  NotificationMethod,
  Peer as RawPeer,
  Client,
  JoinResp,
  ReqMethod,
  OutgoingNotifications,
  TransmitResp
} from '@anticrm/webrtc'

import type { Peer } from '..'

import { GainMeter } from './gain.meter'

type Status = 'joining' | 'joined' | 'left'

const GainPollInterval = 100
const GainThreshold = 0.01

const makePeer = (raw: RawPeer, isMediaReady = true): Peer => ({
  internalID: raw.internalID,
  peer: makeWebRTCPeer(),
  media: new MediaStream(),
  isMediaReady,
  muted: raw.muted,
  camEnabled: raw.camEnabled
})

const extWritable = <T>(
  init: T,
  start?: (set: (x: T) => void) => () => void
): { get: () => T, run: (f: (x: T) => void) => void } & Writable<T> => {
  let value = init
  const w = writable<T>(init, start)

  return {
    set: (v: T) => {
      value = v
      w.set(v)
    },
    update: (f: (x: T) => T) => {
      value = f(value)
      w.set(value)
    },
    get: () => value,
    run: (f: (x: T) => void) => {
      f(value)
    },
    subscribe: w.subscribe
  }
}

const releaseMedia = (p: Peer): Peer => {
  p.media.getTracks().forEach((track) => {
    track.stop()
    p.media.removeTrack(track)
  })

  return {
    ...p,
    isMediaReady: false
  }
}

const makeWebRTCPeer = (): RTCPeerConnection =>
  new RTCPeerConnection({
    iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }]
  })

export class RoomMgr {
  private readonly _peers = extWritable(new Map<string, Peer>())

  get peers (): Readable<Map<string, Peer>> {
    return this._peers
  }

  private readonly _user = extWritable(makePeer({ internalID: '', muted: false, camEnabled: true }, false), () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.queue.add(async () => await this.initMedia())

    return () => {
      this.queue.add(async () => this.releaseMedia())
    }
  })

  get user (): Readable<Peer> {
    return this._user
  }

  private readonly _screen = extWritable(makePeer({ internalID: '', muted: true, camEnabled: true }, false))

  get screen (): Readable<Peer> {
    return this._screen
  }

  private readonly _status = extWritable<Status>('left')

  get status (): Readable<Status> {
    return this._status
  }

  private readonly _gains = extWritable(new Map<string, number>())

  get gains (): Readable<Map<string, number>> {
    return this._gains
  }

  private readonly client: Client

  private readonly queue = new TaskQueue()
  private readonly gainMeters = new Map<
  string,
  {
    timeoutHandler: any
    meter: GainMeter
  }
  >()

  constructor (client: Client) {
    this.client = client
    const boundHandler = this.handle.bind(this)

    this.client.subscribe(NotificationMethod.ICECandidate, boundHandler)
    this.client.subscribe(NotificationMethod.PeerJoined, boundHandler)
    this.client.subscribe(NotificationMethod.PeerLeft, boundHandler)
    this.client.subscribe(NotificationMethod.ScreenSharingFinished, boundHandler)
    this.client.subscribe(NotificationMethod.ScreenSharingStarted, boundHandler)
    this.client.subscribe(NotificationMethod.PeerUpdated, boundHandler)
  }

  async close (): Promise<void> {
    await this.client.close()
  }

  private async initMedia (): Promise<void> {
    const media = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: {
        width: { ideal: 1280 },
        height: { ideal: 920 }
      }
    })

    this._user.update((u) => ({
      ...u,
      media,
      isMediaReady: true
    }))
  }

  private releaseMedia (): void {
    this._user.update(releaseMedia)

    const screen = this._screen.get()
    const user = this._user.get()
    if (screen.owner === user.internalID) {
      this._screen.update(releaseMedia)
    }
  }

  async toggleMute () {
    const user = this._user.get()

    if (this._status.get() !== 'left') {
      const { peer } = await this.client.sendRequest({
        method: ReqMethod.PeerUpdate,
        params: [
          {
            muted: !user.muted
          }
        ]
      })

      this._user.update((u) => ({
        ...u,
        ...peer
      }))
    } else {
      this._user.update((u) => ({
        ...u,
        muted: !u.muted
      }))
    }

    const updatedUser = this._user.get()
    updatedUser.media.getAudioTracks().forEach((track) => (track.enabled = !updatedUser.muted))
  }

  async toggleCam () {
    const user = this._user.get()

    if (this._status.get() !== 'left') {
      const { peer } = await this.client.sendRequest({
        method: ReqMethod.PeerUpdate,
        params: [
          {
            camEnabled: !user.camEnabled
          }
        ]
      })

      this._user.update((u) => ({
        ...u,
        ...peer
      }))
    } else {
      this._user.update((u) => ({
        ...u,
        camEnabled: !u.camEnabled
      }))
    }

    const updatedUser = this._user.get()
    updatedUser.media.getVideoTracks().forEach((track) => (track.enabled = updatedUser.camEnabled))
  }

  private readonly pollPeerGain = (id: string) => (track: MediaStreamTrack) => {
    const meter = new GainMeter(track)
    const handler = setInterval(() => {
      const curLevel = this._gains.get().get(id)
      const level = meter.getValue() > GainThreshold ? 1 : 0

      if (level !== curLevel) {
        this._gains.update((gains) => {
          gains.set(id, level)
          return gains
        })
      }
    }, GainPollInterval)

    this.gainMeters.set(id, {
      meter,
      timeoutHandler: handler
    })
  }

  private async init (result: JoinResp['result']): Promise<void> {
    if (this._status.get() === 'left') {
      return
    }

    if (result === undefined) {
      console.error('Failed to join room: missing result')

      return
    }

    this._status.set('joined')

    this._user.update((user) => ({
      ...user,
      ...(result.me ?? {}),
      peer: makeWebRTCPeer()
    }))

    await this.setupPeer(this._user.get(), this.pollPeerGain('user'))

    this._peers.set(new Map(result.peers.map((x) => [x.internalID, makePeer(x, true)])))

    await Promise.all(
      [...this._peers.get().values()].map(async (p) => await this.setupPeer(p, this.pollPeerGain(p.internalID), true))
    )

    if (result.screen !== undefined) {
      const internalID = result.screen.peer.internalID
      const owner = result.screen.owner

      this._screen.update((screen) => ({
        ...screen,
        internalID,
        peer: makeWebRTCPeer(),
        isMediaReady: true,
        owner
      }))

      await this.setupPeer(this._screen.get(), () => {}, true)
    }
  }

  async join (room: string): Promise<void> {
    if (this._status.get() !== 'left') {
      return
    }

    this._status.set('joining')
    const user = this._user.get()

    try {
      const resp: JoinResp['result'] = await this.client.sendRequest({
        method: ReqMethod.Join,
        params: [
          {
            room,
            peer: {
              camEnabled: user.camEnabled,
              muted: user.muted
            }
          }
        ]
      })

      await this.queue.add(async () => await this.init(resp))
    } catch (e) {
      console.error(e)
      this._status.set('left')
    }
  }

  async leave (): Promise<void> {
    this._user.run((u) => {
      u.peer.close()
    })

    this._peers.run((ps) => {
      ps.forEach((p) => {
        p.peer.close()
        releaseMedia(p)
      })
    })

    this._peers.set(new Map())
    ;[...this.gainMeters.values()].forEach(({ timeoutHandler, meter }) => {
      clearInterval(timeoutHandler)
      meter.close()
    })

    this.gainMeters.clear()
    this._gains.set(new Map())

    await this.handleScreenSharingFinished()

    this._status.set('left')

    await this.client.sendRequest({
      method: ReqMethod.Leave,
      params: []
    })
  }

  async shareScreen (): Promise<void> {
    if (this._status.get() !== 'joined') {
      return
    }

    const screen = this._screen.get()

    if (screen.isMediaReady) {
      return
    }

    // https://github.com/microsoft/TypeScript/issues/33232
    // @ts-expect-error
    const media = (await navigator.mediaDevices.getDisplayMedia({
      audio: false,
      video: {
        frameRate: { ideal: 30 }
      }
    })) as MediaStream

    media.getTracks()[0]?.addEventListener('ended', () => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.stopSharingScreen()
    })

    this._screen.update((screen) => ({
      ...screen,
      media,
      isMediaReady: true
    }))

    const { peerID } = await this.client.sendRequest({
      method: ReqMethod.InitScreenSharing,
      params: []
    })

    await this.queue.add(async () => await this.handleScreenSharingStarted(peerID, this._user.get().internalID))
  }

  async stopSharingScreen (): Promise<void> {
    const screen = this._screen.get()
    const user = this._user.get()

    if (screen.owner !== user.internalID) {
      return
    }

    await this.queue.add(async () => await this.handleScreenSharingFinished())
  }

  private async handle (msg: OutgoingNotifications): Promise<void> {
    if (this._status.get() === 'left') {
      return
    }

    await this.queue.add(async () => {
      const { result } = msg
      if (result === undefined) {
        return
      }

      switch (result.notification) {
        case NotificationMethod.ICECandidate: {
          const target = this.findPeer(result.params.peerID)

          if (target === undefined) {
            return
          }

          await target.peer.addIceCandidate(result.params.candidate)

          return
        }
        case NotificationMethod.PeerJoined: {
          const peer = makePeer(result.params.peer, true)
          this._peers.update((peers) => {
            peers.set(peer.internalID, peer)
            return peers
          })

          await this.setupPeer(peer, this.pollPeerGain(peer.internalID), true)

          return
        }
        case NotificationMethod.PeerLeft: {
          const targetID = result.params.peerID
          const peer = this._peers.get().get(targetID)

          if (peer === undefined) {
            return
          }

          const meter = this.gainMeters.get(targetID)
          clearTimeout(meter?.timeoutHandler)
          meter?.meter.close()

          this.gainMeters.delete(targetID)
          this._gains.update((gains) => {
            gains.delete(targetID)
            return gains
          })

          this._peers.update((peers) => {
            peers.delete(targetID)
            return peers
          })

          releaseMedia(peer)
          peer.peer.close()

          return
        }
        case NotificationMethod.ScreenSharingStarted: {
          await this.handleScreenSharingStarted(result.params.peerID, result.params.owner)

          return
        }
        case NotificationMethod.ScreenSharingFinished: {
          this.handleScreenSharingFinished()
          return
        }
        case NotificationMethod.PeerUpdated: {
          const targetPeer = this._peers.get().get(result.params.peer.internalID)
          if (targetPeer === undefined) {
            return
          }

          this._peers.update((peers) => {
            peers.set(targetPeer.internalID, {
              ...targetPeer,
              ...result.params.peer
            })

            return peers
          })
        }
      }
    })
  }

  private async handleScreenSharingStarted (peerID: string, ownerID: string): Promise<void> {
    this._screen.update((screen) => ({
      ...screen,
      internalID: peerID,
      peer: makeWebRTCPeer(),
      isMediaReady: true,
      owner: ownerID
    }))

    const screen = this._screen.get()
    const user = this._user.get()

    await this.setupPeer(screen, () => {}, screen.owner !== user.internalID)
  }

  private async handleScreenSharingFinished (): Promise<void> {
    const screen = this._screen.get()
    releaseMedia(screen)
    screen.peer.close()

    this._screen.update((screen) => ({
      ...screen,
      id: '',
      internalID: '',
      isMediaReady: false,
      owner: undefined
    }))

    const user = this._user.get()

    if (this._status.get() === 'joined' && user.internalID === screen.owner) {
      await this.client.sendRequest({
        method: ReqMethod.StopScreenSharing,
        params: []
      })
    }
  }

  private findPeer (id: string): Peer | undefined {
    if (this._user.get().internalID === id) {
      return this._user.get()
    }

    if (this._screen.get().internalID === id) {
      return this._screen.get()
    }

    return this._peers.get().get(id)
  }

  private async setupPeer (peer: Peer, onAudioTrack: (track: MediaStreamTrack) => void, remote = false): Promise<void> {
    if (remote) {
      peer.peer.addTransceiver('audio', { direction: 'recvonly' })
      peer.peer.addTransceiver('video', { direction: 'recvonly' })

      peer.peer.addEventListener('track', ({ track }) => {
        if (track.kind === 'audio') {
          onAudioTrack(track)
        }
        peer.media.addTrack(track)
      })
    } else {
      peer.media.getTracks().forEach((track) => {
        if (track.kind === 'audio') {
          onAudioTrack(track)
        }
        peer.peer.addTrack(track)
      })
    }

    peer.peer.addEventListener('icecandidate', ({ candidate }) => {
      if (candidate === null || candidate.sdpMid === null) {
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.client.sendNotification({
        method: NotificationMethod.ICECandidate,
        params: [
          {
            candidate: candidate as any,
            peerID: peer.internalID
          }
        ]
      })
    })

    await peer.peer.createOffer().then(async (offer) => {
      await peer.peer.setLocalDescription(offer)
      const resp: TransmitResp['result'] = await this.client.sendRequest({
        method: ReqMethod.Transmit,
        params: [
          {
            peerID: peer.internalID,
            sdp: offer.sdp ?? ''
          }
        ]
      })

      await peer.peer.setRemoteDescription({ type: 'answer', sdp: resp?.sdp })
    })
  }
}
