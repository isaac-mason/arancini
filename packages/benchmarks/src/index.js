import { performance } from 'perf_hooks';
import { addRemove } from './suites/add-remove.js';
import { addition } from './suites/addition.js';
import { destroy } from './suites/destroy.js';
import { velocity } from './suites/velocity.js';

/**
 * @param {string} name
 * @param {Function} fn
 */
const bench = (name, fn) => {
  const start = performance.now();

  fn();

  const end = performance.now();

  const time = end - start;

  console.log(`[${name}] took ${(time / 1000).toFixed(6)}s`);
};

console.log('\nrunning benchmarks...\n')
bench('velocity', velocity);
bench('add remove', addRemove);
bench('addition', addition);
bench('destroy', destroy);
