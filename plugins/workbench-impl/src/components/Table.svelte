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
  import type { AnySvelteComponent } from '@anticrm/ui'
  import { Label, Progress } from '@anticrm/ui'
  import Reactions from './Reactions.svelte'
  import UserInfo from './UserInfo.svelte'
  import TaskStatus from './TaskStatus.svelte'
  import Chat from './icons/Chat.svelte'

  interface Cell {
    item: AnySvelteComponent
    props?: Object
    nopadding?: boolean
  }

  export let thread: boolean = false
  export let tableHead: string[] = ['Candidate', 'ID', 'Label', 'City']
  export let table: Cell[][] = [[{ item: Label, props: { label: 'Create UI for apps without the spaces and update the interface flow' } },
                                 { item: Reactions, props: { reactions: [{ icon: Chat, count: 3 }] } },
                                 { item: UserInfo, props: { user: 'tim' } },
                                 { item: TaskStatus, props: { title: 'ACTIVE', color: '#73A5C9' } }],

                                [{ item: Label, props: { label: 'Bitcoin price ‘relief’ move to $47K pushes BTC below stock-to-flow trajectory' } },
                                 { item: Reactions, props: { reactions: [{ icon: Chat, count: 10 }] } },
                                 { item: UserInfo, props: { user: 'chen' } },
                                 { item: TaskStatus, props: { title: 'CANCELLED', color: '#D0826E' } }],

                                [{ item: Label, props: { label: 'Bitcoin price ‘relief’ move to $47K pushes BTC below stock-to-flow trajectory' } },
                                 { item: Reactions, props: { reactions: [{ icon: Chat, count: 10 }] } },
                                 { item: UserInfo, props: { user: 'elon' } },
                                 { item: TaskStatus, props: { title: 'ARCHIVED', color: 'rgba(255,255,255,.1)' } }],

                                 [{ item: Label, props: { label: 'Bitcoin price ‘relief’ move to $47K pushes BTC below stock-to-flow trajectory' } },
                                 { item: Reactions, props: { reactions: [{ icon: Chat, count: 10 }] } },
                                 { item: UserInfo, props: { user: 'chen' } },
                                 { item: Progress, props: { value: 42 } }],

                                [{ item: Label, props: { label: 'Bitcoin price ‘relief’ move to $47K pushes BTC below stock-to-flow trajectory' } },
                                 { item: Reactions, props: { reactions: [{ icon: Chat, count: 10 }] } },
                                 { item: UserInfo, props: { user: 'elon' } },
                                 { item: TaskStatus, props: { title: 'IN REVIEW' } }],

                                [{ item: Label, props: { label: 'Bitcoin price ‘relief’ move to $47K pushes BTC below stock-to-flow trajectory' } },
                                 { item: Reactions, props: { reactions: [{ icon: Chat, count: 10 }] } },
                                 { item: UserInfo, props: { user: 'kathryn' } },
                                 { item: TaskStatus, props: { title: 'IN REVIEW' } }]]

</script>

<div class="table-container">
  <table class="table-body">
    <tr>
      {#each tableHead as cellHead}
        <th>{cellHead}</th>
      {/each}
    </tr>
    {#each table as row}
      <tr class="tr-body">
      {#each row as cell}
        <td><svelte:component this={cell.item} {...cell.props}/></td>
      {/each}
      </tr>
    {/each}
  </table>
</div>

<style lang="scss">
  .table-container {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;

    .table-body {
      display: table;
      border-collapse: collapse;
      z-index: 1;

      td {
        align-items: center;
        height: 64px;
        padding: 0 20px;
        color: var(--theme-content-accent-color);
      }
      th {
        align-items: center;
        height: 50px;
        padding: 0 20px;
        font-weight: 500;
        text-align: left;
        border-bottom: 1px solid var(--theme-bg-focused-color);
        color: var(--theme-content-trans-color);
      }
      .tr-body {
        position: relative;
        border-top: 1px solid var(--theme-bg-accent-hover);
      }
      .tr-body:hover {
        border-color: transparent;

        & + .tr-body {
          border-color: transparent;
        }
        &::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: var(--theme-button-bg-enabled);
          border: 1px solid var(--theme-bg-accent-color);
          border-radius: 12px;
          z-index: -1;
        }
      }
    }
  }
</style>
