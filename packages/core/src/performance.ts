// Basic performance metrics suite.

interface CounterInfo {
  name: string
  operations: number
  time: number
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
export function measure (name: string): () => void {
  const st = Date.now()
  return () => {
    const ed = Date.now()

    let opm = measurements.get(name)
    if (opm === undefined) {
      opm = { name, operations: 0, time: 0 }
      measurements.set(name, opm)
    }

    opm.operations++
    opm.time += ed - st
  }
}

/**
 * @public
 */
export async function measureAsync<T> (name: string, op: () => Promise<T>): Promise<T> {
  const done = measure(name)
  try {
    return await op()
  } finally {
    done()
  }
}

/**
 * @public
 * Return measurements line by line
 */
export function getMeasurements (): { name: string, avg: number, ops: number, total: number }[] {
  return Array.from(measurements.values())
    .sort((a, b) => b.time - a.time)
    .map((m) => ({ name: m.name, avg: m.time / (m.operations + 1), total: m.time, ops: m.operations }))
}
