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
  import { onDestroy } from 'svelte'
  import type { Channel } from '@anticrm/chunter'
  import { getClient } from '@anticrm/workbench'
  import { ListItem, TreeNode, TreeItem, TreeSeparator } from '@anticrm/ui'

  import chunter from '../plugin'

  let channels: Channel[] = []
  onDestroy(getClient().query(chunter.class.Channel, {}, result => { channels = result }))

</script>

<div>
  <ListItem title="Hashtag" icon={chunter.icon.Hashtag}/>
  <ListItem title="Lock" icon={chunter.icon.Lock}/>
  <TreeSeparator/>
  <TreeNode title="Channels" collapsed>
    {#each channels as channel}
      <TreeItem title={channel.name} icon={chunter.icon.Hashtag}/>
    {/each}
  </TreeNode>
  <TreeNode title="Test" notifications={10}>
    <TreeItem title="Hashtag" icon={chunter.icon.Hashtag} notifications={2}/>
    <TreeItem title="Lock" icon={chunter.icon.Lock} notifications={3}/>
    <TreeItem title="Title" icon={chunter.icon.Hashtag} notifications={5}/>
  </TreeNode>
</div>
