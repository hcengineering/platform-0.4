<!--
// Copyright © 2020 Anticrm Platform Contributors.
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
-->

<script lang="ts">
  import type { Ref, Space } from '@anticrm/core'

  import Message from './Message.svelte'
  import ChannelSeparator from './ChannelSeparator.svelte'

  export let space: Ref<Space>
</script>

<div class="channel-container">
  <!-- {#if thread}
    <Message {thread} name="Rosamund Chen" time="3:20 PM" message="The Dark Lord has Nine. But we have One!"/>
    <ChannelSeparator title={'6 replies'} line={true}/>
  {/if} -->
  <Message reactions replies name="Rosamund Chen" time="3:20 PM" message="The Dark Lord has Nine. But we have One, mightier than they: the White Rider. Hero  has passed through the fire and the abyss, and they shall fear him. mightier than they: the White Rider. Hero  has passed through the fire and the abyss, and they shall fear him. I believe the QR “Typography and spacing” is showing the subtle differences in line height that need to be specified when the weight of fonts. Hero  has passed through the fire and the abyss, and they shall fear him. mightier than they. "/>
  <ChannelSeparator title={'MAR 25, 3:20 PM'}/>
  <Message name="Rosamund Chen" time="3:20 PM" message="The Dark Lord has Nine. But we have One, mightier than they: the White Rider. I believe the QR “Typography and spacing” is showing the subtle differences in line height that need to be specified when the weight of fonts."/>
  <Message reactions name="Rosamund Chen" time="3:20 PM" message="The Dark Lord has Nine. But we have One, mightier than they: the White Rider. Hero  has passed through the fire and the abyss, and they shall fear him. mightier than they: the White Rider. Hero  has passed through the fire and the abyss, and they shall fear him. I believe the QR “Typography and spacing” is showing the subtle differences in line height that need to be specified when the weight of fonts. Hero  has passed through the fire and the abyss, and they shall fear him. mightier than they. "/>
  <Message name="Rosamund Chen" time="3:20 PM" message="The Dark Lord has Nine. But we have One, mightier than they: the White Rider. I believe the QR “Typography and spacing” is showing the subtle differences in line height that need to be specified when the weight of fonts."/>
  <Message replies name="Rosamund Chen" time="3:20 PM" message="The Dark Lord has Nine. But we have One!"/>
</div>

<style lang="scss">
  .channel-container {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }
</style>
