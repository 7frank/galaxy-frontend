import BaseDistribution, { DistributionNode, NodePositionChangeCallback, StepCallback, EndCallback } from "./BaseDistribution"
import BaseCluster3D from "../BaseCluster3D"
import { TWEEN } from "../../lib/Tween"
import { Vector3 } from "three/src/math/Vector3.js";
import * as _ from "lodash";

export default class CircleDistribution extends BaseDistribution {

    constructor(scale: number = 50) {
        super(scale, 2);
    }

    setNodes(
        nodes: DistributionNode[] | InstanceType<typeof BaseCluster3D>,
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
        const count = nodeArray.length;
        const radius = this.mScale;
        const that = this;
        let notTweenFinished = true;
        let mTimeout: number;

        this.stop();
        const tweens = this.mTweens = [];

        _.each(nodeArray, function (n: DistributionNode, idx: number) {
            const angle = (idx / count) * Math.PI * 2;
            const target = new Vector3(
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius
            );

            const mc = idx;
            const origPos: { x: number; y: number; z: number } = (n instanceof BaseCluster3D) ? n.position : n as { x: number; y: number; z: number };

            const tween = new TWEEN.Tween(origPos)
                .easing(that.mEasingFunction)
                .to(target, mDuration)
                .onUpdate(function () {
                    if (mc === count - 1) {
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
}
