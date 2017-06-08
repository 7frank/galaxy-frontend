/**
 * Created by Frank on 30.05.2017.
 */


import ClusterLeafElement from "./ClusterLeafElement"
import BaseNode from "./BaseNode"
import EdgeUtil from "./EdgeUtil"


/**
 * NOTE: possible future work flow/use case
 *  cluster=new BaseCluster3D(allNodes)
 *  cluster.applyClustering(...) // copy existing stuff
 *  _dist= new ForceGraphDistribution() // set nodes internally
 *
 *  cluster.find("#other").setDistribution(_dist)
 *  cluster.find("United States").applyClustering(...)
 */


export default
class BaseCluster3D extends BaseNode {

    /**
     *
     * @param nodes
     * @param clusteringHandler instanceof List<ClusteringHandler>
     */
    constructor(nodes, clusteringHandlers) {
        super();

        this.addNodes(nodes);

        this.mClusters = {};
          //Cluster if present, use to cluster nodes into sub-clusters
        if (_.isArray(clusteringHandlers) && clusteringHandlers.length > 0) {
            this.applyClustering(clusteringHandlers);
        }
        else this.updateCluster()

    }

    /**
     * add one or many nodes to the cluster
     *
     * TODO could this be used to dynamically add nodes an re-run the clustering
     *
     */


    addNodes(nodes) {
        if (!this.mNodes) this.mNodes = [];

        if (typeof nodes == "undefined") return;

        if (_.isArray(nodes))
            this.mNodes = this.mNodes.concat(nodes);
        else
            this.mNodes.push(nodes)

    }


    /**
     * returns the nodes that where used to generate the current iteration of the cluster
     * if the cluster has sub-clusters the node represent the sum of all nodes of the sub-clusters as well
     */

    getNodes() {
        return this.mNodes;
    }


    /**
     * pushes the clusters to the mesh stack to render them
     *
     */

    addAllSubClustersToContainer() {

        _.each(this.mClusters, (cluster) => this.add(cluster))

    }


    /**
    *  used for recursive cluster generation if class is used for inheritance
    */

    getChildClusterConstructor() {
        return this.constructor

    }

    /**
     * this method can be re-run to change the sub-clusters
     * -which will result in deleting old clusters
     * -adding new ones to the container
     * TODO this should re-build all child clusters if another ordering is provided
     *
     */

    applyClustering(mClusteringSpeccsArray) {

        //e. g. result should be .. {china:instanceof BaseCluster3D}


        var entry = mClusteringSpeccsArray[0];


        this.doClusteringForOnlyThis(entry);

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


    /**
     * based on the entry the clustering
     * the  visible child clusters are generated
     *
     */

    doClusteringForOnlyThis(entry) {
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

    /**
     * the current cluster gets subdivided into smaller clusters
     * based on the result of the filterFunction
     * the resulting groups are used by @see doClusteringForOnlyThis to create the actual visible child clusters
     */
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
     *
     *  used only to change distribution of current cluster
     *  there is a similar implementation for the ClusterLeafElement class
     * @param distribution instanceof BaseDistribution
     */
    setDistributionHandler(distribution,onComplete=function(){}) {

        var values = Object.values(this.mClusters)
        //TODO translation,rotation,scale by using different per-node function

        if (this.isLeaf())
            this.mLeaf.setDistributionHandler(distribution);
        else
            distribution.setNodes(this, function onStep(vecPosition, i) {
                //  let n = values[i];
                //  n.position.copy(vecPosition)
            },function(){   onComplete()   });


    }

    /**
     *
     *  current limenentation of the hull is a simle sphere with a border with the radius of the boundingSphere
     *  TODO  could be convex hull in sub class in which case override
     */

    adjustHullSize() {


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

        boundingSphere.radius = radius;




        var geometry = new THREE.RingGeometry(boundingSphere.radius * 0.95, boundingSphere.radius, 32);
        var material = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            wireframe: false,
            transparent: true,
            opacity: 0.3,
            visible:false
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


    }


    /**
     *
     * if true the cluster is the leaf cluster and contains mLeaf attribute
     *
     * @returns {boolean}
     */


    isLeaf() {
        return typeof this.mLeaf != "undefined"
    }

    /**
     * create a inner particles for each leaf node element
     *
     *
     * @param entry
     */


    createParticlePointCloud(entry) {
        // console.log("reached leaf cluster", this)

        let leaf = new ClusterLeafElement(this.mNodes);
        this.mLeaf = leaf;
        this.add(leaf);
        leaf.setDistributionHandler(entry.distribution)

    }

    /**
    * updates hull and adds child clusters if necessary
    *
    *
     */
    updateCluster() {

        this.addAllSubClustersToContainer();

        this.adjustHullSize();

    }


    /**
     *  returns some infos of the children of the the cluster relative to each other
     *  TODO make use of it meanwhile @deprecated
     */

    getRelationInfo() {
        return EdgeUtil.getClusterInfo(this.mClusters);

    }


    /**
     * creates edegse from nodes
     * the edges can be inner edges only from nodes within cluster to other nodes within
     * or external edges leading into nodes from other clusters
     */

    createEdgesForChildClusters() {

        return EdgeUtil.createEdgesBetweenClustersFromMap(this.mClusters);

    }

    /**
     *
     *
     *
     * @returns the radius of the cluster
     */
    getRadius() {

        return this.geometry.boundingSphere ? this.geometry.boundingSphere.radius : null;

    }


    /**
     * has to be called after initialisation to re-calculate dependent elements
     * like dot clouds and cluster boder and hull
     */
    onAfterClusteredAndDistributed() {

      _.each(_.reverse( this.findClusters("*")), function (cluster) {
            cluster.adjustHullSize();


        })


        this.adjustHullSize()
    }


    /**
     * returns an array of the actual ClusterLeafElements
     * that render the nodes itself
     */

    getLeafs() {
        var leafElements = [];

        this.traverse(function (item) {
            if (item instanceof ClusterLeafElement)
                leafElements.push(item)

        })
        return leafElements;
    }

    /**
     * return an array of all sub clusters of the current cluster
     *
     * TODO make use of the selector attribute like #china or #other
     *
     */
    findClusters(selector) {
        var clusters = []

        this.traverse(function (item) {
            if (item instanceof BaseCluster3D)
                clusters.push(item)
        })

        return clusters

    }


}