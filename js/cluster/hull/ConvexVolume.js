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


    createFromBoundingBox(vertices, boundingBox) {


        let geo = new THREE.ConvexGeometry(vertices)


        this.geometryLowPoly = geo.clone()
        let modifier = new THREE.SubdivisionModifier(1)
        modifier.modify(geo)
        this.geometryAveragePoly = geo.clone()
        modifier.modify(geo)
        this.geometryHighPoly = geo.clone()

        //FIXME ,polygonOffset:true,polygonOffsetFactor:-4
        let mat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            opacity: 0.03,
            transparent: true,
            depthWrite: false,
            side: THREE.BackSide
        });

        let mesh = new THREE.Mesh(geo, mat);

        mesh.geometry.boundingBox = boundingBox;


        if (this.mesh) this.remove(this.mesh);
        this.mesh = mesh;
        this.add(mesh);
        return this.mesh;

    }


    setLOD(l) {
        super.setLOD(l)
//FIXME lod will only work if we use the generated mesh instead of how we currently just use the geometry so the mouse events will stay at the original mesh

        if (l < 0.3) this.mesh.geometry = this.geometryLowPoly
        if (l >= 0.3 && l <= 0.7) this.mesh.geometry = this.geometryAveragePoly
        if (l > 0.7) this.mesh.geometry = this.geometryHighPoly
    }


    setActive() {



        let opacity = 0.1 * this.lod;
        this.mesh.material.opacity = opacity;

        console.log("setActive",opacity)

    }


    setInactive() {

        let opacity = 0.03 * this.lod;
        this.mesh.material.opacity = opacity;


        console.log("setInactive",opacity)
    }


}