/**
 * Created by Frank on 22.06.2017.
 */

/**
 * The default implementation for a hull/volume around a cluster of nodes.
 * This will create an invisible box  using the bounding box of the cluster.
 * Nothing is renderd but some properties of the resulting volume are used to determine distances between
 * neighboring elements in the cluster section.
 *
 * NOTE: for an implementation of a visible volume see {@see BoxVolume}
 */

import * as THREE from "three";


export default class BaseVolume extends THREE.Object3D {

    /**
     * default constructor
     */

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

    /**
     * Creates  and returns a Three.js material ( in this case a {@see THREE.LineBasicMaterial} )
     * that is used to render the object.
     */

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
     * Determines if the volume  can be made visible to the user.
     * If set to false the volume is never shown but its dimensions are still used for other processes
     *
     * @returns {boolean}
     */

    canBeVisible() {
        return false
    }





    /**
     * The overall goal of this method and all its inheriting implementations like {@see ConvexVolume.createVolumeFromVertices}
     * is that based on the vertices a {@see THREE.Mesh} is created which functions as a hull structure around the vertices.
     *
     * NOTE: The BaseVolume does not make use of the vertices instead it creates the mesh based on the second (boundingBox) parameter
     *
     * @param vertices ... a set of  {@see THREE.Vector3} representing positions in 3D-space
     * @param boundingBox ... a {@see THREE.Box3} which holds bounding box data for the vertices
     * @returns {*}
     */

    createVolumeFromVertices(vertices, boundingBox) {

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


    /**
     * The created volume does have two states 'active' and 'inactive' which can be used for a visual feedback when the user interacts with it.
     * For example, it can be used to highlight the volume when the user hovers over the volume with the mouse cursor.
     *
     * The BaseVolume simply changes an opacity multiplicator 'maxOpacity' which is used to alter the current opacity (which itself can vary based on distance between camera and mesh)
     */

    setActive() {

        this.maxOpacity = 1

    }

    /**
     * {@see setActive}
     *
     */


    setInactive() {

        this.maxOpacity = 0.3

    }


    /**
     * Starts freeing memory when called via GC
     * to prevent memory leaks.
     */

    dispose() {
        this.mesh.geometry.dispose()
        this.mesh.material.dispose()

        if (this.parent)
            this.parent.remove(this)

    }


}

