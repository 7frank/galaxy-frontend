/**
 * Created by Frank on 29.05.2017.
 */

import BaseDistribution, { DistributeResult, DistributionNode } from "./BaseDistribution"
import BaseCluster3D from "../BaseCluster3D"
import { Vector3 } from "three/src/math/Vector3.js";

export default class DefaultDistribution extends BaseDistribution {

    constructor(scale: number = 1, dimensions: number = 3) {
        super(scale, dimensions);
        this.mDuration = 1;
    }

    distribute(node: DistributionNode & { _bubble?: any }, _dx: number, _dy: number, _dz: number): DistributeResult {
        const mesh = (node._bubble) ? node._bubble : node;
        let absPos: Vector3;

        if (mesh) {
            absPos = new Vector3();
            absPos.setFromMatrixPosition(mesh.matrixWorld);

            if (mesh instanceof BaseCluster3D)
                absPos.sub(mesh.getRoot().position);
            else
                absPos.sub(mesh.parent.parent.getRoot().position);
        } else {
            const raw: { x?: number; y?: number; z?: number } = {};
            if (typeof node.x != "undefined") raw.x = node.x;
            if (typeof node.y != "undefined") raw.y = node.y;
            if (typeof node.z != "undefined") raw.z = node.z;
            absPos = new Vector3(raw.x ?? 0, raw.y ?? 0, raw.z ?? 0);
        }

        return { position: new Vector3(absPos.x, absPos.y, absPos.z).multiplyScalar(this.mScale) };
    }
}
