/**
 * Created by Frank on 06.06.2017.
 */

import BaseDistribution from "./BaseDistribution"

import { Vector3 } from "three/src/math/Vector3.js";


/**
 *
 * distributes nodes on a sphere using equirectangular projection
 *
 */

export default class SphericalDistribution extends BaseDistribution {

    /**
     * for details {@link BaseDistribution.constructor}
     **/
    constructor(scale = 50, dimensions = 1) {
        super(scale, 2) //only 2d

    }


    distribute(node, dx, dy, dz) {
        const radius = this.mScale / 2;
        const theta = 2 * Math.PI * dx;
        const phi = Math.acos(1 - 2 * (dy + 0.5));
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);
        return { position: new Vector3(x, y, z) };
    }


}

