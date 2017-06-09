/**
 * Created by Frank on 29.05.2017.
 */

/**
 * TODO  possible different ways to distribute elements => moveTo, goTo, stack?
 *
 *
 */


import BaseDistribution from "./BaseDistribution"



    export default  class DefaultDistribution extends BaseDistribution
    {
    constructor(scale=1,dimensions=3){

        super(scale,dimensions)

    }


//TODO this is quite redundant we want the same work flow but not at idle copy costs if possible
    distribute(node,dx,dy,dz){

        return {position:new THREE.Vector3(node.x,node.y,node.z).multiplyScalar(this.mScale)};
    }
}

