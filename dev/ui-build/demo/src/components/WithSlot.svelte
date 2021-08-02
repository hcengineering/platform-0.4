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
  import Spinner from './Spinner.svelte'
  
  export let msg: string
  export const readonlyProp = 'some value'

</script>

<slot>
  <div> Default value </div>
</slot>

<slot name='extra'>
  <div> Extra value </div>
</slot>

<slot name='props' msg={msg}>
</slot>
<Spinner></Spinner>