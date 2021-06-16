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

import { NotificationMethod } from '@anticrm/webrtc'
import { Session } from '../session'

const mockPipeline = (): {create: jest.Mock} => ({
  create: jest.fn()
})

const mockEndpoint = (): {
  on: jest.Mock
  processOffer: jest.Mock
  gatherCandidates: jest.Mock
  addIceCandidate: jest.Mock
  setMaxVideoRecvBandwidth: jest.Mock
  setMaxVideoSendBandwidth: jest.Mock
  release: jest.Mock
  connect: jest.Mock
} => ({
  on: jest.fn(),
  processOffer: jest.fn().mockImplementation(sdpResp),
  gatherCandidates: jest.fn().mockResolvedValue(undefined),
  addIceCandidate: jest.fn().mockResolvedValue(undefined),
  setMaxVideoRecvBandwidth: jest.fn().mockResolvedValue(undefined),
  setMaxVideoSendBandwidth: jest.fn().mockResolvedValue(undefined),
  release: jest.fn().mockResolvedValue(undefined),
  connect: jest.fn().mockResolvedValue(undefined)
})

const mockSend = (): jest.Mock => jest.fn()

const sdpReq = (name: string): string => `SDP request from ${name}`
const sdpResp = (req: string): string => `SDP response for '${req}'`

const createSession = (name: string): {
  pipeline: ReturnType<typeof mockPipeline>
  outgoingEndpoint: ReturnType<typeof mockEndpoint>
  send: ReturnType<typeof mockSend>
  session: Session
} => {
  const pipeline = mockPipeline()
  const outgoingEndpoint = mockEndpoint()
  const send = mockSend()

  pipeline.create.mockResolvedValueOnce(outgoingEndpoint)

  const session = new Session(
    name,
    pipeline as any,
    send
  )

  return {
    pipeline,
    outgoingEndpoint,
    send,
    session
  }
}

describe('session', () => {
  it('creates and initializes session', async () => {
    const {
      session,
      pipeline,
      outgoingEndpoint,
      send
    } = createSession('test_session')

    const sdpOffer = sdpReq(session.name)
    const sdpAnswer = await session.initVideoTransmission(session, sdpOffer)

    expect(sdpAnswer).toBe(sdpResp(sdpOffer))

    await session.addICECandidate('candidate:0' as any, session.name)
    await session.addICECandidate('candidate:1' as any, session.name)
    await session.addICECandidate('candidate:2' as any, 'UNKNOWN_SESSION')

    await session.close()

    expect(pipeline.create).toBeCalledTimes(1)
    expect(pipeline.create).toBeCalledWith('WebRtcEndpoint')

    expect(outgoingEndpoint.setMaxVideoRecvBandwidth).toBeCalledTimes(1)
    expect(outgoingEndpoint.setMaxVideoSendBandwidth).toBeCalledTimes(1)
    expect(outgoingEndpoint.setMaxVideoRecvBandwidth).toBeCalledWith(5000)
    expect(outgoingEndpoint.setMaxVideoSendBandwidth).toBeCalledWith(5000)

    expect(outgoingEndpoint.on).toBeCalledTimes(1)

    const args = outgoingEndpoint.on.mock.calls[0]
    expect(args[0]).toBe('IceCandidateFound')

    const candidate = 'test_candidate'
    args[1]({ candidate })

    expect(outgoingEndpoint.processOffer).toBeCalledTimes(1)
    expect(outgoingEndpoint.processOffer).toBeCalledWith(sdpOffer)

    expect(send).toBeCalledTimes(1)
    expect(send).toBeCalledWith({
      result: {
        notification: NotificationMethod.ICECandidate,
        params: {
          peerID: session.name,
          candidate
        }
      }
    })

    expect(outgoingEndpoint.addIceCandidate).toBeCalledTimes(2)
    expect(outgoingEndpoint.addIceCandidate.mock.calls[0]).toEqual(['candidate:0'])
    expect(outgoingEndpoint.addIceCandidate.mock.calls[1]).toEqual(['candidate:1'])

    expect(outgoingEndpoint.release).toBeCalledTimes(1)
  })

  it('manages transmission properly', async () => {
    const sessions = [0, 1, 2]
      .map(x => createSession(`test_session_${x}`))

    const endpoints = Array(2).fill(undefined).map(mockEndpoint)
    sessions[0].pipeline.create.mockImplementation(
      ((idx: number) => async () => {
        return await Promise.resolve(endpoints[idx++])
      })(0))

    const session1SDPOffer = sdpReq(sessions[1].session.name)
    const session1SDPAnswer = await sessions[0].session.initVideoTransmission(sessions[1].session, session1SDPOffer)
    expect(session1SDPAnswer).toBe(sdpResp(session1SDPOffer))

    expect(sessions[1].outgoingEndpoint.connect).toBeCalledTimes(1)
    expect(sessions[1].outgoingEndpoint.connect).toBeCalledWith(endpoints[0])

    expect(endpoints[0].processOffer).toBeCalledTimes(1)
    expect(endpoints[0].processOffer).toBeCalledWith(session1SDPOffer)
    expect(endpoints[0].gatherCandidates).toBeCalledTimes(1)

    const session2SDPOffer = sdpReq(sessions[2].session.name)
    const session2SDPAnswer = await sessions[0].session.initVideoTransmission(sessions[2].session, session2SDPOffer)
    expect(session2SDPAnswer).toBe(sdpResp(session2SDPOffer))

    expect(sessions[2].outgoingEndpoint.connect).toBeCalledTimes(1)
    expect(sessions[2].outgoingEndpoint.connect).toBeCalledWith(endpoints[1])

    expect(endpoints[1].processOffer).toBeCalledTimes(1)
    expect(endpoints[1].processOffer).toBeCalledWith(session2SDPOffer)
    expect(endpoints[1].gatherCandidates).toBeCalledTimes(1)

    expect(sessions[0].pipeline.create.mock.calls).toEqual([
      ['WebRtcEndpoint'],
      ['WebRtcEndpoint'],
      ['WebRtcEndpoint']
    ])

    await sessions[0].session.addICECandidate('candidate' as any, sessions[1].session.name)

    expect(endpoints[0].addIceCandidate).toBeCalledTimes(1)
    expect(endpoints[0].addIceCandidate).toBeCalledWith('candidate')

    await sessions[0].session.cancelVideoTransmission(sessions[1].session.name)
    expect(endpoints[0].release).toBeCalledTimes(1)

    await sessions[0].session.cancelVideoTransmission('UNKNOWN_SESSION')

    await sessions[0].session.close()

    expect(endpoints[1].release).toBeCalledTimes(1)
  })
})
