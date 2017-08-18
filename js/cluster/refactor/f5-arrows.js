/**
 * Created by Frank on 16.07.2017.
 */


//------------------------------------------------
//Feature 5 arrows


function _findSceneForMesh(mesh, maxIter = 99) {
    var scene = null;
    while (mesh.parent && maxIter--) {
        if (mesh.parent instanceof THREE.Scene) return mesh.parent;
        mesh = mesh.parent
    }

    return scene

}


//NOTE: add arrows only to selection to improve performance
export
function addArrow(d3LinkObj, color, options) {


    var defaults = {
        highlightArrowType: "line"

    };

    var env = _.extend(defaults, options);


    if (d3LinkObj.arrow) return;

    var lineMesh = d3LinkObj._line;

    //TODO set arrow to sphere radius not center


    //	var from0 = d3LinkObj.mStart
    //	var to0 = d3LinkObj.mEnd


    var from0 = new THREE.Vector3();
    from0.setFromMatrixPosition(d3LinkObj.source._bubble.matrixWorld);


    var to0 = new THREE.Vector3();
    to0.setFromMatrixPosition(d3LinkObj.target._bubble.matrixWorld);


    //TODO
    if (!to0) return;

    var distVec = to0.clone().sub(from0);
    var len = distVec.length();

    /**
     * TODO currently the arrow helper gets used which creates some "ditter" effect when rendered at the same position as a edge
     *
     */


    //distVec.normalize()
    distVec.multiplyScalar(0.9);
    //change start and end of arrow
    var from = from0.clone().add(distVec);
    var to = to0.clone().sub(distVec);


    var direction = to.clone().sub(from);
    var length = direction.length();

    var headLength = 0.2 * len * 0.2; //use original length


    var arrowHelper;


    if (env.highlightArrowType == "line") {
        let dir = to0.clone().sub(from0);
        let len = dir.length();

        arrowHelper = new THREE.ArrowHelper(dir.normalize(), from0, len, color || 0x0000FF, 0.001, 0.001); //setting headlength and with to zero will trigger lots of warnings


    }
    else if (env.highlightArrowType == "animated") {
        let dir = to0.clone().sub(from0);
        let len = dir.length();

        arrowHelper = new CustomAnimatedLineMesh(direction.normalize(), from, length, color || 0x0000FF, 1, "img/arrow.png")

    }
    else if (env.highlightArrowType == "simple")
        arrowHelper = new THREE.ArrowHelper(direction.normalize(), from, length, color || 0x0000FF, headLength, 0.4 * headLength);
    else if (env.highlightArrowType == "double")
        arrowHelper = new ArrowExt(direction.normalize(), from, length, color || 0x0000FF, headLength, 0.4 * headLength);


    d3LinkObj.arrow = arrowHelper;
    //lineMesh.parent.add(arrowHelper);


    var scene = _findSceneForMesh(d3LinkObj.source.get3DRoot());

    if (!scene)   scene = _findSceneForMesh(d3LinkObj.target.get3DRoot());

    if (!scene) {
        console.warn("no scene found arrows can't be created");
      //  debugger;
    }
    else
        scene.add(arrowHelper);

}

export
function removeArrow(d3LinkObj) {
    if (!d3LinkObj.arrow) return;
    //TODO
    //var env=globalEnv;
    var lineMesh = d3LinkObj._line;


    if (d3LinkObj.arrow) {
        let parent = d3LinkObj.arrow.parent;

        //lineMesh.parent.remove(d3LinkObj.arrow);
        if (parent)
            parent.remove(d3LinkObj.arrow);


        d3LinkObj.arrow = null;
    }
}
