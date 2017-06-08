/**
 * Created by Frank on 30.05.2017.
 */


import ClusterLeafElement from "./ClusterLeafElement"
import BaseNode from "./BaseNode"
import EdgeUtil from "./EdgeUtil"


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

        this.mClusters = {};


        //FIXME an additional dist schould be called for leaf elements ...  >1 else ...
        //xCluster if present, use to cluster nodes into sub-clusters
        if (_.isArray(clusteringHandlers) && clusteringHandlers.length > 0) {
            this.applyClustering(clusteringHandlers);
        }
        else this.updateCluster()

    }

    addNodes(nodes) {
        if (!this.mNodes) this.mNodes = [];

        if (typeof nodes == "undefined") return;

        if (_.isArray(nodes))
            this.mNodes = this.mNodes.concat(nodes);
        else
            this.mNodes.push(nodes)

    }

    getNodes() {
        return this.mNodes;
    }


    addAllSubClustersToContainer() {

        _.each(this.mClusters, (cluster) => this.add(cluster))

    }


    getChildClusterConstructor() {
        return this.constructor

    }

    /**
     * this method can be re-run to change the sub-clusters
     -which will result in deleting old clusters
     -adding new ones to the container

     */

    applyClustering(mClusteringSpeccsArray) {

        //e. g. result should be .. {china:instanceof BaseCluster3D}


        var entry = mClusteringSpeccsArray[0];


        this._clusterThis(entry);

        _.each(this.mClusters, function (mCluster, key) {

            var nextDepthSpeccsArray = [].concat(mClusteringSpeccsArray);
            nextDepthSpeccsArray.shift();

            if (nextDepthSpeccsArray.length > 1)
                mCluster.applyClustering(nextDepthSpeccsArray);
            else
                mCluster.createParticlePointCloud(nextDepthSpeccsArray[0]);


        })

        this.updateCluster()


    }

    _clusterThis(entry) {
        var clazz = this.getChildClusterConstructor();
        var options = _.extend({minClusterSize: 10, defaultMergeGroupName: "other"}, entry.options);


        var _clustersObj = {};


        //post-process
        //merge clusters that don't match the criteria again
        _.each(this.groupBy(entry.generator), function (_cluster, key) {

            if (_cluster.getNodes().length < options.minClusterSize) {

                var dMGN = options.defaultMergeGroupName
                if (typeof  _clustersObj[dMGN] == "undefined") _clustersObj[dMGN] = new clazz;//new BaseCluster3D()

                _clustersObj[dMGN].addNodes(_cluster.getNodes())
            }
            else
                _clustersObj[key] = _cluster

        })


        _.extend(this.mClusters, _clustersObj)


        this.setDistributionHandler(entry.distribution)

    }


    groupBy(filterFunction) {
        var clazz = this.getChildClusterConstructor();

        let container = {}

        function groupFunction(key, val) {
            if (typeof container[key] == "undefined") container[key] = new clazz;//new BaseCluster3D();

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

        if (this.isLeaf())
            this.mLeaf.setDistributionHandler(distribution);
        else
            distribution.setNodes(this, function onStep(vecPosition, i) {
                //  let n = values[i];
                //  n.position.copy(vecPosition)
            }/*,()=> this.updateTest()*/); //FIXME


    }


    //TODO  re-calculate boundingsphere from time to time
    updateHull() {


    }

    createHull() {


        if (this.mHull && this.mHull.geometry)
            this.mHull.geometry.dispose();
        if (this.mHull && this.mHull.material)
            this.mHull.material.dispose();

        if (this.mHull) this.remove(this.mHull)

        this.geometry.dispose();
        this.geometry.boundingBox = null;
        this.geometry.boundingSphere = null;
        delete(this.geometry);

        let boundingSphere = new THREE.Sphere;

        let boundingBox = new THREE.Box3;
        boundingBox.setFromObject(this);

        //get center, radius
        let _center = boundingBox.getCenter();
        let radius = boundingBox.getSize().length() / 2;


        //TODO
        if (radius < 40) radius = 40


        //  boundingSphere.center.copy(_center);
        boundingSphere.radius = radius;


        // this.geometry.boundingBox = boundingBox;


        var geometry = new THREE.RingGeometry(boundingSphere.radius * 0.95, boundingSphere.radius, 32);
        var material = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            wireframe: false,
            transparent: true,
            opacity: 0.00
        });


        var sphereGeometry = new THREE.SphereGeometry(boundingSphere.radius, 10, 5);
        //  var material = new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true, transparent: true, opacity: 0.1});


        this.mHull = new THREE.Mesh(geometry, material)
        // this.mHull.position.copy(_center);

        // this.geometry.boundingSphere=boundingSphere
        this.add(this.mHull);
        this.mHull.onBeforeRender = function (...args) {
            //billboard effect
            this.setRotationFromQuaternion(args[2].quaternion)

        }


        this.geometry = sphereGeometry;

        /* this.geometry.copy(sphereGeometry)
         this.geometry.needsUpdate=true;
         this.geometry.boundingSphere=boundingSphere;
         */


        //  this.mHull.position.copy(boundingSphere.center)
        //  this.add(this.mHull);


    }


    isLeaf() {
        return typeof this.mLeaf != "undefined"
    }

    createParticlePointCloud(entry) {
        // console.log("reached leaf cluster", this)

        let leaf = new ClusterLeafElement(this.mNodes);
        this.mLeaf = leaf;
        this.add(leaf);
        leaf.setDistributionHandler(entry.distribution)

    }

//TODO  can be convex hull in sub class in which case override
    updateCluster() {

        this.addAllSubClustersToContainer();

        //if (!this.mHull)
        this.createHull();
        // else
        //    this.updateHull();


    }


    //returns some infos of the children of the the cluster relative to each other
    getRelationInfo() {
        return EdgeUtil.getClusterInfo(this.mClusters);

    }

    createEdgesForChildClusters() {

        return EdgeUtil.createEdgesBetweenClustersFromMap(this.mClusters);

    }


    getRadius() {

        return this.geometry.boundingSphere ? this.geometry.boundingSphere.radius : null;

    }

    updateTest() {
        var clustersThatNeedHullUpdates = []

        var leafsThatNeedHullUpdates = []

        this.traverse(function (item) {
            if (item instanceof BaseCluster3D)
                clustersThatNeedHullUpdates.push(item)

            if (item instanceof ClusterLeafElement)
                leafsThatNeedHullUpdates.push(item)

        })

        //  _.each( leafsThatNeedHullUpdates ,function(cluster){
        _.each(_.reverse(leafsThatNeedHullUpdates), function (cluster) {
            cluster.updateHull();
        })

        //  _.each(clustersThatNeedHullUpdates ,function(cluster){
        _.each(_.reverse(clustersThatNeedHullUpdates), function (cluster) {
            cluster.createHull();


        })


        this.createHull()

    }


    getLeafs() {
        var leafElements = [];

        this.traverse(function (item) {
            if (item instanceof __WEBPACK_IMPORTED_MODULE_0__ClusterLeafElement__["a" /* default */])
                leafElements.push(item)

        })
        return leafElements;
    }

    //TODO see use case for potential implementation
    findClusters(selector) {
        var clusters = []

        this.traverse(function (item) {
            if (item instanceof BaseCluster3D)
                clusters.push(item)
        })

        return clusters

    }


}