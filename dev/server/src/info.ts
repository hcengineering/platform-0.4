import { getMeasurements } from '@anticrm/core'
import { SecurityOptions } from '@anticrm/server'
import { createServer } from 'https'
import Koa from 'koa'
import Router from 'koa-router'

interface InfoServer {
  shutdown: () => void
}

export async function startInfoServer (port: number, security: SecurityOptions): Promise<InfoServer> {
  const app = new Koa()
  const router = new Router()

  router.get('auth', '/info', async (ctx: any) => {
    ctx.body = `<html>
    <meta http-equiv="refresh" content="1">
    <table>
    <thead>
      <th>Parameter</th>
      <th>Count</th>
      <th>Average time </th>
      <th>Total time </th>
    </thead>
    <tbody>
      ${getMeasurements()
        .map(
          (t) => `<tr>
        <td> ${t.name}</td>
        <td> ${t.ops}</td>
        <td> ${Math.floor(t.avg * 1000) / 1000}</td>
        <td> ${t.total}</td>
      </tr>`
        )
        .join('\n')}
    </tody>
    </table></html>`
    ctx.set('Content-Type', 'text/html')
    ctx.set('Content-Encoding', 'identity')
  })

  app.use(router.routes()).use(router.allowedMethods())

  const callback = app.callback()

  const server = createServer(security, callback)
  server.listen(port, () => {
    console.log('Anticrm Platform Info server is started at ', port)
  })
  return {
    shutdown: () => {
      server.close()
    }
  }
}

function toLen (val: string, len = 50): string {
  while (val.length < len) {
    val += ' '
  }
  return val
}

let prevInfo = ''
export function printInfo (): void {
  const val = getMeasurements()
    .filter((m) => m.total > 1)
    .map((m) => `${toLen(m.name)}: avg ${m.avg} total: ${m.total} ops: ${m.ops}`.trim())
    .join('\n')
  if (prevInfo !== val) {
    prevInfo = val
    console.log('\nStatistics:\n', val)
  }
}
