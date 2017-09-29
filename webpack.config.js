var webpack = require('webpack');

module.exports = {
    entry: "./js/cluster/SampleClusterApplication.js",
    devtool: 'source-map',
    output: {
        path: __dirname + "/build",
        publicPath: "/galaxy-webcomponent/build/",
        filename: "bundle.js",
        library: 'clusters'
    },
    plugins: [
        new webpack.ProvidePlugin({
            _: "lodash",
            //"d3_force":"d3-force-3d",
            //"Mousetrap":"mousetrap",
            "THREE":"three",
            "$":"jquery",
            "jQuery":"jquery",
            "$$":"jquery-ui"
        })/*,
        new webpack.optimize.UglifyJsPlugin({
           // include: /\.min\.js$/,
            minimize: true
        })*/
    ],
    module: {
        rules: [
            {
                test: /\.(png|jpg|gif|json)$/,
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
            },
            {
                test: /\.(html)$/,
                use: {
                    loader: 'html-loader',
                    options: {
                        attrs: [':data-src']
                    }
                }
            }

        ]
    }
};


