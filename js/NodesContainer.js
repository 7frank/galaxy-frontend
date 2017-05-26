	
/**
*  TODO re-structure graph 
* -into graph + subgraphs or simply multiple graphs
* -each graph may have distribution class/function which handles the layouting of the node/edges
* -for example a node-set might divided into different sub-sets depending on current assosiations 
*  they may further contain sub-sets 
* - for rendering, these sets are going to be put into a container class like the "nodeClouds" 
* so a "nodesContainer" and a nodesClusterContainer will be needed which also have the distribution function 
*/		
	

//the basic node
class Node extends THREE.Vector3{
		
}	

// a set of nodes with some similarities
class NodeCluster extends Array //List<Node>
{

    //FIXME
	/*push(el)
	{

		if (! el instanceof Node  ) throw new Error("NodeCluster must only contain instanceof",Node)
		return super.apply(this,arguments)
	}*/


    groupBy( filterFunction){
      let container={}

        function groupFunction(key,val)
        {
           if (typeof container[key]=="undefined")   container[key]=new NodeCluster();

            container[key].push(val)
        }

	    for (el of this)
        filterFunction(groupFunction,el)


        return container

    }

}



//used to generate arbitrary subsets of nodes from the whole node data
/*
class ClusterFactory
{
	//ClusterFactory(GlobalNodeCluster nodes){}
	
	//ClusterFactory(GlobalNodeCluster[] clusters){}
	

	List<NodeCluster> groupBy(Function filterFunction){
	}
		
	
	List<NodeCluster> groupBy(NodeCluster nodes,Function filterFunction){
		}	
		
	
}	
	

class DistributionHandler
{
	DistributionHandler(Function onNodeFunction)
	//for animating nodes
	setDestinations(){
	}
	
	List<THREE.Vector3> computeDistribution(){
	//@pseudo	
		for (i)
		onNodeFunction(n,i)
			
	return destinations
	}
	
	update(){	
	
	
	}
}
*/

//recursive		
class Container extends THREE.Object3D{
  //position provided by inheritance
 constructor()
 {
	 super();
 	//NodeCluster nodes;
 	//DistributionHandler distribution;

 }

  
  update(){
	super.update();
	this.distribution.update();
  }
  
}




//----------------------------------------------------
//----------------------------------------------------
//----------------------------------------------------

/**
 * copy of current implementation
 * TODO rewrite to be able t use sub-clusters
 *
 *
 * @param allNodes
 * @param options
 * @returns {{container: {}, groupIdList, update: update, updateCrossFade: updateCrossFade, attachTo: attachTo, detach: detach, updateBoundingSpheres: updateBoundingSpheres}}
 */
function createParticleSystemsByGroupAttrTODO(allNodes, options) {

    options = _.extend({
        minGroupSize: 40
    }, options)

    var groupContainer = {}
    var groupIDs = allNodes.map((v) => v.group);
    groupIDs = _.uniq(groupIDs)

    for (var id of groupIDs) {
        var nodes = globalNodes.filter((v) => v.group == id)

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

//it's important that the clusters are dynamic
//so if we want to reorder elements with a set of new generator functions

class ClusterFactory{

	static doSubdivideIntoClusters(allNodesClustersArray, actionsArray)
	{
		
		var entry=actionsArray.pop()
		
		var _g=entry.generator
        var _dist=entry.distribution


        //....
    var clusters=[]
    debugger
      for (let allNodesCluster of allNodesClustersArray) {

          var _clusters = allNodesCluster.groupBy(_g)

          /*

           TODO position each node by using the distribution function
           TODO also when clustering in a different manner... how to handle already applied distribution? we want the nodes to move to the new cluster instead of simply pop up there
           if (_dist)
           _dist => foreach _clusters

           */

          //TODO we want a tree structure for the nodes to be rendered but we might already have such a structure from another
          // iteration so the nodes do have to be put into other groups dynamically
          if (actionsArray.length > 0) {

              _clusters.children = ClusterFactory.doSubdivideIntoClusters(_clusters, actionsArray)
              clusters.push(_clusters)
          }
          else {
              _clusters.children=[]  //empty array of NodeCluster
          clusters.push(_clusters)
        }
      }
        return _clusters


	}
	
}

//TODO stub
class BaseDistribution
{}
//TODO stub
class ForceGraphDistribution extends BaseDistribution
{}
//TODO stub
class SphericalDistribution extends BaseDistribution
{}



class GlobalNodesContainer
{
	constructor(nodes)
	{
        this.mNodes=new NodeCluster(...nodes)

    }


	
	applyClustering(arr){

	
	ClusterFactory.doSubdivideIntoClusters([this.mNodes],arr)
		
	}

}



class MyGlobalNodesContainer extends GlobalNodesContainer
{
    constructor(nodes)
    {
      super(nodes)

		this.createSample(nodes)

    }

    /**
     * pseudo code below for sample clustering
     *
     * -allNodes
     * --sameCompany
     * ---sameCategory
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
			let companyDistributionFunction = new ForceGraphDistribution
			let categoryDistributionFunction = new SphericalDistribution

			//if a distribution parameter is set, the generated cluster will use it to position the nodes depending on it
			// TODO is it of any ose to be able to apply multiple distributions per cluster? like spherical,force-graph?
			//or is it better to create the force graph "by hand"
			this.applyClustering([
				{generator:industrySetGenerator,distribution:companyDistributionFunction},
				{generator:countrySetGenerator,distribution:categoryDistributionFunction}
			])


    }


}



	