/**
 * Created by Frank on 08.06.2017.
 *
 *
 * edge class for convenience.. not much to see here
 *
 * TODO check if we can refactor some methods from linkMixin otherwise this is redundant..
 *
 */

export default class BaseEdge {

    constructor(start, end) {

        this.mStart = start;
        this.mEnd = end;

        //FIXME below code doesn't work because the vectors start and end are used instead the copy inside this  class
        /*     this.mStart = new THREE.Vector3();
             if (start) this.mStart.copy(start);


             this.mEnd = new THREE.Vector3();
             if (end) this.mEnd.copy(end);
         */

    }

    getStart() {
        return this.mStart;

    }

    getEnd() {
        return this.mEnd;
    }


}