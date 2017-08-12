/**
 * Created by Frank on 11.06.2017.
 */

import linkMixin from "./refactor/f0_linkmixin"
import nodeMixin from "./refactor/f0_nodemixin"
import {extendGraphElements} from "./refactor/f1"


export default
class GraphData
{

    constructor(graphData){

            this.mGraphData=graphData
    }

    getClonedRawNodes()
    {
        var mNodes={};

            _.each(this.mGraphData.nodes,function(node,id){
                mNodes[id]=_.extend({x:0,y:0,z:0},node)
            });



        this.mDataNodeCopy=mNodes;


        // Build graph with data
        var d3Nodes  = [];
        for (let nodeId in mNodes) { // Turn nodes into array
            const node =mNodes[nodeId]; // _.extend({},mNodes);
            node._id = nodeId;
            d3Nodes.push(node);
        }
       return d3Nodes

    }

    getAlteredRawLinks(){
        var mDataNodeCopy= this.mDataNodeCopy;

        var links=this.mGraphData.links;

        //FIXME this sets src and dst to the graph data nodes but it should instead link to the cloned nodes so no interference occures
       var  d3Links  = links.map(link => {
            return {
                source: mDataNodeCopy[link[0]],
                target: mDataNodeCopy[link[1]]
            };
        });

    return d3Links



    }

    createClusterNodesAndEdges( view3d)
    {

        //see ForceGraph
        //TODO minimal env options to create a node
        var env={
            nameAccessor:node =>node.name || node.id,
            colorAccessor: node => node.color,
            valAccessor:node => node.val,

            sizeAccessor:node => node.itemCount,

            nodeRelSize:4,
           // useDebugSphere:true,
            domEvents:view3d.mDomEvents
        };




   var d3Nodes= this.getClonedRawNodes();

    if (!d3Nodes.length) {
        return;
    } //if no data is present return for now


    var d3Links =this.getAlteredRawLinks();



    // Add WebGL objects
    d3Nodes.forEach(node => {

        node = nodeMixin(env, node);
     //   node._bubble.name = env.nameAccessor(node) || '';
     //   node.size=env.sizeAccessor(node) || undefined;


    });

    //-----------------------------------------------




    //----------------------


    //nodes are prepared by previous step ? TODO which one was that? for further altering
    extendGraphElements(d3Nodes, d3Links, env);


        return {nodes:d3Nodes,edges:d3Links}

}

    //--------------------------------------------


    /**
     * TODO refactor line group into stand alone class to be used per-cluster
     *
     *
     *
     */
  /*
   initLineGroupHelper( options) {


       var line_geom = new THREE.Geometry();
       var lineMaterial
       var mergedLineMesh





    var defaults = {
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

    mergedLineMesh.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3, 50000);



  return mergedLineMesh


}

*/



}