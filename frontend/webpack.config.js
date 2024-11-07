const path = require('path');
const autoprefixer = require('autoprefixer');

module.exports = {
    target: "web",
    entry: {
        entry: './entry.js',
    },
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
    devServer: {
        static: [
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
        port: 9000,
    },
    optimization: {
        minimize: false,
    }
}
