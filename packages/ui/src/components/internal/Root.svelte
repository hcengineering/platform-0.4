<script lang="ts">
  import { OK } from '@anticrm/status'
  import { PlatformEvent, getMetadata, addEventListener } from '@anticrm/platform'
  import type { AnyComponent } from '@anticrm/status'
  import { applicationShortcutKey, defaultApplicationShortcutKey } from '../../utils'
  import { newRouter } from '../../router'

  import { Theme } from '@anticrm/theme'
  import Component from '../Component.svelte'

  import StatusComponent from './Status.svelte'
  import Clock from './Clock.svelte'
  // import Mute from './icons/Mute.svelte'
  import WiFi from './icons/WiFi.svelte'
  import ThemeSelector from './ThemeSelector.svelte'

  interface AppRoute {
    application: string
  }

  const defaultMeta = getMetadata(defaultApplicationShortcutKey())

  let application: AnyComponent | undefined = getMetadata(applicationShortcutKey(defaultMeta ?? ''))
  let appRoute: AppRoute | undefined

  newRouter<AppRoute>(
    ':application',
    (match) => {
      appRoute = match
      const app = appRoute.application
      const shortcut = getMetadata(applicationShortcutKey(app))
      application = shortcut ?? (app as AnyComponent)
    },
    { application: defaultMeta ?? '' }
  )

  let status = OK

  addEventListener(PlatformEvent, async (_event, _status) => {
    status = _status
  })
</script>

<Theme>
  <div id="ui-root">
    <div class="status-bar">
      <div class="container">
        <div class="status-messages">
          <StatusComponent {status} />
        </div>
        <div class="widgets">
          <div class="clock">
            <Clock />
          </div>
          <div class="widget">
            <ThemeSelector />
          </div>
          <div class="widget">
            <WiFi size={16} />
          </div>
        </div>
      </div>
    </div>
    <div class="app">
      {#if application}
        <Component is={application} props={{}} />
      {:else}
        <div class="caption-1 error">
          Application not found: {application}
        </div>
      {/if}
    </div>
  </div>
</Theme>

<style lang="scss">
  $status-bar-height: 32px;

  #ui-root {
    position: relative;
    display: flex;
    flex-direction: column;

    height: 100vh;

    .status-bar {
      min-height: $status-bar-height;
      min-width: 800px;

      .container {
        display: flex;
        align-items: center;
        height: 100%;

        .status-messages {
          flex-grow: 1;
          text-align: center;
        }

        .widgets {
          display: flex;
          align-items: center;
          flex-direction: row-reverse;

          .clock {
            margin: 0 40px 0 24px;
            font-weight: 500;
            font-size: 12px;
            color: var(--theme-caption-color);
            opacity: 0.3;
            user-select: none;
          }
          .widget {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            opacity: 0.3;
          }
        }
      }
    }

    .error {
      margin-top: 45vh;
      text-align: center;
    }

    .app {
      height: calc(100vh - #{$status-bar-height});
      min-width: 800px;
      min-height: 600px;
    }
  }
</style>
