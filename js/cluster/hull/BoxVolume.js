/**
 * Created by Frank on 22.06.2017.
 */

import BaseVolume from "./BaseVolume"
/**
 * a slight derivative of it's base class
 * allowing for user to add to sub-cluster
 *
 */

export default
class BoxVolume extends  BaseVolume {

    constructor(...args) {
        super(...args)


    }



    transferFunction(x)
    {
     return 1
    }

    /**
     * lod is  value between 0 and 1 that can be used to render elements level-of-detail specific
     * eg. depending on the distance of camera and object
     *
     * @param newLOD
     */
    setLOD(newLOD)
    {
      super.setLOD(newLOD);

        //by default just set the opacity and visibility accordingly
        let y=this.transferFunction(newLOD)
        if ( this.mesh && this.mesh.material) {
            this.mesh.material.opacity =this.maxOpacity*y; //TODO add transferFunction

            if (y<=0)
                this.mesh.material.visible=false;
            else
                this.mesh.material.visible=true;


        }

    }



    canBeVisible()
    {
        return true
    }


}