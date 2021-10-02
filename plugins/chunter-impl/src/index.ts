//
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
//

import type { ChunterService } from '@anticrm/chunter'
import { setResource } from '@anticrm/platform'

import CreateChannel from './components/CreateChannel.svelte'
import CreateDirectMessage from './components/CreateDirectMessage.svelte'
import ChannelView from './components/ChannelView.svelte'
import ThreadsView from './components/ThreadsView.svelte'
import SpaceItem from './components/SpaceItem.svelte'
import SpaceHeader from './components/SpaceHeader.svelte'
import chunter from './plugin'
import OembedPresenter from './components/presenters/Oembed.svelte'
import Github_IssuePreview from './components/presenters/Github_IssuePreview.svelte'

import Channel from './components/Channel.svelte'
import ReferenceInput from './components/ReferenceInput.svelte'

import References from './components/References.svelte'
import MessageView from './components/MessageView.svelte'

import AllThreadsView from './components/AllThreadsView.svelte'

export default async (): Promise<ChunterService> => {
  setResource(chunter.component.CreateChannel, CreateChannel)
  setResource(chunter.component.CreateMessage, CreateDirectMessage)
  setResource(chunter.component.ChannelView, ChannelView)
  setResource(chunter.component.ThreadsView, ThreadsView)
  setResource(chunter.component.SpaceItem, SpaceItem)
  setResource(chunter.component.SpaceHeader, SpaceHeader)

  setResource(chunter.component.OembedPreview, OembedPresenter)
  setResource(chunter.component.GithubIssuePreview, Github_IssuePreview)

  setResource(chunter.component.Channel, Channel)
  setResource(chunter.component.ReferenceInput, ReferenceInput)

  setResource(chunter.component.References, References)
  setResource(chunter.component.MessageView, MessageView)

  setResource(chunter.component.AllThreadsView, AllThreadsView)

  return {}
}

export { chunter as chunterIds }
