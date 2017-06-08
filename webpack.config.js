var webpack = require('webpack');


module.exports = {
   entry: "./js/cluster/SampleClusterApplication.js",
    devtool: 'source-map',
   output: {
       path: __dirname + "/build",
       filename: "bundle.js",
       library: 'clusters'
   },
    plugins: [
      /*  new webpack.ProvidePlugin({
            'window.jQuery': 'jquery',
            'window.$': 'jquery',
        })*/
    ]
};