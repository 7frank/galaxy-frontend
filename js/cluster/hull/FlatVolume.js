/**
 * Created by Frank on 23.06.2017.
 */


import BoxVolume from "./BoxVolume"
import MaterialFadeMixin from "../../utils/MaterialFadeMixin"
import { BackSide } from "three/src/constants.js";
import { Shape } from "three/src/extras/core/Shape.js";
import { BoxGeometry } from "three/src/geometries/BoxGeometry.js";
import { CircleGeometry } from "three/src/geometries/CircleGeometry.js";
import { ShapeGeometry } from "three/src/geometries/ShapeGeometry.js";
import { MeshBasicMaterial } from "three/src/materials/MeshBasicMaterial.js";
import { Sphere } from "three/src/math/Sphere.js";
import { Vector2 } from "three/src/math/Vector2.js";
import { Vector3 } from "three/src/math/Vector3.js";
import { Mesh } from "three/src/objects/Mesh.js";
import * as _ from "lodash";

import convexHull2d from "monotone-convex-hull-2d"

/**
 * This is quick&dirty copy of {@link ConvexVolume} with some changes, using a more optimised algorithm
 * for 2D {@link convexHull2d} and generating a 2D convex hull instead of the former.
 *
 * TODO inherit from ConvexVolume for redundancy reasons
 */

export default class FlatVolume extends BoxVolume {



    constructor(...args) {
        super(...args);

        this.setInactive();

    }

    /**
     * Creates a flat {@link ShapeGeometry} for further processing.
     *
     * @param vertices ... the vertices the convex shape is based on
     * @returns {ShapeGeometry}
     */

    createConvexShapeGeometry(vertices) {
        var pts = _.map(vertices, v => [v.x, v.y]);

        let ids = convexHull2d(pts);

        var resArr = [];
        _.each(ids, function (id) {

            //resArr.push(new Vector2(pts[id][0],pts[id][1]))
            resArr.push(vertices[id])

        })


        var resShape = new Shape(resArr);
        var resGeo = new ShapeGeometry(resShape);


        return resGeo

    }

    /**
     * {@link ConvexVolume.smoothHullModifier}
     *
     * @param geometry  ... at best ca convex geometry
     * @param numSegments ... determines the smoothing of the rounded edges
     * @param margin ... the margin of the convex geometry around the original geometry
     * @returns {ShapeGeometry}
     */

    smoothHullModifier(geometry, numSegments, margin) {

        const allPoints = [];

        for (let v of geometry.vertices) {
            const circle = new CircleGeometry(margin, numSegments);  //use circle geo for 2d instead of sphere
            const pos = circle.getAttribute('position');
            for (let i = 0; i < pos.count; i++) {
                allPoints.push(new Vector3(
                    pos.getX(i) + v.x,
                    pos.getY(i) + v.y,
                    pos.getZ(i) + v.z
                ));
            }
        }

        let convexGeoWithMargin = this.createConvexShapeGeometry(allPoints);


        return convexGeoWithMargin

    }

    /**
     * Creates the actual convex geometry which is later used to create the visible mesh.
     *
     * for details {@link BaseVolume.createVolumeFromVertices}
     */
    createVolumeFromVertices(vertices, boundingBox) {

        //adding a timestamp for the different lods of the mesh
        this.mTime = Date.now();

        let vert = vertices.filter(v => !(v.x == 0 && v.y == 0 && v.z == 0 ));

        if (vert.length < 4 && vertices.length > 4) {
            vertices = [];
            boundingBox.min = new Vector3(-1, -1, -1);
            boundingBox.max = new Vector3(1, 1, 1);

        }


        //ConvexGeometry does need at least 4 vertices
        //so in case we don't have as much we do use the boundingbox instead to generate some more vertices
        if (vertices.length < 4) {

            //test if the boudningBox is valid, else (f)make it so. this way it does not interrupt the work flow and generates a minimal hull
            //TODO   alternativly an empty Geometry would also be sufficient
            if (boundingBox.getSize(new Vector3()).length() == 0)
                boundingBox.max.add(new Vector3(0.1, 0.1, 0.1));

            vertices = this.getVerticesFromBoundingBox(boundingBox);


        }

        //we will create a sphere geometry with a radius==margin for each vertice and merge them beforehand
        //reduce the vertice count before adding margin
        let geo0;
        try {


            geo0 = this.mGeometryZero = this.createConvexShapeGeometry(vertices)// new THREE.ConvexGeometry(vertices);
        }
        catch (e) {
            geo0 = this.mGeometryZero = this.createBoxGeometryFromBoundingBox(boundingBox);
            console.warn(e, vertices)

        }


        this.mBoundingBox = boundingBox;


        let mat = new MeshBasicMaterial({
            color: 0xffffff,
            opacity: 0.03,
            transparent: true,
            depthWrite: true,
            depthTest: false //disabling depth test instead of using polygonOffset to prevent flickering
            // side: BackSide
            //  ,   wireframe:true
        });


        MaterialFadeMixin(mat);

        //FIXME test if previous material exists and take its fade value to prevent flickering
        /* if (this.mesh && this.mesh.material && this.mesh.material.fade)
             mat.fade = this.mesh.material.fade;
         else*/
        mat.fade = 0;

        mat.fadeTo(1, 400);


        //   let mesh = new Mesh(geo, mat);
        let mesh = new Mesh(geo0, mat);


        mesh.geometry.boundingBox = boundingBox;
        mesh.geometry.boundingSphere = boundingBox.getBoundingSphere(new Sphere());

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
     * Returns the vertices as an array of Vector3 for the bounding box given.
     *
     */

    createBoxGeometryFromBoundingBox(boundingBox) {
        let _center = boundingBox.getCenter(new Vector3());
        let _size = boundingBox.getSize(new Vector3());

        let box = new BoxGeometry(_size.x, _size.y, _size.z);

        box.translate(_center.x, _center.y, _center.z);
        return box;
    }


    /**
     * Returns the vertices as an array of Vector3 for the bounding box given.
     *
     */
    getVerticesFromBoundingBox(boundingBox) {

        const box = this.createBoxGeometryFromBoundingBox(boundingBox);
        const pos = box.getAttribute('position');
        const verts = [];
        for (let i = 0; i < pos.count; i++) {
            verts.push(new Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)));
        }
        return verts;
    }


    /**
     * {@link BoxVolume.transferFunction}
     *
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

            let margin = this.mBoundingBox.getSize(new Vector3()).length() / 10;

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
     * For  further details {@link BaseVolume.setLOD}
     *
     * TODO it is probably better to separate the LOD from the visibility/opacity parameter
     */

    setLOD(l) {


        if (l < 0) l = 0;
        if (l > 1) l = 1;

        var minOpacity = 0.00;

        function mTransfer(x) {
            //transfer function y= 0.5*sin(1.5*pi+x*pi*2)+0.5
            return 0.5 * Math.sin(1.5 * Math.PI + x * Math.PI * 2) + 0.5 + minOpacity


        }

        let y = mTransfer(l);

        super.setLOD(y * this.maxOpacity * 2);


        /*     if (l < 0.8) this.mesh.geometry = this.geometryLowPoly;
         if (l >= 0.8 && l <= 0.95) this.mesh.geometry = this.geometryAveragePoly;
         if (l > 0.95) this.mesh.geometry = this.geometryHighPoly*/


        if (l < 0.2)
            this.mesh.geometry = this.createVariousResolutionSubGeometry("Least", 1);
        else if (l > 0.2 && l < 0.6)
            this.mesh.geometry = this.createVariousResolutionSubGeometry("Low", 4);
        else if (l >= 0.6)
            this.mesh.geometry = this.createVariousResolutionSubGeometry("Average", 6);


    }


    /**
     * {@link BaseVolume.setActive}
     */
    setActive() {
        this.maxOpacity = 0.4;
    }


    /**
     * {@link BaseVolume.setActive}
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