/**
 * Created by Frank on 30.05.2017.
 */



import ClusterLeafElement from "./ClusterLeafElement"
import BaseNode from "./BaseNode"
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
class BaseCluster3D extends BaseNode {

    //TODO implement these stubs in sub class
    //createEdgeContainer(){}



    /**
     *
     * @param nodes
     * @param clusteringHandler instanceof List<ClusteringHandler>
     */
    constructor(nodes, clusteringHandlers) {
        super();
        this.addNodes(nodes);
        //by default the cluster is no leaf. TODO
        this.isLeaf = false;
        this.mClusters = {}


        //xCluster if present, use to cluster nodes into sub-clusters
        if (_.isArray(clusteringHandlers) && clusteringHandlers.length > 0) {
            this.applyClustering(clusteringHandlers);
        }
        else this.updateCluster()


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

    applyClustering(mClusteringSpeccsArray) {

        //e. g. result should be .. {china:instanceof BaseCluster3D}


        var entry = mClusteringSpeccsArray[0]

        // this._clusterThis(mClusteringSpeccsArray[0])
        this._clusterThis(entry)
      //  console.log("_clusterThis", Object.keys(this.mClusters), this.mClusters)

        _.each(this.mClusters, function (mCluster, key) {

            var nextDepthSpeccsArray = [].concat(mClusteringSpeccsArray);
            nextDepthSpeccsArray.shift();

            if (nextDepthSpeccsArray.length > 0)
                mCluster.applyClustering(nextDepthSpeccsArray);
            else
                mCluster.createParticlePointCloud(entry);


        })

        this.updateCluster()


    }

    _clusterThis(entry) {

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


        _.extend(this.mClusters, _clustersObj)


        this.setDistributionHandler(entry.distribution)

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


    createHull() {

        let boundingSphere=new THREE.Sphere;

        let boundingBox=new THREE.Box3;
        boundingBox.setFromObject(this);

//get center, radius
        let _center=boundingBox.getCenter();
        let radius=boundingBox.getSize().length()/2;

        if (radius>0)
        console.log("sphere",radius,_center)



        boundingSphere.center.copy(_center);
        boundingSphere.radius=radius;




        this.geometry.boundingBox=boundingBox;
        this.geometry.boundingSphere=boundingSphere;

        var geometry = new THREE.SphereGeometry(boundingSphere.radius, 16, 16);
        var material = new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true, transparent: true, opacity: 0.1});

        if (this.geometry)
        this.geometry.dispose();

        this.geometry=geometry



        if (this.material)
            this.material.dispose();

        this.material=material


      //  this.mHull = new THREE.Mesh(geometry, material);
      //  this.mHull.position.copy(boundingSphere.center)
      //  this.add(this.mHull);


    }


    createParticlePointCloud(entry) {
       // console.log("reached leaf cluster", this)

        let leaf=new ClusterLeafElement(this.mNodes);
        this.mLeaf=leaf;
        this.add(leaf);
        leaf.setDistributionHandler(entry.distribution)

    }

//TODO  can be convex hull in sub class in which case override
    updateCluster() {

        this.addAllSubClustersToContainer();

        if (!this.mHull)
            this.createHull()

        //TODO  re-calculate boundingsphere from time to time


    }


}