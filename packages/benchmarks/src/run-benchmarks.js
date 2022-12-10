import { arancini } from './arancini.js'
import { addRemove } from './suites/add-remove.js'
import { addition } from './suites/addition.js'
import { destroy } from './suites/destroy.js'
import { velocity } from './suites/velocity.js'

/**
 * Runs benchmarks
 * @param {*} now function that returns the current time in micro seconds
 */
export const runBenchmarks = (now) => {
  const bench = (suite) => {
    suite.setup(arancini)

    let sum = 0

    for (let i = 0; i < suite.iterations; i++) {
      const start = now()

      suite.perform(arancini)

      sum += now() - start
    }

    const average = sum / suite.iterations
    const updates = arancini.getMovementSystemUpdateCount()

    const nameTxt = suite.name.padEnd(12, ' ')
    const sumText = `${sum.toFixed(6)}`.padStart(20, ' ') + ' micro seconds'
    const averageText =
      `${average.toFixed(6)}`.padStart(20 + ' ') + ' micro seconds'
    const updateText = updates > 0 ? `${updates} updates`.padStart(20) : ''

    console.log(`${nameTxt} ${averageText} ${sumText} ${updateText}`)
  }

  console.log('\nrunning benchmarks...\n')

  setTimeout(() => {
    ;[addRemove, addition, destroy, velocity].forEach((suite) => {
      bench(suite)
    })
  })
}
