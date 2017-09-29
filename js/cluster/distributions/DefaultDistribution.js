/**
 * Created by Frank on 29.05.2017.
 */

/**
 * TODO  possible different ways to distribute elements => moveTo, goTo, stack?
 *
 *
 */


import BaseDistribution from "./BaseDistribution"

import BaseCluster3D from "../BaseCluster3D"
import * as THREE from "three";



    export default  class DefaultDistribution extends BaseDistribution
    {
    constructor(scale=1,dimensions=3){

        super(scale,dimensions)

        this.mDuration=1;
    }



//TODO this is quite redundant we want the same work flow but not at idle copy costs if possible
    distribute(node,dx,dy,dz) {


        var mesh = (node._bubble) ? node._bubble : node;
        var absPos;
        if (mesh) {
            absPos = new THREE.Vector3();
            absPos.setFromMatrixPosition(mesh.matrixWorld);

        //TODO this is only working for specific cases currently
            if (mesh instanceof BaseCluster3D)
            absPos.sub(mesh.getRoot().position)
             else
            absPos.sub(mesh.parent.parent.getRoot().position)

        }
        else {

        absPos={};  //if above fails, we interpret the node as a yet rendered node with  potential initial x,y,z

            (typeof node.x!="undefined")?absPos.x=node.x:0;
            (typeof node.y!="undefined")?absPos.y=node.x:0;
            (typeof node.z!="undefined")?absPos.z=node.x:0;

            }
        return {position:new THREE.Vector3(absPos.x,absPos.y,absPos.z).multiplyScalar(this.mScale)};
    }
}

