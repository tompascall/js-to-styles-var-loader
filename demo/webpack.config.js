const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: './index.js',
    output: {
      filename: 'bundle.js',
        //path: path.resolve(__dirname)
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
                    loader: "js-to-sass-var-loader"
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
