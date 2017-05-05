var path = require('path');
var webpack = require('webpack');
var config = {
    entry: {
        bundle: path.resolve(__dirname, '../src/index.js')
    },
    output: {
        path: path.resolve(__dirname, '../dist'),
        filename: 'index.js'
    },
    module: {
        loaders: [{
            test: /\.js$/,
            loaders: ['babel-loader'],
            exclude: /node_modules/
        }]
    },
    target: 'web',
    devtool: 'source-map',
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: '"production"',
            }
        }),
    ],
    resolve: {
        extensions: ['.js'],
        alias: {
        }
    }
}
module.exports = config;
