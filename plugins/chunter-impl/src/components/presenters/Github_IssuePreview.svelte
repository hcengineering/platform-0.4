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
  import { ActionIcon, IconMoreV, UserInfo, MarkdownViewer } from '@anticrm/ui'
  import Github from '../../../img/github.png'

  export let organization: string
  export let project: string
  export let issueNumber: string
  export let href: string

  let task: any

  function getInfo (organization: string, project: string, issueNumber: string): void {
    const xmlHttp = new XMLHttpRequest()
    xmlHttp.onreadystatechange = function () {
      if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
        task = JSON.parse(xmlHttp.responseText)
      }
    }
    const infoUri = `https://api.github.com/repos/${organization}/${project}/issues/${issueNumber}`
    xmlHttp.open('GET', infoUri, true) // true for asynchronous
    xmlHttp.send(null)
  }

  $: getInfo(organization, project, issueNumber)
</script>

{#if task}
  <div class="header">
    <div class="taskWithId">
      <span>
        <a {href}> #{issueNumber} {task.title}</a>
      </span>
    </div>
    <ActionIcon size={24} icon={IconMoreV} direction={'left'} />
  </div>
  <div class="issue-body">
    <MarkdownViewer message={task.body} />
  </div>
  <div class="footer">
    {#if task.assignee}
      <UserInfo user={{ avatar: task.assignee.avatar_url, name: task.assignee.login, email: task.assignee.html_url }} />
    {/if}
    <div class="actions">
      <span>
        <a class="flex" {href}>
          <img src={Github} width="16" height="16" alt={href} />
          <div style="margin-left:5px">{project}</div>
        </a>
      </span>
    </div>
  </div>
{:else}
  <a {href}>{href}</a>
{/if}

<style lang="scss">
  .header {
    flex-shrink: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .footer {
    flex-shrink: 0;
    display: flex;
    justify-content: space-between;
    align-items: left;
  }
  .issue-body {
    overflow: auto;
    max-width: 420px;
  }
  .header {
    padding: 0 16px 0 24px;
    height: 84px;
    span {
      margin-right: 16px;
      font-weight: 500;
      color: var(--theme-content-accent-color);
    }
    .taskWithId {
      display: flex;
      flex-direction: column;
    }
  }
  .footer {
    padding: 0 24px;
    height: 74px;
    border-top: 1px solid var(--theme-bg-accent-color);

    .actions {
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
      align-items: center;
    }
  }
</style>
