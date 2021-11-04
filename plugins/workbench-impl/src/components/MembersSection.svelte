<script lang="ts">
  import type { Space, Account, Ref } from '@anticrm/core'
  import core from '@anticrm/core'
  import { IconAdd, Label, Section, UserInfo, UserBoxPopup, showPopup } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import workbench from '../plugin'
  export let space: Space

  let members: Account[] = []
  let otherMembers: Account[] = []

  const client = getClient()

  $: client.findAll(core.class.Account, { _id: { $in: space.members } }).then((m) => {
    members = m
  })

  $: client.findAll(core.class.Account, {}).then((m) => {
    otherMembers = m.filter((m) => !space.members.includes(m._id))
  })
  let btn: HTMLElement | undefined

  function inviteMember (): void {
    console.log(members, otherMembers)
    showPopup(
      UserBoxPopup,
      { label: workbench.string.InviteMember, users: otherMembers, selected: undefined, showSearch: true },
      btn,
      (result: Ref<Account> | undefined) => {
        // undefined passed when closed without changes, null passed when unselect
        if (result !== undefined) {
          client.updateDoc(space._class, core.space.Model, space._id, {
            $push: { members: result }
          })
        }
      }
    )
  }
</script>

<Section icon={workbench.icon.Members} label={workbench.string.Members} closed={false}>
  <div class="list">
    {#each members as member}
      <div class="list-item">
        <UserInfo user={member} size={32} />
      </div>
    {/each}
    {#if otherMembers.length > 0}
      <div bind:this={btn} class="list-item add-item" on:click={inviteMember}>
        <div class="icon">
          <div><IconAdd /></div>
        </div>

        <div class="label">
          <Label label={workbench.string.InviteMember} />
        </div>
      </div>
    {/if}
  </div>
</Section>

<style lang="scss">
  .list {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    max-width: 100%;

    flex-direction: column;
    margin: 0 16px;

    .list-item {
      padding: 10px 0 10px 0;
    }

    .list-item + .list-item {
      border-top: 1px solid var(--theme-menu-divider);
    }

    .add-item {
      display: flex;
      align-items: center;
      cursor: pointer;

      .icon {
        opacity: 0.6;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-color: var(--theme-button-bg-focused);
        border-color: var(--theme-button-border);
        display: flex;

        div {
          margin: auto;
        }
      }
      .label {
        margin-left: 16px;
        color: var(--theme-content-color);
      }

      &:hover {
        .icon {
          opacity: 1;
        }
        .label {
          color: var(--theme-caption-color);
        }
      }
    }
  }
</style>
