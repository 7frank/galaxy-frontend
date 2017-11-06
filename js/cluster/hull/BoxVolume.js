/**
 * Created by Frank on 22.06.2017.
 */

import BaseVolume from "./BaseVolume"

/**
 * A slight (and visible) derivative of it's base class {@see BaseVolume}
 *
 *
 */

export default class BoxVolume extends BaseVolume {

    constructor(...args) {
        super(...args);
        this.maxOpacity = 0.1;
        this.getMaterial().transparent = true;
    }


    /**
     * A transfer function which is used to manipulate the opacity of the hull, depending on the distance between camera and mesh.
     * This can be used to achieve various easing effects - like fading in our out - when the camera moves relative to the mesh.
     */


    transferFunction(x) {
        return 1
    }

    /**
     * lod is  value between 0 and 1 that can be used to render elements level-of-detail specific
     * eg. depending on the distance of camera and object
     *
     * @param newLOD
     */
    setLOD(newLOD) {
        super.setLOD(newLOD);

        //by default just set the opacity and visibility accordingly
        let y = this.transferFunction(newLOD)
        if (this.mesh && this.mesh.material) {
            this.mesh.material.opacity = this.maxOpacity * y;

            if (y <= 0)
                this.mesh.material.visible = false;
            else
                this.mesh.material.visible = true;


        }

    }


    /**
     * The created geometry can be visible and is treated accordingly if certain other parameters - like proper LOD - apply.
     * NOTE: Actual visibility is up to the specific Implementation.
     */

    canBeVisible() {
        return true
    }


}