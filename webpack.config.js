const dotenv = require('dotenv')

dotenv.load()

const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const plugins = []

if (process.env.NODE_ENV === 'production') {
  plugins.push(new UglifyJSPlugin())
}

module.exports = {
  entry: './client/index.js',
  output: {
    filename: './public/js/bundle.js'
  },
  plugins
}
