/**
 * Created by Frank on 23.06.2017.
 */


import BoxVolume from "./BoxVolume"
import MaterialFadeMixin from "../../utils/MaterialFadeMixin"


export default
class ConvexVolume extends BoxVolume {



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
    myModifier(geometry,numSegments,margin)
    {

    let marginGeo = new THREE.Geometry();

    for (let v of geometry.vertices) {
        let sphere = new THREE.SphereGeometry(margin,numSegments, numSegments);
        sphere.translate(v.x, v.y, v.z);

        marginGeo.merge(sphere, sphere.matrix)

    }



    let convexGeoWithMargin = new THREE.ConvexGeometry(marginGeo.vertices);


    return convexGeoWithMargin

    }


    createFromBoundingBox(vertices, boundingBox) {

        console.log("FIXME convexVolume",vertices,boundingBox)
            //getVerticesFormLeaf in adjustHullSize does generate false values sometimes maybe due to some runtime concurrency problem
            //FIXME from time ti time this does not compute which will break the graph

           let vert= vertices.filter(v => !(v.x==0 &&v.y==0 &&v.z==0 ) )

            if (vert.length<4 && vertices.length>4) {
                vertices = [];
                boundingBox.min=new THREE.Vector3(-1,-1,-1);
                boundingBox.max=new THREE.Vector3(1,1,1);

           }




        //ConvexGeometry does need at least 4 vertices
        //so in case we don't have as much we do use the boundingbox instead to generate some more vertices
          if (vertices.length < 4)
            vertices = this.getVerticesFromBoundingBox(boundingBox);

        //we will create a sphere geometry with a radius==margin for each vertice and merge them beforehand

        //reduce the vertice count before adding margin
        let geo0
        try{
            geo0 =this.mGeometryZero= new THREE.ConvexGeometry(vertices);
        }
        catch(e){
            geo0=this.mGeometryZero=this.createBoxGeometryFromBoundingBox(boundingBox);
            console.warn(e)

        }



      this.mBoundingBox=boundingBox;




        //FIXME ,polygonOffset:true,polygonOffsetFactor:-4
        let mat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            opacity: 0.03,
            transparent: true,
            depthWrite: false,
            side: THREE.BackSide
            //  ,   wireframe:true
        });


        MaterialFadeMixin(mat);
        mat.fade=0;
        mat.fadeTo(1,4000);



        //   let mesh = new THREE.Mesh(geo, mat);
        let mesh = new THREE.Mesh(this.geo0, mat);

        mesh.geometry.boundingBox = boundingBox;


        if (this.mesh) this.remove(this.mesh);
        this.mesh = mesh;
        this.add(mesh);
        return this.mesh;

    }

    createBoxGeometryFromBoundingBox(boundingBox)
    {
        let _center = boundingBox.getCenter();
        let _size = boundingBox.getSize();

        let box = new THREE.BoxGeometry(_size.x, _size.y, _size.z);

        box.translate(_center.x, _center.y, _center.z);
    return box;
    }

    getVerticesFromBoundingBox(boundingBox) {

       let box= this.createBoxGeometryFromBoundingBox(boundingBox);


        return box.vertices
    }


    //TODO
    transferFunction(x) {
        return x
    }





    createResolutionGeometry(name,resolution){

        if (!this['geometry'+name]) {
            let margin = this.mBoundingBox.getSize().length() / 10;

            let geo2 = this.myModifier(this.mGeometryZero,resolution , margin);
            geo2.computeBoundingBox();
            this['geometry'+name] = geo2;

        }
        return this['geometry'+name]
    }


    //TODO it is probably better to separate the LOD from the visiblility/opacity
    //
    setLOD(l) {


        if (l < 0) l = 0;
        if (l > 1) l = 1;

        var minOpacity = 0.03;

        function mTransfer(x) {
            //transfer function y= 0.5*sin(1.5*pi+x*pi*2)+0.5
            return 0.5 * Math.sin(1.5 * Math.PI + x * Math.PI * 2) + +0.5 + minOpacity


        }

        let y = mTransfer(l);

        super.setLOD(y * this.maxOpacity );


        /*     if (l < 0.8) this.mesh.geometry = this.geometryLowPoly;
         if (l >= 0.8 && l <= 0.95) this.mesh.geometry = this.geometryAveragePoly;
         if (l > 0.95) this.mesh.geometry = this.geometryHighPoly*/

        if (l < 0.2)
            this.mesh.geometry = this.createResolutionGeometry("Least",2);
       else
        if (l > 0.2 && l < 0.6)
            this.mesh.geometry = this.createResolutionGeometry("Low",5);
        else
        if (l >= 0.6)
            this.mesh.geometry =  this.createResolutionGeometry("Average",10);






    }


    setActive() {
        this.maxOpacity = 0.6;
    }


    setInactive() {
        this.maxOpacity = 0.3;
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