/**
 * Created by Frank on 08.06.2017.
 */


import BaseEdge from "./BaseEdge"
import EdgeUtil from "./EdgeUtil"
import * as THREE from "three";
import _ from "lodash";

/**
 * NOTE: the nodes for this container need to be child elements of the  same cluster
 *
 *  TODO the edgescontainer should have some sort of line factory which we can plugin a specific line implementation
 *  this way we can have something like the basic line which does have a geometry for each line
 *  and alternativly some implementation like the line-mesh
 *
 */

export default class EdgesContainer extends THREE.Object3D {
    constructor(...args) {
        super(...args);
        this.initLineMesh();

        this.mExternalNodesHelpers = [];


        this.setSkipParams(1);

        this.setRenderMode(true, true, true)


    }

    setSkipParams(numSkipEdges, numDefaultMinimum = 20) {
        if (numSkipEdges < 1) numSkipEdges = 1


        this.skipEdges = numSkipEdges;
        this.numDefaultMinimum = numDefaultMinimum;
        return this;
    }


    setRenderMode(drawInternalEdges, drawOutgoingEdges, drawIngoingEdges) {
        this.drawInternalEdges = drawInternalEdges;
        this.drawOutgoingEdges = drawOutgoingEdges;
        this.drawIngoingEdges = drawIngoingEdges;

        return this;
    }


    addEdge(_edge) {


        var that = this;

        function createExternalNodeHelper(node, internalOtherNode) {
            var nPos = node._bubble.position;
            var adjustedPos = new THREE.Vector3();

            return {
                position: adjustedPos,
                update: function () {

                    if (!node.getParentCluster()) return; //not connected
                    if (!internalOtherNode.getParentCluster()) return; //not connected

                    adjustedPos.setFromMatrixPosition(node.getParentCluster().matrixWorld);
                    //setFromMatrix
                    adjustedPos.add(nPos);
                    let other = new THREE.Vector3();
                    other.setFromMatrixPosition(internalOtherNode.getParentCluster().matrixWorld);
                    adjustedPos.sub(other)


                }
            }
        }

        //we need to keep track of  edges that are within it's container and those who are linked to outer elements
        //so all nodes within the edges that link into another cluster (!isSrcInternalNode)
        //are stored for later updating

        //        let newEdge = new BaseEdge(_edge.mStart,_edge.mEnd);
        let newEdge = new BaseEdge(_edge.source._bubble.position, _edge.target._bubble.position);


        if (!_edge.isSrcInternalNode) {
            let helper = createExternalNodeHelper(_edge.source, _edge.target);
            this.mExternalNodesHelpers.push(helper);
            this._vertexList.push(helper.position);

        }
        else
            this._vertexList.push(newEdge.getStart());


        if (!_edge.isTrgInternalNode) {
            let helper = createExternalNodeHelper(_edge.target, _edge.source);
            this.mExternalNodesHelpers.push(helper);
            this._vertexList.push(helper.position);

        }
        else
            this._vertexList.push(newEdge.getEnd());


        return newEdge;
    }

    updateEdges() {

        if (this.mExternalNodesHelpers.length > 0)
            _.each(this.mExternalNodesHelpers, helper => helper.update());

        const verts = this._vertexList;
        const arr = new Float32Array(verts.length * 3);
        for (let i = 0; i < verts.length; i++) {
            arr[i * 3] = verts[i].x;
            arr[i * 3 + 1] = verts[i].y;
            arr[i * 3 + 2] = verts[i].z;
        }
        const attr = new THREE.BufferAttribute(arr, 3);
        this.mEdges.geometry.setAttribute('position', attr);
        this.mEdges.geometry.attributes.position.needsUpdate = true;

    }

    setFromNodes(nodes) {


        let edges = EdgeUtil.getEdgesForNodes(nodes, this.drawInternalEdges, this.drawOutgoingEdges, this.drawIngoingEdges);


        //skip edges for better performance
        //TODO option to filter by size and take only most relevant n elements
        let edgeCounter = 0;

        let skip = this.skipEdges;

        if (nodes.length / this.skipEdges < this.numDefaultMinimum)
            skip = Math.floor(nodes.length / this.numDefaultMinimum, 1)

        edges = edges.filter(e => edgeCounter++ % skip == 0);


        for (let edge of edges)
            this.addEdge(edge)


        this.updateEdges();


    }


    initLineMesh() {

        this._vertexList = [];

        const line_geom = new THREE.BufferGeometry();
        line_geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(0), 3));

        const initLineGroup = (options) => {
            let defaults = {
                opacity: 0.01,
                transparent: true,
                color: 0xffffff
            };

            options = _.extend(defaults, options);

            const lineMaterial = new THREE.LineBasicMaterial({
                color: options.color,
                transparent: options.transparent,
                opacity: options.opacity,
                depthTest: true,
                depthWrite: false
            });

            return new THREE.LineSegments(line_geom, lineMaterial);
        };


        this.mEdges = initLineGroup({
            opacity: 0.2,
            color: 0x49616C,
            transparent: true,
        });

        this.add(this.mEdges)


    }


}
