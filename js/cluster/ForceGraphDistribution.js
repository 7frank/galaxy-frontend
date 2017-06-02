/**
 * Created by Frank on 02.06.2017.
 */

import BaseDistribution from "./BaseDistribution"

import EdgeUtil from "./EdgeUtil"




/*
* TODO the forceGraphDistribution should work like a normal force graph
* but optimally is could use a initial distribution from another dist function with no animation enabled
*
* */



export default
class ForceGraphDistribution extends BaseDistribution
{
    constructor(scale=50,dimensions=1){
        super(scale,dimensions);

    }
    /**
     * a reduced simulation (for testing)
     * TODO add edges and rest of original src
     * @param nodes
     * @param edges
     * @param onTick
     * @param onTICKComplete
     */
    startSimulation(nodes, edges = [], onTick, onTICKComplete) {

        // Add force-directed layout
        let layout = d3_force.forceSimulation();

        //   console.log(... arguments)


        //FIXME containers need links
        layout
            .numDimensions(this.dimensions)
            .nodes(nodes)
            .force('link', d3_force.forceLink().id(function (d) {
                return d._id
            })
                .distance(function computeLinkDistance() {
                    return 20;

                })
                .links(edges))
            .force("collide", d3_force.forceCollide(60)
                .iterations(1))
            .force('charge', (node) => -300)
            .force('linkStrength', (link) => 1)


            .stop();

        layout.on("tick", function () {
            onTick(layout, nodes, edges)
            if (onTICKComplete) onTICKComplete()
        }).on('end', function () {
        }).restart();

    }




    setNodes(nodes,onNodePositionChange)
    {


        //Note: might fail if nodes don't contain correct edges
        let mEdges = EdgeUtil.getEdgesForNodes(nodes, true, false);


        var mNodes=nodes.map(function(n){

            (n.position)?n.position.copy(new THREE.Vector3(0,0,0)):_.extend(n,{x:0,y:0,z:0});

            return (n.position)?n.position:n;


        })


        this.startSimulation(mNodes, mEdges, function layoutTick(layout, d3Nodes, d3Links) {

            // Update nodes position
            //TODO remove this when particle node groups work with picking and selecting
          /*  d3Nodes.forEach(node => {

                const sphere = node._bubble;
                sphere.position.x = node.x;
                sphere.position.y = node.y || 0;
                sphere.position.z = node.z || 0;

            });*/

          _.each(d3Nodes,onNodePositionChange)


        }, function () {

         /*   _.each(pcbs, function (pcElem) {
                //updates the array buffer for the point cloud
                pcElem.update()

            })*/

        });


    }

    //TODO this should be called to distribute the elements of the country layer when finished
    //TODO also it will be useful to add rotation as well in the future


    distribute(node,dx,dy,dz){

        return {position:new THREE.Vector3(0,0,0)}

      //  return {position:new THREE.Vector3(dx,dy,dz).multiplyScalar(this.mScale)};

     }
}

