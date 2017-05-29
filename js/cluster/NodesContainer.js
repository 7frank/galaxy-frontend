	
/**
*  TODO re-structure graph 
* -into graph + subgraphs or simply multiple graphs
* -each graph may have distribution class/function which handles the layouting of the node/edges
* -for example a node-set might divided into different sub-sets depending on current assosiations 
*  they may further contain sub-sets 
* - for rendering, these sets are going to be put into a container class like the "nodeClouds" 
* so a "nodesContainer" and a nodesClusterContainer will be needed which also have the distribution function 
*/		


import BaseDistribution from "./BaseDistribution"
import RandomDistribution from "./RandomDistribution"
import NodeCluster from "./NodeCluster"
import ClusterFactory from "./ClusterFactory"

//TODO
//the basic node
class Node extends THREE.Vector3{
		
}	

//----------------------------------------------------
//----------------------------------------------------
//----------------------------------------------------

/**
 * copy of current implementation
 * TODO rewrite to be able t use sub-clusters
 *
 *
 * @param allNodes object containing all keys and values of current clusters
 * @param options
 * @returns {{container: {}, groupIdList, update: update, updateCrossFade: updateCrossFade, attachTo: attachTo, detach: detach, updateBoundingSpheres: updateBoundingSpheres}}
 */
function createParticleSystemsForClusters(allNodes, options) {

    options = _.extend({
       // minGroupSize: 40
    }, options)

    var groupContainer = {}
    var groupIDs =Object.keys( allNodes)


    for (var id of groupIDs) {
        var nodes = allNodes[id]

        var elem = ParticleNodeGroup(nodes, {
            nodeDefaultSize: 10,
            nodeDefaultScale: 10,
            nodeTexture: "img/dot7.png"
        })

        groupContainer["" + id] = {
            nodes: nodes,
            particles: elem,
            id: id
        }

    }

    function update() {

        _.each(groupContainer, function (el) {
            el.particles.update()
        })

    }

    function updateCrossFade() {

        _.each(groupContainer, function (el) {
            el.particles.updateCrossFade()
        })

    }

    function attachTo(object3d) {

        for (id of groupIDs) {

            object3d.add(groupContainer[id].particles.pointCloud)

        }

    }

    function detach() {

        for (id of groupIDs) {
            var pc = groupContainer[id].particles.pointCloud
            if (pc.parent)
                pc.parent.remove(pc)

        }

    }

    function updateBoundingSpheres() {

        for (id of groupIDs) {
            //var pc = groupContainer[id].particles.pointCloud.geometry.computeBoundingSphere()
            var pc = groupContainer[id].particles.pointCloud;

            var centerPos=getCenterOfMass(pc)

            pc.geometry.computeBoundingSphere()
            pc.geometry.boundingSphere.center.copy(centerPos)


        }

    }

    return {
        container: groupContainer,
        groupIdList: groupIDs,
        update,
        updateCrossFade,
        attachTo,
        detach,
        updateBoundingSpheres
    }

}


//----------------------------------------------------
//----------------------------------------------------
//----------------------------------------------------




//---------------------------
//TODO stub
class ForceGraphDistribution extends BaseDistribution
{
    setEdges(edges){
        this.mEdges=edges
    }

}
//---------------------------
//TODO stub
class SphericalDistribution extends BaseDistribution
{}


//---------------------------
class GlobalNodesContainer
{
	constructor(nodes)
	{
        this.mNodes=new NodeCluster(...nodes)

        //TODO mClusters should work that way
        this.root=new THREE.Object3D()

    }


	
	applyClustering(arr){
    let res=ClusterFactory.doSubdivideIntoClusters({root:this.mNodes},arr)
	    this.mClusters=	res.root

        return this
	}





}
//---------------------------

export class MyGlobalNodesContainer extends GlobalNodesContainer
{
    constructor(nodes)
    {
      super(nodes)

		this.createSample(nodes)

    }

    /**
     * code below for sample clustering
     *
     * -allNodes
     * --sameCompany
     * ---sameIndustry
     *
     */
    createSample(nodes){


        //TODO re-merge function to be able to undo grouping for sizes < 40 like in the default implementation

			function countrySetGenerator(groupFunction, node){

			groupFunction(node.group,node)
			}

			function industrySetGenerator(groupFunction, node){
                groupFunction(node.industry,node)
			}

			//others migh be .. RandomDistribution
			let companyDistributionFunction = new BaseDistribution()
			let categoryDistributionFunction = new RandomDistribution()

			//if a distribution parameter is set, the generated cluster will use it to position the nodes depending on it
			// TODO is it of any use to be able to apply multiple distributions per cluster? like spherical,force-graph?
			//or is it better to create the force graph "by hand"
			this.applyClustering([
                {generator:countrySetGenerator,distribution:companyDistributionFunction,options:{minClusterSize:15}},
				{generator:industrySetGenerator,distribution:categoryDistributionFunction,options:{minClusterSize:5}}

			])


    }


}







	