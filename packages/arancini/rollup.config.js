import commonjs from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import path from 'path'
import filesize from 'rollup-plugin-filesize'

const commonOutput = {
  format: 'es',
  sourcemap: true,
  exports: 'named',
}

const plugins = [
  terser(),
  nodeResolve(),
  commonjs(),
  typescript({
    tsconfig: path.resolve(__dirname, `tsconfig.json`),
  }),
  filesize(),
]

export default [
  {
    input: `./src/index.ts`,
    external: ['@arancini/core'],
    output: [
      {
        file: `./index.js`,
        ...commonOutput,
      },
    ],
    plugins,
  },
  {
    input: `./src/react.ts`,
    external: ['@arancini/core', '@arancini/react', 'react', 'react-dom'],
    output: [
      {
        file: `./react.js`,
        ...commonOutput,
      },
    ],
    plugins,
  },
  {
    input: `./src/net.ts`,
    external: ['@arancini/core'],
    output: [
      {
        file: `./net.js`,
        ...commonOutput,
      },
    ],
    plugins,
  },
]
