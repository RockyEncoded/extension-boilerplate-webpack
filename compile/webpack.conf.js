const fs = require('fs')
const path = require('path')
const webpack = require('webpack')
const packageJson = require('../package.json')

const CopyWebpackPlugin = require('copy-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const GenerateJsonPlugin = require('generate-json-webpack-plugin')
// const WriteFilePlugin = require('write-file-webpack-plugin')
const LiveReloadPlugin = require('webpack-livereload-plugin')
const ZipPlugin = require('zip-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const ESLintPlugin = require('eslint-webpack-plugin')

const production = process.env.NODE_ENV === 'production'
const target = process.env.TARGET || 'chrome'
const environment = process.env.NODE_ENV || 'development'

const generic = JSON.parse(fs.readFileSync(`./config/${environment}.json`))
const specific = JSON.parse(fs.readFileSync(`./config/${target}.json`))
const context = Object.assign({}, generic, specific)

const manifestTemplate = JSON.parse(fs.readFileSync('./manifest.json'))
const manifestOptions = {
  firefox: {
    applications: {
      gecko: {
        id: 'my-app-id@mozilla.org'
      }
    }
  }
}
const manifest = Object.assign(
  {},
  manifestTemplate,
  target === 'firefox' ? manifestOptions.firefox : {},
  {
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description
  }
)

function resolve (dir) {
  return path.join(__dirname, '..', dir)
}

function replaceQuery (query) {
  return `/* @echo ${query} */`
}

function copy (context, from, to) {
  return { context, from, to, noErrorOnMissing: true }
}

const webpackConfig = {
  mode: (environment === 'development' ? 'development' : 'production'),
  entry: {
    background: './src/scripts/background.js',
    contentscript: './src/scripts/contentscript.js',
    options: ['./src/scripts/options.js', './src/styles/options.scss'],
    popup: ['./src/scripts/popup.js', './src/styles/popup.scss']
  },
  output: {
    path: resolve(`build/${target}`),
    filename: 'scripts/[name].js'
  },
  resolve: {
    extensions: ['.js', '.json', '.sass', '.scss'],
    modules: [
      resolve('src'),
      resolve('node_modules')
    ],
    alias: {
      src: resolve('src'),
      actions: resolve('src/scripts/actions'),
      components: resolve('src/scripts/components'),
      services: resolve('src/scripts/services')
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.js$/,
        loader: 'string-replace-loader',
        options: {
          multiple: Object.keys(context).map(function (key) {
            return {
              search: replaceQuery(key),
              replace: context[key]
            }
          })
        }
      },
      {
        test: /\.(sa|s?c)ss$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader']
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        copy('./src/icons', '**/*', 'icons'),
        copy('./src/_locales', '**/*', '_locales'),
        copy('./src/images', '**/*', 'images'),
        copy('./src/images/shared', '**/*', 'images'),
        copy('./src', '**/*.html', '.')
      ]
    }),
    new GenerateJsonPlugin('manifest.json', manifest),
    new MiniCssExtractPlugin({ filename: 'styles/[name].css' }),
    new webpack.DefinePlugin({
      'process.env': require(`../env/${environment}.env`)
    })
  ]
}

if (production) {
  const zipFile = `${packageJson.name}-v${packageJson.version}-${target}.zip`
  webpackConfig.output.path = resolve(`dist/${target}`)
  webpackConfig.plugins = webpackConfig.plugins.concat([
    new ESLintPlugin(),
    new TerserPlugin({
      extractComments: false,
      terserOptions: {
        format: {
          comments: false
        },
        compress: {
          pure_funcs: ['console.info', 'console.debug', 'console.warn', 'console.log']
        },
        keep_classnames: true,
        mangle: true,
        module: true
      }
    }),
    new ZipPlugin({ filename: zipFile })
  ])
} else {
  webpackConfig.entry.background = [
    './src/scripts/livereload.js',
    './src/scripts/background.js'
  ]
  webpackConfig.plugins = webpackConfig.plugins.concat([
    // new WriteFilePlugin(),
    new LiveReloadPlugin({ port: 35729 })
  ])
}

module.exports = webpackConfig
