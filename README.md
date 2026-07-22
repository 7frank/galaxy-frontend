# galaxy-webcomponent

A WebGL/THREE.js web component that renders large graphs of nodes and edges in 3D using force-directed layout. Built with webpack 2, d3-force-3d, and Apollo Client for GraphQL data loading.

The component (`<sample-cluster-application>`) is a native custom element and can be embedded in any HTML page.

## Prerequisites

- Node.js v22+
- npm
- A web server capable of serving static files (e.g. PHP built-in server, nginx, Apache)

## Installing

```bash
npm install --legacy-peer-deps
```

> `--legacy-peer-deps` is required due to older dependency versions that predate npm's strict peer resolution.

## Building

```bash
npm run build
```

Outputs to `./build/`:
- `bundle.js` — application code
- `node-modules-bundle.js` — vendored dependencies

## Running

```bash
npm start
# opens http://localhost:8080/index.html
```

## Data Sources

Configured in `js/data/data-set-loader.js`. Two modes are supported:

- **GraphQL** via Apollo Client — connects to `http://localhost:8088/graphql` by default (see `galaxy-backend`)
- **Local CSV / JSON files** — parsed directly in the browser via PapaParse / qwest

## Project Structure

```
js/
  cluster/          # Core graph components (nodes, edges, clusters, layout)
    configs/        # 2D/3D graph configuration presets
    distributions/  # Node distribution/layout strategies
    edges/          # Edge rendering
    elements/       # Individual node/cluster element rendering
    hull/           # Convex hull rendering for node groups
    particles/      # Particle effects
    text/           # Text label rendering
    utils/          # Internal helpers
  data/             # Data source adapters (Apollo/GraphQL, CSV, JSON)
  gui/              # UI controls (search bar, mode select, HUD)
  lib/              # Three.js geometry utilities (ConvexGeometry, QuickHull)
  utils/            # General utilities
  view/             # GraphView3D — top-level 3D scene and camera management
```

## Built With

- [THREE.js](https://threejs.org/) — WebGL rendering
- [d3-force-3d](https://github.com/vasturiano/d3-force-3d) — 3D force simulation
- [Apollo Client](https://www.apollographql.com/docs/react/) — GraphQL data fetching
- [webpack 2](https://v2.webpack.js.org/) — bundling

## License

Proprietary — all rights reserved. See `LICENSE.md`.
