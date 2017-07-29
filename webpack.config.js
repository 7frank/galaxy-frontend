var webpack = require('webpack');

module.exports = {
    entry: "./js/cluster/SampleClusterApplication.js",
    devtool: 'source-map',
    output: {
        path: __dirname + "/build",
        publicPath: "/test_app/build/",
        filename: "bundle.js",
        library: 'clusters'
    },
    plugins: [
        /*    new webpack.ProvidePlugin({
         THREE: "three"
         })*/
    ],
    module: {
        rules: [
            {
                test: /\.(png|jpg|gif)$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 8192
                        }
                    }
                ]
            }
        ]
    }
};


