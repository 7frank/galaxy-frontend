	
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

/**
 * a set of node objects
 * the cluster itself also contains parts of the visual representation of the nodes
 * TODO in which case the clster might rather inherit from THREE.Points (point cloud) ?
 */





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


class ClusterLeaf
{
    constructor(nodes){
        this.mNodes=nodes;
        this.mParticles=this.createParticleCloud()

    }


    //TODO refactor
    setDistributionHandler(distribution)
    {
        var that=this;
        distribution.setNodes(this.mNodes,function(vec,i){
           var n= that.mNodes[i];

           n.x=vec.x;
           n.y=vec.y;
           n.z=vec.z;

            that.mParticles.updateNodePosition(i)

        });

    }

    createParticleCloud()
    {

        var elem = ParticleNodeGroup( this.mNodes, {
            nodeDefaultSize: 10,
            nodeDefaultScale: 10,
            nodeTexture: "img/dot7.png"
        })


        return elem
    }



}

//it's important that the clusters are dynamic
//so if we want to reorder elements with a set of new generator functions





class ClusterFactory{

	static doSubdivideIntoClusters(allNodesClustersObject, actionsArray)
	{
		
		var entry=actionsArray.shift()
		
		var _g=entry.generator
        var _dist=entry.distribution

        var options=_.extend({minClusterSize:10,defaultMergeGroupName:"other"},entry.options)


        //....
    var clusters={}

        _.each(allNodesClustersObject,function(nodeCluster, id) {

            var _clustersObj = {};


            //post-process
            //merge clusters that don'tmatch the criterian again
            _.each(nodeCluster.groupBy(_g), function (_cluster, key) {

                if (_cluster.length < options.minClusterSize) {

                    var dMGN = options.defaultMergeGroupName
                    if (typeof  _clustersObj[dMGN] == "undefined") _clustersObj[dMGN] = new NodeCluster()

                    _clustersObj[dMGN] = _clustersObj[dMGN].concat(_cluster)
                }
                else
                    _clustersObj[key] = _cluster

            })


            /*

             TODO position each node by using the distribution function
             TODO also when clustering in a different manner... how to handle already applied distribution? we want the nodes to move to the new cluster instead of simply pop up there
             if (_dist)
             _dist => foreach _clustersObj

             */

            //TODO we want a tree structure for the nodes to be rendered but we might already have such a structure from another
            // iteration so the nodes do have to be put into other groups dynamically

            if (actionsArray.length > 0) {

                    clusters[id] =  ClusterFactory.doSubdivideIntoClusters(_clustersObj, actionsArray);

            }else {

                //no more subdivisions for this branch

               var res= _.map(_clustersObj,function(v,k){

                   let leaf=new ClusterLeaf(v);
                   leaf.setDistributionHandler(_dist)
                   return  leaf

                })

                clusters[id] =  res;
            }
      })
        return clusters


	}
	
}


class BaseDistribution
{
    constructor(){
    this.dimensions=1 //TODO
    }


   setNodes(nodes,onNodePosition)
   {
       let len= nodes.length

      let _len;
       if (this.dimensions==1)
           _len=len;
       if (this.dimensions==1)
           _len= len/Math.sqrt(len);
       if (this.dimensions==1)
           _len= len/Math.pow(len,1/3);


       let step=1/_len

       //1d/2d/3d helpers
       //for (let i=0;i<=1;i+=step)
       var i=0;
       var c=0;
        for (n of nodes)
       {
         let _vec3=  this.distribute(n, i,0,0);

         //TODO set value in particle cloud
           onNodePosition(_vec3,c)

           i+=step
            c++;
       }


   }

  distribute(node,dx,dy,dz){
     return new THREE.Vector3(dx,dy,0)
  }
}

class RandomDistribution extends BaseDistribution
{
    distribute(node,dx,dy){
        return new THREE.Vector3(_.random(-50,50),_.random(-50,50),_.random(-50,50))
    }
}


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

        //TODO mClusters should work that way
        this.root=new THREE.Object3D()

    }


	
	applyClustering(arr){
    let res=ClusterFactory.doSubdivideIntoClusters({root:this.mNodes},arr)
	    this.mClusters=	res.root

        return this
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
                {generator:countrySetGenerator,distribution:categoryDistributionFunction,options:{minClusterSize:15}},
				{generator:industrySetGenerator,distribution:companyDistributionFunction,options:{minClusterSize:5}}

			])


    }


}



	