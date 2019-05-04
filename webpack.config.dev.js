const webpack = require('webpack');
const merge = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const base = require('./webpack.config.base');

module.exports = merge(base, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    host: '0.0.0.0',
    contentBase: './docs',
    hot: true
  },
  plugins: [
    new webpack.DefinePlugin({
      PUBLIC_PATH: JSON.stringify('/'),
    }),
    new CleanWebpackPlugin(['docs']),
    ...Object.keys(base.entry).map(entryName => {
      return new HtmlWebpackPlugin({
        template: 'examples/index.html',
        chunks: [entryName],
        filename: `${entryName}.html`,
        inject: true,
      });
    }),
    new webpack.HotModuleReplacementPlugin()
  ],
});