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


    /**
     *  implementation of the equirectangular projection
     * @param mVec2 - a Vector2 that has been transformed into normalised coordinates
     *
     */
    project2dNormalisedToSphere(mVec2, radius) {

        var longitude = mVec2.x * Math.PI
        var latitude = mVec2.y * Math.PI / 2

        var x = radius * Math.cos(latitude) * Math.cos(longitude)
        var y = radius * Math.cos(latitude) * Math.sin(longitude)
        var z = radius * Math.sin(latitude)

        return new Vector3(y, z, x) //?different coordinate system in skybox?

    }


    /**
     * for details {@link BaseDistribution.distribute}
     **/

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

