module.exports = {
   entry: "./js/cluster/NodesContainer.js",
    devtool: 'source-map',
   output: {
       path: __dirname + "/build",
       filename: "bundle.js",
       library: 'clusters'
   }
};