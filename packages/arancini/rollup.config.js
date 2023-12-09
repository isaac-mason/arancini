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

const entrypoint = ({ name, external }) => ({
  input: `./src/${name}.ts`,
  external: external ?? [],
  output: [
    {
      file: `./dist/${name}.js`,
      ...commonOutput,
    },
  ],
  plugins,
})

export default [
  entrypoint({ name: 'index', external: ['@arancini/core'] }),
  entrypoint({
    name: 'react',
    external: ['@arancini/core', 'react', 'react-dom'],
  }),
  entrypoint({ name: 'events' }),
  entrypoint({ name: 'pool' }),
  entrypoint({ name: 'systems', external: ['@arancini/core'] }),
]
