import webpack = require('webpack');
import HtmlWebpackPlugin = require('html-webpack-plugin');

const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  entry: {
    'ubirch-certification': path.resolve(__dirname, '../src/index.ts'),
  },
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'index.js',
    libraryTarget: 'umd',
  },
  resolve: {
    extensions: ['.js', '.ts'],
    fallback: {
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer/'),
      zlib: require.resolve('browserify-zlib'),
      assert: require.resolve("assert/"),
      util: require.resolve("util/")
    },
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: 'process',
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: path.resolve(__dirname, '../demo/simple-cert.html'),
      minify: false,
    }),
    new CleanWebpackPlugin({ cleanStaleWebpackAssets: false }),
  ],
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          // Creates `style` nodes from JS strings
          'style-loader',
          // Translates CSS into CommonJS
          'css-loader',
          // Compiles Sass to CSS
          'sass-loader',
        ],
      },
    ],
  },
  devServer: {
    static: path.join(__dirname, '../dist'),
    compress: true,
    port: 9105,
  },
};

export {};
