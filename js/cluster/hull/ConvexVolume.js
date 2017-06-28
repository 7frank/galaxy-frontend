/**
 * Created by Frank on 23.06.2017.
 */


import BoxVolume from "./BoxVolume"

/**
 *
 *
 *
 */

export default
class ConvexVolume extends BoxVolume {



    //leaf- bbox => geometry => sum(vertex)
    //ConvexGeometry
    //NOTE also have compute different detailed hulls to set by lod factor
    //eg. if lod <0.3 this.mesh.geometry=this.lowpolyMesh

    constructor(...args) {
        super(...args)

        this.maxOpacity = 0.6

    }


    createFromBoundingBox(vertices, boundingBox) {

        //ConvexGeometry does need at least 4 vertices
        //so in case we don't have as much we do use the boundingbox instead to generate some more vertices
        if (vertices.length < 4)
            vertices = this.getVerticesFromBoundingBox(boundingBox)


        let geo = new THREE.ConvexGeometry(vertices);
         geo.computeBoundingBox();

        let modifier = new THREE.SubdivisionModifier(1);
        modifier.modify(geo);

        this.geometryLowPoly = geo.clone();

        modifier.modify(geo);
        this.geometryAveragePoly = geo.clone();
        modifier.modify(geo);
        this.geometryHighPoly = geo.clone();

        //FIXME ,polygonOffset:true,polygonOffsetFactor:-4
        let mat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            opacity: 0.03,
            transparent: true,
            depthWrite: false,
            side: THREE.BackSide
        });

        //   let mesh = new THREE.Mesh(geo, mat);
        let mesh = new THREE.Mesh(this.geometryLowPoly, mat);

        mesh.geometry.boundingBox = boundingBox;


        if (this.mesh) this.remove(this.mesh);
        this.mesh = mesh;
        this.add(mesh);
        return this.mesh;

    }


    getVerticesFromBoundingBox(boundingBox) {


        let _center = boundingBox.getCenter();
        let _size = boundingBox.getSize();

        let box = new THREE.BoxGeometry(_size.x, _size.y, _size.z);

        box.translate(_center.x, _center.y, _center.z);

        return box.vertices
    }



    //TODO it is probably better to separate the LOD from the visiblility/opacity
    //
    setLOD(l) {


        if (l < 0) l = 0
        if (l > 1) l = 1

        var minOpacity=0.03;

        function mTransfer(x) {
            //transfer function y= 0.5*sin(1.5*pi+x*pi*2)+0.5
            return 0.5 * Math.sin(1.5 * Math.PI + x * Math.PI * 2) + +0.5+minOpacity


        }

        let y = mTransfer(l )
        super.setLOD(y* this.maxOpacity);


        if (l < 0.3) this.mesh.geometry = this.geometryLowPoly;
        if (l >= 0.3 && l <= 0.7) this.mesh.geometry = this.geometryAveragePoly;
        if (l > 0.7) this.mesh.geometry = this.geometryHighPoly
    }


    setActive() {
        this.maxOpacity = 0.6;
    }


    setInactive() {
        this.maxOpacity = 0.3;
    }


}