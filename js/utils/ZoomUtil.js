/**
 * Created by Frank on 08.06.2017.
 */

import TWEEN from "../lib/Tween"
import BaseCluster3D from "../cluster/BaseCluster3D";


/**
 * static helper for smooth navigation within 3D space
 *
 */

export default class ZoomUtil {


    /**
     * used to
     * for further details {@link ZoomUtil.moveToPosition}
     *
     * @param cluster
     * @param options: an object containing a 'complete' callback function and a 'distance' parameter
     *
     *
     */
    static moveToCluster(cluster, options) {

        let defaults = {
            complete: function () {
            },
            distance: 400
        }
        options = _.extend(defaults, options)

        let view = cluster.getView()

        if (!view) {
            console.warn("cluster must be bound to instanceof View3D")
            return
        }


        let mesh = cluster;
        ZoomUtil.moveToMesh(mesh, view.mCamera, view.mControls, options.distance, options.complete);


    }


    /**
     * moves the camera position to a target mesh
     * for further details {@link ZoomUtil.moveToPosition}
     *
     * @param mesh: {@link THREE.Mesh}
     *
     */

    static moveToMesh(mesh, camera, controls, cameraDistanceToMesh = 400, onComplete = function () {
    }) {

        var position = new THREE.Vector3();
        position.setFromMatrixPosition(mesh.matrixWorld);


        //fixes cluster hull center if one is present
        if (mesh instanceof BaseCluster3D && mesh.mHull) {
            console.log(mesh.mHull.mBoundingBox.getCenter())
            let hullCenterPos = mesh.mHull.mBoundingBox.getCenter()
            position = mesh.localToWorld(hullCenterPos)
        }


        ZoomUtil.moveToPosition(position, camera, controls, cameraDistanceToMesh, onComplete)


    }


    /**
     * animates the position and rotation of a given camera {@link THREE.Camera} to the target position
     *
     * @param position: instanceof {@link THREE.Vector3} ... a target position must be provided in world coordinates
     * @param camera: instanceof {@link THREE.Camera}
     * @param controls: instanceof THREE a THREE control class like TrackballControls
     * @param cameraDistanceToMesh: the distance to the target position the camera will stop at
     * @param onComplete: a callback function that is triggered when the animation fphase has ended and the camera is at the target location
     */
    static moveToPosition(position, camera, controls, cameraDistanceToMesh = 400, onComplete = function () {
    }) {


        var mTimeout;

        var cameraTargetPosition = controls.target
        var vec3Start = camera.position


        var isComplete1 = false
        var isComplete2 = false

        //  var vec3End = new THREE.Vector3();
        //  vec3End.setFromMatrixPosition(mesh.matrixWorld);
        var vec3End = position

        //we want to have a fixed distance to a node when selecting
        var distVec = vec3End.clone().sub(vec3Start)
        var len = distVec.length()
        distVec.normalize()
        distVec.multiplyScalar(cameraDistanceToMesh) //apply fixed distance to the target

        var alteredVecEnd = vec3End.clone().sub(distVec)

        //-------------------------------------
        //rotate the vector to be orientated on 0,0,1   //this will have not much impact on the 3d zoom but will prevent the 2d zoom from rotating
        //TODO find an alternative solution

        let distVec2d = new THREE.Vector3(0, 0, -1).multiplyScalar(distVec.length())
        alteredVecEnd = vec3End.clone().sub(distVec2d)

        // -------------------------------------


        //change distance to target
        var tween = new TWEEN.Tween(vec3Start)
            .to(alteredVecEnd, 400)
            //.onUpdate(function () {})
            .onComplete(function () {
                onComplete.bind(this)();
                cancelAnimationFrame(mTimeout)
                isComplete1 = true
            })
            .start();

        //lookat target
        var tween2 = new TWEEN.Tween(cameraTargetPosition)
            .to(vec3End, 400).onComplete(function () {
                isComplete2 = true
            })
            .start();

        requestAnimationFrame(animate);

        function animate(time) {

            if (isComplete1 && isComplete2) return;

            mTimeout = requestAnimationFrame(animate);
            tween.update(time);
            tween2.update(time);
        }


    }

}