/**
 * Created by Frank on 16.07.2017.
 */


//Feature 2 zoom and search
//@deprecated use ZoomUtil instead
function doZoomToMesh(mesh, onEnd, minMaxDistance = 400) {


    let view = $(".view-3d[hasFocus]")[0];

    if (!view) view = $(".view-3d.view-3d-maximised").get(0);

    if (!view) console.warn("no view focused to be able to zoom");


    let camera = view.mCamera;
    let controls = view.mControls;


    var vec3Start = camera.position;


    var vec3End = new THREE.Vector3();
    vec3End.setFromMatrixPosition(mesh.matrixWorld);

    //	var vec3End = mesh.position //e.target.position


    //we want to have a fixed distance to a node when selecting
    var distVec = vec3End.clone().sub(vec3Start);
    var len = distVec.length();
    distVec.normalize();
    distVec.multiplyScalar(minMaxDistance); //apply fixed distance to the target

    var alteredVecEnd = vec3End.clone().sub(distVec);


    if (typeof onEnd != "function") onEnd = function () {
    };
    //change distance to target
    var tween = new TWEEN.Tween(vec3Start)
        .to(alteredVecEnd, 400)
        .onUpdate(function () {

        }).onComplete(onEnd)
        .start();

    //lookat target
    var tween2 = new TWEEN.Tween(controls.target)
        .to(vec3End, 400)
        .onUpdate(function () {

        })
        .start();

    requestAnimationFrame(animate);

    function animate(time) {
        requestAnimationFrame(animate);
        TWEEN.update(time);
    }

}

