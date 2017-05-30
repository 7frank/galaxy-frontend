/**
 * Created by Frank on 30.05.2017.
 */


/**
 *
 * cluster=new BaseCluster3D(allNodes)
 *  cluster.applyClustering(...) // copy existing stuff
 *
 *  _dist= new ForceGraphDistribution() // set nodes internally
 *
 * cluster.find("#other").setDistribution(_dist)
 * cluster.find("United States").applyClustering(...)
 */


//refactoring current cluster structure
export default
class BaseCluster3D extends Three.Object3D
{

    //TODO implement these stubs in sub class
    //createEdgeContainer(){}
    //createParticlesIfLeafNode(){}
    //createOrUpdateBoundingVolume(){} //can be convex hull in sub class


    constructor(nodes,xClusterClassInstance){
        super();
        this.mNodes=nodes;


        //xCluster if present, use to cluster nodes into sub-clusters
        if (xClusterClassInstance)
        {
             this.subdivideIntoSubClusters(xClusterClassInstance);

            this.hasSubClusters=true;

        }

        this.hasSubClusters=false;


    }





    addAllSubClustersToContainer()
    {
        _.each(this.mClusters,(cluster)=> this.add(cluster))

    }


    /**
     * this method can be re-run to change the sub-clusters
      -which will result in deleting old clusters
      -adding new ones to the container

     */
    subdivideIntoSubClusters(handler,distribution)
   {


       //e. g. return.. {china:instanceof BaseCluster3D}
        let res=handler(this.mNodes)

       this.mClusters= res
       this.addAllSubClustersToContainer();

       distributeElements(distribution)

        return
   }


    distributeElements(/*BaseDistribution*/distibutionHandler){

        if (!distibutionHandler) return; //silent fail

        let dist=   new distibutionHandler()

        dist.for(this.mClusters)

    }

}