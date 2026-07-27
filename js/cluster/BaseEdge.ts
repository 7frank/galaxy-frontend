/**
 * Created by Frank on 08.06.2017.
 */

import { Vector3 } from "three/src/math/Vector3.js";

export default class BaseEdge {

    mStart: Vector3
    mEnd: Vector3

    constructor(start: Vector3, end: Vector3) {
        this.mStart = start;
        this.mEnd = end;
    }

    getStart(): Vector3 {
        return this.mStart;
    }

    getEnd(): Vector3 {
        return this.mEnd;
    }
}
