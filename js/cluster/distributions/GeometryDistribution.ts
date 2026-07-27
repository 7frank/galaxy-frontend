/**
 * Created by Frank on 05.06.2017.
 */

import BaseDistribution from "./BaseDistribution"
import { BufferGeometry } from "three/src/core/BufferGeometry.js";

/**
 * TODO stub
 * the geometry distribution takes an arbitrary geometry and uses its vertex data to create a point cloud
 *  of graph nodes looking similar to the original geometry
 **/

export default class GeometryDistribution extends BaseDistribution {
    constructor(_geometry: BufferGeometry) {
        super(1, 0);
    }
}
