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




  ---
  What you already have to tune:

  1. setSkipParams(skip, min) — already used for internal edges (30, 40). Increasing skip aggressively thins the
  cross-cluster edges. E.g. setSkipParams(10, 5) shows only 1-in-10 edges with a max of 5 visible. This is the
  cheapest win.
  2. Opacity — currently 1.0. Dropping to 0.1–0.2 with transparent: true makes many overlapping lines readable as
  a density field rather than individual lines. Internal edges use 0.04.
  3. LOD threshold — currently > 0.75 (same as internal). You could raise it to e.g. > 0.9 so they only appear
  when very close. Or fade opacity based on LOD.
  4. depthTest — currently false (debug mode). Setting it true means lines behind geometry disappear, massively
  reducing visual clutter.

  ---
  Best practices for large graphs (what tools like Gephi, Cosmograph, D3-force do):

  5. Show only edges to/from a selected/hovered cluster — the most effective reduction. Most graph tools hide all
  cross-cluster edges by default and only reveal them on hover/selection of a node or cluster.
  6. Show only the N strongest edges — sort by link_strength (already on ClusterEdge) and only draw the top N per
  leaf. Cuts noise dramatically.
  7. Edge bundling — instead of individual node-to-node lines, draw one bundled bezier arc between the two cluster
   centroids, scaled by edge count. This is what the aggregated ClusterBaseEdges already does at the cluster level
   — the cross-cluster node-level edges would just be a finer version of that.
  8. Only draw edges to adjacent clusters (clusters that share a parent) — avoids long "spaghetti" lines crossing
  the whole scene.

  ---
  Recommended approach for your codebase:

  The quickest high-impact changes:
  - setSkipParams(10, 3) — show max ~3–5 representative edges per leaf
  - opacity 0.15, depthTest: true
  - LOD threshold > 0.9 (only at very close zoom)

  The best long-term approach would be option 5: only show cross-cluster edges when the source cluster is 
  selected/hovered, which your codebase already has selection/highlight infrastructure for (_sm,
  showHighlight/hideHighlight on nodes, and the selection manager).

  Would you like to go with the quick tuning approach, the selection-gated approach, or both?