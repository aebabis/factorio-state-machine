const webpack = require('webpack');
const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: [
        './src/index.js',
    ],
    output: {
        path: path.join(__dirname, '/dist'),
        filename: 'bundle.js'
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: 'Factorio State Machine',
            template: path.join(__dirname, 'src', 'index.html'),
            favicon: './src/favicon.ico'
        }),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
    ],
    module: {
        rules: [{
            test: /\.ne$/,
            use: ['nearley-loader']
        }, {
            test: /\.(png|jpg|ico)$/,
            loader: ['url-loader']
        }],
    },

    resolve: {
        extensions: ['.js', '.css'],
        modules: ['node_modules'],
    }
};