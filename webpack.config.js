const path = require('path');
const Dotenv = require('dotenv-webpack');

module.exports = {
  mode: 'development', // change to 'production' for production builds
  entry: {
    background: path.resolve(__dirname, 'background.js'),
    content: path.resolve(__dirname, 'content.js')
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js'
  },
  plugins: [
    new Dotenv()
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
};