import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { URL } from 'url'; // in Browser, the URL in native accessible on window

const __dirname = new URL('.', import.meta.url).pathname;

export default {
    entry: [
        './src/index.js',
    ],
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'bundle.js'
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: 'Factorio State Machine',
            template: './src/index.html',
            favicon: './src/favicon.ico'
        }),
        // new webpack.HotModuleReplacementPlugin(),
        // new webpack.NoEmitOnErrorsPlugin(),
    ],
    module: {
        rules: [
            { test: /\.css$/, use: ['style-loader', 'css-loader'] },
            { test: /\.ne$/,  use: 'nearley-loader' },
            { test: /\.(png|jpg|ico)$/, use: 'url-loader' }
        ],
    },

    resolve: {
        extensions: ['.js', '.css'],
        modules: ['node_modules'],
    }
};