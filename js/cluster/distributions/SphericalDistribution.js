/**
 * Created by Frank on 06.06.2017.
 */

import BaseDistribution from "./BaseDistribution"

import * as THREE from "three";


/**
 *
 * distributes nodes on a sphere using equirectangular projection
 *
 */

export default class SphericalDistribution extends BaseDistribution {

    /**
     * for details {@see BaseDistribution.constructor}
     **/
    constructor(scale = 50, dimensions = 1) {
        super(scale, 2) //only 2d

    }


    /**
     *  implementation of the equirectangular projection
     * @param mVec2 - a THREE.Vector2 that has been transformed into normalised coordinates
     *
     */
    project2dNormalisedToSphere(mVec2, radius) {

        var longitude = mVec2.x * Math.PI
        var latitude = mVec2.y * Math.PI / 2

        var x = radius * Math.cos(latitude) * Math.cos(longitude)
        var y = radius * Math.cos(latitude) * Math.sin(longitude)
        var z = radius * Math.sin(latitude)

        return new THREE.Vector3(y, z, x) //?different coordinate system in skybox?

    }


    /**
     * for details {@see BaseDistribution.distribute}
     **/

    distribute(node, dx, dy, dz) {
        let mv3 = this.project2dNormalisedToSphere(new THREE.Vector2(2 * dx, 2 * dy), this.mScale / 2)
        return {position: mv3};
    }


}

