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
  import { Class, Ref } from '@anticrm/core'
  import { getClient } from '@anticrm/workbench'
  import { Button, TextArea } from '@anticrm/ui'
  import { QueryUpdater } from '@anticrm/presentation'
  import type { Feedback, FeedbackRequest } from '@anticrm/recruiting'
  import recruiting from '@anticrm/recruiting'

  const client = getClient()

  export let objectId: Ref<FeedbackRequest>
  export let objectClass: Ref<Class<FeedbackRequest>>

  let request: FeedbackRequest | undefined
  let feedback: Feedback | undefined

  let requestQ: QueryUpdater<FeedbackRequest> | undefined
  $: requestQ = client.query(requestQ, objectClass, { _id: objectId }, ([first]) => (request = first))

  let feedbackQ: QueryUpdater<Feedback> | undefined
  $: feedbackQ = client.query(
    feedbackQ,
    recruiting.class.Feedback,
    { request: objectId },
    ([first]) => (feedback = first)
  )

  let feedbackMsg = ''
  async function create () {
    if (request === undefined) {
      return
    }

    await client.createDoc(recruiting.class.Feedback, client.userSpace(), {
      feedback: feedbackMsg,
      parent: request.parent,
      request: request._id
    })
  }
</script>

{#if feedback !== undefined}
  <div class="feedback">
    {feedback.feedback}
  </div>
{:else if request !== undefined}
  <div class="root">
    <TextArea bind:value={feedbackMsg} />
    <Button label={recruiting.string.SubmitFeedback} on:click={create} />
  </div>
{/if}

<style lang="scss">
  .root {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .feedback {
    max-width: 400px;
  }
</style>
