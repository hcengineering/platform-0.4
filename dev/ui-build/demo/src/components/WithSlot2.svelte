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
<script lang='ts'>
  /**
   * @slot {{ prop: number; doubled: number; }}
   * @slot {{ props: { class?: string; } }} description
   */

  export let prop = 0;
</script>

<h1>
  <div class='logo'>
    <slot {prop} doubled={prop * 2} />
  </div>
</h1>

<p>
  <slot name="description" props={{ class: $$props.class }} />
</p>
<style lang='scss'>
  .logo {
          position: relative;
          &:after {
            position: absolute;
            content: '';
            background: center url('../../img/logo.svg');
            transform: translate(-50%, -50%);
            width: 63px;
            height: 79px;
          }
          &:before {
            position: absolute;
            content: '';
            transform: translate(-50%, -50%);
            width: 255px;
            height: 255px;
            border: 1.8px solid #ffffff;
            border-radius: 50%;
            opacity: 0.08;
          }
        }
</style>