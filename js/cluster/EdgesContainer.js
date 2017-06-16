/**
 * Created by Frank on 08.06.2017.
 */


import BaseEdge from "./BaseEdge"
import EdgeUtil from "./EdgeUtil"

export default
class EdgesContainer extends THREE.Object3D {
    constructor(...args) {
        super(...args);
        this.initLineMesh();
    }

    addEdge(_edge) {

        //        let newEdge = new BaseEdge(_edge.mStart,_edge.mEnd);
        let newEdge = new BaseEdge( _edge.source._bubble.position, _edge.target._bubble.position);

        this.mEdges.geometry.vertices.push(newEdge.getStart());
        this.mEdges.geometry.vertices.push(newEdge.getEnd());


        return newEdge;
    }

    updateEdges() {

        this.mEdges.geometry.verticesNeedUpdate = true;

    }

    setFromNodes(nodes) {


        let edges = EdgeUtil.getEdgesForNodes(nodes, true, true,false);

      //  let edge2 = EdgeUtil.getEdgesForNodes(nodes, true, false,false);
      //  let edge3 = EdgeUtil.getEdgesForNodes(nodes, false, true,true);

       // console.warn("setFromNodes",edges,edge2,edge3)
      //  console.warn("------------",edges.length,edge2.length,edge3.length)

        for (let edge of edges)
            this.addEdge(edge)


        this.updateEdges();


    }


    initLineMesh() {

        var line_geom = new THREE.Geometry();
        var lineMaterial
        var mergedLineMesh

        function initLineGroup(options) {


            defaults = {
                opacity: 0.01,
                transparent: true,
                //lineIsVisible:true, // if disabled the line won't be shown on the scene
                color: 0xffffff
            }

            options = _.extend(defaults, options)

            lineMaterial = new THREE.MeshBasicMaterial({
                color: options.color,
                transparent: options.transparent,
                opacity: options.opacity,
                depthTest: false,
                depthWrite: false
            });


            mergedLineMesh = new THREE.Line(line_geom, lineMaterial, THREE.LineSegments);


            //TODO compute boundingbox to prevent flicker when edges are partially off screen
            //   mergedLineMesh.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3, 50000);


            return mergedLineMesh;
        }


        this.mEdges = initLineGroup({
            opacity: 0.5,
            color: 0x49616C,
            transparent: true,
        })

        this.add(this.mEdges)


    }


}
