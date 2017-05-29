module.exports = {
   entry: "./js/NodesContainer.js",
   output: {
       path: __dirname + "/build",
       filename: "bundle.js",
       library: 'clusters'
   }
};