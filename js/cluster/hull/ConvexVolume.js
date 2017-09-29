/**
 * Created by Frank on 23.06.2017.
 */


import BoxVolume from "./BoxVolume"
import MaterialFadeMixin from "../../utils/MaterialFadeMixin"
import * as THREE from "three";


export default class ConvexVolume extends BoxVolume {


    //leaf- bbox => geometry => sum(vertex)
    //ConvexGeometry
    //NOTE also have compute different detailed hulls to set by lod factor
    //eg. if lod <0.3 this.mesh.geometry=this.lowpolyMesh

    constructor(...args) {
        super(...args);

        this.setInactive();

    }


    //geometry ... at best a convexGeometry
    //numSegments ... determines the smoothing of the rounded edges
    //margin ... the margin of the convex geometry around the original geometry
    myModifier(geometry, numSegments, margin) {

        let marginGeo = new THREE.Geometry();

        for (let v of geometry.vertices) {
            let sphere = new THREE.SphereGeometry(margin, numSegments, numSegments);
            sphere.translate(v.x, v.y, v.z);

            marginGeo.merge(sphere, sphere.matrix)

        }


        let convexGeoWithMargin = new THREE.ConvexGeometry(marginGeo.vertices);


        return convexGeoWithMargin

    }


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


    createFromBoundingBox(vertices, boundingBox) {

        //adding a timestamp for the different lods of the mesh
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

    createBoxGeometryFromBoundingBox(boundingBox) {
        let _center = boundingBox.getCenter();
        let _size = boundingBox.getSize();

        let box = new THREE.BoxGeometry(_size.x, _size.y, _size.z);

        box.translate(_center.x, _center.y, _center.z);
        return box;
    }

    getVerticesFromBoundingBox(boundingBox) {

        let box = this.createBoxGeometryFromBoundingBox(boundingBox);


        return box.vertices
    }


    //TODO
    transferFunction(x) {
        return x
    }


    createResolutionGeometry(name, resolution) {

        if (!this['geometry' + name] || this['geometry' + name].mTime != this.mTime) {

            let margin = this.mBoundingBox.getSize().length() / 10;

            let geo2 = this.myModifier(this.mGeometryZero, resolution, margin);
            geo2.computeBoundingBox();
            geo2.mTime = this.mTime;
            this['geometry' + name] = geo2;

        }
        return this['geometry' + name]
    }


    //TODO it is probably better to separate the LOD from the visiblility/opacity
    //
    setLOD(l) {

        if (l < 0) l = 0;
        if (l > 1) l = 1;

        var minOpacity = 0.00;

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
            this.mesh.geometry = this.createResolutionGeometry("Least", 1);
        else if (l > 0.2 && l < 0.6)
            this.mesh.geometry = this.createResolutionGeometry("Low", 4);
        else if (l >= 0.6)
            this.mesh.geometry = this.createResolutionGeometry("Average", 6);


    }


    setActive() {
        this.maxOpacity = 0.4;
    }


    setInactive() {
        this.maxOpacity = 0.2;
    }


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