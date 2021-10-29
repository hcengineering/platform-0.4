// Basic performance metrics suite.

interface Measurement {
  operations: number
  time: number

  params: Record<string, Measurement>
}
interface CounterInfo extends Measurement {
  name: string
}

/**
 * @public
 */
export interface AvgMeasurement {
  avg: number
  ops: number
  total: number
  params: Record<string, AvgMeasurement>
}

/**
 * @public
 */
export interface PerfUtil {
  /**
   * Start performance measuremenet of a kind.
   */
  measure: (operation: string) => () => void
}

const measurements = new Map<string, CounterInfo>()

/**
 * @public
 */
export function measure (name: string, ...params: string[]): () => void {
  const st = Date.now()
  return () => {
    const ed = Date.now()

    let opm = measurements.get(name)
    if (opm === undefined) {
      opm = { name, operations: 0, time: 0, params: {} }
      measurements.set(name, opm)
    }

    opm.operations++
    opm.time += ed - st
    let oop: Measurement = opm
    for (const p of params) {
      const v = oop.params[p] ?? { operations: 0, time: 0, params: {} }
      v.operations += 1
      v.time += ed - st
      oop.params[p] = v
      oop = v
    }
  }
}

/**
 * @public
 */
export async function measureAsync<T> (name: string, op: () => Promise<T>, ...params: string[]): Promise<T> {
  const done = measure(name, ...params)
  try {
    return await op()
  } finally {
    done()
  }
}

/**
 * @public
 */
export function clearMeasurements (): void {
  measurements.clear()
}

/**
 * @public
 * Return measurements line by line
 */
export function getMeasurements (): (AvgMeasurement & { name: string, params: Record<string, AvgMeasurement> })[] {
  return Array.from(measurements.values())
    .sort((a, b) => b.time - a.time)
    .map((m) => ({
      name: m.name,
      ...toAvg(m),
      params: toAvgRec(m.params)
    }))
}

function toAvg (m: Measurement): AvgMeasurement {
  return {
    avg: m.time / (m.operations + 1),
    total: m.time,
    ops: m.operations,
    params: toAvgRec(m.params)
  }
}

function toAvgRec (m: Record<string, Measurement>): Record<string, AvgMeasurement> {
  const result: Record<string, AvgMeasurement> = {}
  for (const [k, v] of Object.entries(m).sort((a, b) => b[1].time - a[1].time)) {
    result[k] = toAvg(v)
  }
  return result
}

function toLen (val: string, len = 50): string {
  while (val.length < len) {
    val += ' '
  }
  return val
}

let prevInfo = ''

function printMeasurementParams (params: Record<string, AvgMeasurement>, offset: number): string {
  let r = ''
  if (Object.keys(params).length > 0) {
    r += '\n' + toLen('', offset)
    r += Object.entries(params)
      .map(([k, vv]) => printMeasurement(k, vv, offset))
      .join('\n' + toLen('', offset))
  }
  return r
}
function printMeasurement (name: string, m: AvgMeasurement, offset: number): string {
  let r = `${toLen('', offset)}${toLen(name, 50 - offset)}: avg ${m.avg} total: ${m.total} ops: ${m.ops}`.trim()
  r += printMeasurementParams(m.params, offset + 4)
  return r
}

/**
 * @public
 */
export function printMeasurements (): void {
  const val = getMeasurements()
    .filter((m) => m.total > 1)
    .map((m) => printMeasurement(m.name, m, 0))
    .join('\n')
  if (prevInfo !== val) {
    prevInfo = val
    console.log('\nStatistics:\n' + val.trim())
  }
}
