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
  // Main purpose is to handle 2 cases:
  // 1. Load children after delay (slow scroll case)
  // 2. Load children instantly if scroll finished before delay

  export let delay: number = 100
  export let isScrolling: boolean

  let ready = !isScrolling || delay === 0

  $: if (!isScrolling) {
    ready = true
  }

  setTimeout(() => {
    ready = true
  }, delay)
</script>

<slot {ready} />
