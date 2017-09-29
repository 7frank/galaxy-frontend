/**
 * Created by Frank on 22.06.2017.
 */

/**
 * the default implementation for a hull/volume around a cluster/sub-cluster
 *
 *
 */

import * as THREE from "three";


export default class BaseVolume extends THREE.Object3D {

    constructor(...args) {
        super(...args);
        this.lod = 1;
        this.maxOpacity = 0.0
    }


    /**
     * lod is  value between 0 and 1 that can be used to render elements level-of-detail specific
     * eg. depending on the distance of camera and object
     *
     * @param newLOD
     */
    setLOD(newLOD) {


        if (newLOD < 0) newLOD = 0;
        if (newLOD > 1) newLOD = 1;


        this.lod = newLOD


    }


    getMaterial() {
        if (this.mMaterial) return this.mMaterial;

        this.mMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,
            linewidth: 5,
            opacity: this.maxOpacity,
            transparent: false
        });

        this.mMaterial.visible = this.canBeVisible();

        return this.mMaterial

    }


    /**
     * determines if the volume is can be made visible to the user
     *
     * @returns {boolean}
     */

    canBeVisible() {
        return false
    }


//FIXME have a better approach to generate the hull
//? rather: create from vertices
    createFromBoundingBox(vertices, boundingBox) {

        this.mBoundingBox = boundingBox;


        let _center = boundingBox.getCenter();
        let _size = boundingBox.getSize();

        let box = new THREE.BoxGeometry(_size.x, _size.y, _size.z);

        let geo = new THREE.EdgesGeometry(box); // or WireframeGeometry( geometry )

        let mat = this.getMaterial();

        let wireframe = new THREE.LineSegments(geo, mat);
        wireframe.position.add(_center);
        wireframe.geometry.boundingBox = boundingBox;


        if (this.mesh) this.remove(this.mesh);
        this.mesh = wireframe;
        this.add(wireframe);


        return this.mesh


    }


    setActive() {

        this.maxOpacity = 1

    }


    setInactive() {

        this.maxOpacity = 0.3

    }


    dispose() {
        this.mesh.geometry.dispose()
        this.mesh.material.dispose()

        if (this.parent)
            this.parent.remove(this)

    }


}

