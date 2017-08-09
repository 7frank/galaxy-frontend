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
        new webpack.ProvidePlugin({
            _: "lodash",
            "d3_force":"d3-force-3d",
            "Mousetrap":"mousetrap",
            "THREE":"three",
            "$":"jquery",
            "$$":"jquery-ui"
        })
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
            },
            {
                test: /\.css$/,
                use: [ 'style-loader', 'css-loader' ]
            }
        ]
    }
};


