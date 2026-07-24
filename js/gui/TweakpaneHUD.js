import { Pane } from "tweakpane";

import Extended2DGraphConfig from "../cluster/configs/Extendend2DGraphConfig";
import Default3DGraphConfig from "../cluster/configs/Default3DGraphConfig";
import Default2DGraphConfig from "../cluster/configs/Default2DGraphConfig";

import NoneHullEffect from "../cluster/hull/effects/NoneHullEffect";
import BasicHullEffect from "../cluster/hull/effects/BasicHullEffect";
import BoxHullEffect from "../cluster/hull/effects/BoxHullEffect";
import OutlineHullEffect, { OutlineComposer } from "../cluster/hull/effects/OutlineHullEffect";
import ConvexVolume from "../cluster/hull/ConvexVolume";

import CsvDatasource from "../data/CsvDatasource";
import GeneratorDatasource from "../data/GeneratorDatasource";

import ForceLayoutEngine from "../cluster/distributions/engines/ForceLayoutEngine";
import SphericalLayoutEngine from "../cluster/distributions/engines/SphericalLayoutEngine";
import DagreLayoutEngine from "../cluster/distributions/engines/DagreLayoutEngine";

const MODES = {
    "3D":  () => new Default3DGraphConfig(),
    "2D":  () => new Default2DGraphConfig(),
    "2D+": () => new Extended2DGraphConfig(),
};

const BORDERS = {
    "None":    { makeEffect: () => new NoneHullEffect(),                  makeComposer: () => null },
    "Outline": { makeEffect: (mode, c) => new OutlineHullEffect(mode, c), makeComposer: (v) => { const c = new OutlineComposer(); c.init(v.mRenderer, v.mScene, v.mCamera); return c; } },
    "Basic":   { makeEffect: () => new BasicHullEffect(),                 makeComposer: () => null },
    "Box":     { makeEffect: () => new BoxHullEffect(),                   makeComposer: () => null },
};

const SOURCES = {
    "CSV": () => new CsvDatasource("assets/realDataNodesv5_ticker.csv", "assets/realDataLinksv5.csv"),
    "1k":  () => new GeneratorDatasource({ nodeCount: 1000,  edgeCount: 2000 }),
    "5k":  () => new GeneratorDatasource({ nodeCount: 5000,  edgeCount: 10000 }),
    "10k": () => new GeneratorDatasource({ nodeCount: 10000, edgeCount: 20000 }),
    "20k": () => new GeneratorDatasource({ nodeCount: 20000, edgeCount: 40000 }),
    "50k": () => new GeneratorDatasource({ nodeCount: 50000, edgeCount: 100000 }),
};

const LAYOUTS = {
    "3D":       new ForceLayoutEngine(3),
    "Plane":    new ForceLayoutEngine(2),
    "Spherical":new SphericalLayoutEngine(),
    "Dagre LR": new DagreLayoutEngine("LR"),
    "Dagre TB": new DagreLayoutEngine("TB"),
};

function getView() {
    const app = document.querySelector("sample-cluster-application");
    return app && app.getCurrentView();
}

function initStatsPane(container) {
    const stats = new Pane({ title: "Stats", expanded: true, container });

    const data = { fps: 0, clusters: 0, nodes: 0, relations: 0 };

    stats.addBinding(data, "fps",       { label: "FPS",       readonly: true, view: "graph", series: 0, min: 0, max: 144 });
    stats.addBinding(data, "clusters",  { label: "Clusters",  readonly: true });
    stats.addBinding(data, "nodes",     { label: "Nodes",     readonly: true });
    stats.addBinding(data, "relations", { label: "Relations", readonly: true });

    setInterval(() => {
        const view = getView();
        if (!view) return;

 
        data.fps = view.mActualFPS || 0;

        const root = view.mRootCluster;
        if (root) {
            const leafs = root.getLeafs();
            data.clusters = root.findClusters("*").length;
            data.nodes = leafs.reduce((sum, l) => sum + (l.mNodes ? l.mNodes.length : 0), 0);
            data.relations = leafs.reduce((sum, l) => sum + (l.mNodes ? l.mNodes.reduce((s, n) => s + (n.edges ? n.edges.length : 0), 0) : 0), 0);
        }

        stats.refresh();
    }, 1000);

    return stats;
}

export function initTweakpane() {
    const pane = new Pane({ title: "Controls", expanded: true });
    pane.element.parentElement.style.zIndex = "100";

    const state = {
        mode:   "3D",
        border: "Outline",
        source: "CSV",
        layout: "3D",
    };

    let prevMode = "3D";

    pane.addBinding(state, "mode", { label: "Graph", options: Object.fromEntries(Object.keys(MODES).map(k => [k, k])) })
        .on("change", ({ value }) => {
            if (value === prevMode) return;
            const app = document.querySelector("sample-cluster-application");
            const view = app && app.getCurrentView();
            if (!view) return;
            MODES[value]().setView(view).setMode(() => { prevMode = value; });
        });

    pane.addBinding(state, "border", { label: "Border", options: Object.fromEntries(Object.keys(BORDERS).map(k => [k, k])) })
        .on("change", ({ value }) => {
            const view = getView();
            if (!view || !view.mRootCluster) return;
            const entry = BORDERS[value];

            if (view.mBorderEffect) { view.mBorderEffect.dispose(); view.mBorderEffect = null; }
            const composer = entry.makeComposer(view);

            view.mRootCluster.findClusters("*").forEach(cluster => {
                if (!cluster.mHull || !(cluster.mHull instanceof ConvexVolume) || !cluster.mHull.mesh) return;
                if (cluster._hullEffect) cluster._hullEffect.onDetach(cluster.mHull.mesh);
                const mode = cluster._hullMode || (cluster._hullEffect && cluster._hullEffect.mMode) || "hover";
                if (!cluster._hullMode) cluster._hullMode = mode;
                const effect = entry.makeEffect(mode, composer);
                cluster._hullEffect = effect;
                effect.onAttach(cluster.mHull.mesh);
            });

            if (composer) view.setBorderEffect(composer);
        });

    pane.addBinding(state, "source", { label: "Data", options: Object.fromEntries(Object.keys(SOURCES).map(k => [k, k])) })
        .on("change", ({ value }) => {
            const view = getView();
            if (!view) return;
            view.loadDatasource(SOURCES[value]());
        });

    pane.addBinding(state, "layout", { label: "Layout", options: Object.fromEntries(Object.keys(LAYOUTS).map(k => [k, k])) })
        .on("change", ({ value }) => {
            const view = getView();
            if (!view || !view._currentDatasource) return;
            const engine = LAYOUTS[value];
            const speccs = view.getSpeccs();
            if (!speccs) return;
            speccs.forEach((spec, i) => {
                const scale = spec.distribution ? spec.distribution.mScale : null;
                if (scale !== null) spec.distribution = engine.forLevel(i, scale);
            });
            view.loadDatasource(view._currentDatasource);
        });

    const spacer = document.createElement("div");
    spacer.style.height = "1em";
    pane.element.parentElement.appendChild(spacer);
    initStatsPane(pane.element.parentElement);

    return pane;
}
