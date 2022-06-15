const path = require('path')
const { BannerPlugin } = require('webpack')
const externals = require('webpack-node-externals')
// import path from 'path';
// import pkg from 'webpack';
// import externals from 'webpack-node-externals';
// const {BannerPlugin} = pkg;

const config = {
  context: path.join(__dirname, './src'),
  entry: './index.js',
  output: {
    path: path.join(__dirname, './dist'),
    libraryTarget: 'commonjs2',
    filename: 'lint-only.js',
    sourceMapFilename: 'lint-only.js.map',
  },
  devtool: 'source-map',
  target: 'node',
  externals: [externals()],
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new BannerPlugin({
      banner: '#!/usr/bin/env node',
      raw: true,
    }),
  ]
}

module.exports = config
