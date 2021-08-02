/* eslint-disable @typescript-eslint/explicit-function-return-type */
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

export class GainMeter {
  private readonly ctx = new AudioContext()
  private readonly FFT_SIZE = 2048
  private readonly analyzer = new AnalyserNode(this.ctx, {
    fftSize: this.FFT_SIZE,
    smoothingTimeConstant: 0.01
  })

  private readonly src: MediaStreamAudioSourceNode

  constructor (track: MediaStreamTrack) {
    const stream = new MediaStream([track])
    this.src = this.ctx.createMediaStreamSource(stream)

    this.src.connect(this.analyzer)
  }

  close () {
    this.analyzer.disconnect()
    this.src.disconnect()
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.ctx.close()
  }

  getValue () {
    const buffer = new Float32Array(this.FFT_SIZE)
    this.analyzer.getFloatTimeDomainData(buffer)

    const rms = Math.sqrt(buffer.reduce((r, x) => r + x ** 2, 0) / buffer.length)

    return rms
  }
}
