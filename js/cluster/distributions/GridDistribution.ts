import BaseDistribution, { DistributeResult, DistributionNode } from "./BaseDistribution"
import { Vector3 } from "three/src/math/Vector3.js";

export default class GridDistribution extends BaseDistribution {

    constructor(scale: number = 50) {
        super(scale, 2);
    }

    distribute(_node: DistributionNode, dx: number, dy: number, _dz: number): DistributeResult {
        return { position: new Vector3(dx * this.mScale, 0, dy * this.mScale) };
    }
}
