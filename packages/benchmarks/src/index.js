import { hrtime } from 'process'
import { runBenchmarks } from './run-benchmarks.js'

const nowInMicroSeconds = () => {
  const hr = hrtime()
  return (hr[0] * 1e9 + hr[1]) / 1000
}

runBenchmarks(nowInMicroSeconds)
