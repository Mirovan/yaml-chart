const path = require('path');
const autoprefixer = require('autoprefixer');
const HtmlWebpackPlugin = require('html-webpack-plugin');


module.exports = {
    target: "web",
    entry: {
        entry: './src/entry.js',
    },
    stats: 'errors-only',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, './dist')
    },
    module: {
        rules: [
            {
                test: /\.(sass|css|scss)$/,
                use: [
                    {
                        loader: 'style-loader'
                    },
                    {
                        loader: 'css-loader'
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                plugins: [
                                    autoprefixer
                                ]
                            }
                        }
                    },
                    {
                        loader: 'sass-loader'
                    }
                ]
            }
        ]
    },
    plugins: [new HtmlWebpackPlugin({
        inject: false,
        filename: 'index.html',
        template: './index.html',
    })],
    devServer: {
        static: [
            path.join(__dirname, 'test'),
            path.join(__dirname, 'dist'),
            path.join(__dirname, 'images'),
        ],
        client: {
            overlay: {
                errors: true,
                warnings: false,
                runtimeErrors: true,
            },
        },
        compress: true,
        port: 3000,
    },
    optimization: {
        minimize: false,
    }
}
