/* eslint-disable max-len, import/no-extraneous-dependencies */
import path from 'path';

import autoprefixer from 'autoprefixer';
import config from 'config';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import SriPlugin from 'webpack-subresource-integrity';
import webpack from 'webpack';

import SriDataPlugin from './src/core/server/sriDataPlugin';
import { getPlugins, getRules } from './webpack-common';

const appName = config.get('appName');
const appsBuildList = appName ? [appName] : config.get('validAppNames');

const entryPoints = {};
// eslint-disable-next-line no-restricted-syntax
for (const app of appsBuildList) {
  entryPoints[app] = `src/${app}/client`;
}

const settings = {
  devtool: 'source-map',
  context: path.resolve(__dirname),
  entry: entryPoints,
  output: {
    crossOriginLoading: 'anonymous',
    path: path.join(__dirname, 'dist'),
    filename: '[name]-[chunkhash].js',
    chunkFilename: '[name]-[chunkhash].js',
    publicPath: config.has('staticHost') ? `${config.get('staticHost')}/` : '/',
  },
  module: {
    rules: getRules(),
  },
  plugins: [
    ...getPlugins(),
    new ExtractTextPlugin({
      filename: '[name]-[contenthash].css',
      allChunks: true,
    }),
    // optimizations
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      comments: false,
      compress: {
        drop_console: true,
      },
    }),
    new SriPlugin({ hashFuncNames: ['sha512'] }),
    new SriDataPlugin({
      saveAs: path.join(__dirname, 'dist', 'sri.json'),
    }),
    // This function helps ensure we do bail if a compilation error
    // is encountered since --bail doesn't cause the build to fail with
    // uglify errors.
    // Remove when https://github.com/webpack/webpack/issues/2390 is fixed.
    function bailOnStatsError() {
      this.plugin('done', (stats) => {
        if (stats.compilation.errors && stats.compilation.errors.length) {
          // eslint-disable-next-line no-console
          console.log(stats.compilation.errors);
          process.exit(1);
        }
      });
    },
  ],
  resolve: {
    alias: {
      'normalize.css': 'normalize.css/normalize.css',
    },
    modules: [
      path.resolve(__dirname),
      path.resolve('./src'),
      'node_modules',
    ],
    extensions: ['.js', '.jsx'],
  },
};

if (config.get('enablePostCssLoader')) {
  settings.plugins.push(
    new webpack.LoaderOptionsPlugin({
      options: {
        context: path.resolve(__dirname),
        postcss: [
          autoprefixer({ browsers: ['last 2 versions'] }),
        ],
      },
    })
  );
}

export default settings;
