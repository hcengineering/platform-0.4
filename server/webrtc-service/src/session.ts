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

import { NotificationMethod, Outgoing } from '@anticrm/webrtc'
import { IceCandidate, MediaPipeline, WebRtcEndpoint } from 'kurento-client'

export class Session {
  private readonly pipeline: MediaPipeline
  private readonly outgoingMedia: Promise<WebRtcEndpoint>
  private readonly incomingMedia = new Map<string, Promise<WebRtcEndpoint>>()
  public readonly send: (msg: Outgoing) => void
  public readonly name: string

  constructor (
    name: string,
    pipeline: MediaPipeline,
    send: (msg: Outgoing) => void
  ) {
    this.pipeline = pipeline
    this.send = send
    this.name = name

    this.outgoingMedia = this.createEndpoint(name)
  }

  async addICECandidate (candidate: IceCandidate, from: string): Promise<void> {
    const endpointP = this.name === from
      ? this.outgoingMedia
      : this.incomingMedia.get(from)

    if (endpointP === undefined) {
      return
    }

    const endpoint = await endpointP

    await endpoint.addIceCandidate(candidate as never as RTCIceCandidate)
  }

  async initVideoTransmission (session: Session, sdpOffer: string): Promise<string> {
    const endpoint = await this.getEndpointForSession(session)
    const sdp = await endpoint.processOffer(sdpOffer)

    await endpoint.gatherCandidates((err) => console.error(err))

    return sdp
  }

  async cancelVideoTransmission (from: string): Promise<void> {
    const endpoint = await this.incomingMedia.get(from)

    if (endpoint === undefined) {
      return
    }

    await endpoint.release()
    this.incomingMedia.delete(from)
  }

  async close (): Promise<void> {
    await Promise.all(
      [...this.incomingMedia.values()]
        .map(async endpoint => await endpoint.then(async x => await x.release()))
    )

    this.incomingMedia.clear()

    await (await this.outgoingMedia).release()
  }

  private async getEndpointForSession (session: Session): Promise<WebRtcEndpoint> {
    if (session.name === this.name) {
      return await this.outgoingMedia
    }

    const existingEndpoint = this.incomingMedia.get(session.name)

    if (existingEndpoint !== undefined) {
      return await existingEndpoint
    }

    const endpoint = this.createEndpoint(session.name)

    this.incomingMedia.set(session.name, endpoint)

    const remotePeer = await session.outgoingMedia
    await remotePeer.connect(await endpoint)

    return await endpoint
  }

  private async createEndpoint (sender: string): Promise<WebRtcEndpoint> {
    const endpoint = await this.pipeline.create('WebRtcEndpoint')
    await endpoint.setMaxVideoRecvBandwidth(5000)
    await endpoint.setMaxVideoSendBandwidth(5000)
    endpoint.on('IceCandidateFound', ({ candidate }) => {
      this.send({
        result: {
          notification: NotificationMethod.ICECandidate,
          params: {
            peerID: sender,
            candidate: candidate
          }
        }
      })
    })

    return endpoint
  }
}
