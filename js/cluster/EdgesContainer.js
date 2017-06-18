/**
 * Created by Frank on 08.06.2017.
 */


import BaseEdge from "./BaseEdge"
import EdgeUtil from "./EdgeUtil"


/**
 * NOTE: the nodes for this container need to be child elements of the  same cluster
 *
 *
 */

export default
class EdgesContainer extends THREE.Object3D {
    constructor(...args) {
        super(...args);
        this.initLineMesh();

        this.mExternalNodesHelpers=[]


        this.skipEdges=10;
        this.drawInternalEdges=true;
        this.drawOutgoingEdges=true;
        this.drawIngoingEdges=true;

    }

    addEdge(_edge) {


        var that = this

        function createExternalNodeHelper(node,internalOtherNode) {
            var nPos = node._bubble.position
            var adjustedPos = new THREE.Vector3

            return {
                position: adjustedPos,
                update: function () {

                    //FIXME currently does not match with arrowhelpers so .. invalid

                    if (!node.get3DRoot().parent) return //not connected


                    adjustedPos.setFromMatrixPosition( node.get3DRoot().parent.matrixWorld );

                    //setFromMatrix
                    adjustedPos.add(nPos)
                    let other=new THREE.Vector3
                    other.setFromMatrixPosition( internalOtherNode.get3DRoot().parent.matrixWorld );

                    adjustedPos.sub(other)


                }
            }
        }

        //we need to keep track of  edges that are within it's container and those who are linked to outer elements
        //so all nodes within the edges that link into another cluster (!isSrcInternalNode)
        //are stored for later updating

        //        let newEdge = new BaseEdge(_edge.mStart,_edge.mEnd);
        let newEdge = new BaseEdge(_edge.source._bubble.position, _edge.target._bubble.position);


        if (!_edge.isSrcInternalNode)
        {
            let helper = createExternalNodeHelper(_edge.source,_edge.target)
            this.mExternalNodesHelpers.push(helper)
            this.mEdges.geometry.vertices.push(helper.position);

         }
         else
        this.mEdges.geometry.vertices.push(newEdge.getStart());


        if (!_edge.isTrgInternalNode)
        {
            let helper = createExternalNodeHelper(_edge.target,_edge.source)
            this.mExternalNodesHelpers.push(helper)
            this.mEdges.geometry.vertices.push(helper.position);

        }
        else
            this.mEdges.geometry.vertices.push(newEdge.getEnd());






       // this.mEdges.geometry.vertices.push(newEdge.getStart());
       // this.mEdges.geometry.vertices.push(newEdge.getEnd());


        return newEdge;
    }

    updateEdges() {

        _.each(this.mExternalNodesHelpers,helper => helper.update())

        this.mEdges.geometry.verticesNeedUpdate = true;

    }

    setFromNodes(nodes) {





        let edges = EdgeUtil.getEdgesForNodes(nodes, this.drawInternalEdges,this.drawOutgoingEdges,this.drawIngoingEdges);

    //skip edges for better performance
        //TODO option to filter by size and take only most relevant n elements
        let edgeCounter=0;
        edges= edges.filter( e => edgeCounter++%this.skipEdges==0 )


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
                depthTest: true,
                depthWrite: false
            });


            mergedLineMesh = new THREE.Line(line_geom, lineMaterial, THREE.LineSegments);


            //TODO compute boundingbox to prevent flicker when edges are partially off screen
            //   mergedLineMesh.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3, 50000);


            return mergedLineMesh;
        }


        this.mEdges = initLineGroup({
            opacity: 0.2,
            color: 0x49616C,
            transparent: true,
        })

        this.add(this.mEdges)


    }


}
