/**
 * Created by Frank on 30.05.2017.
 */


import BaseDistribution from "./BaseDistribution"

/**
 * a simple random distribution function
 *
 */

export default class RandomDistribution extends BaseDistribution
{
    constructor(radius=25)
    {
        super();
        this.maxDiameter=radius*2;
    }
    distribute(node,dx,dy){
        let min=this.maxDiameter/-2,max=this.maxDiameter/2
        return new THREE.Vector3(_.random(min,max),_.random(min,max),_.random(min,max))
    }
}
