var webpack = require('webpack');
var path = require('path');

var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
var HardSourceWebpackPlugin =require("hard-source-webpack-plugin")

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

           /*
           //this plugin should improve build performance by caching but does instead prolong build times for our configuration..
           //Note: does not work with CommonsChunkPlugin
            new HardSourceWebpackPlugin({
            cacheDirectory: path.join(__dirname, 'node_modules/.cache/hardsource/[confighash]'),
            recordsPath: path.join(__dirname, 'node_modules/.cache/hardsource/[confighash]/records.json'),
            configHash: function(webpackConfig) {
                return require('node-object-hash')().hash(webpackConfig);
            },
            environmentHash: {
                root: process.cwd(),
                directories: ['node_modules'],
                files: ['package.json'],
            }
        }),
        */

        /*
        new webpack.ProvidePlugin({

            "$":"jquery",
            "jQuery":"jquery",
           "$$":"jquery-ui"
        }),
        */

        //new BundleAnalyzerPlugin({    analyzerMode: 'static'    }),


        new webpack.optimize.CommonsChunkPlugin({
            name: 'node-modules-bundle',
            filename: 'node-modules-bundle.js',
            minChunks(module, count) {
                var context = module.context;
                return context && context.indexOf('node_modules') >= 0;
            }
        })

        /*,
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


