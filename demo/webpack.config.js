const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: './index.js',
    output: {
      filename: 'bundle.js',
    },
    module: {
        rules: [
            { test: /\.(js)$/, use: 'babel-loader' },
            {
                test: /\.scss$/,
                use: [{
                    loader: "style-loader"
                }, {
                    loader: "css-loader"
                }, {
                    loader: "sass-loader"
                },
                {
                    loader: "../index.js"
                }]
            },
            {
                test: /\.less$/,
                use: [{
                    loader: "style-loader"
                }, {
                    loader: "css-loader"
                }, {
                    loader: "less-loader"
                },
                {
                    loader: "../index.js"
                }]
            }
        ]
    },
    devServer: {
        inline: true,
        hot: true,
        port: 8030
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin()
    ]
}
