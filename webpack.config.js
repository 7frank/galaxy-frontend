module.exports = {
   entry: "./js/cluster/NodesContainer.js",
   output: {
       path: __dirname + "/build",
       filename: "bundle.js",
       library: 'clusters'
   }
};