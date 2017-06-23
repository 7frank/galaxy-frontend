/**
 * Created by Frank on 22.06.2017.
 */

/**
 * the default implementation for a hull/volume around a cluster/sub-cluster
 *
 *
 */



export default
class BaseVolume {

    constructor() {

        this.lod=1

    }


    /**
     * lod is  value between 0 and 1 that can be used to render elements level-of-detail specific
     * eg. depending on the distance of camera and object
     *
     * @param newLOD
     */
    setLOD(newLOD)
    {
        if (newLOD<0) newLOD=0;
        if (newLOD>1) newLOD=1;


        this.lod=newLOD


    }



    /**
     * determines if the volume is can be made visible to the user
     *
     * @returns {boolean}
     */

    canBeVisible()
    {
        return false
    }


//FIXME have a better approach to generate the hull
//? rather: create from vertices
    createFromBoundingBox(vertices,boundingBox) {

        let _center = boundingBox.getCenter();
        let _size = boundingBox.getSize();

        let box = new THREE.BoxGeometry(_size.x, _size.y, _size.z);

        let geo = new THREE.EdgesGeometry(box); // or WireframeGeometry( geometry )

        let mat = new THREE.LineBasicMaterial({color: 0xffffff, linewidth: 5, opacity: 0.1, transparent: true});

        let wireframe = new THREE.LineSegments(geo, mat);
        wireframe.position.add(_center);
        wireframe.geometry.boundingBox=boundingBox;

        this.mesh=this.mix(wireframe);


        return this.mesh




    }


    mix(mesh)
    {

        mesh.setActive=function(){

           this.material.opacity=1;

        }


        mesh.setInactive=function(){

        this.material.opacity=0.3

        }

        return mesh


    }




}

