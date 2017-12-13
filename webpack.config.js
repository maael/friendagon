const dotenv = require('dotenv')

dotenv.load()

const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const PreloadWebpackPlugin = require('preload-webpack-plugin')
const extraPlugins = []

if (process.env.NODE_ENV === 'production') {
  extraPlugins.push(new UglifyJSPlugin())
}

module.exports = {
  entry: './client/index.js',
  output: {
    path: __dirname,
    filename: 'public/js/bundle.js',
    publicPath: '/'
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Friendagon',
      filename: './server/views/room.html',
      template: './server/views/room-tmp.html'
    }),
    new PreloadWebpackPlugin()
  ].concat(extraPlugins)
}
