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
  import { EditBox, Dialog, Toggle } from '@anticrm/ui'

</script>

<Dialog label="Create Channel">
  <EditBox label="Name" value="Channel Name"/>
  <EditBox label="Description" value="This is a little description"/>
  <div class="private">
    <div class="caption">
      Make channel private
      <span>Lorem ipsum dolor sit amet quantum nunca sic</span>
    </div>
    <Toggle/>
  </div>
</Dialog>

<style lang="scss">

.private {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  .caption {
    font-size: 14px;
    font-weight: 400;
    color: var(--theme-caption-color);

    span {
      display: block;
      font-size: 12px;
      opacity: .3;
    }
  }
}

</style>