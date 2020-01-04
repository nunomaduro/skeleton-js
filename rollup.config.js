/* eslint-disable import/no-commonjs, functional/immutable-data, functional/no-let */

import json from '@rollup/plugin-json';
import path from 'path';
import babel from 'rollup-plugin-babel';
import filesize from 'rollup-plugin-filesize';
import ignore from 'rollup-plugin-ignore';
import globals from 'rollup-plugin-node-globals';
import { terser } from 'rollup-plugin-terser';
import ts from 'rollup-plugin-typescript2';

const version = require('./package.json').version;
const copyright = '© Nuno Maduro.';
const link = 'https://github.com/nunomaduro/package-name';
const createLicence = name => {
  return `/*! ${name} | ${version} | ${copyright} | ${link} */`;
};

const builds = [
  { file: `package-name.esm.js`, format: `es` },
  { file: `package-name.cjs.js`, format: `cjs` },
  { file: `package-name.umd.js`, format: `umd` },
];

const babelConfig = {
  babelrc: false,
  extensions: ['.ts'],
  presets: [
    [
      '@babel/preset-env',
      {
        modules: false,
        targets: {
          browsers: ['last 2 versions', 'ie >= 11'],
        },
      },
    ],
  ],
};

export default builds.map(build => {
  const output = build;

  const isUmdBuild = /\.umd.js$/.test(output.file);

  if (isUmdBuild) {
    output.name = 'copyrightsearch';
    output.banner = createLicence(output.file);
  }

  output.file = `dist/${output.file}`;

  let dependencies = require('./package.json').dependencies;

  if (isUmdBuild || dependencies === undefined) {
    dependencies = [];
  }

  return {
    input: 'src/index.ts',
    external: [], // external dependencies, if any
    plugins: [
      json({ namedExports: false }),
      globals({ global: true }),
      ignore([]), // external dependencies to ignore, if any.
      ts({
        check: true,
        tsconfig: path.resolve(__dirname, 'tsconfig.json'),
        cacheRoot: path.resolve(__dirname, 'node_modules/.rts2_cache'),
        tsconfigOverride: {
          include: ['src/**/*.ts'],
          exclude: ['tests/**'],
          compilerOptions: {
            declaration: true,
            declarationMap: true,
          },
        },
      }),
      // we apply babel on browser builds
      ...(isUmdBuild ? [terser(), babel(babelConfig)] : []),
      filesize({
        showMinifiedSize: false,
        showGzippedSize: true,
      }),
    ],
    output,
    onwarn(msg, warn) {
      if (!/Circular/.test(msg)) {
        warn(msg);
      }
    },
  };
});
