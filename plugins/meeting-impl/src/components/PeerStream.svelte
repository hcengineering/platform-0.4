<!--
Copyright © 2021 Anticrm Platform Contributors.

Licensed under the Eclipse Public License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may
obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.

See the License for the specific language governing permissions and
limitations under the License.
-->
<script type="ts">
  export let media: MediaStream
  export let isLocal = false
  export let level = 0
  export let full = false

  let videoContainer: HTMLVideoElement

  $: if (videoContainer) {
    videoContainer.srcObject = media
  }
</script>

<video
  class="video"
  class:mVideoSpeaking={level > 0}
  class:mVideoFull={full}
  autoplay
  muted={isLocal}
  controls={false}
  bind:this={videoContainer}
/>

<style lang="scss">
  .video {
    border-radius: 20px;
    border: 1px solid var(--theme-bg-accent-color);
    width: 100%;
    height: 100%;
    object-fit: cover;
    padding: 1px;

    &.mVideoSpeaking {
      border: 2px solid greenyellow;
      padding: 0;
    }

    &.mVideoFull {
      object-fit: contain;
      border-radius: unset;
      border: unset;
      padding: 0;
    }
  }
</style>
