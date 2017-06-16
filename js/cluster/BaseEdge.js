/**
 * Created by Frank on 08.06.2017.
 */

export default
class BaseEdge {

    //FIXME fix offset of edges or add to rootcluster maybe? with offset per cluster? ...

    constructor(start,end) {

        this.mStart=start;
        this.mEnd=end;

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