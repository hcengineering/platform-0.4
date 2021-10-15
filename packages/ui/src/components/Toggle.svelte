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
  export let on: boolean = false
</script>

<label class="toggle">
  <input class="chBox" type="checkbox" bind:checked={on} on:change />
  <span class="toggle-switch" />
</label>

<style lang="scss">
  .toggle {
    display: inline-block;
    height: 24px;
    line-height: 24px;
    vertical-align: middle;
    font-size: inherit;
    user-select: none;
    .chBox {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      border: 0;
      padding: 0;
      clip: rect(0 0 0 0);
      overflow: hidden;

      &:checked + .toggle-switch {
        background-color: var(--primary-button-enabled);
        &:before {
          left: 26px;
        }
      }
      &:not(:disabled) + .toggle-switch {
        cursor: pointer;
      }
      &:disabled + .toggle-switch {
        filter: grayscale(70%);
        &:before {
          background: #eee;
        }
      }
      &:focus-within + .toggle-switch {
        // border: 1px solid var(--primary-button-focused-border);
        box-shadow: 0 0 0 2px var(--primary-button-outline);
      }
    }
    &:active > .toggle-switch {
      // border: 1px solid var(--primary-button-focused-border);
      box-shadow: 0 0 0 2px var(--primary-button-outline);
    }
    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 52px;
      height: 28px;
      border-radius: 50px;
      background-color: var(--theme-button-bg-pressed);
      // border: 1px solid transparent;
      box-shadow: 1px 2px 7px rgba(119, 129, 142, 0.101961);
      transition: left 0.2s;
      &:before {
        content: '';
        position: absolute;
        top: 2px;
        left: 3px;
        display: inline-block;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #fff;
        box-shadow: 1px 2px 7px rgba(119, 129, 142, 0.1);
        transition: 0.15s;
      }
    }
  }
</style>
