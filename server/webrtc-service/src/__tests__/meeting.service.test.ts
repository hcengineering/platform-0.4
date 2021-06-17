/* eslint-disable import/first */
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
const kurentoMock = {
  create: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined)
}

const makeKurentoMock = jest.fn().mockResolvedValue(kurentoMock)

jest.mock('../kurento.client', () => ({
  makeKurento: makeKurentoMock
}))

jest.mock('../session')

import { makeScreenID, NotificationMethod, ReqMethod } from '@anticrm/webrtc'
import MeetingService from '../meeting.service'
import { Session } from '../session'

describe('meeting service', () => {
  const MockedSession = Session as any

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates and closes properly', async () => {
    const service = new MeetingService()

    expect(makeKurentoMock).toBeCalledTimes(1)

    const pipeline = {
      release: jest.fn()
    }

    kurentoMock.create.mockResolvedValueOnce(pipeline)

    const handler0 = service.onNewClient(jest.fn())

    const roomName = 'test_room'
    await handler0.onWSMsg({
      method: ReqMethod.Join,
      params: [{
        room: roomName,
        peer: {
          camEnabled: true,
          muted: false
        }
      }]
    })

    expect(kurentoMock.create).toBeCalledTimes(1)
    expect(kurentoMock.create).toBeCalledWith('MediaPipeline')

    await service.close()

    expect(pipeline.release).toBeCalledTimes(1)
    expect(kurentoMock.close).toBeCalledTimes(1)

    await expect(handler0.onWSMsg({
      method: ReqMethod.Join,
      params: [{
        room: roomName,
        peer: {
          camEnabled: true,
          muted: false
        }
      }]
    })).rejects.toThrowError()
  })

  it('rejects unknown rpc methods', async () => {
    const service = new MeetingService()
    const handler = service.onNewClient(jest.fn())

    const roomName = 'test_room'
    await handler.onWSMsg({
      method: ReqMethod.Join,
      params: [{
        room: roomName,
        peer: {
          camEnabled: true,
          muted: false
        }
      }]
    })

    await expect(handler.onWSMsg({
      method: 'UNKNOWN_METHOD',
      params: []
    } as any)).rejects.toThrowError()
  })

  it('rejects non-joined peer requests', async () => {
    const service = new MeetingService()
    const handler = service.onNewClient(jest.fn())

    await expect(handler.onWSMsg({
      method: NotificationMethod.ICECandidate,
      params: [{
        peerID: '0',
        candidate: 'super candidate' as any
      }]
    })).rejects.toThrowError()
  })

  it('manages join/leave request', async () => {
    const service = new MeetingService()

    const handler0 = service.onNewClient(jest.fn())

    const roomName = 'test_room'
    const join0Resp = await handler0.onWSMsg({
      method: ReqMethod.Join,
      params: [{
        room: roomName,
        peer: {
          camEnabled: true,
          muted: false
        }
      }]
    })

    expect(join0Resp).toEqual({
      peers: [],
      me: {
        internalID: '0',
        camEnabled: true,
        muted: false
      },
      screen: undefined
    })

    MockedSession.mock.instances[0].send = jest.fn()

    const handler1 = service.onNewClient(jest.fn())
    const handler2 = service.onNewClient(jest.fn())

    const join2Resp = await handler2.onWSMsg({
      method: ReqMethod.Join,
      params: [{
        room: 'unrelated_room',
        peer: {
          camEnabled: true,
          muted: false
        }
      }]
    })

    expect(join2Resp).toEqual({
      peers: [],
      me: {
        internalID: '2',
        camEnabled: true,
        muted: false
      },
      screen: undefined
    })

    MockedSession.mock.instances[1].send = jest.fn()

    const join1Resp = await handler1.onWSMsg({
      method: ReqMethod.Join,
      params: [{
        room: roomName,
        peer: {
          camEnabled: true,
          muted: false
        }
      }]
    })

    expect(join1Resp).toEqual({
      peers: [{
        internalID: '0',
        camEnabled: true,
        muted: false
      }],
      me: {
        internalID: '1',
        camEnabled: true,
        muted: false
      },
      screen: undefined
    })

    expect(MockedSession.mock.instances[0].send).toBeCalledTimes(1)
    expect(MockedSession.mock.instances[0].send).toBeCalledWith({
      result: {
        notification: NotificationMethod.PeerJoined,
        params: {
          peer: {
            internalID: '1',
            camEnabled: true,
            muted: false
          }
        }
      }
    })

    await expect(handler0.onWSMsg({
      method: ReqMethod.Join,
      params: [{
        room: 'another_room',
        peer: {
          camEnabled: true,
          muted: false
        }
      }]
    })).rejects.toThrowError()

    MockedSession.mock.instances[2].send = jest.fn()

    const leaveResp = await handler0.onWSMsg({
      method: ReqMethod.Leave,
      params: []
    })

    expect(leaveResp).toEqual(true)

    expect(MockedSession.mock.instances[2].send).toBeCalledTimes(1)
    expect(MockedSession.mock.instances[2].send).toBeCalledWith({
      result: {
        notification: NotificationMethod.PeerLeft,
        params: {
          peerID: '0'
        }
      }
    })

    expect(MockedSession.mock.instances[1].send).not.toBeCalled()
  })

  it('handles peer disconnect', async () => {
    const service = new MeetingService()

    const handler0 = service.onNewClient(jest.fn())

    const roomName = 'test_room'
    await handler0.onWSMsg({
      method: ReqMethod.Join,
      params: [{
        room: roomName,
        peer: {
          camEnabled: true,
          muted: false
        }
      }]
    })

    MockedSession.mock.instances[0].send = jest.fn()

    const handler1 = service.onNewClient(jest.fn())

    await handler1.onWSMsg({
      method: ReqMethod.Join,
      params: [{
        room: roomName,
        peer: {
          camEnabled: true,
          muted: false
        }
      }]
    })

    MockedSession.mock.instances[1].send = jest.fn()

    await handler0.onClose()

    expect(MockedSession.mock.instances[1].send).toBeCalledTimes(1)
    expect(MockedSession.mock.instances[1].send).toBeCalledWith({
      result: {
        notification: NotificationMethod.PeerLeft,
        params: {
          peerID: '0'
        }
      }
    })
  })

  it('handles self webrtc negotiation', async () => {
    const service = new MeetingService()

    const handler = service.onNewClient(jest.fn())

    const roomName = 'test_room'
    await handler.onWSMsg({
      method: ReqMethod.Join,
      params: [{
        room: roomName,
        peer: {
          camEnabled: true,
          muted: false
        }
      }]
    })

    const sdpOffer = 'SDP offer'
    const sdpAnswer = 'SDP answer'
    MockedSession.mock.instances[0].send = jest.fn()
    MockedSession.mock.instances[0].initVideoTransmission.mockResolvedValueOnce(sdpAnswer)
    MockedSession.mock.instances[0].addICECandidate.mockResolvedValueOnce(undefined)

    const transmitResp = await handler.onWSMsg({
      method: ReqMethod.Transmit,
      params: [{
        peerID: '0',
        sdp: sdpOffer
      }]
    })

    expect(transmitResp).toEqual({
      sdp: sdpAnswer
    })

    const iceCandidateResp = await handler.onWSMsg({
      method: NotificationMethod.ICECandidate,
      params: [{
        peerID: '0',
        candidate: 'super candidate' as any
      }]
    })

    expect(iceCandidateResp).toBeUndefined()
    expect(MockedSession.mock.instances[0].addICECandidate).toBeCalledTimes(1)
    expect(MockedSession.mock.instances[0].addICECandidate).toBeCalledWith('super candidate', '0')
  })

  it('handles foreign webrtc negotiation', async () => {
    const service = new MeetingService()

    const handler0 = service.onNewClient(jest.fn())

    const roomName = 'test_room'
    await handler0.onWSMsg({
      method: ReqMethod.Join,
      params: [{
        room: roomName,
        peer: {
          camEnabled: true,
          muted: false
        }
      }]
    })

    MockedSession.mock.instances[0].send = jest.fn()

    const handler1 = service.onNewClient(jest.fn())

    await handler1.onWSMsg({
      method: ReqMethod.Join,
      params: [{
        room: roomName,
        peer: {
          camEnabled: true,
          muted: false
        }
      }]
    })

    MockedSession.mock.instances[1].send = jest.fn()

    const sdpOffer = 'SDP offer'
    const sdpAnswer = 'SDP answer'
    MockedSession.mock.instances[0].initVideoTransmission.mockResolvedValueOnce(sdpAnswer)
    MockedSession.mock.instances[0].addICECandidate.mockResolvedValueOnce(undefined)

    const transmitResp = await handler0.onWSMsg({
      method: ReqMethod.Transmit,
      params: [{
        peerID: '1',
        sdp: sdpOffer
      }]
    })

    expect(transmitResp).toEqual({
      sdp: sdpAnswer
    })

    const iceCandidateResp = await handler0.onWSMsg({
      method: NotificationMethod.ICECandidate,
      params: [{
        peerID: '1',
        candidate: 'super candidate' as any
      }]
    })

    expect(iceCandidateResp).toBeUndefined()
    expect(MockedSession.mock.instances[0].addICECandidate).toBeCalledTimes(1)
    expect(MockedSession.mock.instances[0].addICECandidate).toBeCalledWith('super candidate', '1')
  })

  it('handles invalid negotiation cases', async () => {
    const service = new MeetingService()

    const handler = service.onNewClient(jest.fn())

    const roomName = 'test_room'
    await handler.onWSMsg({
      method: ReqMethod.Join,
      params: [{
        room: roomName,
        peer: {
          camEnabled: true,
          muted: false
        }
      }]
    })

    await expect(handler.onWSMsg({
      method: ReqMethod.Transmit,
      params: [{
        peerID: 'UNKNOWN_PEER',
        sdp: 'offer'
      }]
    })).rejects.toThrowError()

    await expect(handler.onWSMsg({
      method: ReqMethod.Transmit,
      params: [{
        peerID: makeScreenID('0'),
        sdp: 'offer'
      }]
    })).rejects.toThrowError()

    await expect(handler.onWSMsg({
      method: NotificationMethod.ICECandidate,
      params: [{
        candidate: 'candidate' as any,
        peerID: makeScreenID('0')
      }]
    })).rejects.toThrowError()
  })

  it('handles screen sharing flow', async () => {
    const service = new MeetingService()

    const handler0 = service.onNewClient(jest.fn())

    const roomName = 'test_room'
    await handler0.onWSMsg({
      method: ReqMethod.Join,
      params: [{
        room: roomName,
        peer: {
          camEnabled: true,
          muted: false
        }
      }]
    })

    MockedSession.mock.instances[0].send = jest.fn()

    const handler1 = service.onNewClient(jest.fn())

    await handler1.onWSMsg({
      method: ReqMethod.Join,
      params: [{
        room: roomName,
        peer: {
          camEnabled: true,
          muted: false
        }
      }]
    })

    MockedSession.mock.instances[1].send = jest.fn()

    const screenSharingResp0 = await handler0.onWSMsg({
      method: ReqMethod.InitScreenSharing,
      params: []
    })

    expect(screenSharingResp0).toEqual(true)

    MockedSession.mock.instances[2].name = makeScreenID('0')

    const sdpOffer = 'SDP offer'
    const sdpAnswer = 'SDP answer'
    MockedSession.mock.instances[2].initVideoTransmission.mockResolvedValueOnce(sdpAnswer)
    MockedSession.mock.instances[2].addICECandidate.mockResolvedValueOnce(undefined)

    const transmitResp = await handler0.onWSMsg({
      method: ReqMethod.Transmit,
      params: [{
        peerID: makeScreenID('0'),
        sdp: sdpOffer
      }]
    })

    expect(transmitResp).toEqual({
      sdp: sdpAnswer
    })

    await handler0.onWSMsg({
      method: NotificationMethod.ICECandidate,
      params: [{
        candidate: 'candidate' as any,
        peerID: makeScreenID('0')
      }]
    })

    expect(MockedSession.mock.instances[1].send).toBeCalledTimes(1)
    expect(MockedSession.mock.instances[1].send).toBeCalledWith({
      result: {
        notification: NotificationMethod.ScreenSharingStarted,
        params: {
          owner: '0'
        }
      }
    })

    const handler2 = service.onNewClient(jest.fn())

    const joinResp = await handler2.onWSMsg({
      method: ReqMethod.Join,
      params: [{
        room: roomName,
        peer: {
          camEnabled: true,
          muted: false
        }
      }]
    })

    expect(joinResp).toEqual({
      peers: [
        {
          internalID: '0',
          camEnabled: true,
          muted: false
        },
        {
          internalID: '1',
          camEnabled: true,
          muted: false
        }
      ],
      me: {
        internalID: '2',
        camEnabled: true,
        muted: false
      },
      screen: {
        internalID: makeScreenID('0'),
        camEnabled: true,
        muted: true
      }
    })

    MockedSession.mock.instances[3].send = jest.fn()

    const handler3 = service.onNewClient(jest.fn())

    const joinResp3 = await handler3.onWSMsg({
      method: ReqMethod.Join,
      params: [{
        room: 'unrelated_room',
        peer: {
          camEnabled: true,
          muted: false
        }
      }]
    })

    expect(joinResp3).toEqual({
      peers: [],
      me: {
        internalID: '3',
        camEnabled: true,
        muted: false
      },
      screen: undefined
    })

    MockedSession.mock.instances[4].send = jest.fn()
    MockedSession.mock.instances[1].send.mockClear()

    const stopSharingResp0 = await handler0.onWSMsg({
      method: ReqMethod.StopScreenSharing,
      params: []
    })

    expect(stopSharingResp0).toEqual(true)

    expect(MockedSession.mock.instances[1].send).toBeCalledTimes(1)
    expect(MockedSession.mock.instances[1].send).toBeCalledWith({
      result: {
        notification: NotificationMethod.ScreenSharingFinished
      }
    })
    expect(MockedSession.mock.instances[3].send).toBeCalledTimes(1)
    expect(MockedSession.mock.instances[3].send).toBeCalledWith({
      result: {
        notification: NotificationMethod.ScreenSharingFinished
      }
    })

    expect(MockedSession.mock.instances[4].send).not.toBeCalled()
  })

  it('handles screen owner leaving', async () => {
    const service = new MeetingService()

    const handler0 = service.onNewClient(jest.fn())

    const roomName = 'test_room'
    await handler0.onWSMsg({
      method: ReqMethod.Join,
      params: [{
        room: roomName,
        peer: {
          camEnabled: true,
          muted: false
        }
      }]
    })

    MockedSession.mock.instances[0].send = jest.fn()

    const handler1 = service.onNewClient(jest.fn())

    await handler1.onWSMsg({
      method: ReqMethod.Join,
      params: [{
        room: roomName,
        peer: {
          camEnabled: true,
          muted: false
        }
      }]
    })

    MockedSession.mock.instances[1].send = jest.fn()

    const screenSharingResp0 = await handler0.onWSMsg({
      method: ReqMethod.InitScreenSharing,
      params: []
    })

    expect(screenSharingResp0).toEqual(true)

    expect(MockedSession.mock.instances[1].send).toBeCalledTimes(1)
    expect(MockedSession.mock.instances[1].send).toBeCalledWith({
      result: {
        notification: NotificationMethod.ScreenSharingStarted,
        params: {
          owner: '0'
        }
      }
    })
    MockedSession.mock.instances[2].name = makeScreenID('0')
    MockedSession.mock.instances[1].send.mockClear()

    await handler0.onClose()

    expect(MockedSession.mock.instances[1].send).toBeCalledTimes(2)
    expect(MockedSession.mock.instances[1].send).toBeCalledWith({
      result: {
        notification: NotificationMethod.ScreenSharingFinished
      }
    })
    expect(MockedSession.mock.instances[1].send).toBeCalledWith({
      result: {
        notification: NotificationMethod.PeerLeft,
        params: {
          peerID: '0'
        }
      }
    })
  })

  it('prevents stopping foreign screen sharing session', async () => {
    const service = new MeetingService()

    const handler0 = service.onNewClient(jest.fn())

    const roomName = 'test_room'
    await handler0.onWSMsg({
      method: ReqMethod.Join,
      params: [{
        room: roomName,
        peer: {
          camEnabled: true,
          muted: false
        }
      }]
    })

    MockedSession.mock.instances[0].send = jest.fn()

    const handler1 = service.onNewClient(jest.fn())

    await handler1.onWSMsg({
      method: ReqMethod.Join,
      params: [{
        room: roomName,
        peer: {
          camEnabled: true,
          muted: false
        }
      }]
    })

    MockedSession.mock.instances[1].send = jest.fn()

    const screenSharingResp0 = await handler0.onWSMsg({
      method: ReqMethod.InitScreenSharing,
      params: []
    })

    expect(screenSharingResp0).toEqual(true)

    expect(MockedSession.mock.instances[1].send).toBeCalledTimes(1)
    expect(MockedSession.mock.instances[1].send).toBeCalledWith({
      result: {
        notification: NotificationMethod.ScreenSharingStarted,
        params: {
          owner: '0'
        }
      }
    })
    MockedSession.mock.instances[2].name = makeScreenID('0')
    MockedSession.mock.instances[1].send.mockClear()

    await expect(handler1.onWSMsg({
      method: ReqMethod.StopScreenSharing,
      params: []
    })).rejects.toThrowError()
  })
})
