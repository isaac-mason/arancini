import babel from '@rollup/plugin-babel'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import path from 'path'
import filesize from 'rollup-plugin-filesize'

const babelOptions = {
  babelrc: false,
  extensions: ['.ts'],
  exclude: '**/node_modules/**',
  babelHelpers: 'bundled',
  presets: [
    [
      '@babel/preset-env',
      {
        loose: true,
        modules: false,
        targets: '>1%, not dead, not ie 11, not op_mini all',
      },
    ],
    '@babel/preset-typescript',
  ],
}

const plugins = [
  nodeResolve(),
  typescript({
    tsconfig: path.resolve(__dirname, `tsconfig.json`),
    emitDeclarationOnly: true,
  }),
  babel(babelOptions),
  filesize(),
]

const entrypoint = ({ name, external }) => ({
  input: `./src/${name}.ts`,
  external: external ?? [],
  output: [
    {
      file: `./dist/${name}.mjs`,
      format: 'es',
      sourcemap: true,
      exports: 'named',
    },
  ],
  plugins,
})

export default [
  entrypoint({ name: 'index', external: ['@arancini/core'] }),
  entrypoint({
    name: 'react',
    external: ['@arancini/core', '@arancini/react', 'react', 'react-dom'],
  }),
  entrypoint({ name: 'events', external: ['@arancini/events'] }),
  entrypoint({
    name: 'systems',
    external: ['@arancini/core'],
  }),
]
