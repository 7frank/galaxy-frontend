/**
 * Created by Frank on 02.06.2017.
 */

import BaseDistribution, { NodePositionChangeCallback, StepCallback, EndCallback, DistributeResult, DistributionNode } from "./BaseDistribution"
import BaseCluster3D from "../BaseCluster3D"
import AnimationFrameBasedScheduler from "../utils/AnimationFrameBasedScheduler"
import { Vector3 } from "three/src/math/Vector3.js";
import * as _ from "lodash";
import * as d3_force from "d3-force-3d";
import type { ClusterEdge } from "../EdgeUtil";

interface D3SimNode extends Record<string, unknown> {
    x: number; y: number; z: number
    _el?: BaseCluster3D
    _id?: string
    edges?: ClusterEdge[]
}

interface D3SimEdge {
    source: D3SimNode | { x: number; y: number; z: number }
    target: D3SimNode | { x: number; y: number; z: number }
    link_strength?: number
}

interface D3Simulation {
    numDimensions(n: number): D3Simulation
    alphaDecay(n: number): D3Simulation
    velocityDecay(n: number): D3Simulation
    nodes(n: D3SimNode[]): D3Simulation
    force(name: string, f?: unknown): D3Simulation
    stop(): D3Simulation
    tick(): D3Simulation
    on(event: string, fn: () => void): D3Simulation
    alpha(n?: number): number
}

export default class ForceGraphDistribution extends BaseDistribution {

    initialEngineTicks: number
    maxConvergeTime: number
    maxConvergeFrames: number

    static _queue: AnimationFrameBasedScheduler | undefined

    constructor(scale: number = 50, dimensions: number = 1) {
        super(scale, dimensions);
        this.initialEngineTicks = 200;
        this.maxConvergeTime = 9000;
        this.maxConvergeFrames = 700;
    }

    queue(): AnimationFrameBasedScheduler {
        if (!ForceGraphDistribution._queue) ForceGraphDistribution._queue = new AnimationFrameBasedScheduler();
        return ForceGraphDistribution._queue;
    }

    startSimulation(
        nodes: D3SimNode[],
        edges: D3SimEdge[] = [],
        onTick: (layout: D3Simulation, nodes: D3SimNode[], edges: D3SimEdge[]) => void,
        onComplete: EndCallback
    ): void {
        const that = this;
        const d3 = d3_force as unknown as Record<string, (...args: unknown[]) => unknown>;
        const layout: D3Simulation = d3.forceSimulation() as unknown as D3Simulation;
        const scale = this.mScale;

        layout
            .numDimensions(this.dimensions)
            .alphaDecay(0.05)
            .velocityDecay(0.6)
            .nodes(nodes)
            .force('link', (d3.forceLink() as unknown as { id: (fn: (d: D3SimNode) => string | undefined) => unknown; distance: (fn: () => number) => unknown; links: (e: D3SimEdge[]) => unknown }).id((d: D3SimNode) => d._id)
                .distance(() => scale / 5)
                .links(edges)
            )
            .force('charge', () => -scale / 5)
            .force('linkStrength', () => 1)
            .stop();

        if (nodes.length > 0 && nodes[0]._el && nodes[0]._el instanceof BaseCluster3D) {
            const is2D = this.dimensions < 3;
            const collideRadius = is2D ? scale * 1.2 : scale / 2;
            const collideIterations = is2D ? 8 : 2;
            layout.force("collide", d3.forceCollide(collideRadius, collideIterations));
            if (is2D) {
                layout
                    .force("forceX", d3.forceX(0))
                    .force("forceY", d3.forceY(0));
            }
        }

        for (let i = 0; i < this.initialEngineTicks; i++) {
            layout.tick();
        }

        let cntTicks = 0;
        const startTickTime = Date.now();
        const alphaAbort = 0.01;

        this.queue().add(function onQueue() {
            if (cntTicks++ > that.maxConvergeFrames || Date.now() - startTickTime > that.maxConvergeTime || layout.alpha() < alphaAbort) {
                layout.alpha(0);
                layout.stop();
            }

            layout.tick();
            onTick(layout, nodes, edges);
            if (layout.alpha() == 0) {
                that.queue().remove(onQueue);
                if (onComplete) onComplete();
            }
        });

        layout.on('end', function () {
            if (onComplete) onComplete();
        });
    }

    setNodes(
        nodes: DistributionNode[] | InstanceType<typeof BaseCluster3D>,
        onNodePositionChange: NodePositionChangeCallback,
        onStep: StepCallback,
        onComplete: EndCallback
    ): void {
        if (!(nodes instanceof BaseCluster3D) && !_.isArray(nodes))
            throw new Error("not supported, must be array of nodes or BaseCluster3D");

        let mEdges: D3SimEdge[] = [];
        let mNodes: D3SimNode[];

        if (nodes instanceof BaseCluster3D) {
            mEdges = nodes.createEdgesForChildClusters();
            mEdges.forEach(function (edge: D3SimEdge) {
                edge.source = (edge.source as { position: { x: number; y: number; z: number } }).position;
                edge.target = (edge.target as { position: { x: number; y: number; z: number } }).position;
            });
            mNodes = Object.values(nodes.mClusters).map(function (n: BaseCluster3D) {
                const pos = n.position as unknown as D3SimNode;
                pos._el = n;
                return pos;
            });
        } else {
            mNodes = (nodes as D3SimNode[]).map(function (n: D3SimNode) {
                mEdges = mEdges.concat((n.edges ?? []) as D3SimEdge[]);
                n.x = n.x || 0;
                n.y = n.y || 0;
                n.z = n.z || 0;
                return n;
            });
        }

        const that = this;
        _.each(mNodes, function (n: D3SimNode) {
            if (that.dimensions < 3) n.z = 0;
            if (that.dimensions < 2) n.y = 0;
        });

        this.startSimulation(mNodes, mEdges, function layoutTick(layout, d3Nodes) {
            _.each(d3Nodes, onNodePositionChange as (pos: D3SimNode) => void);
            if (onStep) onStep(layout.alpha());
        }, onComplete);
    }

    distribute(_node: DistributionNode, _dx: number, _dy: number, _dz: number): DistributeResult {
        return { position: new Vector3(0, 0, 0) };
    }
}
