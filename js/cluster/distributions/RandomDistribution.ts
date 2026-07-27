/**
 * Created by Frank on 30.05.2017.
 */

import BaseDistribution, { DistributeResult, DistributionNode } from "./BaseDistribution"
import { Vector3 } from "three/src/math/Vector3.js";
import * as _ from "lodash";

export default class RandomDistribution extends BaseDistribution {

    maxDiameter: number

    constructor(scale: number = 50, dimensions: number = 1) {
        super(scale, dimensions);
        this.maxDiameter = this.mScale * 2;
    }

    distribute(_node: DistributionNode, _dx: number, _dy: number): DistributeResult {
        const min = this.maxDiameter / -2;
        const max = this.maxDiameter / 2;

        const x = _.random(min, max);
        const y = this.dimensions > 1 ? _.random(min, max) : 0;
        const z = this.dimensions > 2 ? _.random(min, max) : 0;

        return { position: new Vector3(x, y, z) };
    }
}
