var path = require('path');
var webpack = require('webpack');
var resolvers = require('../build_helpers/resolvers');

var isDev = process.env.NODE_ENV !== 'production';

module.exports = {
  entry: path.join(__dirname, 'renderPath.js'),

  output: {
    path: path.resolve(__dirname, '../__site_prerender__/'),
    filename: 'renderPath.js',
    libraryTarget: 'commonjs2',
  },

  target: 'node',

  module: {
    loaders: [
      {
        test: /\.md$/,
        loader: [
          'html-loader?{"minimize":false}',
          path.join(__dirname, '../build_helpers/markdownLoader')
        ].join('!')
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      },
      {
        test: /\.css$/,
        loader: 'null-loader'
      },
      {
        test: /\.scss$/,
        loader: 'null-loader'
      },
      {
        test: /\.less$/,
        loader: 'null-loader'
      },
      {
        test: /\.png$/,
        loader: 'file-loader',
        query: { mimetype: 'image/png', name: 'images/[name]-[hash].[ext]' }
      }
    ]
  },

  resolve: {
    alias: {
      'frontend-datatable/css': path.join(__dirname, '../src/css'),
      'frontend-datatable': path.join(__dirname, '../src/FixedDataTableRoot')
    },
    plugins: [resolvers.resolveHasteDefines]
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      '__DEV__': JSON.stringify(isDev || true)
    })
  ]
};

if (process.env.NODE_ENV === 'production') {
  module.exports.plugins.push(
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        warnings: false
      }
    })
  );
}
