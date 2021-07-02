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

import { get, Readable, Unsubscriber } from 'svelte/store';

import { NotificationMethod, ReqMethod } from '@anticrm/webrtc'
import { RoomMgr } from '../room.mgr'
import { Peer } from '../..';

jest.mock('../gain.meter')
jest.useFakeTimers()

const mediaStreamConstructor = jest.fn()
Object.defineProperty(global, 'MediaStream', {
  writable: true,
  value: mediaStreamConstructor
});

const getUserMediaMock = jest.fn()
const getDisplayMediaMock = jest.fn()

Object.defineProperty(global, 'navigator', {
  writable: true,
  value: {
    mediaDevices: {
      getDisplayMedia: getDisplayMediaMock,
      getUserMedia: getUserMediaMock
    }
  }
})

const mockTrack = () => ({
  stop: jest.fn(),
  addEventListener: jest.fn(),
  enabled: true,
  kind: ''
})

const mockMedia = () => {
  const tracks = Array(2).fill(undefined).map(mockTrack)
  tracks[0].kind = 'audio'
  tracks[1].kind = 'video'

  const media = {
    getAudioTracks: jest.fn().mockReturnValue([tracks[0]]),
    getVideoTracks: jest.fn().mockReturnValue([tracks[1]]),
    getTracks: jest.fn().mockReturnValue(tracks),
    addTrack: jest.fn(),
    removeTrack: jest.fn()
  }

  return {tracks, media}
}

const mockClient = () => ({
  sendRequest: jest.fn(),
  sendNotification: jest.fn(),
  subscribe: jest.fn()
})

const mockWebRTCEndpoint = (offer: string) => ({
  addIceCandidate: jest.fn(),
  addEventListener: jest.fn(),
  addTrack: jest.fn(),
  addTransceiver: jest.fn(),
  createOffer: jest.fn().mockResolvedValue({sdp: offer}),
  setLocalDescription: jest.fn(),
  setRemoteDescription: jest.fn(),
  close: jest.fn()
})

const checkStore = <T>(
  store: Readable<T>,
  values: Partial<T>[],
  check: (a: T, b: Partial<T>) => void = (a: T, b: Partial<T>) => expect(a).toEqual(b)
): Unsubscriber => {
  let idx = 0

  const unsub = store.subscribe((value) => {
    const target = values[idx++]

    check(value, target)
  })

  return () => {
    unsub()
    expect(idx).toEqual(values.length)
  }
}

const waitForMediaReady = (store: Readable<Peer>) => new Promise((resolve) => {
  const uns = store.subscribe(val => {
    if (val.isMediaReady) {
      uns()
      resolve(undefined)
    }
  })
})

const waitForMediaReleased = (store: Readable<Peer>) => new Promise((resolve, reject) => {
  let count = 0

  const checker = () => {
    count++
    if (count === 3) {
      reject('Release timeout')
      return
    }

    if ((store as any).get().isMediaReady === false) {
      resolve(undefined)
      return
    }

    awaiter()
  }
  const awaiter = () => {
    jest.useRealTimers()
    setTimeout(checker, 100)
    jest.useFakeTimers()
  }

  checker()
})

describe('room manager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  it('constructs properly', () => {
    (global as any).RTCPeerConnection = jest.fn()
    const client = mockClient()

    new RoomMgr(client as any)

    const notifications = client.subscribe.mock.calls.map(x => x[0])

    expect(notifications).toHaveLength(6)
    expect(notifications).toContainEqual(NotificationMethod.PeerJoined)
    expect(notifications).toContainEqual(NotificationMethod.PeerLeft)
    expect(notifications).toContainEqual(NotificationMethod.PeerUpdated)
    expect(notifications).toContainEqual(NotificationMethod.ScreenSharingStarted)
    expect(notifications).toContainEqual(NotificationMethod.ScreenSharingFinished)
    expect(notifications).toContainEqual(NotificationMethod.ICECandidate)
  })

  it('initializes and releases media when gets user subscriber', async () => {
    (global as any).RTCPeerConnection = jest.fn()
    const {media, tracks} = mockMedia()
    getUserMediaMock.mockResolvedValue(media)
    const client = mockClient()

    const mgr = new RoomMgr(client as any)

    const unsub = checkStore(
      mgr.user,
      [
        {
          internalID: '',
          isMediaReady: false,
          muted: false,
          camEnabled: true 
        },
        {
          internalID: '',
          isMediaReady: true,
          muted: false,
          camEnabled: true 
        }
      ],
      (a, b) => expect(a).toEqual(expect.objectContaining(b))
    )

    expect(getUserMediaMock).toBeCalledTimes(1)

    await waitForMediaReady(mgr.user)

    expect(global.RTCPeerConnection).toBeCalledTimes(2)
    expect(global.MediaStream).toBeCalledTimes(2)
    expect(get(mgr.status) === 'left')

    unsub()

    await waitForMediaReleased(mgr.user)

    expect(media.getTracks).toBeCalledTimes(1)
    tracks.forEach(track => {
      expect(track.stop).toBeCalledTimes(1)
      expect(media.removeTrack).toBeCalledWith(track)
    })
  })
  it('toggles cam when not joined', async () => {
    (global as any).RTCPeerConnection = jest.fn()
    const {media, tracks} = mockMedia()
    getUserMediaMock.mockResolvedValue(media)
    const client = mockClient()

    const mgr = new RoomMgr(client as any)

    const unsub = checkStore(
      mgr.user,
      [
        {
          internalID: '',
          isMediaReady: false,
          muted: false,
          camEnabled: true 
        },
        {
          internalID: '',
          isMediaReady: true,
          muted: false,
          camEnabled: true 
        },
        {
          internalID: '',
          isMediaReady: true,
          muted: false,
          camEnabled: false
        },
        {
          internalID: '',
          isMediaReady: true,
          muted: false,
          camEnabled: true
        }
      ],
      (a, b) => expect(a).toEqual(expect.objectContaining(b))
    )

    await waitForMediaReady(mgr.user)

    await mgr.toggleCam()
    expect(tracks[0].enabled).toBe(true)
    expect(tracks[1].enabled).toBe(false)

    await mgr.toggleCam()
    expect(tracks[0].enabled).toBe(true)
    expect(tracks[1].enabled).toBe(true)

    unsub()
  })
  it('toggles mic when not joined', async () => {
    (global as any).RTCPeerConnection = jest.fn().mockReturnValue({
      addTrack: jest.fn()
    })
    const {media, tracks} = mockMedia()
    getUserMediaMock.mockResolvedValue(media)
    const client = mockClient()

    const mgr = new RoomMgr(client as any)

    const unsub = checkStore(
      mgr.user,
      [
        {
          internalID: '',
          isMediaReady: false,
          muted: false,
          camEnabled: true 
        },
        {
          internalID: '',
          isMediaReady: true,
          muted: false,
          camEnabled: true 
        },
        {
          internalID: '',
          isMediaReady: true,
          muted: true,
          camEnabled: true
        },
        {
          internalID: '',
          isMediaReady: true,
          muted: false,
          camEnabled: true
        }
      ],
      (a, b) => expect(a).toEqual(expect.objectContaining(b))
    )

    await waitForMediaReady(mgr.user)

    await mgr.toggleMute()
    expect(tracks[0].enabled).toBe(false)
    expect(tracks[1].enabled).toBe(true)

    await mgr.toggleMute()
    expect(tracks[0].enabled).toBe(true)
    expect(tracks[1].enabled).toBe(true)

    unsub()
  })

  it('toggles cam when joined', async () => {
    const {media, tracks} = mockMedia()
    getUserMediaMock.mockResolvedValue(media)

    ;(global as any).RTCPeerConnection = jest.fn().mockImplementation(() => mockWebRTCEndpoint(''))
    const client = mockClient()

    const mgr = new RoomMgr(client as any)

    const joinResp = {
      peers: [],
      screen: undefined,
      me: {
        internalID: 'test-user',
        muted: false,
        camEnabled: true
      }
    }

    const unsub = checkStore(
      mgr.user,
      [
        {
          internalID: '',
          isMediaReady: false,
          muted: false,
          camEnabled: true 
        },
        {
          internalID: '',
          isMediaReady: true,
          muted: false,
          camEnabled: true 
        },
        {
          internalID: joinResp.me.internalID,
          isMediaReady: true,
          muted: false,
          camEnabled: true 
        },
        {
          internalID: joinResp.me.internalID,
          isMediaReady: true,
          muted: false,
          camEnabled: false
        },
        {
          internalID: joinResp.me.internalID,
          isMediaReady: true,
          muted: false,
          camEnabled: true
        }
      ],
      (a, b) => expect(a).toEqual(expect.objectContaining(b))
    )

    await waitForMediaReady(mgr.user)
  
    client.sendRequest.mockImplementation((request: any) => {
      if (request.method === ReqMethod.Join) {
        return joinResp
      }

      if (request.method === ReqMethod.Transmit) {
        return {
          sdp: ''
        }
      }

      if (request.method === ReqMethod.PeerUpdate) {
        return {
          peer: {
            internalID: joinResp.me.internalID,
            camEnabled: request.params[0].camEnabled,
            muted: false
          }
        }
      }
    })
    await mgr.join('test-room')
    client.sendRequest.mockClear()

    await mgr.toggleCam()
    expect(tracks[0].enabled).toBe(true)
    expect(tracks[1].enabled).toBe(false)
    expect(client.sendRequest).toBeCalledWith({
      method: ReqMethod.PeerUpdate,
      params: [{
        camEnabled: false
      }]
    })

    client.sendRequest.mockClear()

    await mgr.toggleCam()
    expect(tracks[0].enabled).toBe(true)
    expect(tracks[1].enabled).toBe(true)
    expect(client.sendRequest).toBeCalledWith({
      method: ReqMethod.PeerUpdate,
      params: [{
        camEnabled: true
      }]
    })

    unsub()
  })
  it('toggles mic when joined', async () => {
    const {media, tracks} = mockMedia()
    getUserMediaMock.mockResolvedValue(media)
    const userEndpoint = mockWebRTCEndpoint('')

    ;(global as any).RTCPeerConnection = jest.fn()
      .mockReturnValueOnce(mockWebRTCEndpoint('')) // init user endpoint
      .mockReturnValueOnce(mockWebRTCEndpoint('')) // init screen endpoint
      .mockReturnValueOnce(userEndpoint) // actual user endpoint
    const client = mockClient()

    const mgr = new RoomMgr(client as any)

    const joinResp = {
      peers: [],
      screen: undefined,
      me: {
        internalID: 'test-user',
        muted: false,
        camEnabled: true
      }
    }

    const unsub = checkStore(
      mgr.user,
      [
        {
          internalID: '',
          isMediaReady: false,
          muted: false,
          camEnabled: true 
        },
        {
          internalID: '',
          isMediaReady: true,
          muted: false,
          camEnabled: true 
        },
        {
          internalID: joinResp.me.internalID,
          isMediaReady: true,
          muted: false,
          camEnabled: true 
        },
        {
          internalID: joinResp.me.internalID,
          isMediaReady: true,
          muted: true,
          camEnabled: true
        },
        {
          internalID: joinResp.me.internalID,
          isMediaReady: true,
          muted: false,
          camEnabled: true
        }
      ],
      (a, b) => expect(a).toEqual(expect.objectContaining(b))
    )

    await waitForMediaReady(mgr.user)
  
    client.sendRequest.mockImplementation((request: any) => {
      if (request.method === ReqMethod.Join) {
        return joinResp
      }

      if (request.method === ReqMethod.Transmit) {
        return {
          sdp: ''
        }
      }

      if (request.method === ReqMethod.PeerUpdate) {
        return {
          peer: {
            internalID: joinResp.me.internalID,
            camEnabled: true,
            muted: request.params[0].muted
          }
        }
      }
    })
    await mgr.join('test-room')
    client.sendRequest.mockClear()

    await mgr.toggleMute()
    expect(tracks[0].enabled).toBe(false)
    expect(tracks[1].enabled).toBe(true)
    expect(client.sendRequest).toBeCalledWith({
      method: ReqMethod.PeerUpdate,
      params: [{
        muted: true
      }]
    })

    client.sendRequest.mockClear()

    await mgr.toggleMute()
    expect(tracks[0].enabled).toBe(true)
    expect(tracks[1].enabled).toBe(true)
    expect(client.sendRequest).toBeCalledWith({
      method: ReqMethod.PeerUpdate,
      params: [{
        muted: false
      }]
    })

    unsub()
  })

  it('joins to specific room when it is empty', async () => {
    const offer = 'super offer'
    const answer = 'super answer'
    const userEndpoint = mockWebRTCEndpoint(offer)

    ;(global as any).RTCPeerConnection = jest.fn()
      .mockReturnValueOnce(mockWebRTCEndpoint('')) // init user endpoint
      .mockReturnValueOnce(mockWebRTCEndpoint('')) // init screen endpoint
      .mockReturnValueOnce(userEndpoint) // actual user endpoint

    const {media, tracks} = mockMedia()
    getUserMediaMock.mockResolvedValueOnce(media)
    const client = mockClient()

    const joinResp = {
      peers: [],
      screen: undefined,
      me: {
        internalID: 'test-user',
        muted: false,
        camEnabled: true
      }
    }

    const mgr = new RoomMgr(client as any)
    const unsubUser = checkStore(
      mgr.user,
      [
        {
          internalID: '',
          isMediaReady: false,
          muted: false,
          camEnabled: true 
        },
        {
          internalID: '',
          isMediaReady: true,
          muted: false,
          camEnabled: true 
        },
        {
          ...joinResp.me,
          isMediaReady: true
        }
      ],
      (a, b) => expect(a).toEqual(expect.objectContaining(b))
    )

    await waitForMediaReady(mgr.user)

    const unsubPeers = checkStore(
      mgr.peers,
      [
        new Map(),
        new Map()
      ]
    )
    const unsubStatus = checkStore(
      mgr.status,
      [
        'left',
        'joining',
        'joined'
      ]
    )
    client.sendRequest.mockImplementation((request: any) => {
      if (request.method === ReqMethod.Join) {
        return joinResp
      }

      if (request.method === ReqMethod.Transmit) {
        return {
          sdp: answer
        }
      }
    })

    await mgr.join('test-room')

    expect(client.sendRequest).toBeCalledTimes(2)
    expect(client.sendRequest).toBeCalledWith({
      method: ReqMethod.Join,
      params: [
        {
          room: 'test-room',
          peer: {
            camEnabled: true,
            muted: false
          }
        }
      ]
    })
    expect(client.sendRequest).toBeCalledWith({
      method: ReqMethod.Transmit,
      params: [{
        peerID: joinResp.me.internalID,
        sdp: offer
      }]
    })
    expect(userEndpoint.setLocalDescription).toBeCalledTimes(1)
    expect(userEndpoint.setLocalDescription).toBeCalledWith({sdp: offer})
    expect(userEndpoint.setRemoteDescription).toBeCalledTimes(1)
    expect(userEndpoint.setRemoteDescription).toBeCalledWith({ type: 'answer', sdp: answer})
    expect(userEndpoint.addEventListener).toBeCalledTimes(1)
    expect(userEndpoint.addEventListener.mock.calls[0][0]).toBe('icecandidate')

    unsubUser()
    unsubPeers()
    unsubStatus()
  })
  it('handles webrtc negotiation', async () => {
    const offer = 'super offer'
    const answer = 'super answer'
    const userEndpoint = mockWebRTCEndpoint(offer)

    ;(global as any).RTCPeerConnection = jest.fn()
      .mockReturnValueOnce(mockWebRTCEndpoint('')) // init user endpoint
      .mockReturnValueOnce(mockWebRTCEndpoint('')) // init screen endpoint
      .mockReturnValueOnce(userEndpoint) // actual user endpoint

    const {media} = mockMedia()
    getUserMediaMock.mockResolvedValueOnce(media)
    const client = mockClient()

    const joinResp = {
      peers: [],
      screen: undefined,
      me: {
        internalID: 'test-user',
        muted: false,
        camEnabled: true
      }
    }

    const mgr = new RoomMgr(client as any)
    const unsubUser = checkStore(
      mgr.user,
      [
        {
          internalID: '',
          isMediaReady: false,
          muted: false,
          camEnabled: true 
        },
        {
          internalID: '',
          isMediaReady: true,
          muted: false,
          camEnabled: true 
        },
        {
          ...joinResp.me,
          isMediaReady: true
        }
      ],
      (a, b) => expect(a).toEqual(expect.objectContaining(b))
    )

    await waitForMediaReady(mgr.user)

    client.sendRequest.mockImplementation((request: any) => {
      if (request.method === ReqMethod.Join) {
        return joinResp
      }

      if (request.method === ReqMethod.Transmit) {
        return {
          sdp: answer
        }
      }
    })

    await mgr.join('test-room')

    expect(userEndpoint.addEventListener).toBeCalledTimes(1)
    expect(userEndpoint.addEventListener.mock.calls[0][0]).toBe('icecandidate')

    const icecandidateCb = userEndpoint.addEventListener.mock.calls[0][1]
    const candidate = { sdpMid: 'sdpMid' }
    icecandidateCb({ candidate })

    expect(client.sendNotification).toBeCalledTimes(1)
    expect(client.sendNotification).toBeCalledWith({
      method: NotificationMethod.ICECandidate,
      params: [{
        candidate,
        peerID: joinResp.me.internalID
      }]
    })

    client.sendNotification.mockClear()

    icecandidateCb({ candidate: null })
    icecandidateCb({ candidate: { sdpMid: null } })

    expect(client.sendNotification).not.toBeCalled()

    const handler = client.subscribe.mock.calls
      .find(x => x[0] === NotificationMethod.ICECandidate)
      ?.[1]

    expect(handler).toBeDefined()

    const externalCandidate = 'external-candidate'
    await handler({
      result: {
        notification: NotificationMethod.ICECandidate,
        params: {
          candidate: externalCandidate,
          peerID: 'UNKNOWN_PEER'
        }
      }
    })

    expect(userEndpoint.addIceCandidate).not.toBeCalled()

    await handler({
      result: {
        notification: NotificationMethod.ICECandidate,
        params: {
          candidate: externalCandidate,
          peerID: joinResp.me.internalID
        }
      }
    })

    expect(userEndpoint.addIceCandidate).toBeCalledTimes(1)
    expect(userEndpoint.addIceCandidate).toBeCalledWith(externalCandidate)

    unsubUser()
  })
  it('handles screen sharing workflow', async () => {
    const offer = 'super offer'
    const answer = 'super answer'
    const userEndpoint = mockWebRTCEndpoint(offer)
    const screenEndpoint = mockWebRTCEndpoint(offer)

    ;(global as any).RTCPeerConnection = jest.fn()
      .mockReturnValueOnce(mockWebRTCEndpoint('')) // init user endpoint
      .mockReturnValueOnce(mockWebRTCEndpoint('')) // init screen endpoint
      .mockReturnValueOnce(userEndpoint) // actual user endpoint
      .mockReturnValueOnce(screenEndpoint) // actual screen endpoint

    const {media, tracks} = mockMedia()
    getDisplayMediaMock.mockResolvedValueOnce(media)
    getUserMediaMock.mockResolvedValueOnce(mockMedia().media)

    const client = mockClient()

    const joinResp = {
      peers: [],
      screen: undefined,
      me: {
        internalID: 'test-user',
        muted: false,
        camEnabled: true
      }
    }

    const screenID = 'screen-id'

    const mgr = new RoomMgr(client as any)
    const unsubUser = checkStore(
      mgr.user,
      [
        {
          internalID: '',
          isMediaReady: false,
          muted: false,
          camEnabled: true 
        },
        {
          internalID: '',
          isMediaReady: true,
          muted: false,
          camEnabled: true 
        },
        {
          ...joinResp.me,
          isMediaReady: true
        }
      ],
      (a, b) => expect(a).toEqual(expect.objectContaining(b))
    )
    const unsubScreen = checkStore(
      mgr.screen,
      [
        {
          internalID: '',
          isMediaReady: false,
          muted: true,
          camEnabled: true
        },
        {
          internalID: '',
          isMediaReady: true,
          muted: true,
          camEnabled: true
        },
        {
          internalID: screenID,
          isMediaReady: true,
          muted: true,
          camEnabled: true
        },
        {
          internalID: '',
          isMediaReady: false,
          muted: true,
          camEnabled: true
        }
      ],
      (a, b) => expect(a).toEqual(expect.objectContaining(b))
    )

    await waitForMediaReady(mgr.user)

    client.sendRequest.mockImplementation((request: any) => {
      if (request.method === ReqMethod.Join) {
        return joinResp
      }

      if (request.method === ReqMethod.Transmit) {
        return {
          sdp: answer
        }
      }
    })

    await mgr.shareScreen()
    
    expect(client.sendRequest).not.toBeCalled()

    await mgr.join('test-room')

    client.sendRequest.mockClear()

    client.sendRequest.mockImplementation((request: any) => {
      if (request.method === ReqMethod.Transmit) {
        return {
          sdp: answer
        }
      }

      if (request.method === ReqMethod.InitScreenSharing) {
        return {
          peerID: screenID
        }
      }
    })

    await mgr.shareScreen()

    expect(client.sendRequest).toBeCalledWith({
      method: ReqMethod.InitScreenSharing,
      params: []
    })
    expect(screenEndpoint.setLocalDescription).toBeCalledTimes(1)
    expect(screenEndpoint.setLocalDescription).toBeCalledWith({ sdp: offer })
    expect(client.sendRequest).toBeCalledWith({
      method: ReqMethod.Transmit,
      params: [{
        peerID: screenID,
        sdp: offer
      }]
    })
    expect(screenEndpoint.setRemoteDescription).toBeCalledTimes(1)
    expect(screenEndpoint.setRemoteDescription).toBeCalledWith({ type: 'answer', sdp: answer })
  
    // @ts-expect-error
    expect(navigator.mediaDevices.getDisplayMedia).toBeCalledTimes(1)

    // @ts-expect-error
    navigator.mediaDevices.getDisplayMedia.mockClear()

    await mgr.shareScreen()

    // @ts-expect-error
    expect(navigator.mediaDevices.getDisplayMedia).not.toBeCalled()

    await mgr.stopSharingScreen()

    expect(client.sendRequest).toBeCalledWith({
      method: ReqMethod.StopScreenSharing,
      params: []
    })

    expect(media.removeTrack).toBeCalledTimes(2)
    tracks.forEach((track) => {
      expect(track.stop).toBeCalledTimes(1)
      expect(media.removeTrack).toBeCalledWith(track)
    })

    unsubUser()
    unsubScreen()
  })

  it('stops screen sharing on leave', async () => {
    const offer = 'super offer'
    const answer = 'super answer'
    const userEndpoint = mockWebRTCEndpoint(offer)
    const screenEndpoint = mockWebRTCEndpoint(offer)

    ;(global as any).RTCPeerConnection = jest.fn()
      .mockReturnValueOnce(mockWebRTCEndpoint('')) // init user endpoint
      .mockReturnValueOnce(mockWebRTCEndpoint('')) // init screen endpoint
      .mockReturnValueOnce(userEndpoint) // actual user endpoint
      .mockReturnValueOnce(screenEndpoint) // actual screen endpoint

    const {media, tracks} = mockMedia()
    getDisplayMediaMock.mockResolvedValueOnce(media)
    getUserMediaMock.mockResolvedValueOnce(mockMedia().media)

    const client = mockClient()

    const joinResp = {
      peers: [],
      screen: undefined,
      me: {
        internalID: 'test-user',
        muted: false,
        camEnabled: true
      }
    }
    const screenID = 'sceen-id'

    const mgr = new RoomMgr(client as any)
    const unsubUser = checkStore(
      mgr.user,
      [
        {
          internalID: '',
          isMediaReady: false,
          muted: false,
          camEnabled: true 
        },
        {
          internalID: '',
          isMediaReady: true,
          muted: false,
          camEnabled: true 
        },
        {
          ...joinResp.me,
          isMediaReady: true
        }
      ],
      (a, b) => expect(a).toEqual(expect.objectContaining(b))
    )
    const unsubScreen = checkStore(
      mgr.screen,
      [
        {
          internalID: '',
          isMediaReady: false,
          muted: true,
          camEnabled: true
        },
        {
          internalID: '',
          isMediaReady: true,
          muted: true,
          camEnabled: true
        },
        {
          internalID: screenID,
          isMediaReady: true,
          muted: true,
          camEnabled: true
        },
        {
          internalID: '',
          isMediaReady: false,
          muted: true,
          camEnabled: true
        }
      ],
      (a, b) => expect(a).toEqual(expect.objectContaining(b))
    )

    await waitForMediaReady(mgr.user)

    client.sendRequest.mockImplementation((request: any) => {
      if (request.method === ReqMethod.Join) {
        return joinResp
      }

      if (request.method === ReqMethod.Transmit) {
        return {
          sdp: answer
        }
      }
    })

    await mgr.shareScreen()
    
    expect(client.sendRequest).not.toBeCalled()

    await mgr.join('test-room')

    client.sendRequest.mockClear()

    client.sendRequest.mockImplementation((request: any) => {
      if (request.method === ReqMethod.Transmit) {
        return {
          sdp: answer
        }
      }
      if (request.method === ReqMethod.InitScreenSharing) {
        return {
          peerID: screenID
        }
      }
    })

    await mgr.shareScreen()
    await mgr.leave()

    expect(client.sendRequest).toBeCalledWith({
      method: ReqMethod.StopScreenSharing,
      params: []
    })

    expect(media.removeTrack).toBeCalledTimes(2)
    tracks.forEach((track) => {
      expect(track.stop).toBeCalledTimes(1)
      expect(media.removeTrack).toBeCalledWith(track)
    })

    unsubUser()
    unsubScreen()
  })

  it('stops screen sharing on ended event', async () => {
    const offer = 'super offer'
    const answer = 'super answer'
    const userEndpoint = mockWebRTCEndpoint(offer)
    const screenEndpoint = mockWebRTCEndpoint(offer)

    ;(global as any).RTCPeerConnection = jest.fn()
      .mockReturnValueOnce(mockWebRTCEndpoint('')) // init user endpoint
      .mockReturnValueOnce(mockWebRTCEndpoint('')) // init screen endpoint
      .mockReturnValueOnce(userEndpoint) // actual user endpoint
      .mockReturnValueOnce(screenEndpoint) // actual screen endpoint

    const {media, tracks} = mockMedia()
    getDisplayMediaMock.mockResolvedValueOnce(media)
    getUserMediaMock.mockResolvedValueOnce(mockMedia().media)

    const client = mockClient()

    const joinResp = {
      peers: [],
      screen: undefined,
      me: {
        internalID: 'test-user',
        muted: false,
        camEnabled: true
      }
    }
    const screenID = 'screen-id'

    const mgr = new RoomMgr(client as any)
    const unsubUser = checkStore(
      mgr.user,
      [
        {
          internalID: '',
          isMediaReady: false,
          muted: false,
          camEnabled: true 
        },
        {
          internalID: '',
          isMediaReady: true,
          muted: false,
          camEnabled: true 
        },
        {
          ...joinResp.me,
          isMediaReady: true
        }
      ],
      (a, b) => expect(a).toEqual(expect.objectContaining(b))
    )
    const unsubScreen = checkStore(
      mgr.screen,
      [
        {
          internalID: '',
          isMediaReady: false,
          muted: true,
          camEnabled: true
        },
        {
          internalID: '',
          isMediaReady: true,
          muted: true,
          camEnabled: true
        },
        {
          internalID: screenID,
          isMediaReady: true,
          muted: true,
          camEnabled: true
        },
        {
          internalID: '',
          isMediaReady: false,
          muted: true,
          camEnabled: true
        }
      ],
      (a, b) => expect(a).toEqual(expect.objectContaining(b))
    )

    client.sendRequest.mockImplementation((request: any) => {
      if (request.method === ReqMethod.Join) {
        return joinResp
      }

      if (request.method === ReqMethod.Transmit) {
        return {
          sdp: answer
        }
      }
    })

    await mgr.join('test-room')

    client.sendRequest.mockClear()

    client.sendRequest.mockImplementation((request: any) => {
      if (request.method === ReqMethod.Transmit) {
        return {
          sdp: answer
        }
      }
      if (request.method === ReqMethod.InitScreenSharing) {
        return {
          peerID: screenID
        }
      }
    })

    await mgr.shareScreen()

    expect(tracks[0].addEventListener).toBeCalledTimes(1)
    const [event, handler] = tracks[0].addEventListener.mock.calls[0]

    expect(event).toBe('ended')

    handler()

    await waitForMediaReleased(mgr.screen)

    expect(client.sendRequest).toBeCalledWith({
      method: ReqMethod.StopScreenSharing,
      params: []
    })

    expect(media.removeTrack).toBeCalledTimes(2)
    tracks.forEach((track) => {
      expect(track.stop).toBeCalledTimes(1)
      expect(media.removeTrack).toBeCalledWith(track)
    })

    unsubUser()
    unsubScreen()
  })

  it('handles peer join/leave', async () => {
    const offer = 'super offer'
    const answer = 'super answer'
    const peerEndpoint = mockWebRTCEndpoint(offer)

    ;(global as any).RTCPeerConnection = jest.fn()
      .mockReturnValueOnce(mockWebRTCEndpoint('')) // init user endpoint
      .mockReturnValueOnce(mockWebRTCEndpoint('')) // init screen endpoint
      .mockReturnValueOnce(mockWebRTCEndpoint('')) // actual user endpoint
      .mockReturnValueOnce(peerEndpoint) // peer endpoint

    const {media, tracks} = mockMedia()
    getDisplayMediaMock
      .mockResolvedValueOnce(mockMedia().media) // user media
    
    mediaStreamConstructor
      .mockReturnValueOnce(mockMedia().media) // user media
      .mockReturnValueOnce(mockMedia().media) // screen media
      .mockReturnValueOnce(media) // peer media

    const client = mockClient()

    const joinResp = {
      peers: [],
      screen: undefined,
      me: {
        internalID: 'test-user',
        muted: false,
        camEnabled: true
      }
    }

    const peerID = 'peer-id'

    const mgr = new RoomMgr(client as any)
    const unsubUser = checkStore(
      mgr.user,
      [
        {
          internalID: '',
          isMediaReady: false,
          muted: false,
          camEnabled: true 
        },
        {
          internalID: '',
          isMediaReady: true,
          muted: false,
          camEnabled: true 
        },
        {
          ...joinResp.me,
          isMediaReady: true
        }
      ],
      (a, b) => expect(a).toEqual(expect.objectContaining(b))
    )
    const unsubPeers = checkStore(
      mgr.peers,
      [
        new Map(),
        new Map(),
        new Map([
          [peerID, {
            internalID: peerID,
            isMediaReady: true,
            muted: false,
            camEnabled: false,
            media
          }]
        ]),
        new Map()
      ],
      (a, b) => {
        expect([...a.keys()]).toEqual(b && [...b.keys!()])
        ;([...a.keys()])
          .forEach(k => expect(a.get(k)).toEqual(expect.objectContaining(b.get!(k))))
      }
    )

    client.sendRequest.mockImplementation((request: any) => {
      if (request.method === ReqMethod.Join) {
        return joinResp
      }

      if (request.method === ReqMethod.Transmit) {
        return {
          sdp: ''
        }
      }
    })

    const peerJoinedNotif = {
      result: {
        notification: NotificationMethod.PeerJoined,
        params: {
          peer: {
            internalID: peerID,
            camEnabled: false,
            muted: false
          }
        }
      }
    }

    const peerJoinedSub = client.subscribe.mock.calls.find(x => x[0] === NotificationMethod.PeerJoined)[1]
    await peerJoinedSub(peerJoinedNotif)
    expect(client.sendRequest).not.toBeCalled()

    await mgr.join('test-room')
    client.sendRequest.mockClear()

    client.sendRequest.mockImplementation((request: any) => {
      if (request.method === ReqMethod.Transmit) {
        return {
          sdp: answer
        }
      }
    })
    await peerJoinedSub(peerJoinedNotif)

    expect(peerEndpoint.createOffer).toBeCalledTimes(1)
    expect(peerEndpoint.setLocalDescription).toBeCalledWith({ sdp: offer })
    expect(peerEndpoint.setRemoteDescription).toBeCalledWith({ type: 'answer', sdp: answer })
    expect(client.sendRequest).toBeCalledWith({
      method: ReqMethod.Transmit,
      params: [{
        peerID,
        sdp: offer
      }]
    })

    expect(peerEndpoint.addTransceiver).toBeCalledTimes(2)
    expect(peerEndpoint.addTransceiver).toBeCalledWith('audio', { direction: 'recvonly' })
    expect(peerEndpoint.addTransceiver).toBeCalledWith('video', { direction: 'recvonly' })
    expect(peerEndpoint.addEventListener).toBeCalledTimes(2)
    const trackCb = peerEndpoint.addEventListener.mock.calls.find(x => x[0] === 'track')[1]

    trackCb({ track: tracks[0] })
    trackCb({ track: tracks[1] })

    expect(media.addTrack).toBeCalledTimes(2)
    expect(media.addTrack).toBeCalledWith(tracks[0])
    expect(media.addTrack).toBeCalledWith(tracks[1])

    const icecandidateCb = client.subscribe.mock.calls.find(x => x[0] === NotificationMethod.ICECandidate)[1]

    await icecandidateCb({
      result: {
        notification: NotificationMethod.ICECandidate,
        params: {
          peerID,
          candidate: 'candidate'
        }
      }
    })

    expect(peerEndpoint.addIceCandidate).toBeCalledTimes(1)
    expect(peerEndpoint.addIceCandidate).toBeCalledWith('candidate')

    const leftCb = client.subscribe.mock.calls.find(x => x[0] === NotificationMethod.PeerLeft)[1]
    await leftCb({
      result: {
        notification: NotificationMethod.PeerLeft,
        params: {
          peerID
        }
      }
    })

    expect(peerEndpoint.close).toBeCalledTimes(1)
    expect(media.getTracks).toBeCalledTimes(1)
    expect(media.removeTrack).toBeCalledTimes(2)
    tracks.forEach((track) => {
      expect(track.stop).toBeCalledTimes(1)
      expect(media.removeTrack).toBeCalledWith(track)
    })

    unsubPeers()
    unsubUser()
  })

  it('handles peer update', async () => {
    ;(global as any).RTCPeerConnection = jest.fn()
      .mockReturnValueOnce(mockWebRTCEndpoint('')) // init user endpoint
      .mockReturnValueOnce(mockWebRTCEndpoint('')) // init screen endpoint
      .mockReturnValueOnce(mockWebRTCEndpoint('')) // actual user endpoint
      .mockReturnValueOnce(mockWebRTCEndpoint('')) // peer endpoint

    const {media, tracks} = mockMedia()
    getDisplayMediaMock
      .mockResolvedValueOnce(mockMedia().media) // user media
    
    mediaStreamConstructor
      .mockReturnValueOnce(mockMedia().media) // user media
      .mockReturnValueOnce(mockMedia().media) // screen media
      .mockReturnValueOnce(media) // peer media

    const client = mockClient()

    const joinResp = {
      peers: [],
      screen: undefined,
      me: {
        internalID: 'test-user',
        muted: false,
        camEnabled: true
      }
    }

    const peerID = 'peer-id'

    const mgr = new RoomMgr(client as any)
    const unsubUser = checkStore(
      mgr.user,
      [
        {
          internalID: '',
          isMediaReady: false,
          muted: false,
          camEnabled: true 
        },
        {
          internalID: '',
          isMediaReady: true,
          muted: false,
          camEnabled: true 
        },
        {
          ...joinResp.me,
          isMediaReady: true
        }
      ],
      (a, b) => expect(a).toEqual(expect.objectContaining(b))
    )
    const unsubPeers = checkStore(
      mgr.peers,
      [
        new Map(),
        new Map(),
        new Map([
          [peerID, {
            internalID: peerID,
            isMediaReady: true,
            muted: false,
            camEnabled: false,
            media
          }]
        ]),
        new Map([
          [peerID, {
            internalID: peerID,
            isMediaReady: true,
            muted: true,
            camEnabled: true,
            media
          }]
        ]),
      ],
      (a, b) => {
        expect([...a.keys()]).toEqual(b && [...b.keys!()])
        ;([...a.keys()])
          .forEach(k => expect(a.get(k)).toEqual(expect.objectContaining(b.get!(k))))
      }
    )

    client.sendRequest.mockImplementation((request: any) => {
      if (request.method === ReqMethod.Join) {
        return joinResp
      }

      if (request.method === ReqMethod.Transmit) {
        return {
          sdp: ''
        }
      }
    })

    const peerJoinedNotif = {
      result: {
        notification: NotificationMethod.PeerJoined,
        params: {
          peer: {
            internalID: peerID,
            camEnabled: false,
            muted: false
          }
        }
      }
    }

    const peerJoinedSub = client.subscribe.mock.calls.find(x => x[0] === NotificationMethod.PeerJoined)[1]

    await mgr.join('test-room')

    await peerJoinedSub(peerJoinedNotif)

    const peerUpdatedCb = client.subscribe.mock.calls.find(x => x[0] === NotificationMethod.PeerUpdated)[1]
    await peerUpdatedCb({
      result: {
        notification: NotificationMethod.PeerUpdated,
        params: {
          peer: {
            internalID: 'UNKNOWN_PEER',
            camEnabled: false,
            muted: true
          }
        }
      }
    })

    await peerUpdatedCb({
      result: {
        notification: NotificationMethod.PeerUpdated,
        params: {
          peer: {
            internalID: peerID,
            camEnabled: true,
            muted: true
          }
        }
      }
    })

    unsubPeers()
    unsubUser()
  })

  // TODO:
  //   1. external screen sharing
  //   2. join room with screen and peers
  //   3. Deal with gain meter (think it is better to extract this logic, and make store that uses media stream directly)
})