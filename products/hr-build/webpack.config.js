//
// Copyright © 2020 Anticrm Platform Contributors.
//
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
//

const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CompressionPlugin = require('compression-webpack-plugin')

const mode = process.env.NODE_ENV || 'development'
const NO_SVELTE = process.env.NO_SVELTE ?? false
const prod = mode === 'production'

module.exports = {
  entry: {
    bundle: [
      '@anticrm/theme/styles/global.scss',
      './src/main.ts'
    ]
  },
  resolve: {
    symlinks: true,
    alias: {
      svelte: path.resolve('./node_modules', 'svelte')
    },
    extensions: ['.mjs', '.js', '.svelte', '.ts'],
    mainFields: (prod || NO_SVELTE) ? ['browser', 'module', 'main'] : ['svelte', 'browser', 'module', 'main']
  },
  output: {
    path: path.join(__dirname, 'dist/web'),
    filename: '[name].js',
    chunkFilename: '[name].[id].js',
    publicPath: '/'
  },
  optimization: {
    minimize: prod,
    usedExports: prod,
    splitChunks: {
      chunks: 'all',
      maxAsyncRequests: 5,
      maxInitialRequests: 3,
      cacheGroups: {
        vendors: {
          name: 'vendors',
          test: /[\\/]node_modules[\\/]/,
          priority: 20
        }
      }
    }
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.svelte$/,
        exclude: /node_modules[\/cd \\].*\.svelte/,
        use: {
          loader: 'svelte-loader',
          options: {
            emitCss: true,
            minimize: prod,
            preprocess: require('svelte-preprocess')()
          }
        }
      },
      {
        test: /node_modules[\/\\].*\.svelte/,
        use: {
          loader: 'svelte-loader',
          options: {
            emitCss: false,
            preprocess: require('svelte-preprocess')()
          }
        }
      },
      {
        test: /\.css$/,
        use: prod
          ? [MiniCssExtractPlugin.loader, 'css-loader']
          : ['style-loader', 'css-loader']
      },

      {
        test: /\.scss$/,
        use: prod
          ? [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader']
          : ['style-loader', 'css-loader', 'sass-loader']
      },

      {
        test: /\.(ttf|otf|eot|woff|woff2)$/,
        use: {
          loader: 'file-loader',
          options: {
            name: 'fonts/[name].[ext]',
            esModule: false
          }
        }
      },
      {
        test: /\.(jpg|png)$/,
        use: {
          loader: 'file-loader',
          options: {
            name: 'img/[name].[ext]',
            esModule: false
          }
        }
      },
      {
        test: /\.svg$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              esModule: false
            }
          },
          {
            loader: 'svgo-loader',
            options: {
              plugins: [
                { name: 'removeHiddenElems', active: false }
                // { removeHiddenElems: { displayNone: false } },
                // { cleanupIDs: false },
                // { removeTitle: true }
              ]
            }
          }
        ]
      }
    ]
  },
  mode,
  plugins: [
    ...(prod ? [new CompressionPlugin(), new MiniCssExtractPlugin()] : []),
    new CopyPlugin({
      patterns: [
        { from: './public', to: '.' },
        { from: './config.env.template', to: '../config' }
      ]
    })
  ],
  devtool: 'eval-source-map',
  devServer: {
    publicPath: '/',
    historyApiFallback: {
      disableDotRule: true
    }
  }
}
