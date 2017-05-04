'use strict'
const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
let config = {
    devtool: '#eval-source-map',
    entry: [path.join(__dirname, './app.js'), 'webpack-hot-middleware/client'],
    module: {
        rules: [{
                test: /\.css$/,
                loader: 'css-loader!style-loader'
            },
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/
            },
            {
                test: /\.json$/,
                loader: 'json-loader'
            },
            {
                test: /\.vue$/,
                loader: 'vue-loader',
                options: {
                    autoprefixer: {
                        browsers: ['last 2 Chrome versions']
                    },
                    loaders: {
                        sass: 'vue-style-loader!css-loader!sass-loader?indentedSyntax=1',
                        scss: 'vue-style-loader!css-loader!sass-loader'
                    }
                }
            },
            {
                test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
                loader: 'url-loader',
                query: {
                    limit: 10000,
                    name: 'imgs/[name].[hash:7].[ext]'
                }
            },
            {
                test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
                loader: 'url-loader',
                query: {
                    limit: 10000,
                    name: 'fonts/[name].[hash:7].[ext]'
                }
            }
        ]
    },
    plugins: [
        // new webpack.ProvidePlugin({
        //     $: 'jquery',
        //     jQuery: 'jquery'
        // }),
        new webpack.HotModuleReplacementPlugin(),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            title: 'vue test'
        }),
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.DefinePlugin({
            'process.env.DEV_TARGET': '"${process.env.DEV_TARGET}"'
        }),
        new webpack.NamedModulesPlugin()
    ],
    output: {
        filename: '[name].js',
        publicPath: '/'
    },
    resolve: {
        alias: {},
        extensions: ['.js', '.vue', '.json', '.css'],
        // modules: [
        //     path.join(__dirname, 'node_modules')
        // ]
    },
    target: 'web'
}
module.exports = config
