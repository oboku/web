import { resolve } from 'path';
import { Configuration } from 'webpack';

const CopyPlugin = require("copy-webpack-plugin");

export const sharedConfig = (functionName: String): Configuration => ({
  entry: __dirname + `/../src/functions/${functionName}.ts`,
  externals: {
    'aws-sdk': 'commonjs aws-sdk',
  },
  devtool: 'cheap-module-source-map',
  target: 'node',
  mode: 'development',
  node: {
    __dirname: false,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
      },
      {
        test: /\.node$/,
        loader: 'node-loader',
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    path: resolve(__dirname, `../dist/${functionName}`),
    filename: '[name].js',
    libraryTarget: 'commonjs',
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "package-build.json", to: "package.json" },
        { from: ".secrets", to: ".secrets" },
        { from: ".env", to: "./" },
      ],
    }),
  ],
});