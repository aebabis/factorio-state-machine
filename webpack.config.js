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
        new HtmlWebpackPlugin({ title: 'Factorio State Machine' }),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
    ],
    module: {
        rules: [{
            test: /\.js$/,
            loader: 'babel-loader',
            include: [path.resolve(__dirname, 'src')],
            query: {
                presets: ['es2015']
            }
        }],
    },

    resolve: {
        extensions: ['.js', '.css'],
        modules: ['node_modules'],
    }
};