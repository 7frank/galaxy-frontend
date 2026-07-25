/**
 * Created by Frank on 29.05.2017.
 */

import BaseCluster3D from "../BaseCluster3D"
import { TWEEN } from "../../lib/Tween"
import { Vector3 } from "three/src/math/Vector3.js";
import * as _ from "lodash";
import type { GraphNode } from "../particles/ParticleNodeGroup";

export type DistributionNode = GraphNode | BaseCluster3D

export type NodePositionChangeCallback = (pos: Vector3 | { x: number; y: number; z: number }, index: number) => void
export type StepCallback = (alpha?: number) => void
export type EndCallback = () => void

export interface DistributeResult {
    position: Vector3
}

export default class BaseDistribution {

    mDuration: number
    dimensions: number
    mScale: number
    mEasingFunction: (k: number) => number
    mSortFunction: ((a: DistributionNode, b: DistributionNode) => number) | undefined
    mTweens: InstanceType<typeof TWEEN.Tween>[]

    constructor(scale: number = 50, dimensions: number = 1) {
        this.mDuration = 2000;
        this.dimensions = dimensions;
        this.mScale = scale;
        this.mEasingFunction = TWEEN.Easing.Quadratic.In;
        this.mTweens = [];
    }

    onSort(sortFN: (a: DistributionNode, b: DistributionNode) => number): this {
        this.mSortFunction = sortFN;
        return this;
    }

    doSort(nodesArray: DistributionNode[]): void {
        if (!this.mSortFunction) return;
        nodesArray.sort(this.mSortFunction);
    }

    setNodes(
        nodes: GraphNode[] | InstanceType<typeof BaseCluster3D>,
        onNodePositionChange: NodePositionChangeCallback,
        onStepComplete: StepCallback,
        onEnd: EndCallback
    ): void {
        let nodeArray: DistributionNode[];

        if (nodes instanceof BaseCluster3D) {
            nodeArray = Object.values(nodes.mClusters);
        } else if (_.isArray(nodes)) {
            nodeArray = nodes;
        } else {
            throw new Error("not supported, must be array of nodes or BaseCluster3D");
        }

        this.doSort(nodeArray);

        const mDuration = this.mDuration;
        let mTimeout: number;

        const len = nodeArray.length;

        let i = 0, j = 0, k = 0;
        let _len: number;

        if (this.dimensions == 1) _len = len;
        else if (this.dimensions == 2) _len = Math.sqrt(len);
        else _len = Math.pow(len, 1 / 3);

        if (this.dimensions < 3) k = 0.5 * (_len - 1);
        if (this.dimensions < 2) j = 0.5 * (_len - 1);

        let c = 0;
        const count = nodeArray.length;
        const that = this;
        let notTweenFinished = true;

        this.stop();
        const tweens = this.mTweens = [];

        _.each(nodeArray, function (n: DistributionNode) {
            if (i > _len) { j++; i = 0; }
            if (j > _len) { k++; j = 0; }

            const dist = that.distribute(n, i / (_len - 1) - 0.5, j / (_len - 1) - 0.5, k / (_len - 1) - 0.5);

            const mc = c;
            const origPos: { x: number; y: number; z: number } = (n instanceof BaseCluster3D) ? n.position : n as { x: number; y: number; z: number };

            const tween = new TWEEN.Tween(origPos)
                .easing(that.mEasingFunction)
                .to(dist.position, mDuration)
                .onUpdate(function () {
                    if (mc == count - 1) {
                        if (onStepComplete) onStepComplete();
                    }
                    onNodePositionChange(origPos, mc);
                })
                .onComplete(function () {
                    if (notTweenFinished) {
                        notTweenFinished = false;
                        that.stop();
                        if (onEnd) onEnd();
                        cancelAnimationFrame(mTimeout);
                    }
                })
                .start();

            tweens.push(tween);
            i++;
            c++;
        });

        mTimeout = requestAnimationFrame(animate);

        function animate(time: number) {
            _.each(tweens, function (tween: InstanceType<typeof TWEEN.Tween>) {
                tween.update(time);
            });
            if (notTweenFinished)
                mTimeout = requestAnimationFrame(animate);
        }
    }

    stop(): void {
        _.each(this.mTweens, function (tween: InstanceType<typeof TWEEN.Tween>) {
            TWEEN.remove(tween);
        });
    }

    distribute(_node: DistributionNode, dx: number, dy: number, dz: number): DistributeResult {
        return { position: new Vector3(dx, dy, dz).multiplyScalar(this.mScale) };
    }
}
