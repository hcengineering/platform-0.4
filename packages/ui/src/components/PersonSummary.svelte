<!--
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
-->
<script lang="ts">
  import type { Person } from '../types'

  export let person: Person
  export let subtitle: string | undefined

  const getName = (a: string | undefined, b: string | undefined) =>
    [a, b].filter((x) => x !== undefined && x.length > 0).join(' ')

  let name = getName(person.firstName, person.lastName)
  $: name = getName(person.firstName, person.lastName)
</script>

<div class="root">
  <div class="content">
    <img class="avatar" src={person.avatar} alt="avatar" />
    <div class="name">
      {name}
    </div>
    {#if subtitle !== undefined && subtitle.length > 0}
      <div class="subtitle">
        {subtitle}
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  .root {
    display: flex;
    justify-content: center;
    align-items: center;

    height: 240px;
    width: 100%;

    border-radius: 20px;
    background-image: url('https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Borscht_served.jpg/1920px-Borscht_served.jpg');
    background-position: center;
    background-size: cover;
  }

  .content {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .avatar {
    border-radius: 50%;
    height: 80px;
    width: 80px;
  }

  .name {
    padding-top: 15px;
    font-weight: 500;
    font-size: 16px;

    color: #fff;
    text-shadow: 1px 1px 1px #000;
  }

  .subtitle {
    padding-top: 5px;
    font-weight: 500;
    font-size: 12px;

    color: #fff;
    text-shadow: 1px 1px 1px #000;
    opacity: 0.6;
  }
</style>
