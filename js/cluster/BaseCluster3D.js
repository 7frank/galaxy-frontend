/**
 * Created by Frank on 30.05.2017.
 */


import ClusterFactory from "./ClusterFactory"

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
class BaseCluster3D extends THREE.Object3D {

    //TODO implement these stubs in sub class
    //createEdgeContainer(){}
    //createParticlesIfLeafNode(){}
    //createOrUpdateBoundingVolume(){} //can be convex hull in sub class

    /**
     *
     * @param nodes
     * @param clusteringHandler instanceof List<ClusteringHandler>
     */
    constructor(nodes, clusteringHandlers) {
        super();
        this.addNodes(nodes);
        //by default the cluster is no leaf. TODO
        this.isLeaf=false;
        this.mClusters={}


        //xCluster if present, use to cluster nodes into sub-clusters
        if (_.isArray(clusteringHandlers) && clusteringHandlers.length>0) {
            this.applyClustering(clusteringHandlers);

        }




    }

    addNodes(nodes) {
        if (!this.mNodes) this.mNodes = []

        if (typeof nodes == "undefined") return

        if (_.isArray(nodes))
            this.mNodes = this.mNodes.concat(nodes)
        else
            this.mNodes.push(nodes)

    }

    getNodes() {
        return this.mNodes;
    }


    addAllSubClustersToContainer() {

        _.each(this.mClusters, (cluster) => this.add(cluster))

    }


    /**
     * this method can be re-run to change the sub-clusters
     -which will result in deleting old clusters
     -adding new ones to the container

     */

    applyClustering(clusteringHandlers) {

        //e. g. result should be .. {china:instanceof BaseCluster3D}



        this._clusterThis(clusteringHandlers[0])
        console.log("_clusterThis",Object.keys(this.mClusters),this.mClusters)
        this.doSubdivideIntoClustersNEW(this.mClusters, clusteringHandlers)

        this.addAllSubClustersToContainer();

    }

    _clusterThis(entry)
    {

        var options = _.extend({minClusterSize: 10, defaultMergeGroupName: "other"}, entry.options)


        var _clustersObj = {};


        //post-process
        //merge clusters that don't match the criteria again
        _.each(this.groupBy(entry.generator), function (_cluster, key) {

            if (_cluster.getNodes().length < options.minClusterSize) {

                var dMGN = options.defaultMergeGroupName
                if (typeof  _clustersObj[dMGN] == "undefined") _clustersObj[dMGN] = new BaseCluster3D()

                _clustersObj[dMGN].addNodes(_cluster.getNodes())
            }
            else
                _clustersObj[key] = _cluster

        })


        _.extend(this.mClusters,_clustersObj)


    }


    doSubdivideIntoClustersNEW(mBaseCluster3DContainerObject, mSpeccsArray) {

        if (!mBaseCluster3DContainerObject) throw new Error("!!!")//mBaseCluster3DContainerObject = {root: this}

        var speccsArray=[].concat(mSpeccsArray)

        var entry = speccsArray.shift()

        var _nextGeneratorFunction = entry.generator
        var _nextDistributionHandler = entry.distribution

        var options = _.extend({minClusterSize: 10, defaultMergeGroupName: "other"}, entry.options)


        //....
        var clusters ={}

        _.each(mBaseCluster3DContainerObject, function (mBaseCluster, id) {

          //  console.log("sub-cluster",id,mBaseCluster)

            var _clustersObj = {};


            //post-process
            //merge clusters that don't match the criteria again
            _.each(mBaseCluster.groupBy(_nextGeneratorFunction), function (_cluster, key) {

                if (_cluster.getNodes().length < options.minClusterSize) {

                    var dMGN = options.defaultMergeGroupName
                    if (typeof  _clustersObj[dMGN] == "undefined") _clustersObj[dMGN] = new BaseCluster3D()

                    _clustersObj[dMGN].addNodes(_cluster.getNodes())
                }
                else
                    _clustersObj[key] = _cluster

            })


            /*

             TODO position each node by using the distribution function
             TODO also when clustering in a different manner... how to handle already applied distribution? we want the nodes to move to the new cluster instead of simply pop up there
             if (_nextDistributionHandler)
             _nextDistributionHandler => foreach _clustersObj

             */

            //TODO we want a tree structure for the nodes to be rendered but we might already have such a structure from another
            // iteration so the nodes do have to be put into other groups dynamically
debugger
            if (speccsArray.length > 0) {


                // let res= ClusterFactory.doSubdivideIntoClusters(_clustersObj, speccsArray);

                _.each(_clustersObj,function(cl,key){

                    let res = new BaseCluster3D(cl.getNodes(), speccsArray)
                    res.setDistributionHandler(_nextDistributionHandler)

                    cl.mClusters[key]=res;

                    clusters[id] =  cl;// res

                })




            } else {

                //no more subdivisions for this branch

                //FIXME but we want to maintain the category each element is in. so we need an object instead of an array
                //TODO refactor


                /*  var res= _.map(_clustersObj,function(v,k){

                 let leaf=new ClusterLeafElement(v);
                 leaf.setDistributionHandler(_nextDistributionHandler)
                 return  leaf

                 })*/

               // var res = {}
                _.each(_clustersObj, function (v, k) {

                    v.isLeaf=true
                    console.log(k,"isLeaf",v.isLeaf)
                  //  let leaf = new ClusterLeafElement(v);
                  //  leaf.setDistributionHandler(_nextDistributionHandler)
                  //  res[k] = leaf

                    clusters[id]=v
                })


            }
        })


debugger
        _.extend(  this.mClusters,clusters)

        //return clusters

    }

    groupBy(filterFunction) {
        let container = {}

        function groupFunction(key, val) {
            if (typeof container[key] == "undefined") container[key] = new BaseCluster3D();

            container[key].addNodes(val)
        }

        for (el of this.mNodes)
            filterFunction(groupFunction, el)


        return container

    }


    /**
     *   TODO should be overridden for ClusterLeaf
     *
     *  used only to change distribution of current cluster
     *
     * @param distribution instanceof BaseDistribution
     */
    setDistributionHandler(distribution) {

        var values = Object.values(this.mClusters)
        //TODO translation,rotation,scale by using different per-node function
        distribution.setNodes(values, function (vecPosition, i) {
            let n = values[i];

            n.position.copy(vecPosition)


            // that.mParticles.updateNodePosition(i)

        });


    }

}