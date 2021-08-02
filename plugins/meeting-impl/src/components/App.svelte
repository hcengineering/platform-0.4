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
  import { onDestroy } from 'svelte'

  import { Button } from '@anticrm/ui'

  import PeerStream from './PeerStream.svelte'
  import { initGridStore, makeGridSizeStore } from './grid.layout'

  import { getScreenOwner } from '@anticrm/webrtc'

  import { roomMgr } from '..'
  import type { Peer } from '..'

  const { user, screen, peers, status, gains } = roomMgr
  let container: Element

  let { amount, size, containerSize: cSize } = initGridStore()
  $: if (container && peers) {
    const s = makeGridSizeStore(container, $peers.size + 1)
    amount = s.amount
    size = s.size
    cSize = s.containerSize
  }

  $: if ($peers) {
    amount.set($peers.size + 1 + ($screen.isMediaReady ? 1 : 0))
  }

  let isScreenShared = false
  $: if ($screen) {
    isScreenShared = $screen.isMediaReady
  }

  let peersArray: Peer[] = []
  $: peersArray = [...$peers.values()]

  async function join () {
    roomMgr.join('common')
  }

  function leave () {
    roomMgr.leave()
  }

  function shareScreen () {
    roomMgr.shareScreen()
  }

  function stopSharing () {
    roomMgr.stopSharingScreen()
  }

  onDestroy(() => roomMgr.leave())

  async function toggleMute () {
    await roomMgr.toggleMute()
  }

  async function toggleCam () {
    await roomMgr.toggleCam()
  }

  function requestFullscreen () {
    container?.requestFullscreen()
  }

  let videoStyle = ''
  $: videoStyle = isScreenShared ? '' : `width: ${$size.width}px; height: ${$size.height}px`

  let videosStyle = ''
  $: videosStyle = isScreenShared ? '' : `width: ${$cSize.width}px`
</script>

<div class="root" bind:this={container}>
  {#if isScreenShared}
    <div class="video" class:mVideoFull={isScreenShared}>
      <PeerStream media={$screen.media} full={true} />
    </div>
  {/if}
  <div class="videos" class:mVideosCompact={isScreenShared} style={videosStyle}>
    <div class="video" class:mVideoCompact={isScreenShared} style={videoStyle}>
      <PeerStream media={$user.media} level={$gains.get('user')} isLocal={true} />
    </div>
    {#each peersArray as peer (peer.internalID)}
      <div class="video" class:mVideoCompact={isScreenShared} style={videoStyle}>
        <PeerStream media={peer.media} level={$gains.get(peer.internalID)} />
      </div>
    {/each}
  </div>
  <div class="controls">
    {#if $status === 'left'}
      {#if $user.isMediaReady}
        <Button on:click={join} label="Join" />
      {/if}
    {:else}
      <Button on:click={leave} label="Leave" />
      {#if !isScreenShared}
        <Button on:click={shareScreen} label="Share screen" />
      {:else if getScreenOwner($screen.internalID) === $user.internalID}
        <Button on:click={stopSharing} label="Stop sharing" />
      {/if}
    {/if}
    <Button on:click={toggleMute} label={$user.muted ? 'Unmute' : 'Mute'} />
    <Button on:click={toggleCam} label={$user.camEnabled ? 'Disable cam' : 'Enable cam'} />
    <Button on:click={requestFullscreen} label="Fullscreen" />
  </div>
</div>

<style lang="scss">
  .root {
    height: 100%;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    overflow: auto;
    padding: 20px;

    &:fullscreen {
      padding: 0;
    }
  }

  .controls {
    position: absolute;
    bottom: 25px;
    left: 0;
    width: 100%;

    display: flex;
    justify-content: center;
    align-items: center;

    gap: 10px;
  }

  .videos {
    position: absolute;
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;

    &.mVideosCompact {
      width: 100px;
      right: 0;
      top: 0;
      margin: 20px 20px;
      padding: 5px;
      border: 1px solid var(--theme-bg-accent-color);
      border-radius: 20px;
    }
  }

  .video {
    flex: none;

    &.mVideoFull {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    &.mVideoCompact {
      width: 100%;
    }
  }
</style>
