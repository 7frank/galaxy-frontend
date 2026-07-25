import dagre from "dagre";
import BaseDistribution, { NodePositionChangeCallback, StepCallback, EndCallback, DistributeResult, DistributionNode } from "./BaseDistribution";
import BaseCluster3D from "../BaseCluster3D";
import { TWEEN } from "../../lib/Tween";
import { Vector3 } from "three/src/math/Vector3.js";
import * as _ from "lodash";
import type { ClusterEdge } from "../EdgeUtil";

interface DagreSimNode extends Record<string, unknown> {
    x: number; y: number; z: number
    position?: DagreSimNode
    edges?: ClusterEdge[]
}

export default class DagreDistribution extends BaseDistribution {

    rankdir: string

    constructor(scale: number = 50, rankdir: string = "LR") {
        super(scale, 2);
        this.rankdir = rankdir;
    }

    setNodes(
        nodes: DistributionNode[] | InstanceType<typeof BaseCluster3D>,
        onNodePositionChange: NodePositionChangeCallback,
        onStep: StepCallback,
        onComplete: EndCallback
    ): void {
        let mNodes: DagreSimNode[] = [];
        let mEdges: Array<{ source: DagreSimNode; target: DagreSimNode }> = [];

        if (nodes instanceof BaseCluster3D) {
            mNodes = Object.values(nodes.mClusters).map((n: BaseCluster3D) => {
                (n.position as DagreSimNode)._el = n;
                return n.position as unknown as DagreSimNode;
            });
            const rawEdges = nodes.createEdgesForChildClusters();
            rawEdges.forEach((e: ClusterEdge) => {
                mEdges.push({ source: (e.source as BaseCluster3D).position as unknown as DagreSimNode, target: (e.target as BaseCluster3D).position as unknown as DagreSimNode });
            });
        } else if (_.isArray(nodes)) {
            mNodes = (nodes as DagreSimNode[]).map((n: DagreSimNode) => {
                mEdges = mEdges.concat((n.edges || []) as Array<{ source: DagreSimNode; target: DagreSimNode }>);
                return n;
            });
        }

        const g = new (dagre as any).graphlib.Graph();
        g.setGraph({
            rankdir: this.rankdir,
            ranksep: this.mScale * 0.12,
            nodesep: this.mScale * 0.12,
            marginx: this.mScale * 0.05,
            marginy: this.mScale * 0.05
        });
        g.setDefaultEdgeLabel(() => ({}));

        const nodeSize = this.mScale * 0.1;
        mNodes.forEach((n: DagreSimNode, i: number) => {
            g.setNode(String(i), { width: nodeSize, height: nodeSize, _n: n });
        });

        mEdges.forEach((e: { source: DagreSimNode; target: DagreSimNode }) => {
            const si = mNodes.indexOf(e.source);
            const ti = mNodes.indexOf(e.target);
            if (si !== -1 && ti !== -1) g.setEdge(String(si), String(ti));
        });

        (dagre as any).layout(g);

        const nodeIds: string[] = g.nodes();
        let cx = 0, cy = 0;
        nodeIds.forEach((id: string) => { const nd = g.node(id); cx += nd.x; cy += nd.y; });
        cx /= nodeIds.length || 1;
        cy /= nodeIds.length || 1;

        this.stop();
        const tweens = this.mTweens = [];
        const count = nodeIds.length;
        let finished = false;
        let rafId: number;

        nodeIds.forEach((id: string, idx: number) => {
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

        const animate = (time: number) => {
            tweens.forEach((t: InstanceType<typeof TWEEN.Tween>) => t.update(time));
            if (!finished) rafId = requestAnimationFrame(animate);
        };
        rafId = requestAnimationFrame(animate);
    }

    distribute(_node: DistributionNode, _dx: number, _dy: number, _dz: number): DistributeResult {
        return { position: new Vector3(0, 0, 0) };
    }
}
