- get frontend running again
- migrate frontend to typescript
- add data source port and adapter so that we can plug bakcnd or simple node lists to it

- maybe decouple force graph as only one alyout algorithm so that we can plug different


- perf test comare to https://github.com/vasturiano/3d-force-graph it has 9k stars and is fast but not as fast as our solution

- maybe we can optimize further, who knows whats possible
- do we have an option where we somly dont render the edges? that woud massivly improve perf


- convert demo app from 
    - jquery
    - querySelector("sample-cluster-application")
    - webapp 
into 
    - standalone js component 
    - annd react example app or svelte demo app
    - with maybe some sharable ui elements like "search bar" or add this to samples


- migrate dependencies especially threejs, this should drastically reduce bundle size    


- better hull with fresnel or rim shader


https://threejs.org/examples/?q=toon#webgl_materials_toon
https://github.com/mrdoob/three.js/blob/master/examples/webgl_materials_toon.html

https://github.com/pmndrs/postprocessing/blob/main/demo/src/demos/OutlineDemo.js


- any comutations that we can do in gpu or webassembly?


remove f2  hotkeys logic we have a hull for tat


- streamable data sources 


 loading weedback when 50 k nodes are for example initiall force graphed
 or when the initla distribution happens where we currently have stutters

/home/frank/Projects/7frank/galaxy/galaxy-frontend/js/cluster/refactor this is really old code lets se what we can do with it, where things are no longer necessary, what we do to refactor it into our new structure

still some js files other than refactor

- second example has a "center" function we shoud add this to graph and have siome ui element for centering the graph too

  js/cluster/refactor/SpecificDataUtils.ts coupling specific use case? is this part of the core cluster and what tod do that the clsuter is more general usable