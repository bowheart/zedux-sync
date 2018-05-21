const { resolve } = require('path')


module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    contentBase: resolve('public')
  },
  entry: {
    'nested-iframes-parent': resolve('nested-iframes/parent/index.js'),
    'nested-iframes-child': resolve('nested-iframes/child/index.js'),
    'nested-iframes-grandchild': resolve('nested-iframes/grandchild/index.js')
  },
  externals: {
    rxjs: 'Rx'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [{
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/env',
              '@babel/react',
              [ '@babel/stage-2', { decoratorsLegacy: true } ]
            ]
          }
        }]
      }
    ]
  },
  output: {
    path: resolve('dist'),
    filename: '[name].js',
    publicPath: '/'
  }
}
