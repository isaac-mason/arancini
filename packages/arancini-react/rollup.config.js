import commonjs from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import path from 'path'
import filesize from 'rollup-plugin-filesize'

export default [
  {
    input: `./src/index.tsx`,
    external: ['@arancini/core', 'react', 'react-dom'],
    output: [
      {
        file: `dist/index.es.js`,
        format: 'es',
        sourcemap: 'inline',
        exports: 'named',
      },
    ],
    plugins: [
      terser(),
      nodeResolve(),
      commonjs(),
      typescript({
        tsconfig: path.resolve(__dirname, `tsconfig.json`),
      }),
      filesize(),
    ],
  },
]
