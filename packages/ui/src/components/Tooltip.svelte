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
  import type { IntlString } from '@anticrm/platform'
  import Label from './Label.svelte'

  export let label: IntlString
  export let direction: string = 'top'
</script>

<div class="container">
  <div class="trigger"><slot/></div>
  <div class="tooltip {direction}"><Label label={label}/></div>
</div>

<style lang="scss">
  .container {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    
    .trigger:hover + .tooltip {
      opacity: 1;
      &.top {
        transform: translateY(-10px);
      }
      &.bottom {
        transform: translateY(10px);
      }
      &.right {
        transform: translateX(10px);
      }
      &.left {
        transform: translateX(-10px);
      }
    }

    .tooltip {
      box-sizing: border-box;
      position: absolute;
      padding: 8px;
      color: #fff;
      background-color: #2C2C34;
      border: 1px solid rgba(255, 255, 255, 0.03);
      border-radius: 8px;
      box-shadow: 0px 8px 20px rgba(0, 0, 0, 0.25);
      opacity: 0;
      transition: transform .3s ease, opacity .2s ease-in-out;
      pointer-events: none;
      text-align: center;
      transition-delay: .2s;

      &::after {
        content: "";
        position: absolute;
        width: 15px;
        height: 15px;
        background: linear-gradient(-45deg, rgba(44, 44, 52, 1) 50%, rgba(44, 44, 52, 0) 40%);
        border-radius: 0 0 3px;
      }

      &.top::after, &.bottom::after {
        left: 50%;
        margin-left: -7.5px;
      }
      &.top {
        bottom: 100%;
        &::after {
          bottom: -5px;
          transform: rotate(45deg);
        }
      }
      &.bottom {
        top: 100%;
        &::after {
          top: -5px;
          transform: rotate(-135deg);
        }
      }

      &.right::after, &.left::after {
        top: 50%;
        margin-top: -7.5px;
      }
      &.right {
        left: 100%;
        &::after {
          left: -5px;
          transform: rotate(135deg);
        }
      }
      &.left {
        right: 100%;
        &::after {
          right: -5px;
          transform: rotate(-45deg);
        }
      }
    }
  }
</style>
