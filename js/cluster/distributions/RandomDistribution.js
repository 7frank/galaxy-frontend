/**
 * Created by Frank on 30.05.2017.
 */

import BaseDistribution from "./BaseDistribution"
import { Vector3 } from "three/src/math/Vector3.js";
import * as _ from "lodash";


/**
 * A simple random distribution function which positions nodes via some pseudo random algorithm
 *
 * {@link BaseDistribution}
 */

export default class RandomDistribution extends BaseDistribution {


    /**
     * for details {@link BaseDistribution.constructor}
     **/

    constructor(...args) {
        super(...args);
        this.maxDiameter = this.mScale * 2;
    }


    /**
     * for details {@link BaseDistribution.distribute}
     **/

    distribute(node, dx, dy) {
        let min = this.maxDiameter / -2, max = this.maxDiameter / 2

        let x = _.random(min, max);
        let y = this.dimensions > 1 ? _.random(min, max) : 0;
        let z = this.dimensions > 2 ? _.random(min, max) : 0;


        return {
            position: new Vector3(x, y, z)
        }
    }
}
