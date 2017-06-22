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


    createFromBoundingBox(boundingBox) {

        let _center = boundingBox.getCenter();
        let _size = boundingBox.getSize()

        var box = new THREE.BoxGeometry(_size.x, _size.y, _size.z)

        var geo = new THREE.EdgesGeometry(box); // or WireframeGeometry( geometry )

        var mat = new THREE.LineBasicMaterial({color: 0xffffff, linewidth: 5, opacity: 0.1, transparent: true});

        var wireframe = new THREE.LineSegments(geo, mat);
        wireframe.position.add(_center)
        wireframe.geometry.boundingBox=boundingBox

        return wireframe


    }





}

