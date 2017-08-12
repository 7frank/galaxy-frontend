/**
 * Created by Frank on 16.07.2017.
 */

import {basicElementExtend} from "../cluster/refactor/f0-basic-element-3d-classes"

export default
function linkMixin(env, link, options) {

    if (link._mixin_) return;
    link._mixin = true;


    /*
  let defaults = {
        opacity: 0.01,
        transparent: true,
        lineIsVisible: true, // if disabled the line won't be shown on the scene
        color: 0xffffff
    };

    options = _.extend(defaults, options);
*/

    //TODO check if cluster edges used line group
    /*
    var lineMaterial = new THREE.MeshBasicMaterial({
        color: options.color,
        transparent: options.transparent,
        opacity: options.opacity
    });

    function createBasicLineMesh() {



        if (env.lineOpacity) //deprecated?
            lineMaterial.opacity = env.lineOpacity;


        var line = new THREE.Line(new THREE.Geometry(), lineMaterial);
        line.geometry.vertices = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)];

        return line;

    }


    //--------------------------------

    function createLineGroupElem() {


        var start = new THREE.Vector3(0, 0, 0);
        var stop = new THREE.Vector3(0, 0, 0);


        //naive approach to reduce the edge count for larger graph

        if (options.lineIsVisible) {
            env.mergedLineMesh.geometry.vertices.push(start);
            env.mergedLineMesh.geometry.vertices.push(stop);
        }


        return {
            start, stop, update: function () {
                env.mergedLineMesh.geometry.verticesNeedUpdate = true;
            }
        };

    }
    */


  //  basicElementExtend(env, link, link._line)


}