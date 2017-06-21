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
    constructor(nodes, clusteringHandlers, view) {
        super(view);
        this.addNodes(nodes);

        this.mClusters = {};
        //Cluster if present, use to cluster nodes into sub-clusters
        if (_.isArray(clusteringHandlers) && clusteringHandlers.length > 0) {
            this.applyClustering(clusteringHandlers);
        }
        // else this.updateCluster()

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
     * free the given gclusters again
     *
     *
     *
     */

    static cleanUpClusters(clusters, self) {
        clusters.push(self)

        _.each(clusters, function (cluster) {

            if (cluster.tn) {
                cluster.tn.remove()
                delete (cluster.tn)
            }
            if (cluster.mTextNodes) {
                cluster.mTextNodes.remove()
                delete (cluster.mTextNodes)
            }


            if (cluster == self) return;//don't detach the current root element

            if (cluster.parent) {

                if (cluster.parent.mClusters && cluster.name)
                    delete(cluster.parent.mClusters[cluster.name])
                cluster.parent.remove(cluster)
            }


        })


    }

    /**
     * free leaf elements
     *
     *
     */


    cleanUpLeafs() {
        _.each(this.getLeafs(), function (leaf) {

            //TOO to leaf specific clean up

            //for now at least remove the particle cloud
            leaf.geometry.dispose()
            if (leaf.parent)
                leaf.parent.remove(leaf)
        })

    }


    /**
     * TODO we want to get the node positions relative to the current root? cluster
     *      after reclustering we can use these to update the new positions to match the old ones in world coords
     *
     */

    storeParentPositionInNodes() {

        var leafElements = this.getLeafs()
        _.each(leafElements, function (leaf) {
            let mNodes = leaf.mNodes
            _.each(mNodes, function (node) {


                var c1 = new THREE.Vector3();
                c1.setFromMatrixPosition(leaf.matrixWorld);

                node._parentPosAbs = c1;

            })
        })


    }

    restoreNodePositionFromExParent() {


        var leafElements = this.getLeafs()
        _.each(leafElements, function (leaf) {
            let mNodes = leaf.mNodes
            _.each(mNodes, function (node) {
                //get current parent pos
                let c1 = node._parentPosAbs

                if (!c1) return;
                var c2 = new THREE.Vector3();
                c2.setFromMatrixPosition(leaf.matrixWorld);

                node._bubble.position.add(c1).sub(c2)
                _.extend(node, node._bubble.position)

            })
        })


    }


    setEntry(entry) {
        this.mEntry = entry
    }

    getClusterOptions() {
        return this.mEntry && this.mEntry.options ? this.mEntry.options : {}

    }


    /**
     * this method can be re-run to change the sub-clusters
     * -which will result in deleting old clusters
     * -adding new ones to the container
     * TODO this should re-build all child clusters if another ordering is provided
     *
     */

    applyClustering(mClusteringSpeccsArray) {

        if (mClusteringSpeccsArray.length >= 1)
            this.setEntry(mClusteringSpeccsArray[0])


//FIXME currently only working in root
        //  this.storeParentPositionInNodes()

        //e. g. result should be .. {china:instanceof BaseCluster3D}

        if (mClusteringSpeccsArray.length == 1) {

            let prevClusters = this.findClusters("*");
            this.cleanUpLeafs();
            this.createParticlePointCloud(mClusteringSpeccsArray[0]);

            //clean up previous clusters


            BaseCluster3D.cleanUpClusters(prevClusters, this)

            return false;
        }


        var entry = mClusteringSpeccsArray[0];

        //store previous clusters
        let prevClusters = this.findClusters("*");

        //create new clusters
        this.doClusteringForOnlyThis(entry);


        _.each(this.mClusters, function (mCluster, key) {

            var nextDepthSpeccsArray = [].concat(mClusteringSpeccsArray);
            nextDepthSpeccsArray.shift();

            if (nextDepthSpeccsArray.length > 1)
                mCluster.applyClustering(nextDepthSpeccsArray);
            else {
                mCluster.setEntry(entry)
                mCluster.createParticlePointCloud(nextDepthSpeccsArray[0]);
            }

        })

        this.updateCluster()


        //clean up previous clusters
        BaseCluster3D.cleanUpClusters(prevClusters, this)

        //adjust positions if cluster gets re-clustered
        // this.restoreNodePositionFromExParent()
    }


    /**
     * based on the entry the clustering
     * the  visible child clusters are generated
     *
     */


    doClusteringForOnlyThis(entry) {
        var clazz = this.getChildClusterConstructor();
        var options = _.extend({
            minClusterSize: 10,
            defaultMergeGroupName: "other",
            hull: function () {
                return new THREE.Mesh()
            }

        }, entry.options);
        var that = this;

        var _clustersObj = {};


        //post-process
        //merge clusters that don't match the criteria again
        let elements = this.groupBy(entry.generator)
        _.each(elements, function (_cluster, key) {

            if (_cluster.getNodes().length < options.minClusterSize) {

                var dMGN = options.defaultMergeGroupName
                if (typeof  _clustersObj[dMGN] == "undefined") _clustersObj[dMGN] = new clazz(undefined, undefined, that.getView());//new BaseCluster3D()
                _clustersObj[dMGN].name = dMGN
                _clustersObj[dMGN].addNodes(_cluster.getNodes())
            }
            else {
                _cluster.name = key
                _clustersObj[key] = _cluster


            }
        })


        _.extend(this.mClusters, _clustersObj)


        this.setDistributionHandler(entry.distribution, function () {

            that.mClusterRule = entry
            that.trigger("complete")


        })

    }

    /**
     * the current cluster gets subdivided into smaller clusters
     * based on the result of the filterFunction
     * the resulting groups are used by @see doClusteringForOnlyThis to create the actual visible child clusters
     */
    groupBy(filterFunction) {
        var clazz = this.getChildClusterConstructor();
        var that = this;
        let container = {}

        function groupFunction(key, val) {
            if (typeof container[key] == "undefined") container[key] = new clazz(undefined, undefined, that.getView());//new BaseCluster3D();

            container[key].addNodes(val)
        }

        for (el of this.mNodes)
            filterFunction(groupFunction, el)


        return container

    }


    getCompoundBoundingBox() {
        var box = new THREE.Box3;
        _.each(this.getLeafs(), function (leaf) {
            var geometry = leaf.geometry;
            if (geometry === undefined) return;


            let boundingBox = new THREE.Box3;
            //generate the boundingbox for the node particles if it is a leaf

            let pc = leaf.mNodeParticles.pointCloud

            if (pc.geometry.boundingBox)
                boundingBox.copy(pc.geometry.boundingBox)
            /*  else
             boundingBox.setFromObject(pc);
             */


            let _center = boundingBox.getCenter();

            //FIXME offsets are not properly calculated
            // let offset=leaf.localToWorld(new THREE.Vector3) //boundingBox.getCenter()
            boundingBox.translate(_center);


            box.union(boundingBox);


        });
        return box;
    }


    /**
     *
     *  used only to change distribution of current cluster
     *  there is a similar implementation for the ClusterLeafElement class
     * @param distribution instanceof BaseDistribution
     */
    setDistributionHandler(distribution, onComplete = function () {
    }) {
        var that = this
        var values = Object.values(this.mClusters)
        //TODO translation,rotation,scale by using different per-node function

        if (this.isLeaf())
            this.mLeaf.setDistributionHandler(distribution, onComplete);
        else
            distribution.setNodes(this,
                function onNodePositionChanged(vecPosition, i) {
                },
                function onStep() {

                    updateLeafsEdges(that)

                }, function () {
                    onComplete()
                });


        //FIXME redundant updating multiple edges and potentially leafs
        function updateLeafsEdges(cluster) {
            let leafs = cluster.getLeafs()

            _.each(leafs, function (leaf) {
                leaf.updateEdges();
            })

        }

    }

    /**
     *
     *  current limenentation of the hull is a simle sphere with a border with the radius of the boundingSphere
     *  TODO  could be convex hull in sub class, in which case the method still needs to be overridden
     */

    adjustHullSize() {
        console.warn("adjustHullSize")
/*
        if (this.mHull && this.mHull.geometry)
            this.mHull.geometry.dispose();
        if (this.mHull && this.mHull.material)
            this.mHull.material.dispose();

        if (this.mHull) this.remove(this.mHull)

        this.geometry.dispose();
        this.geometry.boundingBox = null;
        this.geometry.boundingSphere = null;
        delete(this.geometry);
*/

        let boundingBox = new THREE.Box3;


        //generate the boundingbox for the node particles if this is a leaf
        if (this.isLeaf()) {
            let pc = this.mLeaf.mNodeParticles.pointCloud
            console.log(this.mLeaf.mNodeParticles.pointCloud)
            if (!pc) {
                console.error("leaf: nodescontainer not created yet")
            }
            else {

                //   boundingBox.setFromObject(pc);//would create wrong bb because of other elements within pc getting changed while animation loop runs
                boundingBox.setFromArray(pc.geometry.attributes.position.array)
                pc.geometry.boundingBox = boundingBox
            }

        }
        /* else //FIXME get bb of all leafs instead + actual position
         //we want to generate the hull for a cluster that is no leaf only:
         //if the leaf/child has finished it's distribution function
         //and
         //if ths has distributed it's children
         //via listeners?
         boundingBox = this.getCompoundBoundingBox()
         */
        //get center, radius
        let _center = boundingBox.getCenter();
        let _size = boundingBox.getSize()
        let radius = _size.length() / 2;


        let boundingSphere = boundingBox.getBoundingSphere()


        // we must have at least one hull impl
        // it might be invisible or idle but it should be set via defaults /
        // also text nodes depend on valid sized bbox
        //compute hull object from bounding box
        var mOptions = this.getClusterOptions();
        if (typeof mOptions.hull == "function") {


            let mHull = mOptions.hull(boundingBox)

            if (!this.mHull) {

                this.mHull = mHull;
                // this.mHull.material.visible = false//set hull default to invisible
                this.add(this.mHull);
            }
            else {
                this.mHull.geometry = mHull.geometry

                this.mHull.position.copy(mHull.position)
            }

        }
        else
            console.error("default hull function  not defined")


        //TODO this is currently used for the mouse interactions but should be refactored and removed
        var sphereGeometry = new THREE.SphereGeometry(boundingSphere.radius, 10, 5);
        var sphereMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            wireframe: true,
            transparent: true,
            opacity: 0.1
        });

        //sphereGeometry.boundingSphere=boundingSphere
        sphereGeometry.boundingBox = boundingBox


        // this.material = sphereMaterial;
        if (this.mHull && this.mHull.geometry)
            this.geometry = this.mHull.geometry
        else
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
        var that = this
        let leaf = new ClusterLeafElement(this.mNodes);
        this.mLeaf = leaf;
        this.add(leaf);
        leaf.setDistributionHandler(entry.distribution, function () {

            //create/update the hull element after the animation has finished

            that.updateIfIsLeaf()


        })

    }


    updateIfIsLeaf() {
        this.adjustHullSize()
        this._initDotParticles();
        this.updateDotParticles()


    }

    /**
     * updates hull and adds child clusters if necessary
     *
     *
     */
    updateCluster() {

        this.addAllSubClustersToContainer();

        //  this.adjustHullSize(); //diabled for testing of hull and bounding box

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
     * @params defaultRadius if the radius is not yet determined the fefault value is used instead
     * @returns the radius of the cluster
     */
    getRadius(defaultRadius = 100) {

        return this.geometry.boundingSphere ? this.geometry.boundingSphere.radius : defaultRadius;

    }


    /**
     * has to be called after initialisation to re-calculate dependent elements
     * like dot clouds and cluster boder and hull
     */
    /* onAfterClusteredAndDistributed() {


     //  return //FIXME
     _.each(_.reverse(this.findClusters("*")), function (cluster) {

     if (!cluster.isLeaf())
     cluster.adjustHullSize();


     })

     if (!this.isLeaf())
     this.adjustHullSize()
     }*/


    /**
     * returns an array of the actual ClusterLeafElements
     * that render the nodes itself
     *
     * TODO add clear function and remove cached elements
     */

    getLeafs() {
        if (this._LeafsCached) this._LeafsCached


        var leafElements = this._LeafsCached = [];

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

        clusters.shift() //remove first elemn as it is "this"

        return clusters

    }


    getDOMElement() {


        var view3d = this.getView()
        if (!view3d || !view3d.domElement) {
            console.warn("attach graph to a view before using dom specific functions")
            return null;
        }

        return view3d.domElement

    }


    /**
     *
     *
     *
     *
     */
    getDOMEvents() {


        var view3d = this.getView()
        if (!view3d || !view3d.mDomEvents) {
            console.warn("attach graph to a view before using dom specific functions")
            return null;
        }

        return view3d.mDomEvents

    }


    /**
     * tries to get the view3d element, which the cluster is rendered within
     * @returns a View3D if attached to the view before, else null
     */
    getView() {
        //  var rootCluster=this.getRoot()
        // if (!rootCluster.mParentView) return null
        return this.mParentView
    }

    /**
     * sets the view element for the root
     * the view must be a View3D (extends HTMLElement)
     *
     */
    setView(view3d) {
        // var rootCluster=this.getRoot()

        this.mParentView = view3d;
        return this
    }

    /**
     *
     *
     *
     * returns the root element of the cluster
     */


    getRoot(maxDepth = 20) {
        var _root = this;
        while (maxDepth--) {
            let r = _root.parent;
            if (r == null) return _root;
            if (!(r instanceof BaseCluster3D)) return _root;
            _root = r;
        }

        return _root
    }

    getParents(maxDepth = 20) {
        var _root = this;
        var parents = []
        while (maxDepth--) {
            let r = _root.parent;
            if (r == null) return parents
            if (!(r instanceof BaseCluster3D)) return parents;
            _root = r;

            parents.unshift(_root)

        }

        return parents;

    }


}