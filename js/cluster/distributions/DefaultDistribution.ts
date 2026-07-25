/**
 * Created by Frank on 29.05.2017.
 */

import BaseDistribution, { DistributeResult, DistributionNode } from "./BaseDistribution"
import BaseCluster3D from "../BaseCluster3D"
import type { BubbleNode } from "../particles/ParticleNodeGroup"
import { Object3D } from "three/src/core/Object3D.js";
import { Vector3 } from "three/src/math/Vector3.js";

export default class DefaultDistribution extends BaseDistribution {

    constructor(scale: number = 1, dimensions: number = 3) {
        super(scale, dimensions);
        this.mDuration = 1;
    }

    distribute(node: DistributionNode & Pick<BubbleNode, '_bubble'>, _dx: number, _dy: number, _dz: number): DistributeResult {
        const mesh: Object3D | DistributionNode = node._bubble ? node._bubble as unknown as Object3D : node;
        let absPos: Vector3;

        if (mesh instanceof Object3D) {
            absPos = new Vector3();
            absPos.setFromMatrixPosition(mesh.matrixWorld);

            if (mesh instanceof BaseCluster3D)
                absPos.sub(mesh.getRoot().position);
            else if (mesh.parent?.parent instanceof BaseCluster3D)
                absPos.sub(mesh.parent.parent.getRoot().position);
        } else {
            const n = mesh as { x?: number; y?: number; z?: number };
            absPos = new Vector3(n.x ?? 0, n.y ?? 0, n.z ?? 0);
        }

        return { position: new Vector3(absPos.x, absPos.y, absPos.z).multiplyScalar(this.mScale) };
    }
}
