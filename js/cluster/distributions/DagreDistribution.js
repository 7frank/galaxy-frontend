import dagre from "dagre";
import BaseDistribution from "./BaseDistribution";
import BaseCluster3D from "../BaseCluster3D";
import { TWEEN } from "../../lib/Tween";
import * as _ from "lodash";

export default class DagreDistribution extends BaseDistribution {

    constructor(scale = 50, rankdir = "LR") {
        super(scale, 2);
        this.rankdir = rankdir;
    }

    setNodes(nodes, onNodePositionChange, onStep, onComplete) {
        let mNodes = [];
        let mEdges = [];

        if (nodes instanceof BaseCluster3D) {
            mNodes = Object.values(nodes.mClusters).map(n => {
                n.position._el = n;
                return n.position;
            });
            const rawEdges = nodes.createEdgesForChildClusters();
            rawEdges.forEach(e => {
                mEdges.push({ source: e.source.position, target: e.target.position });
            });
        } else if (_.isArray(nodes)) {
            mNodes = nodes.map(n => {
                mEdges = mEdges.concat(n.edges || []);
                return n;
            });
        }

        const g = new dagre.graphlib.Graph();
        g.setGraph({ rankdir: this.rankdir, ranksep: this.mScale * 0.12, nodesep: this.mScale * 0.12, marginx: this.mScale * 0.05, marginy: this.mScale * 0.05 });
        g.setDefaultEdgeLabel(() => ({}));

        const nodeSize = this.mScale * 0.1;
        mNodes.forEach((n, i) => {
            g.setNode(String(i), { width: nodeSize, height: nodeSize, _n: n });
        });

        mEdges.forEach(e => {
            const si = mNodes.indexOf(e.source);
            const ti = mNodes.indexOf(e.target);
            if (si !== -1 && ti !== -1) g.setEdge(String(si), String(ti));
        });

        dagre.layout(g);

        const nodeIds = g.nodes();
        let cx = 0, cy = 0;
        nodeIds.forEach(id => { const nd = g.node(id); cx += nd.x; cy += nd.y; });
        cx /= nodeIds.length || 1;
        cy /= nodeIds.length || 1;

        this.stop();
        const tweens = this.mTweens = [];
        const count = nodeIds.length;
        let finished = false;

        nodeIds.forEach((id, idx) => {
            const nd = g.node(id);
            const n = nd._n;
            const target = { x: nd.x - cx, y: nd.y - cy, z: 0 };
            const origPos = (n.position) ? n.position : n;

            const tween = new TWEEN.Tween(origPos)
                .easing(TWEEN.Easing.Quadratic.InOut)
                .to(target, this.mDuration)
                .onUpdate(() => {
                    onNodePositionChange(origPos, idx);
                    if (idx === count - 1 && onStep) onStep(0);
                })
                .onComplete(() => {
                    if (!finished) {
                        finished = true;
                        this.stop();
                        if (onComplete) onComplete();
                        cancelAnimationFrame(rafId);
                    }
                })
                .start();

            tweens.push(tween);
        });

        let rafId;
        const animate = (time) => {
            tweens.forEach(t => t.update(time));
            if (!finished) rafId = requestAnimationFrame(animate);
        };
        rafId = requestAnimationFrame(animate);
    }
}
