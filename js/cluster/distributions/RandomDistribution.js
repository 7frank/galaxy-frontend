/**
 * Created by Frank on 30.05.2017.
 */

import BaseDistribution from "./BaseDistribution"
import * as THREE from "three";
import * as _ from "lodash";


/**
 * A simple random distribution function which positions nodes via some pseudo random algorithm
 *
 * {@see BaseDistribution}
 */

export default class RandomDistribution extends BaseDistribution {


    /**
     * for details {@see BaseDistribution.constructor}
     **/

    constructor(...args) {
        super(...args);
        this.maxDiameter = this.mScale * 2;
    }


    /**
     * for details {@see BaseDistribution.distribute}
     **/

    distribute(node, dx, dy) {
        let min = this.maxDiameter / -2, max = this.maxDiameter / 2

        let x = _.random(min, max);
        let y = this.dimensions > 1 ? _.random(min, max) : 0;
        let z = this.dimensions > 2 ? _.random(min, max) : 0;


        return {
            position: new THREE.Vector3(x, y, z)
        }
    }
}
