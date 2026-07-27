### ...

- publish new minor version and merge with main force clean

### Backlog

#### Architecture

* Get the frontend running again.
* Migrate the frontend to TypeScript.
* Add a data source port and adapter so we can plug in either a backend or simple in-memory Node lists.
* Make the graph layout algorithm pluggable instead of coupling everything to the force graph implementation.
* Support streamable data sources.
* Review `/home/frank/Projects/7frank/galaxy/galaxy-frontend/js/cluster/refactor`, remove obsolete code, and refactor it into the new architecture.
* Remove the remaining JavaScript files outside the `refactor` directory.
* Review `js/cluster/refactor/SpecificDataUtils.ts` for use-case-specific coupling. Make the cluster library more generic and reusable.

#### Performance

* Benchmark performance against `https://github.com/vasturiano/3d-force-graph`. It has ~9k stars and is fast, but currently not as fast as our implementation.
* Investigate further rendering and simulation optimizations.
* Add an option to disable edge rendering to significantly improve performance for large graphs.
* Investigate moving suitable computations to the GPU or WebAssembly.
* Improve loading feedback for large graphs (e.g. 50k nodes), especially during the initial force simulation and distribution where stuttering currently occurs.

#### Demo & Examples

* Convert the demo application from:

  * jQuery
  * `querySelector("sample-cluster-application")`
  * a web app
* Into:

  * a standalone JavaScript component
  * a React example application or a Svelte demo application
  * shared UI components (e.g. a search bar) that can be reused across samples
* Add a graph "Center" function (already available in the second example) and expose it through the API and a UI control.

#### Dependencies

* Upgrade dependencies, especially Three.js, to reduce bundle size.

#### Rendering & Visuals

* Improve hull rendering using a Fresnel or rim shader.
* Investigate toon shading:

  * [https://threejs.org/examples/?q=toon#webgl_materials_toon](https://threejs.org/examples/?q=toon#webgl_materials_toon)
  * [https://github.com/mrdoob/three.js/blob/master/examples/webgl_materials_toon.html](https://github.com/mrdoob/three.js/blob/master/examples/webgl_materials_toon.html)
* Evaluate outline rendering:

  * [https://github.com/pmndrs/postprocessing/blob/main/demo/src/demos/OutlineDemo.js](https://github.com/pmndrs/postprocessing/blob/main/demo/src/demos/OutlineDemo.js)

#### Cleanup

* Remove the F2 hotkey logic. The hull already provides this functionality.
