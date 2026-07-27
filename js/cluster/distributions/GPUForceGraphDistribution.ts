import { ForceDirectedGraph } from "@jonobr1/force-directed-graph";
import type { NodeData, LinkData } from "@jonobr1/force-directed-graph";
import { Vector3 } from "three/src/math/Vector3.js";
import { WebGLRenderer } from "three/src/renderers/WebGLRenderer.js";
import type { WebGLRenderTarget } from "three";
import * as _ from "lodash";

import BaseDistribution, {
    NodePositionChangeCallback,
    StepCallback,
    EndCallback,
    DistributeResult,
    DistributionNode,
} from "./BaseDistribution";
import BaseCluster3D from "../BaseCluster3D";
import AnimationFrameBasedScheduler from "../utils/AnimationFrameBasedScheduler";
import type { ClusterEdge } from "../EdgeUtil";

export default class GPUForceGraphDistribution extends BaseDistribution {
    initialEngineTicks: number;
    maxConvergeTime: number;
    maxConvergeFrames: number;

    renderer: WebGLRenderer;
    private static _queue: AnimationFrameBasedScheduler | undefined;

    constructor(renderer: WebGLRenderer, scale: number = 50, dimensions: number = 3, initialEngineTicks: number = 0) {
        super(scale, dimensions);
        this.renderer = renderer;
        this.initialEngineTicks = initialEngineTicks;
        this.maxConvergeTime = 9000;
        this.maxConvergeFrames = 700;
    }

    private queue(): AnimationFrameBasedScheduler {
        if (!GPUForceGraphDistribution._queue)
            GPUForceGraphDistribution._queue = new AnimationFrameBasedScheduler();
        return GPUForceGraphDistribution._queue;
    }

    setNodes(
        nodes: DistributionNode[] | InstanceType<typeof BaseCluster3D>,
        onNodePositionChange: NodePositionChangeCallback,
        onStep: StepCallback,
        onComplete: EndCallback
    ): void {
        if (!(nodes instanceof BaseCluster3D) && !_.isArray(nodes))
            throw new Error("not supported, must be array of nodes or BaseCluster3D");

        let rawEdges: ClusterEdge[] = [];
        let nodeList: DistributionNode[];

        if (nodes instanceof BaseCluster3D) {
            rawEdges = nodes.createEdgesForChildClusters() as ClusterEdge[];
            nodeList = Object.values(nodes.mClusters);
        } else {
            nodeList = nodes as DistributionNode[];
            nodeList.forEach((n) => {
                rawEdges = rawEdges.concat(((n as { edges?: ClusterEdge[] }).edges ?? []) as ClusterEdge[]);
            });
        }

        const jitter = () => (Math.random() - 0.5) * this.mScale * 0.1;
        const fdgNodes: NodeData[] = nodeList.map((n, i) => {
            const pos = (n instanceof BaseCluster3D)
                ? n.position as unknown as { x: number; y: number; z: number }
                : n as { x: number; y: number; z: number };
            return {
                id: (n instanceof BaseCluster3D ? n.uuid : ((n as { _id?: string })._id ?? String(i))),
                x: pos.x || jitter(),
                y: pos.y || jitter(),
                z: this.dimensions >= 3 ? (pos.z || jitter()) : 0,
            };
        });

        const idToIndex = new Map<string, number>(fdgNodes.map((n, i) => [String(n.id), i]));

        const fdgLinks: LinkData[] = rawEdges
            .map((e) => {
                const src = e.source as unknown as { _id?: string; uuid?: string };
                const tgt = e.target as unknown as { _id?: string; uuid?: string };
                const srcId = src._id ?? src.uuid ?? "";
                const tgtId = tgt._id ?? tgt.uuid ?? "";
                return idToIndex.has(srcId) && idToIndex.has(tgtId)
                    ? { source: srcId, target: tgtId }
                    : null;
            })
            .filter((e): e is { source: string; target: string } => e !== null);

        const fdg = new ForceDirectedGraph(this.renderer);
        fdg.is2D = this.dimensions < 3;
        fdg.springLength = this.mScale / 5;
        fdg.repulsion = this.mScale / 5;

        let textureBuffer: Float32Array | null = null;
        let textureSize = 0;

        const that = this;
        let cntTicks = 0;
        const startTickTime = Date.now();
        const alphaAbort = 0.01;

        const readAllPositions = () => {
            const ud = (fdg as unknown as {
                userData: { gpgpu: { getCurrentRenderTarget: (v: unknown) => WebGLRenderTarget }; variables: { positions: unknown } }
            }).userData;
            const rt = ud.gpgpu.getCurrentRenderTarget(ud.variables.positions);
            const sz: number = rt.width;

            if (sz !== textureSize) {
                textureSize = sz;
                textureBuffer = new Float32Array(sz * sz * 4);
            }

            (that.renderer as unknown as { readRenderTargetPixels: (rt: unknown, x: number, y: number, w: number, h: number, buf: Float32Array) => void }).readRenderTargetPixels(rt, 0, 0, sz, sz, textureBuffer!);

            nodeList.forEach((n, i) => {
                const uvx = i % sz;
                const uvy = Math.floor(i / sz);
                const offset = (uvy * sz + uvx) * 4;
                const x = textureBuffer![offset];
                const y = textureBuffer![offset + 1];
                const z = textureBuffer![offset + 2];

                const pos = (n instanceof BaseCluster3D)
                    ? n.position as unknown as { x: number; y: number; z: number }
                    : n as { x: number; y: number; z: number };

                pos.x = x;
                pos.y = y;
                pos.z = that.dimensions >= 3 ? z : 0;

                onNodePositionChange(pos as Vector3, i);
            });
        };

        nodeList.forEach((n, i) => {
            const src = fdgNodes[i];
            const pos = (n instanceof BaseCluster3D)
                ? n.position as unknown as { x: number; y: number; z: number }
                : n as { x: number; y: number; z: number };
            pos.x = src.x ?? 0;
            pos.y = src.y ?? 0;
            pos.z = that.dimensions >= 3 ? (src.z ?? 0) : 0;
            onNodePositionChange(pos as Vector3, i);
        });

        fdg.set({ nodes: fdgNodes, links: fdgLinks }).then(() => {
            for (let i = 0; i < this.initialEngineTicks; i++) {
                fdg.update(Date.now());
            }
            readAllPositions();

            this.queue().add(function onQueue() {
                const elapsed = Date.now() - startTickTime;
                if (
                    cntTicks++ > that.maxConvergeFrames ||
                    elapsed > that.maxConvergeTime ||
                    fdg.alpha < alphaAbort
                ) {
                    fdg.alpha = 0;
                    that.queue().remove(onQueue);
                    if (onComplete) onComplete();
                    fdg.dispose();
                    return;
                }

                fdg.update(Date.now());
                readAllPositions();
                if (onStep) onStep(fdg.alpha);
            });
        });

    }

    distribute(_node: DistributionNode, _dx: number, _dy: number, _dz: number): DistributeResult {
        return { position: new Vector3(0, 0, 0) };
    }
}
