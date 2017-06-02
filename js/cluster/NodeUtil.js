/**
 * Created by Frank on 02.06.2017.
 */

import BaseNode from "./BaseNode"

export default
class NodeUtil {

   static zoomToNode(nodeMesh, onEnd) {

       let mCamera= BaseNode.domEvents._camera
        var mTimeout;

        let minMaxDistance = 400;

        let vec3Start = mCamera.position;
        let vec3End = nodeMesh.position;


        //we want to have a fixed distance to a node when selecting
       let distVec = vec3End.clone().sub(vec3Start);
       let len = distVec.length();
        distVec.normalize()
        distVec.multiplyScalar(minMaxDistance) //apply fixed distance to the target

        let alteredVecEnd = vec3End.clone().sub(distVec)


        if (typeof onEnd != "function") onEnd = function () {
        };

        //change distance to target
       let tween = new TWEEN.Tween(vec3Start)
            .to(alteredVecEnd, 400)
           // .onUpdate(function (){})
           .onComplete(function(){

               onEnd()
               cancelAnimationFrame(mTimeout)

           })
            .start();

        //lookat target
       let tween2 = new TWEEN.Tween(globalEnv.controls.target)
            .to(vec3End, 400)
            //.onUpdate(function () {})
            .start();

        requestAnimationFrame(animate);

        function animate(time) {
        mTimeout=    requestAnimationFrame(animate);
            TWEEN.update(time);
        }

    }

}