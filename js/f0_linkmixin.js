/**
 * Created by Frank on 16.07.2017.
 */




function linkMixin(env, link, options) {

    if (link._mixin_) return;
    link._mixin = true;

    defaults = {
        opacity: 0.01,
        transparent: true,
        lineIsVisible: true, // if disabled the line won't be shown on the scene
        color: 0xffffff
    };

    options = _.extend(defaults, options);

    function createBasicLineMesh() {


        var lineMaterial = new THREE.MeshBasicMaterial({
            color: options.color,
            transparent: options.transparent,
            opacity: options.opacity
        });
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

    //----------------------------

    /*
     function createExtLineHelper() {


     var line = new MeshLine();
     var material = new MeshLineMaterial({transparent: options.transparent, opacity: options.opacity});

     var mStart = new THREE.Vector3;
     var mEnd = new THREE.Vector3;

     return {
     setStart: function (vec3) {
     mStart = vec3
     }, setEnd: function (vec3) {
     mEnd = vec3
     },
     getLine: function (srcWidth = 1, dstWidth = 1) {


     var geo = new THREE.Geometry();
     geo.vertices = [mStart, mEnd];
     line.setGeometry(geo, function (p) {

     var ratio = (srcWidth * p) + (dstWidth * (1 - p));
     return ratio / 10
     });
     var lineMesh = new THREE.Mesh(line.geometry, material);

     return lineMesh
     }
     };

     }

     */


    /*   if (env.useLineWidthFeature == true && (link.source.isGroupNode || link.target.isGroupNode)) {

     var helper = createExtLineHelper();

     helper.setStart(new THREE.Vector3);
     helper.setEnd(new THREE.Vector3);


     link._line =//new THREE.Object3D
     helper.getLine();

     _.extend(link, {

     setStartEnd: function (mVecStart, mVecEnd) {
     this.mStart = new THREE.Vector3(mVecStart.x, mVecStart.y || 0, mVecStart.z || 0);
     this.mEnd = new THREE.Vector3(mVecEnd.x, mVecEnd.y || 0, mVecEnd.z || 0);


     helper.setStart(this.mStart);
     helper.setEnd(this.mEnd);


     //FIXME handle line like a container to maintain event handlers and such
     env.scene.remove(link._line);
     link._line;
     link._line = helper.getLine(this.source.link_count || 1, this.target.link_count || 1);
     env.scene.add(link._line);

     }
     })


     }
     else {


     if (env.useLineGroup) {

     var lg = createLineGroupElem();


     link._line = {};
     _.extend(link, {

     setStartEnd: function (mVecStart, mVecEnd) {

     lg.start.copy(mVecStart);
     lg.stop.copy(mVecEnd);

     this.mStart = lg.start;
     this.mEnd = lg.stop;

     lg.update()

     }
     })


     }
     else { */


    link._line = createBasicLineMesh();
    /*
     _.extend(link, {

     setStartEnd: function (mVecStart, mVecEnd) {

     this.mStart = new THREE.Vector3(mVecStart.x, mVecStart.y || 0, mVecStart.z || 0);
     this.mEnd = new THREE.Vector3(mVecEnd.x, mVecEnd.y || 0, mVecEnd.z || 0);

     this._line.geometry.vertices[0] = this.mStart;
     this._line.geometry.vertices[1] = this.mEnd;

     this._line.geometry.verticesNeedUpdate = true;
     //this._line.geometry.computeBoundingSphere();


     }
     })*/
    // }


    // }


    basicElementExtend(env, link, link._line)


}