var webpack = require('webpack');
var resolvers = require('./build_helpers/resolvers');
var path = require('path');
var glob = require('glob');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var packageJSON = require('./package.json');

var banner = (
  '/**\n' +
  ' * FixedDataTable v' + packageJSON.version + ' \n' +
  ' *\n' +
  ' * Copyright Mercado Libre\n' +
  ' * All rights reserved.\n' +
  ' *\n' +
  ' * This source code is licensed under the BSD-style license found in the\n' +
  ' * LICENSE file in the root directory of this source tree. An additional grant\n' +
  ' * of patent rights can be found in the PATENTS file in the same directory.\n' +
  ' */\n'
);

var plugins = [
  new ExtractTextPlugin('[name].css'),
  new webpack.DefinePlugin({
    '__DEV__': JSON.stringify(process.env.NODE_ENV !== 'production')
  })
];

var entry = {};
var baseEntryPoints = glob.sync(
  path.join(__dirname, './src/css/layout.scss')
);

var styleEntryPoints = glob.sync(
  path.join(__dirname, './src/css/style.scss')
);

var mainEntryPoints = glob.sync(
  path.join(__dirname, './src/css/index.scss')
);
mainEntryPoints.push('./src/FixedDataTableRoot.js');

if (process.env.COMPRESS) {
  plugins.push(
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        warnings: false
      },
      output: {comments: false}
    })
  );
  entry['fixed-data-table-base.min'] = baseEntryPoints;
  entry['fixed-data-table-style.min'] = styleEntryPoints;
  entry['fixed-data-table.min'] = mainEntryPoints;
} else {
  entry['fixed-data-table-base'] = baseEntryPoints;
  entry['fixed-data-table-style'] = styleEntryPoints;
  entry['fixed-data-table'] = mainEntryPoints;
}

plugins.push(
  new webpack.BannerPlugin({ banner, raw: true })
);

module.exports = {
  resolve: {
    plugins: [resolvers.resolveHasteDefines]
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },
      {
        test: /\.scss$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [{
            loader: 'css-loader'
          }, {
            loader: 'postcss-loader'
          }, {
            loader: 'sass-loader'
          }],
        })
      },
    ],
  },

  entry: entry,

  output: {
    library: 'FixedDataTable',
    libraryTarget: 'umd',
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },

  externals: {
    react: {
      root: 'React',
      commonjs: 'react',
      commonjs2: 'react',
      amd: 'react',
    },
    'react-dom': {
      root: 'ReactDOM',
      commonjs: 'react-dom',
      commonjs2: 'react-dom',
      amd: 'react-dom',
    },
    classnames: {
      root: 'classnames',
      commonjs: 'classnames',
      commonjs2: 'classnames',
      amd: 'classnames',
    },
  },

  node: {
    Buffer: false
  },

  plugins: plugins
};
