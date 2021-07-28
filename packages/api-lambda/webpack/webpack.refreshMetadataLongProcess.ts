import { Configuration } from 'webpack';
import { sharedConfig } from './shared.config'

const CopyPlugin = require("copy-webpack-plugin");

const baseConfig = sharedConfig('refreshMetadataLongProcess')

const config: Configuration = {
  ...baseConfig,
  plugins: [
    ...baseConfig.plugins || [],
    new CopyPlugin({
      patterns: [
        { from: __dirname + "/../../../node_modules/sharp/vendor/8.10.6/lib", to: "lib" },
        // { from: __dirname + "/../sharp-install/node_modules/sharp/vendor/8.10.6/lib", to: "lib" },
      ],
    }),
  ]
};

export default config;