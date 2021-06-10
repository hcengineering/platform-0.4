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
  import { EditBox, Dialog, ToggleWithLabel } from '@anticrm/ui'

</script>

<Dialog label="Create Channel">
  <div class="content">
    <div class="row"><EditBox label="Name" value="Channel Name"/></div>
    <div class="row"><EditBox label="Description" value="This is a little description"/></div>
    <div class="row"><ToggleWithLabel label="Make channel private" description="Lorem ipsum dolor sit amet quantum nunca sic"/></div>
  </div>
</Dialog>


<style lang="scss">

  .content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    row-gap: 20px;
    
    .row {
      grid-column-start: 1;
      grid-column-end: 3;
    }
  }

</style>