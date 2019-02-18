const webpack = require('webpack');
const merge = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const base = require('./webpack.config.base');

// const PUBLIC_PATH = '/';
const PUBLIC_PATH = '/mapbox/';

module.exports = merge(base, {
  mode: 'production',
  output: {
    publicPath: PUBLIC_PATH
  },
  plugins: [
    new webpack.DefinePlugin({
      PUBLIC_PATH: JSON.stringify(PUBLIC_PATH),
    }),
    new CleanWebpackPlugin(['docs']),
    ...Object.keys(base.entry).map(entryName => {
      return new HtmlWebpackPlugin({
        template: 'examples/index.html',
        chunks: [entryName],
        filename: `${entryName}.html`,
        minify: {
          removeComments: true,
          collapseWhitespace: true,
          removeAttributeQuotes: true,
          minifyCSS: true
        }
      });
    })
  ],
});