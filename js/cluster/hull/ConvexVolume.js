/**
 * Created by Frank on 23.06.2017.
 */


import BoxVolume from "./BoxVolume"
import MaterialFadeMixin from "../../utils/MaterialFadeMixin"
import * as THREE from "three";

import "../../lib/ConvexGeometry"
import "../../lib/QuickHull"


/**
 *
 * Implementation of a convex hull around a set of nodes in 3D space using {@see QuickHull} algorithm.
 * In addition multiple separate geometries with different resolutions (triangle count) are generated for rendering,
 * to improve overall GPU load.
 *
 */


export default class ConvexVolume extends BoxVolume {


    /**
     * default constructor
     */

    constructor(...args) {
        super(...args);

        this.setInactive();

    }


    /**
     *
     * The following modifier creates a special hull effect (in or case for a convex hull),
     * which will result in a hull around the convex hull that has a fixed margin.
     * It rounds/smoothens the sharp edges of the original convex hull.
     *
     * NOTE:A modifier for three.js is some algorithm that uses a {@see THREE.Geometry} and alters vertex positions or/and count in some way.
     *
     *
     * @param geometry ... at best a convexGeometry
     * @param numSegments ... determines the smoothing of the rounded edges
     * @param  ... the margin of the convex geometry around the original geometry
     * @returns {THREE.ConvexGeometry}
     */

    smoothHullModifier(geometry, numSegments, margin) {

        let marginGeo = new THREE.Geometry();

        for (let v of geometry.vertices) {
            let sphere = new THREE.SphereGeometry(margin, numSegments, numSegments);
            sphere.translate(v.x, v.y, v.z);

            marginGeo.merge(sphere, sphere.matrix)

        }


        let convexGeoWithMargin = new THREE.ConvexGeometry(marginGeo.vertices);


        return convexGeoWithMargin

    }


    /**
     * Returns the material used for the mesh rendered.
     * {@see BaseVolume.getMaterial}
     */

    getMaterial() {
        if (this.mMaterial) return this.mMaterial;


        let mat = this.mMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            opacity: 0.03,
            transparent: true,
            depthWrite: false,
            side: THREE.BackSide
            //  ,   wireframe:true
        });

        this.mMaterial.visible = this.canBeVisible();


        MaterialFadeMixin(mat);

        //FIXME test if previous material exists and take its fade value to prevent flickering
        /*  if (this.mesh && this.mesh.material && this.mesh.material.fade)
              mat.fade = this.mesh.material.fade;
          else*/
        mat.fade = 0;

        mat.fadeTo(1, 2000);

        return this.mMaterial
    }

    /**
     * Creates the actual convex geometry which is later used to create the visible mesh.
     *
     * for details {@see BaseVolume.createVolumeFromVertices}
     */
    createVolumeFromVertices(vertices, boundingBox) {

        //adding a timestamp to distinguish between the different LOD-based meshes created
        this.mTime = Date.now();

        let vert = vertices.filter(v => !(v.x == 0 && v.y == 0 && v.z == 0 ));

        if (vert.length < 4 && vertices.length > 4) {
            vertices = [];
            boundingBox.min = new THREE.Vector3(-1, -1, -1);
            boundingBox.max = new THREE.Vector3(1, 1, 1);

        }


        //ConvexGeometry does need at least 4 vertices
        //so in case we don't have as much we do use the boundingbox instead to generate some more vertices
        if (vertices.length < 4) {

            //test if the boudningBox is valid, else (f)make it so. this way it does not interrupt the work flow and generates a minimal hull
            //TODO   alternativly an empty Geometry would also be sufficient
            if (boundingBox.getSize().length() == 0)
                boundingBox.max.add(new THREE.Vector3(0.1, 0.1, 0.1));

            vertices = this.getVerticesFromBoundingBox(boundingBox);


        }

        //we will create a sphere geometry with a radius==margin for each vertice and merge them beforehand
        //reduce the vertice count before adding margin
        let geo0;
        try {

            //FIXME this currently fixes a bug when every point lies on the same plane
            //instead a 2d shape should be used if the mode is 2d
            if (vertices[0].x == 0) vertices[0].x = 0.1;
            if (vertices[0].y == 0) vertices[0].y = 0.1;
            if (vertices[0].z == 0) vertices[0].z = 0.1;

            geo0 = this.mGeometryZero = new THREE.ConvexGeometry(vertices);
        }
        catch (e) {
            geo0 = this.mGeometryZero = this.createBoxGeometryFromBoundingBox(boundingBox);
            console.warn(e, vertices)

        }


        this.mBoundingBox = boundingBox;


        //   let mesh = new THREE.Mesh(geo, mat);
        let mesh = new THREE.Mesh(this.geo0, this.getMaterial());

        mesh.geometry.boundingBox = boundingBox;
        mesh.geometry.boundingSphere = boundingBox.getBoundingSphere();

        //this part is to prevent an exception in the raycaster where position is not present but element initialised
        //TODO maybe change the element itself so it stays in a valid state
        var rc = mesh.raycast;
        mesh.raycast = function (raycaster, intersects) {

            if (this.geometry && this.geometry.attributes && !this.geometry.attributes.position)
                return;

            return rc.apply(this, arguments)

        };


        if (this.mesh) this.remove(this.mesh);
        this.mesh = mesh;
        this.add(mesh);

        return this.mesh;

    }


    /**
     * Creates a box geometry.
     *
     * @param boundingBox ..  {@see THREE.Box3}
     * @returns {THREE.BoxGeometry}
     */

    createBoxGeometryFromBoundingBox(boundingBox) {
        let _center = boundingBox.getCenter();
        let _size = boundingBox.getSize();

        let box = new THREE.BoxGeometry(_size.x, _size.y, _size.z);

        box.translate(_center.x, _center.y, _center.z);
        return box;
    }


    /**
     * Returns the vertices as an array of THREE.Vector3 for the bounding box given.
     *
     */

    getVerticesFromBoundingBox(boundingBox) {

        let box = this.createBoxGeometryFromBoundingBox(boundingBox);


        return box.vertices
    }

    /**
     * {@see BoxVolume.transferFunction}
     *
     * TODO test some more useful transfer functions
     */

    transferFunction(x) {
        return x
    }


    /**
     * Used to create geometries with a varying amount of polygons for for LOD purposes (different camera-mesh distances)
     * to increase overall frame rates and prevent unnecessary GPU load.
     *
     */

    createVariousResolutionSubGeometry(name, resolution) {

        if (!this['geometry' + name] || this['geometry' + name].mTime != this.mTime) {

            let margin = this.mBoundingBox.getSize().length() / 10;

            let geo2 = this.smoothHullModifier(this.mGeometryZero, resolution, margin);
            geo2.computeBoundingBox();
            geo2.mTime = this.mTime;
            this['geometry' + name] = geo2;

        }
        return this['geometry' + name]
    }

    /**
     * Uses lower polygon geometry for mesh when camera is further away and higher when camera is closer to the mesh.
     * Also uses private transfer function to blend in/out mesh on zoom. With bigger or minimal distances the mesh gets more transparent.
     * at an average distance between camera and mesh, it reaches its maximmum opacity.
     *
     * For  further details {@see BaseVolume.setLOD}
     *
     * TODO it is probably better to separate the LOD from the visibility/opacity parameter
     */


    setLOD(l) {

        if (l < 0) l = 0;
        if (l > 1) l = 1;

        var minOpacity = 0.00;

        //TODO put this into ConvexVolume.transferFunction .. to do so make minOpacity potentially an attribute for all implementations
        function mTransfer(x) {
            //transfer function y= 0.5*sin(1.5*pi+x*pi*2)+0.5
            return 0.5 * Math.sin(1.5 * Math.PI + x * Math.PI * 2) + 0.5 + minOpacity


        }

        let y = mTransfer(l);

        super.setLOD(y * this.maxOpacity);


        /*     if (l < 0.8) this.mesh.geometry = this.geometryLowPoly;
         if (l >= 0.8 && l <= 0.95) this.mesh.geometry = this.geometryAveragePoly;
         if (l > 0.95) this.mesh.geometry = this.geometryHighPoly*/


        //FIXME initial C-V is to heavy to compute
        l = 0.1;

        if (l < 0.2)
            this.mesh.geometry = this.createVariousResolutionSubGeometry("Least", 1);
        else if (l > 0.2 && l < 0.6)
            this.mesh.geometry = this.createVariousResolutionSubGeometry("Low", 4);
        else if (l >= 0.6)
            this.mesh.geometry = this.createVariousResolutionSubGeometry("Average", 6);


    }

    /**
     * {@see BaseVolume.setActive}
     */
    setActive() {
        this.maxOpacity = 0.4;
    }

    /**
     *  {@see BaseVolume.setActive}
     */
    setInactive() {
        this.maxOpacity = 0.2;
    }

    /**
     * Frees memory used for geometry.
     */
    dispose() {

        this.mesh.material.dispose();

        if (this.geometryLowPoly)
            this.geometryLowPoly.dispose();
        if (this.geometryAveragePoly)
            this.geometryAveragePoly.dispose();
        if (this.geometryHighPoly)
            this.geometryHighPoly.dispose();

        if (this.parent)
            this.parent.remove(this)

    }


}