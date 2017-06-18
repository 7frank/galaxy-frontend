/**
 * Created by Frank on 08.06.2017.
 */

//TODO refactor existing samples
export default
class ZoomUtil {


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



    static
    moveToMesh(mesh, camera, controls, cameraDistanceToMesh = 400, onComplete = function () {
    }) {

         var position = new THREE.Vector3();
        position.setFromMatrixPosition(mesh.matrixWorld);

       ZoomUtil.moveToPosition(position, camera, controls, cameraDistanceToMesh, onComplete)


    }


    /**
     *
     *
     * @param position must be in world coordiantes
     * @param camera
     * @param controls
     * @param cameraDistanceToMesh
     * @param onComplete
     */
    static
    moveToPosition(position, camera, controls, cameraDistanceToMesh = 400, onComplete = function () {
    }) {

        var mTimeout;

        var cameraTargetPosition = controls.target
        var vec3Start = camera.position


      //  var vec3End = new THREE.Vector3();
      //  vec3End.setFromMatrixPosition(mesh.matrixWorld);
        var vec3End=position

        //we want to have a fixed distance to a node when selecting
        var distVec = vec3End.clone().sub(vec3Start)
        var len = distVec.length()
        distVec.normalize()
        distVec.multiplyScalar(cameraDistanceToMesh) //apply fixed distance to the target

        var alteredVecEnd = vec3End.clone().sub(distVec)


        //change distance to target
        var tween = new TWEEN.Tween(vec3Start)
            .to(alteredVecEnd, 400)
            //.onUpdate(function () {})
            .onComplete(function () {
                onComplete.bind(this)();
                cancelAnimationFrame(mTimeout)
            })
            .start();

        //lookat target
        var tween2 = new TWEEN.Tween(cameraTargetPosition)
            .to(vec3End, 400)
            .start();

        requestAnimationFrame(animate);

        function animate(time) {
            mTimeout = requestAnimationFrame(animate);
            TWEEN.update(time);
        }


    }

}