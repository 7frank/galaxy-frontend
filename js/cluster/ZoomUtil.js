/**
 * Created by Frank on 08.06.2017.
 */

//TODO refactor existing samples
export default
class ZoomUtil
{


    static moveToMesh(mesh,onEnd,minMaxDistance=400) {

        var mTimeout;

    var vec3Start = mCamera.position


    var vec3End = new THREE.Vector3();
    vec3End.setFromMatrixPosition( mesh.matrixWorld );

    //	var vec3End = mesh.position //e.target.position


    //we want to have a fixed distance to a node when selecting
    var distVec = vec3End.clone().sub(vec3Start)
    var len = distVec.length()
    distVec.normalize()
    distVec.multiplyScalar(minMaxDistance) //apply fixed distance to the target

    var alteredVecEnd = vec3End.clone().sub(distVec)


    if (typeof onEnd!="function") onEnd=function(){}
    //change distance to target
    var tween = new TWEEN.Tween(vec3Start)
        .to(alteredVecEnd, 400)
        .onUpdate(function () {

        }).onComplete(function(){  onEnd.bind(this)();  cancelAnimationFrame(mTimeout)  })
        .start();

    //lookat target
    var tween2 = new TWEEN.Tween(globalEnv.controls.target)
        .to(vec3End, 400)
        .onUpdate(function () {

        })
        .start();

    requestAnimationFrame(animate);

        function animate(time) {
            mTimeout=    requestAnimationFrame(animate);
            TWEEN.update(time);
        }

}


}