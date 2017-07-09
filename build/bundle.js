var clusters =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 22);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ClusterLeafElement__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__BaseNode__ = __webpack_require__(20);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__EdgeUtil__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__hull_BaseVolume__ = __webpack_require__(4);
/**
 * Created by Frank on 30.05.2017.
 */








/**
 * NOTE: possible future work flow/use case
 *  cluster=new BaseCluster3D(allNodes)
 *  cluster.applyClustering(...) // copy existing stuff
 *  _dist= new ForceGraphDistribution() // set nodes internally
 *
 *  cluster.find("#other").setDistribution(_dist)
 *  cluster.find("United States").applyClustering(...)
 */


class BaseCluster3D extends __WEBPACK_IMPORTED_MODULE_1__BaseNode__["a" /* default */] {

    /**
     *
     * @param nodes
     * @param clusteringHandler instanceof List<ClusteringHandler>
     */
    constructor(nodes, clusteringHandlers, view) {
        super(view);
        this.addNodes(nodes);

        this.registerCustomEvent("hull-updated"); // gets called if the hull got adjusted

        this.mClusters = {};
        //Cluster if present, use to cluster nodes into sub-clusters
        if (_.isArray(clusteringHandlers) && clusteringHandlers.length > 0) {
            this.applyClustering(clusteringHandlers);
        }
        // else this.updateCluster()


        //update lod //TODO the function shoul forwared onBeforeRender args in a way
        this.on("before-render", function () {

            //   if (!this.mHull) return;

            let view = this.getView();
            //based on distance to the camera the LOD is set for the hull object
            let src = view.mCamera.position;

            let dst;
            if (this.mHull && this.mHull.mesh && this.mHull.mesh.geometry && this.mHull.mesh.geometry.boundingBox)
                dst = this.mHull.mesh.geometry.boundingBox.getCenter();
            else
                dst = this.position;


            dst = this.localToWorld(dst.clone());

            let distance = dst.sub(src).length();

            //TODO how to handle max distance with the lod approach of meshes
            let maxDistance = this.getRadius(this.mNodes.length) * 25;
            let minDistance = 0;//this.getRadius() ;

            let L = maxDistance - minDistance;


            var lod = 1 - (distance - minDistance) / (maxDistance - minDistance);

            this.setLOD(lod)

        })


    }


    /**
     *
     *
     *
     *
     * @param mLOD  .. the lod value is a normalised value between 0 and 1 where 0 is a minimal value indicating that the  cluster and it's elements should be rendered at minimum quality
     *
     */

    setLOD(mLOD) {


        if (this.mHull)
            this.mHull.setLOD(mLOD);


        if (this.isLeaf()) {
            this.mLeaf.setLOD(mLOD)
        }

        if (this.mChildClustersEdgesMesh) {

            let vis=(1-mLOD)/2;

            this.mChildClustersEdgesMesh.material.opacity=vis;
            this.mChildClustersEdgesMesh.material.visible=vis>0.05 && vis<0.9;

        }




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
        clusters.push(self);

        _.each(clusters, function (cluster) {

            if (cluster.tn) {
                cluster.tn.remove();
                delete (cluster.tn)
            }
            if (cluster.mTextNodes) {
                cluster.mTextNodes.remove();
                delete (cluster.mTextNodes)
            }


            if (cluster.mHull) {
                cluster.mHull.dispose();
                delete (cluster.mHull);
                cluster.mHull = null;
            }


            if (cluster == self) return;//don't detach the current root element


            if (cluster.mChildClustersEdges) cluster.mChildClustersEdges = null; //delete edge references
            if (cluster.mChildClustersEdgesMesh) {
                cluster.parent.remove( cluster.mChildClustersEdgesMesh)
                cluster.mChildClustersEdgesMesh = null; //delete edge-mesh  references

            }

            if (cluster.parent) {

                if (cluster.parent.mClusters && cluster.name)
                    delete(cluster.parent.mClusters[cluster.name]);
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

            //TODO to leaf specific clean up

            //for now at least remove the particle cloud
            leaf.cleanUp()
        })

    }


    /**
     * TODO we want to get the node positions relative to the current root? cluster
     *      after reclustering we can use these to update the new positions to match the old ones in world coords
     *
     */

    storeParentPositionInNodes() {

        var leafElements = this.getLeafs();
        _.each(leafElements, function (leaf) {
            let mNodes = leaf.mNodes;
            _.each(mNodes, function (node) {


                var c1 = new THREE.Vector3();
                c1.setFromMatrixPosition(leaf.matrixWorld);

                node._parentPosAbs = c1;

            })
        })


    }

    restoreNodePositionFromExParent() {


        var leafElements = this.getLeafs();
        _.each(leafElements, function (leaf) {
            let mNodes = leaf.mNodes;
            _.each(mNodes, function (node) {
                //get current parent pos
                let c1 = node._parentPosAbs;

                if (!c1) return;
                var c2 = new THREE.Vector3();
                c2.setFromMatrixPosition(leaf.matrixWorld);

                node._bubble.position.add(c1).sub(c2);
                _.extend(node, node._bubble.position)

            })
        })


    }


    setEntry(entry) {
        this.mEntry = entry
    }

    getClusterOptions() {

        let options = _.extend({
            minClusterSize: 10,
            defaultMergeGroupName: "other",
            hull: __WEBPACK_IMPORTED_MODULE_3__hull_BaseVolume__["a" /* default */]

        }, this.mEntry.options);

        return options

    }


    /**
     * this method can be re-run to change the sub-clusters
     * -which will result in deleting old clusters
     * -adding new ones to the container
     * TODO this should re-build all child clusters if another ordering is provided
     *
     */

    applyClustering(mClusteringSpeccsArray) {

        if (mClusteringSpeccsArray.length >= 0)
            this.setEntry(mClusteringSpeccsArray[0]);


//FIXME currently only working in root
        //  this.storeParentPositionInNodes()

        //e. g. result should be .. {china:instanceof BaseCluster3D}

        if (mClusteringSpeccsArray.length == 1) {

            let prevClusters = this.findClusters("*");
            this.cleanUpLeafs();
            this.createParticlePointCloud(mClusteringSpeccsArray[0]);

            //clean up previous clusters


            BaseCluster3D.cleanUpClusters(prevClusters, this);

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
                mCluster.setEntry(entry);
                mCluster.createParticlePointCloud(nextDepthSpeccsArray[0]);
            }

        });

        this.updateCluster();


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
        var options = this.getClusterOptions();
        var that = this;

        var _clustersObj = {};


        //post-process
        //merge clusters that don't match the criteria again
        let elements = this.groupBy(entry.generator);
        _.each(elements, function (_cluster, key) {

            if (_cluster.getNodes().length < options.minClusterSize) {

                var dMGN = options.defaultMergeGroupName;
                if (typeof  _clustersObj[dMGN] == "undefined") _clustersObj[dMGN] = new clazz(undefined, undefined, that.getView());//new BaseCluster3D()
                _clustersObj[dMGN].name = dMGN;
                _clustersObj[dMGN].addNodes(_cluster.getNodes())
            }
            else {
                _cluster.name = key;
                _clustersObj[key] = _cluster


            }
        });


        _.extend(this.mClusters, _clustersObj);


        /**
         * add listeners to child elements if the hull was update
         * in which case we bubble up the tree to notify for changes and readjust parent elements
         *
         */
        _.each(this.mClusters, function (childCluster) {
            childCluster.on("hull-updated", _.throttle(function () {
                that.adjustHullSize();
                that.trigger("hull-updated");
                that.addChildClusterEdgeMesh();
            }, 500, {trailing: true, leading: false}))
        });




        this.setDistributionHandler(entry.distribution, function () {
            that.mClusterRule = entry
        })

    }


    //TODO refactor into class like EdgesContainer for leaf/node edges

    /**
     * generated and updates edges between clusters
     *
     */
    addChildClusterEdgeMesh(options) {


        //TODO
        if (this.mChildClustersEdgesMesh) {

        this.mChildClustersEdgesMesh.geometry.verticesNeedUpdate = true;
            return;
        }

        let edges = this.createEdgesForChildClusters();


        var line_geom = new THREE.Geometry();
        var lineMaterial;
        var mergedLineMesh;

              defaults = {
                opacity: 1.0,
                transparent: true,
                //lineIsVisible:true, // if disabled the line won't be shown on the scene
                color: 0x999999
            };

            options = _.extend(defaults, options);

            lineMaterial = new THREE.MeshBasicMaterial({
                color: options.color,
                transparent: options.transparent,
                opacity: options.opacity,
                depthTest: true,
                depthWrite: false
            });


        this.mChildClustersEdgesMesh = new THREE.Line(line_geom, lineMaterial, THREE.LineSegments);
        this.mChildClustersEdgesMesh.geometry.boundingBox=new THREE.Box3;
        this.mChildClustersEdgesMesh.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3, 1);


        this.add(this.mChildClustersEdgesMesh);

    for (let edge of edges)
    {
        //TODO we should unify the edges to not always have 2 separate ways to access certain elements
        //TODO also we should use the center of the hull feature instead
        let src=edge.source.position||edge.source._el.position;
        let dst=edge.target.position||edge.target._el.position;



        line_geom.vertices.push(src);
        line_geom.vertices.push(dst);

    }


    }


    /**
     * the current cluster gets subdivided into smaller clusters
     * based on the result of the filterFunction
     * the resulting groups are used by @see doClusteringForOnlyThis to create the actual visible child clusters
     */
    groupBy(filterFunction) {
        var clazz = this.getChildClusterConstructor();
        var that = this;
        let container = {};

        function groupFunction(key, val) {
            if (typeof container[key] == "undefined") container[key] = new clazz(undefined, undefined, that.getView());//new BaseCluster3D();

            container[key].addNodes(val)
        }

        for (el of this.mNodes)
            filterFunction(groupFunction, el)


        return container

    }


    getVerticesFromBoundingBox(boundingBox) {


        let _center = boundingBox.getCenter();
        let _size = boundingBox.getSize();

        let box = new THREE.BoxGeometry(_size.x, _size.y, _size.z);

        box.translate(_center.x, _center.y, _center.z);

        return box.vertices
    }


    //TODO it  seems, the vertices aren't calculated properly
    getCompoundBoundingBoxInfo() {
        var that = this;
        var box = new THREE.Box3;
        var vertices = [];
        _.each(this.mClusters, function (subCluster) {
            let boundingBox = new THREE.Box3;

            if (!subCluster.geometry.boundingBox) return; //not computed bbox, ignore
            boundingBox.copy(subCluster.geometry.boundingBox);


            let offset_parent = that.localToWorld(new THREE.Vector3);
            let offset_world = subCluster.localToWorld(new THREE.Vector3);
            boundingBox.translate(offset_world.sub(offset_parent));

            let vert = that.getVerticesFromBoundingBox(boundingBox);

            // let vert = that.mHull.mesh.geometry.vertices;
            vertices = vertices.concat(vert);

            box.union(boundingBox);


        });

        return {box: box, vertices: vertices}

    }


    /**
     * in case this is a leaf cluster the function
     * returns an array of vertices positioned relative to it's parent
     * (the vertices are further used for the boundingVolume feature)
     */
    getVerticesForLeaf() {
        var that = this;

        var leaf = this.mLeaf;


        let el = leaf.mNodeParticles.pointCloud;

        let offset_parent = that.localToWorld(new THREE.Vector3);
        let offset_world = el.localToWorld(new THREE.Vector3);


        let translateOffset = offset_world.sub(offset_parent);

        let geometry = el.geometry;
        var attributes = geometry.attributes;
        var positions = attributes.position.array;
        let vert = [];
        for (var i = 0; i < positions.length; i += 3) {

            let v = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
            vert.push(v.add(translateOffset));
        }

        return vert
    }


    /**
     *
     *  used only to change distribution of current cluster
     *  there is a similar implementation for the ClusterLeafElement class
     * @param distribution instanceof BaseDistribution
     */
    setDistributionHandler(distribution, onComplete = function () {
    }) {
        var that = this;
        var values = Object.values(this.mClusters);
        //TODO translation,rotation,scale by using different per-node function

        if (this.isLeaf())
            this.mLeaf.setDistributionHandler(distribution, onComplete);
        else
            distribution.setNodes(this,
                function onNodePositionChanged(vecPosition, i) {
                },
                function onStep() {

                    updateLeafsEdges(that);

                    that.addChildClusterEdgeMesh();


                }, function () {
                    onComplete();
                });


        //FIXME redundant updating multiple edges and potentially leafs
        function updateLeafsEdges(cluster) {

            //TODO the timeout fixes the problem that the edges aren't on spot but this should be reviewed and fixed without it
            setTimeout(function () {

                let leafs = cluster.getLeafs();
                _.each(leafs, function (leaf) {
                    leaf.updateEdges();
                });
            }, 50);
        }

    }

    /**
     *
     *  current implementation of the hull is a simple invisible boundingBox with
     *  @see BaseVolume
     *
     *  this function get's called after a cluster has triggered the "hull-update" event in which case
     * the current set "hull" - option is used to recalculate the hull feature
     *
     */

    adjustHullSize() {


        let info = {box: new THREE.Box3, vertices: []};

        //generate the boundingBox for the node particles if the clster is a leaf
        if (this.isLeaf()) {
            let pc = this.mLeaf.mNodeParticles.pointCloud;

            if (!pc) {
                throw new Error("nodescontainer not created yet for leaf")
            }
            else {

                //   boundingBox.setFromObject(pc);//would create wrong bb because of other elements within pc getting changed while animation loop runs
                info.box.setFromArray(pc.geometry.attributes.position.array);
                // info.vertices = this.getVerticesFromBoundingBox(info.box)  //TODO get vertices from array
                info.vertices = this.getVerticesForLeaf();

                pc.geometry.boundingBox = info.box
            }


        }
        else {
            //  override default values with actual bbox infos
            info = this.getCompoundBoundingBoxInfo();

        }

        let boundingBox = info.box;

        // we must have at least one hull impl
        // it might be invisible or idle but it should be set via defaults
        // also text nodes depend on valid sized bbox
        //compute hull object from bounding box
        var mOptions = this.getClusterOptions();

        // create the hull container
        if (!this.mHull)
            if (__WEBPACK_IMPORTED_MODULE_3__hull_BaseVolume__["a" /* default */] == mOptions.hull || __WEBPACK_IMPORTED_MODULE_3__hull_BaseVolume__["a" /* default */].isPrototypeOf(mOptions.hull)) {

                this.mHull = new mOptions.hull();
                this.add(this.mHull);
            }
            else throw new Error("option hull must have superclass BaseVolume");

        //--------------
        let vertices = info.vertices;
        this.mHull.createFromBoundingBox(vertices, boundingBox);

        //--------------
        //copy the geometry for the doeEvents to work
        if (!this.mHull && this.mHull.geometry) {

            this.geometry = this.mHull.geometry;

        }
        else {

            //have some default geometry for the domEvents //TODO find out why it fails without this part
            let boundingSphere = boundingBox.getBoundingSphere();
            //TODO this is currently used for the mouse interactions but should be refactored and removed
            var sphereGeometry = new THREE.SphereGeometry(boundingSphere.radius, 10, 5);
            sphereGeometry.boundingBox = boundingBox;
            this.geometry = sphereGeometry;
        }

        //notify listeners that the hull size changed
        this.trigger("hull-updated")

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
        var that = this;
        let leaf = new __WEBPACK_IMPORTED_MODULE_0__ClusterLeafElement__["a" /* default */](this.mNodes);
        this.mLeaf = leaf;
        this.add(leaf);
        leaf.setDistributionHandler(entry.distribution, function () {

            //create/update the hull element after the animation has finished

            that.updateIfIsLeaf()


        })


/*
      let dom=this.getDOMEvents()

          dom.addEventListener(leaf.mNodeParticles.pointCloud, "mousemove",function(...args){

                console.log(args)


          }.bind(this), false);
*/


    }


    updateIfIsLeaf() {
        this.adjustHullSize();
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
        return __WEBPACK_IMPORTED_MODULE_2__EdgeUtil__["a" /* default */].getClusterInfo(this.mClusters);

    }


    /**
     * creates edges from nodes
     * the edges can be inner edges only from nodes within cluster to other nodes within
     * or external edges leading into nodes from other clusters
     */

    createEdgesForChildClusters() {

        if (this.mChildClustersEdges) return this.mChildClustersEdges

        return this.mChildClustersEdges = __WEBPACK_IMPORTED_MODULE_2__EdgeUtil__["a" /* default */].createEdgesBetweenClustersFromMap(this.mClusters);

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
        if (this._LeafsCached) this._LeafsCached;


        var leafElements = this._LeafsCached = [];

        this.traverse(function (item) {
            if (item instanceof __WEBPACK_IMPORTED_MODULE_0__ClusterLeafElement__["a" /* default */])
                leafElements.push(item)

        });


        return leafElements;
    }

    /**
     * return an array of all sub clusters of the current cluster
     *
     * TODO make use of the selector attribute like #china or #other
     *
     */
    findClusters(selector) {
        var clusters = [];

        this.traverse(function (item) {
            if (item instanceof BaseCluster3D)
                clusters.push(item)
        });

        clusters.shift(); //remove first elemn as it is "this"

        return clusters

    }


    getDOMElement() {


        var view3d = this.getView();
        if (!view3d || !view3d.domElement) {
            console.warn("attach graph to a view before using dom specific functions");
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


        var view3d = this.getView();
        if (!view3d || !view3d.mDomEvents) {
            console.warn("attach graph to a view before using dom specific functions");
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
        var parents = [];
        while (maxDepth--) {
            let r = _root.parent;
            if (r == null) return parents;
            if (!(r instanceof BaseCluster3D)) return parents;
            _root = r;

            parents.unshift(_root)

        }

        return parents;

    }


}
/* harmony export (immutable) */ __webpack_exports__["a"] = BaseCluster3D;


/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__BaseCluster3D__ = __webpack_require__(0);
/**
 * Created by Frank on 29.05.2017.
 */

/**
 * TODO  possible different ways to distribute elements => moveTo, goTo, stack?
 *
 *
 */




class BaseDistribution {
    constructor(scale = 50, dimensions = 1) {

        //TODO have some kind of dynamic width function as alternative to the static scale value
        //this way it would be possible to have equal with child nodes for example
        let defaults = {scale: () => 50, dimensions: 1}


        this.mDuration = 2000 //FIXME longer duration does not render as intended

        this.dimensions = dimensions //TODO
        this.mScale = scale
        this.mEasingFunction = TWEEN.Easing.Quadratic.In
    }


    //TODO have an options setter instead that checks if this["key"] exists and warns if option not exists
    onSort(sortFN) {
        this.mSortFunction = sortFN
        return this
    }

    doSort(nodesArray) {
        if (!this.mSortFunction) return

        nodesArray.sort(this.mSortFunction)


    }


    setNodes(nodes, onNodePositionChange, onStepComplete, onEnd) {


        if (nodes instanceof __WEBPACK_IMPORTED_MODULE_0__BaseCluster3D__["a" /* default */]) {

            //TODO
            /*   if (nodes.isLeaf())
             nodes =nodes.mNodes
             else*/
            nodes = Object.values(nodes.mClusters)

        }
        else if (!_.isArray(nodes)) throw new Error("not supported, must be array of nodes or BaseClester3D")


        this.doSort(nodes)

        var mDuration = this.mDuration

        //for canceling animation
        var mTimeout;


        let len = nodes.length//|Object.keys(nodes).length


        var i = 0, j = 0, k = 0;

        let _len;
        if (this.dimensions == 1)
            _len = len;
        if (this.dimensions == 2)
            _len = Math.sqrt(len);
        if (this.dimensions == 3)
            _len = Math.pow(len, 1 / 3);

        if (this.dimensions < 3) k = 0.5 * _len
        if (this.dimensions < 2) j = 0.5 * _len


        let step = 1 / _len

        //1d/2d/3d helpers
        //for (let i=0;i<=1;i+=step)

        var c = 0;
        var count = nodes.length;
        var that = this;
        var notTweenFinished = true;

        //stop previous animations
        this.stop()

        var tweens = this.mTweens = []

        _.each(nodes, function (n) {

            if (i > _len) {
                j++;
                i = 0;
            }

            if (j > _len) {
                k++;
                j = 0;
            }


            var dist = that.distribute(n, i / _len - 0.5, j / _len - 0.5, k / _len - 0.5);


            //  onNodePositionChange(dist.position,c)


            //------------------------
            //------------------------

            //animating from current position to new one
            var mc = c;
            let origPos = (n.position) ? n.position : n


            let tween = new TWEEN.Tween(origPos)
                .easing(that.mEasingFunction)
                .to(dist.position, mDuration)
                .onUpdate(function () {

                    //after the last node was updated
                    if (mc == count - 1) {
                        if (onStepComplete)
                            onStepComplete()

                       // console.warn("Step",origPos.x,origPos.y,origPos.z,dist.position.x,dist.position.y,dist.position.z)
                    }

                    onNodePositionChange(origPos, mc)

                }).onComplete(function () {


                    if (notTweenFinished) {
                        notTweenFinished = false;
                        that.stop();
                     //   console.warn("onEnd",origPos.x,origPos.y,origPos.z,dist.position.x,dist.position.y,dist.position.z)
                        if (onEnd) onEnd()


                        //console.log("cancel",mTimeout)
                        cancelAnimationFrame(mTimeout)
                    }


                })
                .start();

            //------------------------
            //------------------------

            tweens.push(tween)
            //i+=step
            i++;
            c++;
        })


        mTimeout = requestAnimationFrame(animate);
//FIXME stop updating tweens if no longer necessary
        function animate(time) {

            //console.log("anmiate",mTimeout)
            _.each(tweens, function (tween) {
                tween.update(time)

            })

            if (notTweenFinished)
                mTimeout = requestAnimationFrame(animate);

        }


    }

    stop() {


        _.each(this.mTweens, function (tween) {

            TWEEN.remove(tween)

        })

    }


    //TODO this should be called to distribute the elements of the country layer when finished
    //TODO also it will be useful to add rotation as well in the future


    distribute(node, dx, dy, dz) {

        return {position: new THREE.Vector3(dx, dy, dz).multiplyScalar(this.mScale)};
    }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = BaseDistribution;




/***/ }),
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__BaseCluster3D__ = __webpack_require__(0);
/**
 * Created by Frank on 02.06.2017.
 */



class EdgeUtil {

    /**
     *
     *
     */
    static getConnectedClusters() {

        //finds external nodes of a cluster

        //look up what cluster the node is in?


    }


    /*
     * takes a object containing BaseCluster3D as input and returns
     * a set of edges
     *
     * */

    static createEdgesBetweenClustersFromMap(clustersContainer) {


        let info = EdgeUtil.getClusterInfo(clustersContainer)

        let clusterKeys = Object.keys(clustersContainer);


        var edgesArray = [];
        _.each(clusterKeys, function (key) {

            let otherClusterKeys = Object.keys(info[key].clustersConnectedTo);

            _.each(otherClusterKeys, function (otherKey) {

                let otherClusters = info[key].clustersConnectedTo;
                let edgesForCluster = info[key].edges;

                let linkStrength = Object.keys(edgesForCluster).length

                edgesArray.push({
                    source: clustersContainer[key],
                    target: otherClusters[otherKey],
                    link_strength: linkStrength
                })


            });


        });

        return edgesArray;
    }

    /**

     * @param clustersContainer  ...  Map<name,cluster>
     * @returns an object containing certain infos about clusters (what clusters are connected, with which edges and nodes within the cluster)
     */
    static getClusterInfo(clustersContainer) {

        //find connections between clusters from nodes contained

        var relevantEdgesPerCluster = {}
        _.each(clustersContainer, function (cluster, id) {
            relevantEdgesPerCluster[id] = {}
            let nodes = cluster.getNodes()
            //get only relevant nodes per cluster that link to/from other clusters
            let edges = EdgeUtil.getEdgesForNodes(nodes, false, true, true)
            relevantEdgesPerCluster[id] = edges

        })


        function isNodeOfCluster(node, cluster) {
            return cluster.getNodes().indexOf(node) >= 0

        }

        //just in case clusters can overlap
        //returns a map of the clusters that contain the node
        function lookUpClustersOfNode(node) {

            var clustersForNode = {};

            _.each(clustersContainer, function (cluster, id) {

                if (isNodeOfCluster(node, cluster))
                    clustersForNode[id] = cluster;
            });

            return clustersForNode;

        }

        var clustersContainerRelationInfo = {};


        //get the clusters that connect to each other from the dges between them
        _.each(relevantEdgesPerCluster, function (clusterExternalEdges, clusterID) {

            clustersContainerRelationInfo[clusterID] = {
                clustersConnectedTo: {},
                edges: {},
                nodes: {}

            };

            //for each edge of the current cluster that connects to another cluster
            _.each(clusterExternalEdges, function (externalEdge) {



                //we can ignore the node that is contained within the current cluster

                var testNode = isNodeOfCluster(externalEdge.source, clustersContainer[clusterID]);
                let otherNode = testNode ? externalEdge.target : externalEdge.source;


                let clustersThatContainNode = lookUpClustersOfNode(otherNode);
                delete (clustersThatContainNode[clusterID]) //undo self reference

                _.extend(clustersContainerRelationInfo[clusterID].clustersConnectedTo, clustersThatContainNode);

                var keys = Object.keys(clustersThatContainNode)


                //have some additional infos
                _.each(keys, function (key) {

                    //the edges that link to the specific cluster
                    if (!clustersContainerRelationInfo[clusterID].edges[key]) clustersContainerRelationInfo[clusterID].edges[key] = []
                    clustersContainerRelationInfo[clusterID].edges[key].push(externalEdge)

                    //the nodes the edges connect to
                    if (!clustersContainerRelationInfo[clusterID].nodes[key]) clustersContainerRelationInfo[clusterID].nodes[key] = []
                    clustersContainerRelationInfo[clusterID].nodes[key].push(externalEdge)

                })


                //all clusters the node links to

            })


        });

        return clustersContainerRelationInfo

    }

    /**
     *  returns all edges for >>contained<< nodes within clusters
     *  this would be suitable to do force-graph distribution on a cluster and all descendants
     */

    static getEdgesForNodes(nodes, bInternal = true, bOutgoing = false, bIngoing = false) {



//a node can be a cluster that represents a set of nodes
        //   if (nodes instanceof BaseCluster3D) nodes = nodes.mNodes

        if (!bInternal && !bOutgoing && !bIngoing) return []
        //get relevant edges from

        //a.clusters.mClusters.mClusters["United States"][0].mNodes

        var edges = [];

        _.each(nodes, function (node, id) {

            //check if it is a container element
            if (node instanceof __WEBPACK_IMPORTED_MODULE_0__BaseCluster3D__["a" /* default */]) {
                let _edges = EdgeUtil.getEdgesForNodes(node.mNodes, bInternal, bOutgoing, bIngoing)
                edges = edges.concat(_edges);
                edges = _.uniq(edges)
                return
            }


            _.each(node.edges, function (edge, id) {


                let srcContained = nodes.indexOf(edge.source) >= 0;
                let trgContained = nodes.indexOf(edge.target) >= 0;


                let isInternalNode = srcContained && trgContained;


                let isOutgoing = !isInternalNode && srcContained
                let isIngoing = !isInternalNode && trgContained
                //TODO we do want to distinguish between outgoing and ingoing edges
                // /if (!isInternalNode)
                //calc direction


                // console.log(srcContained,trgContained,isInternalNode)
                /*   if (bInternal&&bExternal || bInternal && isInternalNode || bExternal && !isInternalNode) {
                 edges = edges.concat(node.edges);
                 edges = _.uniq(edges)
                 }*/
                function pushit(edge) {
                    edge.isSrcInternalNode = srcContained
                    edge.isTrgInternalNode = trgContained
                    edges.push(edge)
                }

                if (bInternal && bOutgoing && bIngoing)
                    pushit(edge)
                else if (bInternal && isInternalNode || bOutgoing && isOutgoing || bIngoing && isIngoing)
                    pushit(edge)

            })

        })


        return edges

    }

}
/* harmony export (immutable) */ __webpack_exports__["a"] = EdgeUtil;


/***/ }),
/* 3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Created by Frank on 11.06.2017.
 */



class GraphData
{

    //constructor(nodes,edges){
    constructor(graphData){
            this.mGraphData=graphData
      /*  this.mNodeData=[];
        this.mEdgeData=[];

        this.addNodes(nodes);
        this.addEdges(nodes);*/

    }

    getClonedRawNodes()
    {
        var mNodes={}

            _.each(this.mGraphData.nodes,function(node,id){
                mNodes[id]=_.extend({x:0,y:0,z:0},node)


            })



        this.mDataNodeCopy=mNodes


        // Build graph with data
        var d3Nodes  = [];
        for (let nodeId in mNodes) { // Turn nodes into array
            const node =mNodes[nodeId] // _.extend({},mNodes);
            node._id = nodeId;
            d3Nodes.push(node);
        }
       return d3Nodes

    }

    getAlteredRawLinks(){
        var mDataNodeCopy= this.mDataNodeCopy
   // var skipLines=100
//FIXME filtering visible nodes here will break edge based calculations and arrows

        var links=this.mGraphData.links   //.filter((v,id)=> !(id%skipLines)   )

        //FIXME this sets src and dst to the graph data nodes but it should instead link to the cloned nodes so no interference occures
       var  d3Links  = links.map(link => {
            return {
                source: mDataNodeCopy[link[0]],
                target: mDataNodeCopy[link[1]]
            };
        })

    return d3Links



    }


  /*  addRawNodeData(nodes){
      if (_.isArray(nodes)) this.mNodeData=this.mNodeData.concat(nodes)

        return this;

    }

    addRawEdgeData(edges)
    {
        if (_.isArray(edges)) this.mEdgeData=this.mEdgeData.concat(edges)

        return this;
    }*/

    createClusterNodesAndEdges( view3d)
    {
        //env=globalEnv
        //see ForceGraph
        //TODO minimal env options to create a node
        var env={
            nameAccessor:node =>node.name || node.id,
            colorAccessor: node => node.color,
            valAccessor:node => node.val,

            sizeAccessor:node => node.itemCount,

            nodeRelSize:4,
           // useDebugSphere:true,
            domEvents:view3d.mDomEvents
        }




   var d3Nodes= this.getClonedRawNodes();

    if (!d3Nodes.length) {
        return;
    } //if no data is present return for now


    var d3Links =this.getAlteredRawLinks();


//TODO
  /*  function countVisibleNodes(node) {

        env._nodeCounter.push(node)

    }*/

    // Add WebGL objects
    d3Nodes.forEach(node => {

        node = nodeMixin(env, node, {
         //   onDrawNode: countVisibleNodes
        })
        node._bubble.name = env.nameAccessor(node) || '';


        node.size=env.sizeAccessor(node) || undefined;


        //TODO not highlighted group nodes should be rendered with separate point cloud
        if (node.isGroupNode) {

            //node.addClass("basic-sprite-collapsed")
            node.addClass("basic-ring")

            //node.on("mouseover",()=> node.addClass("basic-animated"))
            //node.on("mouseout",()=> node.removeClass("basic-animated"))
            node.on("mouseover", () => node.addClass("basic-ring-2"))
            node.on("mouseout", () => node.removeClass("basic-ring-2"))

        } else {

            //TODO specific renderings for node should be handled via class property at node data itself
            //NOTE: the default node/group nodes/links will be put inside a point  cloud for each so we woud need a point cloud for each 3d-class that generates a points object

            //node.addClass("basic-sphere")

            // nothing to begin with
            //node.addClass("basic-sprite")

        }

    });

    //-----------------------------------------------

    //init mesh for groupline
  /*  if (env.useLineGroup)
        initLineGroup(env,{
            opacity:0.01,
            color:0x49616C,
            transparent: true,
        })

    var linecount = 0;
    var skipLines = env.numSkipEdgesRendered + 1;
    if (skipLines < 1)
        skipLines = 1
    function shouldLineByVisible(link, id) {

        return !(linecount++ % skipLines)
    }
*/

        //TODO have more thatn one line mesh per rootcluster .. isntead have line meshes per sub-cluster
       var mLineGroup= this.initLineGroupHelper()

        //used to wrap per cluster functionality
        function linkMixinExt(link,options)
        {
            var env={mergedLineMesh:mLineGroup}

            return linkMixin(env,link,options)

        }




        //d3Links.forEach(link => {
    _.each(d3Links, (link, id) => {

         //TODO have a function within the custer itself that is called
        //determine by distance or something like that
        var bVisible = true;// shouldLineByVisible()

        linkMixinExt( link, {
            lineIsVisible: bVisible,
            color: 0xff0000,
            opacity: 1
        })


    });





    //----------------------


    //nodes are prepared by previous step ? TODO which one was that? for further altering
    extendGraphElements(d3Nodes, d3Links, env)


        return {nodes:d3Nodes,edges:d3Links}

}

    //--------------------------------------------


    /**
     * TODO refactor line group into stand alone class to be used per-cluster
     *
     *
     *
     */
   initLineGroupHelper( options) {


       var line_geom = new THREE.Geometry();
       var lineMaterial
       var mergedLineMesh





    var defaults = {
        opacity: 0.01,
        transparent: true,
        //lineIsVisible:true, // if disabled the line won't be shown on the scene
        color: 0xffffff
    }

    options = _.extend(defaults, options)

    lineMaterial = new THREE.MeshBasicMaterial({
        color: options.color,
        transparent: options.transparent,
        opacity: options.opacity,
        depthTest: false,
        depthWrite: false
    });


    mergedLineMesh = new THREE.Line(line_geom, lineMaterial, THREE.LineSegments);

    mergedLineMesh.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3, 50000);



  return mergedLineMesh


}





}
/* harmony export (immutable) */ __webpack_exports__["a"] = GraphData;


/***/ }),
/* 4 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Created by Frank on 22.06.2017.
 */

/**
 * the default implementation for a hull/volume around a cluster/sub-cluster
 *
 *
 */



class BaseVolume extends THREE.Object3D {

    constructor(...args) {
        super(...args);
        this.lod=1;
        this.maxOpacity=0.0
    }


    /**
     * lod is  value between 0 and 1 that can be used to render elements level-of-detail specific
     * eg. depending on the distance of camera and object
     *
     * @param newLOD
     */
    setLOD(newLOD)
    {
        if (newLOD<0) newLOD=0;
        if (newLOD>1) newLOD=1;


        this.lod=newLOD


    }


    getMaterial()
    {
        if (this.mMaterial) return this.mMaterial;

      return  this.mMaterial= new THREE.LineBasicMaterial({color: 0xffffff, linewidth: 5, opacity: this.maxOpacity, transparent: false});


    }


    /**
     * determines if the volume is can be made visible to the user
     *
     * @returns {boolean}
     */

    canBeVisible()
    {
        return false
    }


//FIXME have a better approach to generate the hull
//? rather: create from vertices
    createFromBoundingBox(vertices,boundingBox) {

        let _center = boundingBox.getCenter();
        let _size = boundingBox.getSize();

        let box = new THREE.BoxGeometry(_size.x, _size.y, _size.z);

        let geo = new THREE.EdgesGeometry(box); // or WireframeGeometry( geometry )

        let mat = this.getMaterial();

        let wireframe = new THREE.LineSegments(geo, mat);
        wireframe.position.add(_center);
        wireframe.geometry.boundingBox=boundingBox;


        if (this.mesh) this.remove(this.mesh);
        this.mesh=wireframe;
        this.add(wireframe);


        return this.mesh




    }




    setActive(){

        this.maxOpacity=1

    }


    setInactive(){

        this.maxOpacity=0.3

    }


    dispose()
    {
        this.mesh.geometry.dispose()
        this.mesh.material.dispose()

        if (this.parent)
            this.parent.remove(this)

    }




}
/* harmony export (immutable) */ __webpack_exports__["a"] = BaseVolume;




/***/ }),
/* 5 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__BaseCluster3D__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__distributions_BaseDistribution__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__distributions_ForceGraphDistribution__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__utils_ZoomUtil__ = __webpack_require__(10);
/**
 * Created by Frank on 06.06.2017.
 */










/**
 * extended cluster

 */

//refactoring current cluster structure
class Cluster3DExtended extends __WEBPACK_IMPORTED_MODULE_0__BaseCluster3D__["a" /* default */] {


    constructor(nodes, clusteringHandlers, view) {
        super(nodes, clusteringHandlers, view);


        this.selected = false;


        this.addListeners();


    }


    /**
     *   have a dynamic distance based on the size of the cluster
     *
     */
    zoomToCluster(defaultDistance = 400) {


        let view = this.getView();

        var distance = this.getRadius(defaultDistance) * 3;


        __WEBPACK_IMPORTED_MODULE_3__utils_ZoomUtil__["a" /* default */].moveToCluster(this, {distance})
    }


    /**
     * adds some listeners and actions
     *  - zoom via keyboard default hotkey "space"
     *  - show hide cluster border defaults to "mouseover"/"mouseout"
     *  - change ordering/distibution of child clusters defaults to "dblclick"
     */


    addListeners() {


        var curr = 0;

        function onClickFactory(res, speccs) {


            return function clickAndSpeccHandler() {


                var _dist = speccs[curr++ % speccs.length].distribution;

                console.log("setting distribution function", _dist);
                res.setDistributionHandler(_dist, function onComplete() {

                    //distribution-complete
                    if (res.isLeaf()) {
                        res.updateIfIsLeaf()
                    }

                    //res.onAfterClusteredAndDistributed()


                })

                //FIXME add complete handler
                /*                setTimeout(function()
                 {

                 res.onAfterClusteredAndDistributed()

                 },1000 )
                 */
            }
        }

        //FIXME find a way to not get click triggered if dblclick is triggered when both are bound to same element
        // also dragging will trigger click events
        this.on("z dblclick", function (e) {
             e.stopPropagation();

            this.zoomToCluster()

        });

        var diameter = null;
        this.on("s", function (e) {
            e.stopPropagation();
            if (!diameter)
                diameter = this.geometry.boundingSphere.radius * 2;
            console.log("clicky clicky", diameter);
            let speccsRoot = [
                {distribution: new __WEBPACK_IMPORTED_MODULE_1__distributions_BaseDistribution__["a" /* default */](diameter, 1)},
                {distribution: new __WEBPACK_IMPORTED_MODULE_1__distributions_BaseDistribution__["a" /* default */](diameter * 0.66, 2)},
                {distribution: new __WEBPACK_IMPORTED_MODULE_1__distributions_BaseDistribution__["a" /* default */](diameter * 0.33, 3)},
                {distribution: new __WEBPACK_IMPORTED_MODULE_2__distributions_ForceGraphDistribution__["a" /* default */](diameter * 0.66, 3)}
            ];


            var fn = onClickFactory(this, speccsRoot);

            fn()
        });


        this.on("a", function (e) {
            e.stopPropagation();
            if (!diameter)
                diameter = this.geometry.boundingSphere.radius * 2;
            console.log("clicky clicky", diameter);
            let speccsRoot = [
                {distribution: new __WEBPACK_IMPORTED_MODULE_2__distributions_ForceGraphDistribution__["a" /* default */](diameter * 0.66, 3)}
            ];


            var fn = onClickFactory(this, speccsRoot);

            fn()
        });


        this.on("mouseover", function (e) {
            e.stopPropagation();

            if (this.mHull) {

                this.mHull.mesh.material.visible=  this.mHull.canBeVisible();
                this.mHull.setActive();

            }

                let name = (this.name ? this.name : this.id);

            let parents = this.getParents();


            //hide tooltip for root cluster
            if (parents.length==0)
            {
                this.getView().setTooltip("");
                return
            }

            parents.shift();
            let root = parents.map(p => p.name ? p.name : p.id).join(" - ");
            //TODO public setter function


           // let lod=(this.mHull)? this.mHull.lod:-1;


            this.getView().setTooltip(root + " " + name) //+" LOD:"+lod


        });


        this.on("mouseout", function (e) {
            e.stopPropagation();
            if (this.mHull)
            {
                this.mHull.setInactive();
            }

            this.getView().setTooltip("")
        });

        this.on("t", function (e) {
            e.stopPropagation();
            this.toggleSelect()
        })


    }


    /**
     *  NOTE:don't call update for any cluster directly,it will be called via before-render
     *
     */
    update() {

        super.update();

        //TODO have a "cluster-ready" event
        this.addNodeCaptions();


        if (this.mTextNodes)
            this.mTextNodes.update();


        if (this.isLeaf())
            if (this.mParticles && this.getView())
                this.mParticles.update(this.getView().mTime);


    }


    appendNodes(nodes) {

        var that = this;
        _.each(nodes, function (node) {
            if (node && node._bubble)
                that.add(node._bubble)


        })


    }


    updateDotParticles() {
        if (this.isLeaf())
            if (this.mParticles) {
                this.mParticles.updateColors();


                //  this.mParticles.pointCloud.position.sub(this.position);
            }


    }

    //create/update particleSystem (little dots inside nodes)
    //potentially add them at specific time
    _initDotParticles() {

        if (this.mParticles) this.mParticles.start();


        if (this.isLeaf() && !this.mParticles) {

            var nodes = this.mLeaf.mNodes;
            var demoOptions = {
                increment: 1,
                duration: 1000,
                easing: TWEEN.Easing.Exponential.Out
            };

            if (!nodes) //FIXME this only works that way because to realData is not generated properly
                demoOptions.npc = function (n) {

                    return n.itemCount || 5
                    //return 5
                };


            //TODO refactor force-graph-utils

            var particles = createParticleSystemForNodes(nodes, demoOptions);
            this.add(particles.pointCloud);


            particles.start();
            //TODO call start if distribution function is finished
            this.on("distribution-complete", function () {

                particles.start()


            });


            this.mParticles = particles;
        }

    }


    /**
     * add some text to the sub-clusters providing informations
     *
     *
     *
     */


    addNodeCaptions() {

        if (this._hasNodeCaptions_) return;
        console.log("addNodeCaptions");
        this._hasNodeCaptions_=true;
        var rootCluster = this.getRoot();
        if (!rootCluster.mParentView) return;


        function _getNodePosition(node) {

            var mVec3 = new THREE.Vector3();
            mVec3.setFromMatrixPosition(node.matrixWorld);


            return mVec3; //node.position.clone()
        }

        var nodes = Object.values(this.mClusters);

        //TODO remove global dependency in TextNodes


        var mTextNode = $(rootCluster.mParentView.mRenderer.domElement).parent().children(".graph-captions-container");


        let env = {
            renderer: rootCluster.mParentView.mRenderer,
            currentNodesVisible: [],//can be left empty if below nodes function is used
            textNode: mTextNode,
            camera: rootCluster.mParentView.mCamera

        };


        //TODO make sure radius is dynamically changed when cluster radius changes

        //let minDistance = this.getRadius() / 3

        // TODO the bounding volume determines the visibility of the text nodes
        //TODO so currently with no volume generated properly the text nodes are invisible
        //  if (minDistance<10000) minDistance=10000

       // let maxDistance = minDistance * 10

        if (!this.mTextNodes)
            this.mTextNodes = TextNodes(env, {
                maxVisibleCount: 50,
                maxDistance: ()=> this.getRadius(this.mNodes.length) / 3*10,//30000
                minDistance:  ()=> this.getRadius(this.mNodes.length) / 3, //3000
                getNodes: function () {

                    return nodes

                },
                onNodeText: function (node) {

                    if (node.name) return node.name;

                    return node.id;

                },
                getCSSClasses: function () {
                    return 'graph-country-caption'

                },
                getNodePosition: _getNodePosition,
                interactable: true,
                onAfterCreateTextField: function (node, el) {

                    var newSize;
                    if (node instanceof Cluster3DExtended) {
                        newSize = 12 + Math.ceil(Math.log2(node.mNodes.length) - 5);


                    }
                    else
                        newSize = 12 + Math.ceil(Math.log2(node.nodes.length) - 5);

                    newSize = _.round(newSize / 12, 3) + "em";

                    el.css("font-size", newSize);

                    el.on("click", function () {
                        node.zoomToCluster();
                        //  doZoomToPos(_getNodePosition(node))
                    })

                }
            })


    }

    isSelected() {
        return this.selected

    }

    toggleSelect() {
        if (this.isSelected())
            this.unselectCluster();
        else
            this.selectCluster()


    }

    /**
     * selecting a cluster will show all child elements of this sub-cluster and hide all other branches of the root-cluster
     *
     *
     */

    selectCluster() {

        if (this.isSelected()) return;


        var allLeafs = this.getRoot().getLeafs();
        var mLeafs = this.getLeafs();


        _.each(allLeafs, function (other) {

            let isChildOfCluster = mLeafs.indexOf(other) >= 0;

            other.parent.visible = isChildOfCluster
            //other.material.visible=isChildOfCluster

        });


        this.selected = true

    }


    unselectCluster() {

        if (!this.isSelected()) return;


        var allLeafs = this.getRoot().getLeafs();


        _.each(allLeafs, function (other) {

            other.parent.visible = true

        });


        this.selected = false

    }


}
/* harmony export (immutable) */ __webpack_exports__["a"] = Cluster3DExtended;


/***/ }),
/* 6 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__EdgesContainer__ = __webpack_require__(21);
/**
 * Created by Frank on 30.05.2017.
 */





class ClusterLeafElement extends THREE.Mesh {
    constructor(nodes) {
        super();


        this.mNodes = nodes;




        this.mNodeParticles = this.createParticleNodeCloud();


        this.add(this.mNodeParticles.pointCloud);


        // add the nodes to the leaf
        this.appendNodes(nodes);


        //add edges to the leaf
        this.createEdgesFromNodes(nodes);



    }


    getView() {
        return this.parent.getView()


    }

    setLOD(levelOfDetail) {
        if (this.mNodeParticles)
            this.mNodeParticles.pointCloud.visible = levelOfDetail > 0.3;
        //TODO nodes,edges, ... as well

        let edgeFadeLOD=0.3;
        let crossfade=0.2;//TODO add crossfade

        if (this.mEdgesContainer) {

         this.mEdgesContainer.visible = levelOfDetail >= edgeFadeLOD;

            this.mEdgesContainer.mEdges.material.opacity=(levelOfDetail-edgeFadeLOD)/edgeFadeLOD;
        }

        if (this.mEdgesContainer2) {

            this.mEdgesContainer2.visible = levelOfDetail < edgeFadeLOD;

            this.mEdgesContainer2.mEdges.material.opacity=  1-levelOfDetail/edgeFadeLOD;
        }


        if (this.mNodeMeshes)
            this.mNodeMeshes.visible = levelOfDetail > 0.2;

        // if (this.parent && this.parent.mParticles)
        // this.parent.mParticles.pointCloud.visible= levelOfDetail>0.1;


    }


    cleanUp() {


        if (this.mNodeParticles) {
            this.mNodeParticles.remove();
            this.mNodeParticles.pointCloud.geometry.dispose();
            this.mNodeParticles = null;
        }

        if (this.mEdgesContainer&&this.mEdgesContainer.geometry) {


        this.mEdgesContainer.geometry.dispose();
        this.mEdgesContainer = null;
     }



        if (this.mEdgesContainer2&&this.mEdgesContainer2.geometry) {


            this.mEdgesContainer2.geometry.dispose();
            this.mEdgesContainer2 = null;
        }


        if (this.mNodeMeshes && this.mNodeMeshes.geometry) {
            this.mNodeMeshes.geometry.dispose();
            this.mNodeMeshes = null;
        }
        if (this.parent && this.parent.mParticles) {
            this.parent.mParticles.remove();
            this.parent.mParticles.pointCloud.geometry.dispose();
            this.parent.mParticles = null;
        }

        if (this.geometry)
        this.geometry.dispose();
        if (this.parent)
            this.parent.remove(this)


    }


    appendNodes(nodes) {


        if (!this.mNodeMeshes) {
            this.mNodeMeshes = new THREE.Object3D;
            this.add(this.mNodeMeshes)

        }


        var that = this.mNodeMeshes;//this;
        _.each(nodes, function (node) {
            if (node && node._bubble)
                that.add(node._bubble)


        })


    }


    createEdgesFromNodes(nodes) {

        this.mEdgesContainer = new __WEBPACK_IMPORTED_MODULE_0__EdgesContainer__["a" /* default */]();
        this.mEdgesContainer.setRenderMode(true,false,false).setSkipParams(30,40).setFromNodes(nodes);
        this.add(this.mEdgesContainer)

       /* this.mEdgesContainer2 = new EdgesContainer();
        this.mEdgesContainer2.setRenderMode(false,true,false).setSkipParams(100,1).setFromNodes(nodes);
        this.add(this.mEdgesContainer2)
*/


    }


    //TODO refactor
    setDistributionHandler(distribution, onComplete = function () {
    }) {

        var that = this;
        distribution.setNodes(this.mNodes, function (vec, i) {

            let n = that.mNodes[i];
            if (n._bubble) n._bubble.position.set(n.x, n.y, n.z);
            that.mNodeParticles.updateNodePosition(i);

        }, function onStep() {


            that.updateEdges();


        }, onComplete);

    }

    updateEdges() {


        if (this.mEdgesContainer)
            this.mEdgesContainer.updateEdges();

        if (this.mEdgesContainer2)
            this.mEdgesContainer2.updateEdges();

    }


    /**
     * creates a structure that contains a point cloud for the nodes for mre effiecient rendering
     *
     * @returns {{nodes, pointCloud, updateCrossFade, update, updateNode, updateNodePosition, updateNodeColor, updateNodeSize, on, remove}|*}
     */

    createParticleNodeCloud() {

        var elem = ParticleNodeGroup(this.mNodes, {
            nodeDefaultSize: 10,
            nodeDefaultScale: 10,
            nodeTexture: "img/dot7.png"
        });


        return elem
    }

}
/* harmony export (immutable) */ __webpack_exports__["a"] = ClusterLeafElement;




/***/ }),
/* 7 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Cluster3DExtended__ = __webpack_require__(5);
/**
 * Created by Frank on 06.06.2017.
 */


//TODO refactor RootCluster


/**
 *
 *  a RootCluster is a root node that contains additional rendering infos over multiple nodes
 * for example: it handles node captions (text nodes)
 */

class RootCluster extends __WEBPACK_IMPORTED_MODULE_0__Cluster3DExtended__["a" /* default */] {

    constructor(...args)
    {
        super(...args)

        this.useClusterText=true;


        //TODO have an actual event triggered for when sub-clusters are distributed to adjust elements
       // setTimeout(()=> this.onAfterClusteredAndDistributed(),5000)



       this.addColorHandler()


    }

    addListeners() {

        super.addListeners();


        this.on("u", e=>{
            e.stopPropagation();

            this.useClusterText=!this.useClusterText;
            console.log("useClusterText", this.useClusterText)
        });

    }





    addColorHandler()
    {

   var nodes=this.mNodes;
   var that=this


        function getCountryNamesFromNodes(nodes)
        {
            var res={}
            _.each(nodes,(n) => res[n.group]=true)

         return Object.keys(res)
        }




        function updateParticles(leaf)
        {
        if (leaf && leaf.parent && leaf.parent.mParticles) {

            leaf.parent.mParticles.updateColors();


        }
            else setTimeout(() => updateParticles(leaf), 100 )
        }


        var countryNames=null;

        $(window).on("node-color-change",function(e,val){


          if (!countryNames)countryNames=getCountryNamesFromNodes(nodes)

            var helper=computeGroupNodeColorHelper(countryNames)


         //   var val=$sel.val()
            if (val=="group")
                nodes.forEach(function(v){ v.color=helper.getColor(v.group)});
            else
                nodes.forEach(function(v){ v.color=computeCompanyNodeColor(parseInt(v.sent),val)   } )

            _.each(that.getLeafs(),function(leaf){


                leaf.mNodeParticles.update()


                updateParticles(leaf)


            })






        })




    }



    /**
     * @override
     * prevent multiple recursive  root clusters from being created by default
     */

    getChildClusterConstructor()
    {
        return __WEBPACK_IMPORTED_MODULE_0__Cluster3DExtended__["a" /* default */];

    }


    /**
     * attaches to root cluster to a specific View3D element to be able to perform container based operations
     *
     *
     */
    attachToView3D(view3D){
        this.mParentView=view3D

        this.addGlobalNodeCaptions()

    }

    /**
     *
     * TODO the root cluster manages the visibility of all of it's currently visible nodes
     * we do have a hierarchical structure that we can use to speed up the rendering a bit
     *
     */


    addGlobalNodeCaptions() {

        if (!this.mParentView) {
            console.warn("use attachToView3D() to attach cluster to a view container first")
            return
        }

        function createTextNodeContainer() {

            //create container for text elements

            var textElementsContainer = $("<div>").addClass("graph-captions-container").css({
                width: "100%",
                height: "100%",
               // top: 0,
               // left: 0,
                overflow: "hidden",
                position: "absolute",
                "pointer-events": "none"//, border: "1px solid red"
            })

            return textElementsContainer
        }

        /**
         * for the method to work env  needs to contain the following paraams :
         * env={
         *  renderer.domElement,  for get dimensions and text pos
         *   currentNodesVisible,   // ... nodes visible==all nodes in set is to harsh let rootcluster handle it probably
         *	textNode,               // node container that is overlay with pointerevents none
         *  camera
         *  }
         */


        var mTextNode = $(this.mParentView.mRenderer.domElement).parent().children(".graph-captions-container")

       if (mTextNode.length == 0) {

            mTextNode = createTextNodeContainer(this.mParentView.mRenderer.domElement);
            $(this.mParentView.mRenderer.domElement).parent().append(mTextNode)
            this.mTextNodesContainer=mTextNode

        }

        this.mGlobalTextNodesContainer=mTextNode

        mTextNode.height(this.mParentView.clientHeight)
        mTextNode.width(this.mParentView.clientWidth)


       mTextNode.empty()



var that=this
        let env={
            renderer:this.mParentView.mRenderer,
            currentNodesVisible:[],//can be left empty if below nodes function is used
            textNode:mTextNode,
            camera:this.mParentView.mCamera

        }

       if (!this.tn)
            this.tn = TextNodes(env, {
                maxVisibleCount: 10,
                onNodeText: function (node) {

                    if (node.name)
                        return node.name

                    return node.id

                },
                getNodes: function(){

                    if (!that.useClusterText)
                   return []

                    //FIXME use only visible nodes to improve performance
                    //TODO also have a per cluster approach for further performance improvements
                    let root=that.getRoot()

                   let res=(root&&_.isArray(root.mVisibleRootTextNodes))?root.mVisibleRootTextNodes:[]
                    if (res==undefined) console.warn("!")
                    return res

                }
            })


    }
    updateRootTextNodes(nodes) {
            this.mVisibleRootTextNodes=nodes
    }

    update(){
        super.update()


        if (this.tn)
       this.tn.update();

    }




    applyClustering(mClusteringSpeccsArray) {

        this.storeParentPositionInNodes()
        super.applyClustering(mClusteringSpeccsArray)

        this.restoreNodePositionFromExParent()
    }


    testRaycaster(x=0,y=0){


       let view=this.getView();

        var mouse = new THREE.Vector2(x,y);
        var raycaster = new THREE.Raycaster();
        let intersections=[];
        raycaster.setFromCamera(mouse, view.mCamera);

        intersections= raycaster.intersectObjects( view.mRootCluster,true)
        console.log(intersections)
      //  view.mRootCluster.raycast(raycaster,intersections)

       // console.log(intersections)

    }



}
/* harmony export (immutable) */ __webpack_exports__["a"] = RootCluster;


/***/ }),
/* 8 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__BaseDistribution__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__EdgeUtil__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__BaseCluster3D__ = __webpack_require__(0);
/**
 * Created by Frank on 02.06.2017.
 */








/*
 * TODO the forceGraphDistribution should work like a normal force graph
 * but optimally is could use a initial distribution from another dist function with no animation enabled
 *
 * */


class ForceGraphDistribution extends __WEBPACK_IMPORTED_MODULE_0__BaseDistribution__["a" /* default */] {
    constructor(scale = 50, dimensions = 1) {
        super(scale, dimensions);

        this.initialEngineTicks = 1;

    // NOTE: using values lower than 3000ms and 90 frames to stop the force graph will sometimes show the nodes in a line instead
        this.maxConvergeTime=3000;//ms ... 5 seconds upper bound for loading phase
        this.maxConvergeFrames=90//frames  ... for slower machines the time will be reached earlier for faster it will hit th frame limit earlier

    }

    /**
     * a reduced simulation (for testing)
     * TODO add edges and rest of original src
     * @param nodes
     * @param edges
     * @param onTick
     * @param onTICKComplete
     */
    startSimulation(nodes, edges = [], onTick, onComplete) {



        var that=this;

        // Add force-directed layout
        let layout = d3_force.forceSimulation();


        var scale = this.mScale;

        //TODO containers need links
        layout
            .numDimensions(this.dimensions)
            .nodes(nodes)
            .force('link', d3_force.forceLink().id(function (d) {
                return d._id
            })
                .distance(function computeLinkDistance() {
                    return scale / 50;

                })
               .links(edges)
            )
            .force('charge', (node) => -scale / 50)
            .force('linkStrength', (link) => 1)
            .force("collide", d3_force.forceCollide(scale/10).iterations(3))
            .stop();


            /*
            //TODO the actual collision does not create a good visualisation so until then this is disabled
            if (nodes[0].size)
                    layout.force("collide", d3_force.forceCollide().radius(function(node){

                        //TODO improve node size value

                        //NOTE: can't use radius here because it is not already generated

                     //   let backupVal=1//that.dimensions*scale/nodes.length;
                     //   let rad=backupVal//node._el?node._el.getRadius()*10: backupVal;

                        return node.size*10||1//rad
                    })
                        .iterations(3))
            */



        for (let i = 0; i < this.initialEngineTicks; i++) {
            layout.tick();
        } // Initial ticks before starting to render


        let cntTicks = 0;
        const startTickTime = new Date();

        layout.on("tick", function () {

           if (cntTicks++ > that.maxConvergeFrames || (new Date()) - startTickTime >  that.maxConvergeTime) {
                layout.alpha(0); //trigger end
                layout.stop(); // Stop ticking graph
            }

            onTick(layout, nodes, edges)

        }).on('end', function () {

            if (onComplete) onComplete()

        }).restart();

    }


    //TODO nodes + setNodes should provide an instanceof BaseCluster3D as default or an array of node primitives
    //in both cases we can determine the edges from it

    setNodes(nodes, onNodePositionChange, onStep, onComplete) {


        if (!nodes instanceof __WEBPACK_IMPORTED_MODULE_2__BaseCluster3D__["a" /* default */] && !_.isArray(nodes)) throw new Error("not supported, must be array of nodes or BaseClester3D");


        let mEdges = [];
        let mNodes = [];
        //in case nodes are instance of BaseNode3D
        if (nodes instanceof __WEBPACK_IMPORTED_MODULE_2__BaseCluster3D__["a" /* default */]) {


            //TODO this part might not to be used at all currently
            mEdges = nodes.createEdgesForChildClusters();


            mEdges.forEach(function(edge){
                edge.source=edge.source.position;
                edge.target=edge.target.position;

            });

            mNodes = Object.values(nodes.mClusters).map(function (n) {
               //add a back reference to the cluster
                n.position._el=n;

                return n.position;
            });




        }
        else if (_.isArray(nodes)) {
            mNodes = nodes.map(function (n) {
                //mEdges   = EdgeUtil.getEdgesForNodes(nodes, true, false);
                mEdges = mEdges.concat(n.edges);
                n.x=n.x||0;
                n.y=n.y||0;
                n.z=n.z||0;
                return n;
            });
        }

        this.startSimulation(mNodes, mEdges, function layoutTick(layout, d3Nodes, d3Links) {

            //handle each node callback
            _.each(d3Nodes, onNodePositionChange);
            //handle step callback
            if (onStep)
                onStep()

        }, onComplete);


    }

    //this is called to distribute the elements
    //TODO add rotation as well in the future

    distribute(node, dx, dy, dz) {

        return {position: new THREE.Vector3(0, 0, 0)}

        //  return {position:new THREE.Vector3(dx,dy,dz).multiplyScalar(this.mScale)};

    }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = ForceGraphDistribution;




/***/ }),
/* 9 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__BaseVolume__ = __webpack_require__(4);
/**
 * Created by Frank on 22.06.2017.
 */


/**
 * a slight derivative of it's base class
 * allowing for user to add to sub-cluster
 *
 */

class BoxVolume extends  __WEBPACK_IMPORTED_MODULE_0__BaseVolume__["a" /* default */] {

    constructor(...args) {
        super(...args);
        this.maxOpacity=0.1;
        this.getMaterial().transparent=true;
    }



    transferFunction(x)
    {
     return 1
    }

    /**
     * lod is  value between 0 and 1 that can be used to render elements level-of-detail specific
     * eg. depending on the distance of camera and object
     *
     * @param newLOD
     */
    setLOD(newLOD)
    {
      super.setLOD(newLOD);

        //by default just set the opacity and visibility accordingly
        let y=this.transferFunction(newLOD)
        if ( this.mesh && this.mesh.material) {
            this.mesh.material.opacity =this.maxOpacity*y; //TODO add transferFunction

            if (y<=0)
                this.mesh.material.visible=false;
            else
                this.mesh.material.visible=true;


        }

    }



    canBeVisible()
    {
        return true
    }


}
/* harmony export (immutable) */ __webpack_exports__["a"] = BoxVolume;


/***/ }),
/* 10 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Created by Frank on 08.06.2017.
 */

//TODO refactor existing samples
class ZoomUtil {


    static moveToCluster(cluster, options) {

        let defaults = {
            complete: function () {
            },
            distance: 400
        }
        options = _.extend(defaults, options)

        let view = cluster.getView()

        if (!view) {
            console.warn("cluster must be bound to instanceof View3D")
            return
        }


        let mesh = cluster;
        ZoomUtil.moveToMesh(mesh, view.mCamera, view.mControls, options.distance, options.complete);


    }



    static
    moveToMesh(mesh, camera, controls, cameraDistanceToMesh = 400, onComplete = function () {
    }) {

         var position = new THREE.Vector3();
        position.setFromMatrixPosition(mesh.matrixWorld);

       ZoomUtil.moveToPosition(position, camera, controls, cameraDistanceToMesh, onComplete)


    }


    /**
     *
     *
     * @param position must be in world coordiantes
     * @param camera
     * @param controls
     * @param cameraDistanceToMesh
     * @param onComplete
     */
    static
    moveToPosition(position, camera, controls, cameraDistanceToMesh = 400, onComplete = function () {
    }) {

        var mTimeout;

        var cameraTargetPosition = controls.target
        var vec3Start = camera.position


      //  var vec3End = new THREE.Vector3();
      //  vec3End.setFromMatrixPosition(mesh.matrixWorld);
        var vec3End=position

        //we want to have a fixed distance to a node when selecting
        var distVec = vec3End.clone().sub(vec3Start)
        var len = distVec.length()
        distVec.normalize()
        distVec.multiplyScalar(cameraDistanceToMesh) //apply fixed distance to the target

        var alteredVecEnd = vec3End.clone().sub(distVec)


        //change distance to target
        var tween = new TWEEN.Tween(vec3Start)
            .to(alteredVecEnd, 400)
            //.onUpdate(function () {})
            .onComplete(function () {
                onComplete.bind(this)();
                cancelAnimationFrame(mTimeout)
            })
            .start();

        //lookat target
        var tween2 = new TWEEN.Tween(cameraTargetPosition)
            .to(vec3End, 400)
            .start();

        requestAnimationFrame(animate);

        function animate(time) {
            mTimeout = requestAnimationFrame(animate);
            TWEEN.update(time);
        }


    }

}
/* harmony export (immutable) */ __webpack_exports__["a"] = ZoomUtil;


/***/ }),
/* 11 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Created by Frank on 13.06.2017.
 */


//a view class to be able to use multiple views and switch between them
//limit fps
//see shadertoy for usage as thumbnail and such


class View3D extends HTMLElement
{

    constructor(...args){
    super(...args);


        this.createCSSRule();
        this.mTime=-1;
        this.mActualFPS=0;
        this.showFPSCounter=false;

    //   this.initStatic()

        // Setup renderer
        this.mRenderer = new THREE.WebGLRenderer({
            antialias: true
        });


    }



    //TODO remove little redundancy
    createCSSRule()
    {
        var style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = '.view-3d-maximised { position: absolute !important;   top: 0  !important;   left: 0  !important;   height: 100% !important;    width: 100% !important; }';
        document.getElementsByTagName('head')[0].appendChild(style);



    }


    resizeCanvas() {
    if (this.mRenderer) {
        this.mRenderer.setSize(this.clientWidth, this.clientHeight);
        this.mCamera.aspect = this.clientWidth /this.clientHeight;
        this.mCamera.updateProjectionMatrix();
    }

        if (this.mRenderer)
            this.mControls.panSpeed =  this.mControls.rotateSpeed = 1600/this.clientWidth*0.3


    }


   /* get scene() {
        return ""+ this.mScene
    }
    set scene(scene) {
        this.mScene=scene
    }
*/
    setCaption(text)
    {


        let captionCSS= {
            "pointer-events": "none",
            position: "relative",
            padding: "1em",
            "font-size": "2em",
            top: "30%",
            height: "3em",
            width: "100%",
            background: "rgba(255,255,255,0.3)",
            left: "0px",
            "z-index": 1
        };

        if (!this.mCaption)
            this.mCaption=$("<span></span>").html(this.name).css(captionCSS);

        this.mCaption.html("").append(text);
        return this
    }




    /**
     *   set up controls,  scene,   renderer,     animation
     *
     */
    initStatic() {

         if (this._inited_static_) return;
         var that=this;


        this.mFPS=0.5;
        this.minFPS=this.minFPS||0;
        this.maxFPS=this.maxFPS||144;


        this.mLastFrameTime=-1;

        let captionCSS= {
            "pointer-events": "none",
            position: "relative",
            padding: "1em",
            "font-size": "2em",
            top: "30%",
            height: "3em",
            width: "100%",
            background: "rgba(255,255,255,0.3)",
            left: "0px",
            "z-index": 1
        };

    if (!this.mCaption)
        this.mCaption=$("<span></span>").html(this.name).css(captionCSS);

        $(this).append(   this.mCaption).addClass("view-3d");



        // Add nav info section


        //createTooltip()

        // Setup camera
        this.mCamera = new THREE.PerspectiveCamera();
        this.mCamera.far = 200000;


        // Setup scene

        this.mScene = new THREE.Scene();



        this.mCamera.lookAt(this.mScene.position);

        this.mCamera.position.z = 150000;




        this.mRenderer.setClearColor( 0x000000 );
        this.mRenderer.setPixelRatio( window.devicePixelRatio );

        this.appendChild(this.mRenderer.domElement);




        $(this.mRenderer.domElement).css({    position: "absolute",width:"100%",height:"100%"});


        //init basic keyboard io
      //FIXME this probably interferes with domEvents here..
        /*

         this.mOtherEvents = new Mousetrap(this.mRenderer.domElement);
          //  this.mOtherEvents
            Mousetrap .bind("shift+r",function(e){
                e.preventDefault();
                e.stopPropagation();
                console.log("actualFPS",   that.mActualFPS)

        })*/

        this.mFpsCounter=$("<span     style='color: white;position: absolute;' >");
        $(this).append(this.mFpsCounter);


        //------------------------------------------------
        //throttle move events to about 50 fps
        //let origMouseMove=THREEx.DomEvents.prototype._onMouseMove;
        THREEx.DomEventsAlt.prototype._onMouseMove	=_.throttle(function(domEvent)
        //THREEx.DomEvents.prototype._onMouseMove	=_.throttle(function(domEvent)
        {
            var mouseCoords = this._getRelativeMouseXY(domEvent);
            this._onMove('mousemove', mouseCoords.x, mouseCoords.y, domEvent);
            this._onMove('mouseover', mouseCoords.x, mouseCoords.y, domEvent);
            this._onMove('mouseout' , mouseCoords.x, mouseCoords.y, domEvent);
        },40);  //25 (f)ps

        //init domEnvents
        //this.mDomEvents = new THREEx.DomEvents(this.mCamera,this.mRenderer.domElement);
        this.mDomEvents = new THREEx.DomEventsAlt(this.mCamera,this.mRenderer.domElement,this.mScene);

        //Note: have a factory in case we need this kind of injection multiple times
       // THREEx.DomEvents.prototype._onMouseMove=origMouseMove;//restore non throttled work flow to not interfere with other implementations


        //------------------------------------------------



        //FIXME binding events will interfere with controls
        $(this.mRenderer.domElement).on("mouseover",function(e){

            if (that.isMaximised()) return;

            e.stopPropagation();
            that.setActive();

            $(that).attr("hasFocus",true);


            that.mCaption.stop(true,false).fadeOut(200)


        });


        $(this.mRenderer.domElement).on("mouseout",function(e) {

            if (that.isMaximised()) return;

            e.stopPropagation();


            $(that).removeAttr("hasFocus");
            if (!$(that).hasClass("view-3d-maximised")) {

            that.mCaption.stop(true, false).delay(400).fadeIn();

            //keep maximised element active or whatever state it currently holds
            that.setInactive();


            }

        });


        // Add camera interaction
        this.mControls = new TrackballControls(this.mCamera, this.mRenderer.domElement);
       // this.mControls.rotateSpeed = 0.3

        this.mControls.maxDistance = this.mCamera.far;





        this.resizeCanvas();

       this.mControls.addEventListener("change", (...args)=> $(this).trigger("change",...args)  );







        this._inited_static_=true;

    return this

    }

         // Kick-off renderer
    animate() {

        var initialFrames=1;
        var that=this;
        var accTime=0,accFrames=0;

      function animate(time) {
        that.mTime=time;


          initialFrames--;
          if (that.mFPS==0) {

              if (initialFrames<0)
              {
                  that.mFrameId = requestAnimationFrame(animate);
                  return;
              }
          }
          else {

              let nextTime = that.mLastFrameTime + (1000 / that.mFPS);
              if (nextTime > time) {

                  that.mFrameId = requestAnimationFrame(animate);
                  return;
              }
          }


          //count frames
          accTime+=time-that.mLastFrameTime;
          accFrames++;

          if (accTime>1000)
          {
              that.mActualFPS=accFrames;

              if (that.showFPSCounter)
              that.mFpsCounter.html(that.mActualFPS);

              accTime=0;
              accFrames=0;


          }



          that.mLastFrameTime = time;

          that.mControls.update();

             console.log( that.mLastFrameTime );



          $(that).trigger("before-render",time);
         // $(that).trigger("animate")

          that.mRenderer.render(that.mScene, that.mCamera);


          that.mFrameId = requestAnimationFrame(animate);
      }

        animate(-1)

    }


    add(object3D)
    {
        this.mScene.add(object3D)

    }


    maximise() {
        $(this).addClass("view-3d-maximised");

     this.mCaption.fadeOut();

        this.setActive()


    }

    isMaximised(){

     return   $(this).hasClass("view-3d-maximised")

    }


    undoMaximise() {
        $(this).removeClass("view-3d-maximised");

        this.setInactive()


    }





    setActive()
    {

        //fps
        this.mFPS=this.maxFPS;

        this.resizeCanvas();
        this.start();

    }

    setInactive()
    {
      //  $(this).removeClass("view-3d-maximised")
        this.mFPS=this.minFPS;

        this.resizeCanvas()
    }


    start(){

    this.stop();

     this.animate()


    }

    stop(){
        window.cancelAnimationFrame( this.mFrameId)
    }

    resume(){

       this.start()

    }


    show(){
        this.resume()


    }

    hide() {
        this.stop()
    }


    connectedCallback(){

        this.createTooltip();


        this.initStatic();
        this.start();

        $(this).trigger("connected")


    }


    createTooltip() {

        // Setup tooltip
        if ( this.toolTipElem ) return;

        this.toolTipElem = document.createElement('div');
        this.toolTipElem.classList.add('graph-tooltip');

        $(this.toolTipElem).css({
            "z-index":1,
            position:"relative",
            "user-select": "none"
        });

        this.appendChild(this.toolTipElem);

        // Capture mouse coords on move

        this.mouse = new THREE.Vector2();
        this.mouse.x = -2; // Initialize off canvas
        this.mouse.y = -2;
        this.addEventListener("mousemove", ev => {
            // update the mouse pos


           // $(env.toolTipElem).show()

            const offset = getOffset(this),
                relPos = {
                    x: ev.pageX - offset.left,
                    y: ev.pageY - offset.top
                };
            this.mouse.x = (relPos.x / this.clientWidth) * 2 - 1;
            this.mouse.y =  - (relPos.y / this.clientHeight) * 2 + 1;
            //console.log(offset);
            // Move tooltip
            this.toolTipElem.style.top = (relPos.y - 40) + 'px';
            this.toolTipElem.style.left = (relPos.x - 20) + 'px';

            function getOffset(el) {
                const rect = el.getBoundingClientRect(),
                    scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
                    scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                return {
                    top: rect.top + scrollTop,
                    left: rect.left + scrollLeft
                };
            }
        }, false);

    }


    /**
     * set the content of the tooltip
     *
     *
     * @param text
     */
    setTooltip(text)
    {

        $(this.toolTipElem).html("").append(text).show()

    }



}
/* harmony export (immutable) */ __webpack_exports__["a"] = View3D;



customElements.define("view-3d", View3D);


/***/ }),
/* 12 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";

/**
 * a set of node objects
 * the cluster itself doesn't contain any visual representation of the nodes
 * Note: currently not used and partial functionality implemented in GraphData
 */





class ClusterNodeArray extends Array //List<Node>
{

    constructor(...args){
    super(...args)
        // TODO extend every loaded  node data in a similar way like it is done
        // currently by the default implementation


    }





}
/* unused harmony export default */




/***/ }),
/* 13 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__BaseDistribution__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__BaseCluster3D__ = __webpack_require__(0);
/**
 * Created by Frank on 29.05.2017.
 */

/**
 * TODO  possible different ways to distribute elements => moveTo, goTo, stack?
 *
 *
 */








    class DefaultDistribution extends __WEBPACK_IMPORTED_MODULE_0__BaseDistribution__["a" /* default */]
    {
    constructor(scale=1,dimensions=3){

        super(scale,dimensions)

        this.mDuration=1;
    }



//TODO this is quite redundant we want the same work flow but not at idle copy costs if possible
    distribute(node,dx,dy,dz) {


        var mesh = (node._bubble) ? node._bubble : node;
        var absPos;
        if (mesh) {
            absPos = new THREE.Vector3();
            absPos.setFromMatrixPosition(mesh.matrixWorld);

        //TODO this is only working for specific cases currently
            if (mesh instanceof __WEBPACK_IMPORTED_MODULE_1__BaseCluster3D__["a" /* default */])
            absPos.sub(mesh.getRoot().position)
             else
            absPos.sub(mesh.parent.parent.getRoot().position)

        }
        else {

        absPos={};  //if above fails, we interpret the node as a yet rendered node with  potential initial x,y,z

            (typeof node.x!="undefined")?absPos.x=node.x:0;
            (typeof node.y!="undefined")?absPos.y=node.x:0;
            (typeof node.z!="undefined")?absPos.z=node.x:0;

            }
        return {position:new THREE.Vector3(absPos.x,absPos.y,absPos.z).multiplyScalar(this.mScale)};
    }
}
/* unused harmony export default */




/***/ }),
/* 14 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__BaseDistribution__ = __webpack_require__(1);
/**
 * Created by Frank on 30.05.2017.
 */




/**
 * a simple random distribution function
 *
 */

class RandomDistribution extends __WEBPACK_IMPORTED_MODULE_0__BaseDistribution__["a" /* default */]
{
    constructor(...args)
    {
        super(...args);
        this.maxDiameter=this.mScale*2;
    }
    distribute(node,dx,dy){
        let min=this.maxDiameter/-2,max=this.maxDiameter/2

        let x=_.random(min,max);
        let y=this.dimensions>1?_.random(min,max):0;
        let z=this.dimensions>1?_.random(min,max):0;


        return {
            position:new THREE.Vector3(x,y,z)
        }
    }
}
/* unused harmony export default */



/***/ }),
/* 15 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__BaseDistribution__ = __webpack_require__(1);
/**
 * Created by Frank on 06.06.2017.
 */







class SphericalDistribution extends __WEBPACK_IMPORTED_MODULE_0__BaseDistribution__["a" /* default */] {


    constructor(scale=50,dimensions=1){
        super(scale,2) //only 2d

    }


    /**
     *  implementation of the equirectangular projection
     * @param mVec2 - a THREE.Vector2 that has been transformed into normalised coordinates
     *
     */
    project2dNormalisedToSphere(mVec2, radius) {

    var longitude = mVec2.x * Math.PI
    var latitude = mVec2.y * Math.PI / 2

    var x = radius * Math.cos(latitude) * Math.cos(longitude)
    var y = radius * Math.cos(latitude) * Math.sin(longitude)
    var z = radius * Math.sin(latitude)

    return new THREE.Vector3(y, z, x) //?different coordinate system in skybox?

}


    distribute(node,dx,dy,dz){
       let mv3= this.project2dNormalisedToSphere(new THREE.Vector2(2*dx,2*dy),this.mScale/2)
        return {position:mv3};
    }




}
/* unused harmony export default */




/***/ }),
/* 16 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__BoxVolume__ = __webpack_require__(9);
/**
 * Created by Frank on 23.06.2017.
 */




/**
 *
 *
 *
 */

class ConvexVolume extends __WEBPACK_IMPORTED_MODULE_0__BoxVolume__["a" /* default */] {



    //leaf- bbox => geometry => sum(vertex)
    //ConvexGeometry
    //NOTE also have compute different detailed hulls to set by lod factor
    //eg. if lod <0.3 this.mesh.geometry=this.lowpolyMesh

    constructor(...args) {
        super(...args);

        this.setInactive();

    }


    createFromBoundingBox(vertices, boundingBox) {



        //geometry ... at best a convexGeometry
        //numSegments ... determines the smoothing of the rounded edges
        //margin ... the margin of the convex geometry around the original geometry
       function  myModifier(geometry,numSegments,margin)
       {

           let marginGeo = new THREE.Geometry();

           for (let v of geometry.vertices) {
               let sphere = new THREE.SphereGeometry(margin,numSegments, numSegments);
               sphere.translate(v.x, v.y, v.z);

               marginGeo.merge(sphere, sphere.matrix)

           }



           let convexGeoWithMargin = new THREE.ConvexGeometry(marginGeo.vertices);


           return convexGeoWithMargin

       }

        //ConvexGeometry does need at least 4 vertices
        //so in case we don't have as much we do use the boundingbox instead to generate some more vertices
        if (vertices.length < 4)
            vertices = this.getVerticesFromBoundingBox(boundingBox);


        //we will create a sphere geometry with a radius==margin for each vertice and merge them beforehand

        //reduce the vertice count before adding margin
        let geo0 = new THREE.ConvexGeometry(vertices);
        let margin = boundingBox.getSize().length()/10;

/*
        let marginGeo = new THREE.Geometry();

        for (let v of geo0.vertices) {
            let sphere = new THREE.SphereGeometry(margin, 8, 6);
            sphere.translate(v.x, v.y, v.z);

            marginGeo.merge(sphere, sphere.matrix)

        }

        //let alteredVertices=vertices
        let alteredVertices = marginGeo.vertices

        let geo = new THREE.ConvexGeometry(alteredVertices);
*/

        let geo= myModifier(geo0,5,margin)
        geo.computeBoundingBox();
        this.geometryLowPoly=geo;


        let geo2= myModifier(geo0,10,margin)
        geo2.computeBoundingBox();
        this.geometryAveragePoly=geo2;


        //FIXME ,polygonOffset:true,polygonOffsetFactor:-4
        let mat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            opacity: 0.03,
            transparent: true,
            depthWrite: false,
            side: THREE.BackSide
            //  ,   wireframe:true
        });

        //   let mesh = new THREE.Mesh(geo, mat);
        let mesh = new THREE.Mesh(this.geometryLowPoly, mat);

        mesh.geometry.boundingBox = boundingBox;


        if (this.mesh) this.remove(this.mesh);
        this.mesh = mesh;
        this.add(mesh);
        return this.mesh;

    }


    getVerticesFromBoundingBox(boundingBox) {


        let _center = boundingBox.getCenter();
        let _size = boundingBox.getSize();

        let box = new THREE.BoxGeometry(_size.x, _size.y, _size.z);

        box.translate(_center.x, _center.y, _center.z);

        return box.vertices
    }


    //TODO
    transferFunction(x) {
        return x
    }


    //TODO it is probably better to separate the LOD from the visiblility/opacity
    //
    setLOD(l) {


        if (l < 0) l = 0;
        if (l > 1) l = 1;

        var minOpacity = 0.03;

        function mTransfer(x) {
            //transfer function y= 0.5*sin(1.5*pi+x*pi*2)+0.5
            return 0.5 * Math.sin(1.5 * Math.PI + x * Math.PI * 2) + +0.5 + minOpacity


        }

        let y = mTransfer(l);

        super.setLOD(y * this.maxOpacity);


        /*     if (l < 0.8) this.mesh.geometry = this.geometryLowPoly;
         if (l >= 0.8 && l <= 0.95) this.mesh.geometry = this.geometryAveragePoly;
         if (l > 0.95) this.mesh.geometry = this.geometryHighPoly*/

        if (l < 0.6) this.mesh.geometry = this.geometryLowPoly;
        if (l >= 0.6) this.mesh.geometry = this.geometryAveragePoly;


    }


    setActive() {
        this.maxOpacity = 0.6;
    }


    setInactive() {
        this.maxOpacity = 0.3;
    }


    dispose() {

        this.mesh.material.dispose();

        if (this.geometryLowPoly)
        this.geometryLowPoly.dispose();
        if (this.geometryAveragePoly)
        this.geometryAveragePoly.dispose();
        if (this.geometryHighPoly)
        this.geometryHighPoly.dispose();

        if (this.parent)
            this.parent.remove(this)

    }


}
/* harmony export (immutable) */ __webpack_exports__["a"] = ConvexVolume;


/***/ }),
/* 17 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__View3D__ = __webpack_require__(11);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__cluster_RootCluster__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__cluster_GraphData__ = __webpack_require__(3);
/**
 * Created by Frank on 13.06.2017.
 */










class GraphView3D extends __WEBPACK_IMPORTED_MODULE_0__View3D__["a" /* default */]
{

    constructor(...args)
    {
        super(...args);

        this.mRootCluster=null



    }


    setSpeccs(speccs)
    {
        this.mSpeccs=speccs;
        return this
    }

    getSpeccs()
    {

        return this.mSpeccs
    }





    initClusterForView(rawGraphData,parentEl3D) {


        if (!rawGraphData) return;

        let speccs = this.getSpeccs();

        let graphData = new __WEBPACK_IMPORTED_MODULE_2__cluster_GraphData__["a" /* default */](rawGraphData);


        let preparedData = graphData.createClusterNodesAndEdges(this);

        var res = new __WEBPACK_IMPORTED_MODULE_1__cluster_RootCluster__["a" /* default */](preparedData.nodes,undefined,this);


//-- count visible nodes
   //TODO check if this interferes with the nodeMixin and the default implementation
      var visibleNodes=[];
        _.each(preparedData.nodes,function(node){
            node.get3DRoot().onBeforeRender=function(){
                visibleNodes.push(node);
            }
        });
//--

        parentEl3D.add(res);
        res.position.set(0, 0, 0);
        res.applyClustering(speccs);
        //IMPORTANT: must attach after clustering is applied because "tn" aka. globalTextNodes gets removed at the start of the clustering
        res.attachToView3D(this);

        var that=this;
        var _____skipFrames=0;

        $(that).on("before-render",function(){





           // res.update()


            if (that.isMaximised()) {

                   _____skipFrames++;
                //     _.each(preparedData.nodes,(n) => n._bubble.material.visible = (_____skipFrames % 20) ? false : true)
             let prev_vis=preparedData.nodes[0]._bubble.material.visible;
                let _vis= (_____skipFrames % 20) ? false : true;
                preparedData.nodes[0]._bubble.material.visible = _vis;

                if (prev_vis)
                {
                GUI.updateFromVisibleNodes(visibleNodes);
                 //   that.mVisibleNodes=[].concat(visibleNodes)
                //$(that).trigger("visible-nodes-changed") //TODO inverse control via listening
                    that.mRootCluster.updateRootTextNodes(visibleNodes);

                }
            }
            visibleNodes=[] //reset count

        });


        this.start();

        return res


    }


    setData(mGraphData)
    {
        this.initStatic();

        if (!this.mRootCluster)
        this.mRootCluster= this.initClusterForView(mGraphData,this.mScene);

        $(this).trigger("loaded")



    }

    loadDataSet(ds){

      var that = this;

        ds(null,function onSuccess(mGraphData)
        {
            console.log("data loaded");
            that.setData(mGraphData);

            $(".cloudNodeColorSelect").val("group").trigger("change")

        });

    return this
    }


    maximise() {

        var  root = this.mRootCluster;

        super.maximise();

            if (root && root.mParentView && root.mGlobalTextNodesContainer) {

                root.mGlobalTextNodesContainer.height(root.mParentView.clientHeight);
                root.mGlobalTextNodesContainer.width(root.mParentView.clientWidth);
                console.log("maximised")
            }




    }

    undoMaximise(){
            super.undoMaximise();


            let root=this.mRootCluster;
            if (root&& root.mParentView && root.mGlobalTextNodesContainer) {

                root.mGlobalTextNodesContainer.height(root.mParentView.clientHeight);
                root.mGlobalTextNodesContainer.width(root.mParentView.clientWidth)
            }


    }


}
/* unused harmony export default */


customElements.define("graph-view-3d", GraphView3D);


/***/ }),
/* 18 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__View3D__ = __webpack_require__(11);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__utils_ZoomUtil__ = __webpack_require__(10);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__cluster_GraphData__ = __webpack_require__(3);
/**
 * Created by Frank on 15.06.2017.
 */



/**
 * Created by Frank on 13.06.2017.
 */












class SimpleForceGraphView3D extends __WEBPACK_IMPORTED_MODULE_0__View3D__["a" /* default */]
{

    constructor(...args)
    {
        super(...args)

        this.mRootCluster=null

    }



    initForceGraphView(rawGraphData,parentEl3D) {

        var graph=this.mSimpleGraph

        if (!graph)
            graph=this.mSimpleGraph=new DefaultForceGraph(this)
            .numDimensions(3)
            (this);


        graph
            .resetState()
            .nameAccessor(node => node.id)
            .colorAccessor(function (node) {
                if (node.color) return node.color

                if (typeof node.group == "undefined") {
                    node.group = 0;
                    return Math.round(Math.random() * 256 * 256 * 256)
                }

                if (typeof node.group!="string")
                    return parseInt(colors[node.group % colors.length].slice(1), 16)
                else
                    return 0xffffff
            })

            .shapeAccessor(node => node.shape ? node.shape : "sphere")
            .graphData(rawGraphData);



        $(window).on("node-color-change",function(e,val){


        var helper=computeGroupNodeColorHelper( graph.env.nodeClouds.groupIdList)


        if (val=="group")
            graph.env._nodes.forEach(function(v){ v.color=helper.getColor(v.group)});
        else
            graph.env._nodes.forEach(function(v){ v.color=computeCompanyNodeColor(parseInt(v.sent),val)   } )

            graph.env.nodeClouds.update()

            graph.env.particles.updateColors()

        })

        return graph
    }


    setData(mGraphData)
    {
        this.initStatic();

        if (!this.mRootCluster)
            this.mRootCluster= this.initForceGraphView(mGraphData,this.mScene)




    }


    loadDataSet(ds){

        var that = this

        ds(null,function onSuccess(mGraphData)
        {
            console.log("data loaded")
            that.setData(mGraphData)

            $(".cloudNodeColorSelect").val("group").trigger("change")

        });

        return this
    }


}
/* unused harmony export default */


customElements.define("simple-force-graph-view-3d", SimpleForceGraphView3D);



//------------------------------------------------
//------------------------------------------------
//------------------------------------------------





function DefaultForceGraph(view3d) {

    var digest=_.debounce(__digest,20)


    const CAMERA_DISTANCE2NODES_FACTOR = 150;

    class CompProp {
        constructor(name, initVal = null, redigest = true, onChange = newVal => {}) {
            this.name = name;
            this.initVal = initVal;
            this.redigest = redigest;
            this.onChange = onChange;
        }
    }

    const env = { // Holds component state
        initialised: false,
        onFrame: () => {}
    };

    //TODO remove and forward env to modules
   // globalEnv = env

    const exposeProps = [
        new CompProp('width', view3d.clientWidth, false, resizeCanvas),
        new CompProp('height', view3d.clientHeight, false, resizeCanvas),
        new CompProp('graphData', {
            nodes: {
                1: {
                    name: 'mock',
                    val: 1
                }
            },
            links: [[1, 1]]// [from, to]
        }),
        new CompProp('numDimensions', 3),
        new CompProp('numSkipEdgesRendered', 5, false),

        new CompProp('nodeRelSize', 4), // volume per val unit
        new CompProp('lineOpacity', 0.1),
        new CompProp('valAccessor', node => node.val),
        new CompProp('nameAccessor', node => node.name),
        new CompProp('groupAccessor', node => node.group),
        new CompProp('colorAccessor', node => node.color),
        new CompProp('shapeAccessor', node => node.shape),
        new CompProp('initialEngineTicks', 0), // how many times to tick the force engine at init before starting to render
        new CompProp('maxConvergeTime', 2 * 7500), // ms
        new CompProp('maxConvergeFrames', 2 * 150),

        new CompProp('useLineWidthFeature', false),
        new CompProp('useNodeTextFeature', true, false),
        new CompProp('convexHullFeature', "none"),
        new CompProp('useDebugSphere', false),
        new CompProp('useTooltip', true),
        new CompProp('highlightArrowType', "line"), //line,animated,simple,mesh

        new CompProp('useLineGroup', true)

    ];
    //----------------------------------------
    function createTooltip() {

        // Setup tooltip

        var tt=$("<div>")
        $(view3d).append(tt)

        env.toolTipElem = tt.get(0)//document.createElement('div');
        env.toolTipElem.classList.add('graph-tooltip');

        env.domNode.appendChild(env.toolTipElem);

        // Capture mouse coords on move
        env.raycaster = new THREE.Raycaster();
        env.mouse = new THREE.Vector2();
        env.mouse.x = -2; // Initialize off canvas
        env.mouse.y = -2;
        env.domNode.addEventListener("mousemove", ev => {
            // update the mouse pos

            if (!env.useTooltip) {
                $(env.toolTipElem).hide()
                return

            } else
                $(env.toolTipElem).show()

            const offset = getOffset(env.domNode),
                relPos = {
                    x: ev.pageX - offset.left,
                    y: ev.pageY - offset.top
                };
            env.mouse.x = (relPos.x / env.width) * 2 - 1;
            env.mouse.y =  - (relPos.y / env.height) * 2 + 1;
            //console.log(offset);
            // Move tooltip
            env.toolTipElem.style.top = (relPos.y - 40) + 'px';
            env.toolTipElem.style.left = (relPos.x - 20) + 'px';

            function getOffset(el) {
                const rect = el.getBoundingClientRect(),
                    scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
                    scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                return {
                    top: rect.top + scrollTop,
                    left: rect.left + scrollLeft
                };
            }
        }, false);

    }
    //----------------------------------------
    //init



    function initStatic() {
        // Wipe DOM
       // env.domNode.innerHTML = '';
        // Add nav info section

        createTooltip()

        // Setup camera
        env.camera =view3d.mCamera
        env.camera.far = 100000;

        // Setup scene
        env.scene =view3d.mScene

        // Setup renderer
        env.renderer =view3d.mRenderer

        env.controls =view3d.mControls
        env.domEvents=view3d.mDomEvents


        env.initialised = true;



        function _updateFromVisibleNodes() {

            GUI.updateFromVisibleNodes(env.currentNodesVisible)

        }

        var throttled_GUI_updateFromVisibleNodes = _.throttle(_updateFromVisibleNodes, 300)

        function _Node_Texts() {

            if (env.tn && env.useNodeTextFeature)
                env.tn.update();

            if (env.tn && !env.useNodeTextFeature)
                env.tn.remove();

            if (env.countryTextNodes && env.useNodeTextFeature && !env.demoDisabled)
                env.countryTextNodes.update();

            if (env.countryTextNodes && !env.useNodeTextFeature)
                env.countryTextNodes.remove();

        }

        var throttled_Node_Texts = _.throttle(_Node_Texts, 10)

        //used within utils too
        //FIXME this is only currently there for the search function to trigger text generation because the onComplete Mehthod might have a problem
        function updateTextWhenCameraIsMoving2() {
            console.error("!")
            setTimeout(function(){
                _updateFromVisibleNodes()

                _Node_Texts()

            },600)


        }

        function updateTextWhenCameraIsMoving() {

            throttled_GUI_updateFromVisibleNodes()
            throttled_Node_Texts()
        }

        env.updateTextWhenCameraIsMoving = updateTextWhenCameraIsMoving
        env.updateTextWhenCameraIsMoving2 = updateTextWhenCameraIsMoving2

        env.controls.addEventListener("change", updateTextWhenCameraIsMoving)








        var _____skipFrames = 0;
        $(view3d).on("before-render",function(){

            env.onFrame();

            // Frame cycle
            env.controls.update();



            if (env.nodeClouds && env.nodeClouds.raytracer)
                env.nodeClouds.raytracer.raycast(console.log)

            //skip onBeforeRenderFor NumberOfFrames
            _____skipFrames++

            // if (window['globalNodes'])
            //    globalNodes.forEach((n) => n._bubble.material.visible = (_____skipFrames % 20) ? false : true)

            //TODO what we want here instead is, a probably already existsing list of sorted visible meshes
            // so we only have to determine which ones are nodes

            //if we can do this, we can skip the onBeforeRender stuff
            //also we can speed uo a lot of gui relevant code

            //the nodecounter gets filled by the meshes that trigger a onBeforeRender event if they are visible
            //TODO refactor ... bad practice though
            env._nodeCounter = []
            env.renderer.render(env.scene, env.camera);
            if (env._nodeCounter.length > 0)
                env.currentNodesVisible = env._nodeCounter

            if (env.nodeClouds)
                env.nodeClouds.updateCrossFade()

        })

        // Kick-off renderer


   /*     (function animate() { // IIFE


            requestAnimationFrame(animate);
        })()*/
    }

    //----------------------------------------
    function __digest() {


        if (!env.initialised) {
            return
        }

        console.log("digest")

        //remove previous text nodes
        if (env.textNode)
            env.textNode.empty()

        env.onFrame = () => {}; // Clear previous frame hook

      _.each(env.scene.children,function(el){
          env.scene.remove(el)
      })

     //   env.scene = new THREE.Scene(); // Clear the place

        var mNodes=_.extend({},env.graphData.nodes)


        // Build graph with data
       var d3Nodes =  []; //globalNodes
        for (let nodeId in mNodes) { // Turn nodes into array
            const node = _.extend({},mNodes[nodeId]);
            //const node = env.graphData.nodes[nodeId];
            mNodes[nodeId]=node;
            node._id = nodeId;
            d3Nodes.push(node);
        }

        if (!d3Nodes.length) {
            return;
        } //if no data is present return for now

        env._nodes=d3Nodes

//TODO
        var d3Links


            //This is for the network/group part working
            d3Links = env.graphData.links.map(link => { //globalLinks
                return {
                    source: mNodes[link[0]],
                    target: mNodes[link[1]]
                };
            })






        //---------------------
        //adding grouping feature

        env.digest = digest



        function countVisibleNodes(node) {

            env._nodeCounter.push(node)

        }

        // Add WebGL objects
        d3Nodes.forEach(node => {

            node = nodeMixin(env, node, {
                onDrawNode: countVisibleNodes
            })
            node._bubble.name = env.nameAccessor(node) || '';

            //FIXME have a second scene atop the particle node and edges for easier interaction
            env.scene.add(node._bubble);

            let bubble,
                bubble_geometry;

            //TODO not highlighted group nodes should be rendered with separate point cloud
            if (node.isGroupNode) {

                //node.addClass("basic-sprite-collapsed")
                node.addClass("basic-ring")

                //node.on("mouseover",()=> node.addClass("basic-animated"))
                //node.on("mouseout",()=> node.removeClass("basic-animated"))
                node.on("mouseover", () => node.addClass("basic-ring-2"))
                node.on("mouseout", () => node.removeClass("basic-ring-2"))

            } else {

                //TODO specific renderings for node should be handled via class property at node data itself
                //NOTE: the default node/group nodes/links will be put inside a point  cloud for each so we woud need a point cloud for each 3d-class that generates a points object

                //node.addClass("basic-sphere")

                // nothing to begin with
                //node.addClass("basic-sprite")

            }

        });

        //-----------------------------------------------

        //init mesh for groupline
        if (env.useLineGroup)
            initLineGroup(env,{
                opacity:0.01,
                color:0x49616C,
                transparent: true,
            })

        var linecount = 0;
        var skipLines = env.numSkipEdgesRendered + 1;
        if (skipLines < 1)
            skipLines = 1
        function shouldLineByVisible(link, id) {

            return !(linecount++ % skipLines)
        }

        //d3Links.forEach(link => {
        _.each(d3Links, (link, id) => {

            //FIXME ... if we... use an external heuristic to change visibility of lines
            /*
             graph.setEdgeVisMod(function(edge){})



             */
            var bVisible = shouldLineByVisible()

            linkMixin(env, link, {
                lineIsVisible: bVisible,
                color: 0xff0000,
                opacity: 1
            })

            if (!env.useLineGroup && bVisible)
                env.scene.add(link._line);

        });

        env.camera.lookAt(env.scene.position);
        //env.camera.position.z = Math.cbrt(d3Nodes.length) * CAMERA_DISTANCE2NODES_FACTOR;
        env.camera.position.z = 5000;

        //----------------------------------------

        //demo impl of better/more performant nodes
        //add some color for now
        //globalNodes.forEach( function(v) { if (!v.size) v.size=_.random(1,20); if (!v.color) v.color=_.random(50,255)*_.random(50,255)*_.random(50,255) })

        //create the grouped pointclouds
        var nodeClouds = createParticleSystemsByGroupAttr(d3Nodes);
        env.nodeClouds = nodeClouds;
        //add it to the scene
        var group = new THREE.Group;
        //group.position.x+=100
        env.scene.add(group);
        nodeClouds.attachTo(group);

        //----------------------


        function initRandomNodePositions(dimensions=3)
        {

            //test to init group positions
            for (let gID of nodeClouds.groupIdList) {
                var x = _.random(-5000, 5000),
                    y = dimensions>1? _.random(-5000, 5000):0,
                    z = dimensions>2?_.random(-5000, 5000):0;
                for (let node of nodeClouds.container[gID].nodes) {

                    node.x = x + _.random(-100, 100);
                    node.y = dimensions>1? y + _.random(-100, 100):0;
                    node.z =  dimensions>2?z + _.random(-100, 100):0;

                }
            }

        }


        initRandomNodePositions(env.numDimensions)


//---------------------------

        if (!env.tn)
            env.tn = TextNodes(env, {
                maxVisibleCount: 10,
                onNodeText: function (node) {

                    if (node.name)
                        return node.name

                    return node.id

                }
            })

        function _getCountryNodePosition(node) {
            return node.particles.pointCloud.geometry.boundingSphere.center.clone()
        }

        function zoomToCountryNode(node) {

            var position = new THREE.Vector3();
            position.setFromMatrixPosition(node.particles.pointCloud.matrixWorld);
            position.add(node.particles.pointCloud.geometry.boundingSphere.center)

            __WEBPACK_IMPORTED_MODULE_1__utils_ZoomUtil__["a" /* default */].moveToPosition(position,env.camera,env.controls)

            //doZoomToPos(_getCountryNodePosition(node))

        }



        if (!env.countryTextNodes)
            env.countryTextNodes = TextNodes(env, {
                maxVisibleCount: 50,
                maxDistance: 30000,
                minDistance: 3000,
                getNodes: function () {

                    return _.map(env.nodeClouds.container, function (v, k) {
                        return v
                    }).filter(function (v, k) {
                        return v.nodes.length > 10
                    })

                },
                onNodeText: function (node) {

                    return node.id

                },
                getCSSClasses: function () {
                    return 'graph-country-caption'

                },
                getNodePosition: _getCountryNodePosition,
                interactable: true,
                onAfterCreateTextField: function (node, el) {

                    var newSize = 12 + Math.ceil(Math.log2(node.nodes.length) - 5);

                    newSize = _.round(newSize / 12, 3) + "em";

                    el.css("font-size", newSize);

                    el.on("click", function () {

                     zoomToCountryNode(node)

                    })

                }
            })



        // Add force-directed layout
        const layout = env.layout = d3_force.forceSimulation();

        //in case the data contains an initial alpha value we'll use that one
        if (typeof env.graphData.alpha == "number")
            layout.alpha(env.graphData.alpha)

        layout
            .numDimensions(env.numDimensions)
            .nodes(d3Nodes)
            .force('link', d3_force.forceLink().id(function (d) {
                return d._id
            }).distance(computeLinkDistance).links(d3Links))
            .force("collide", d3_force.forceCollide(60).iterations(1))
            //.force('charge', d3_force.forceManyBody())
            .force('charge', function (node) {

                return -300

            })
            .force('linkStrength', function (link) {

                return 1

            })
            .stop();

        //nodes are prepared by previous step for further altering
        extendGraphElements(d3Nodes, d3Links, env)

        //
        handleConvexHullFeature()

        for (let i = 0; i < env.initialEngineTicks; i++) {
            layout.tick();
        } // Initial ticks before starting to render



        //hide text overlay and show after layout finishes
        env.textNode.hide()
        layout.on("tick", function () {

            layoutTick(layout, d3Nodes, d3Links)
        }).on('end', function () {
            // Run this when the layout has finished!
            console.log("rendering graph finished.. use 'ctrl+s' to download result ")

            //set link positions for final node/link positions
            d3Links.forEach(link => {

                link.setStartEnd(link.source, link.target)

            });


            //trigger coloring //TODO this should be done earlier
            $(".cloudNodeColorSelect").val("group").trigger("change")

            //set update the cloud to be able to use it for text positioning
            if (env.nodeClouds)
                env.nodeClouds.updateBoundingSpheres();

            //start the node particle effect
            //setTimeout(function () {


                //FIXME see flickering bug

                if (env.particles)
                    env.particles.start()

           // }, 1000)

            if (env.particles)
                env.particles.update()


            //set the text labels to the correct positions

            env.updateTextWhenCameraIsMoving()
            env.textNode.fadeIn(200)

            //createCloudCenterSphereForGroupsByID()
            //globalEnv.particles.pointCloud.visible=false;setVisibleGroups(null,false);setVisibleGroups(["United States"],true);createCloudCenterSphereForGroups(["United States"])

        }).restart();

        //
        initDotParticles(d3Nodes)

    }

    //----------------------------------------
    //----------------------------------------
    //----------------------------------------


    function computeLinkDistance(l, i) {

        var n1 = l.source,
            n2 = l.target;
        // larger distance for bigger groups:
        // both between single nodes and _other_ groups (where size of own node group still counts),
        // and between two group nodes.
        //
        // reduce distance for groups with very few outer links,
        // again both in expanded and grouped form, i.e. between individual nodes of a group and
        // nodes of another group or other group node or between two group nodes.
        //
        // The latter was done to keep the single-link groups ('blue', rose, ...) close.

        if (env.graphData.hasCountryGroups) {
            if (n1.group && n2.group && n1.group != n2.group)
            //return 2500 + (mGraph.dist.getDistance(n1.group, n2.group)|| 2000) //*2/3
                return 1500 // + mGraph.dist.getDistance(n1.group, n2.group) //*2/3
            else
                return 50 //50
        }

        //if (n1.group == n2.group) return 100
        //if (n1.group != n2.group) return 4000


        var groupDataSize1 = (n1.group_data && n1.group_data.size ? n1.group_data.size : 0)
        var groupDataSize2 = (n2.group_data && n2.group_data.size ? n2.group_data.size : 0)
        //var groupDataSize1=(n1.group_data)?n1.size*2:0
        //var groupDataSize2=(n2.group_data)?n2.size*2:0


        var groupDataLS1 = (n1.group_data && n1.group_data.link_count ? n1.group_data.link_count : 0)
        var groupDataLS2 = (n2.group_data && n2.group_data.link_count ? n2.group_data.link_count : 0)

        var scale = 2
        return scale * 60 +
            Math.min(20 * Math.min((n1.size || (n1.group != n2.group ? groupDataSize1 : 0)),
                    (n2.size || (n1.group != n2.group ? groupDataSize2 : 0))),
                -30 +
                30 * Math.min((n1.link_count || (n1.group != n2.group ? groupDataLS1 : 0)),
                    (n2.link_count || (n1.group != n2.group ? groupDataLS2 : 0))),
                150);

    }

    //---------------------------------------

    function handleConvexHullFeature() {

        //add/update hull meshes
        if (env.convexHullFeature == "simple")
            setTimeout(function () {

                updateHullsForExpandedGroups(d3Nodes, env.expand, env.scene, env)

            }, 500);
        else if (env.convexHullFeature == "advanced") {

            multiHullTestCase()

        }

    }

    //---------------------------------------
    let cntTicks = 0;
    const startTickTime = new Date();
    function layoutTick(layout, d3Nodes, d3Links) {

        //console.error("tick tack", new Date() - startTickTime)

        if (cntTicks++ > env.maxConvergeFrames || (new Date()) - startTickTime > env.maxConvergeTime) {
            layout.alpha(0); //trigger end
            layout.stop(); // Stop ticking graph
        }

        // Update nodes position

        //TODO remove this when particle node groups work with picking and selecting
        d3Nodes.forEach(node => {

            const sphere = node._bubble;
            sphere.position.x = node.x;
            sphere.position.y = node.y || 0;
            sphere.position.z = node.z || 0;

        });

        env.nodeClouds.update()

        //todo animationg this will currently not work
        /*	// Update links position
         d3Links.forEach(link => {

         link.setStartEnd(link.source, link.target)

         });

         */

    }

    //---------------------------------------

    function resizeCanvas() {
        if (env.width && env.height && env.renderer) {
            env.renderer.setSize(env.width, env.height);
            env.camera.aspect = env.width / env.height;
            env.camera.updateProjectionMatrix();
        }

        if(env.textNode)
        {
           // $(env.textNode).height(env.height)
           // $(env.textNode).width(env.width)


        }


    }

    //---------------------------------------

    //create/update particleSystem (little dots inside nodes)
    //potentially add them at specific time
    function initDotParticles(d3Nodes) {
        var demoOptions = {}

        if (!d3Nodes[0].nodes) //FIXME this only works that way because to realData is not generated properly
            demoOptions.npc = function (n) {

                return n.itemCount
                //return 5
            }

        if (env.particles)
            env.particles.remove();
        var particles = createParticleSystemForNodes(d3Nodes, demoOptions);
        env.scene.add(particles.pointCloud);

        //FIXME currently does not animate
        //particles.start()

        env.particles = particles;
    }

    //----------------------------------------

    function initTextNodeContainer(nodeElement) {

        //add container for text elements
        if ($(nodeElement)//.parent()
                .children(".textElements").length == 0) {
            var textElementsContainer = $("<div>").addClass("textElements").css({
                width: "100%",
                height: "100%",
                top: 0,
                left: 0,
                overflow: "hidden",
                position: "absolute",
                "pointer-events": "none"
            })
            env.textNode = textElementsContainer;
            $(nodeElement)//.parent()
                .append(textElementsContainer)

        }
    }

    //----------------------------------------

    var initialisedLineGroup = false
    var line_geom = new THREE.Geometry();
    var lineMaterial
    var mergedLineMesh
    function initLineGroup(env, options) {
        if (initialisedLineGroup)
        {


            if (env.useLineGroup)
                env.scene.add(mergedLineMesh);

            return
        }



        let defaults = {
            opacity: 0.01,
            transparent: true,
            //lineIsVisible:true, // if disabled the line won't be shown on the scene
            color: 0xffffff
        }

        options = _.extend(defaults, options)

        lineMaterial = new THREE.MeshBasicMaterial({
            color: options.color,
            transparent: options.transparent,
            opacity: options.opacity,
            depthTest: false,
            depthWrite: false
        });

        /*var material = new THREE.MeshBasicMaterial( {color: 0xffff00,wireframe:true,visible:true,opacity:env.useDebugSphere?1:0,transparent:true ,
         alphaTest: 1
         //blending:THREE.SubtractiveBlending
         //depthTest:      false, //	depthTest:      false,
         //						depthWrite: false

         } );*/

        lineMaterial.opacity = env.lineOpacity;
        mergedLineMesh = new THREE.Line(line_geom, lineMaterial, THREE.LineSegments);

        mergedLineMesh.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3, 50000);

        //TODO

        env.lineMesh = mergedLineMesh;

        //mergedLineMesh.visible=false


        if (env.useLineGroup)
            env.scene.add(mergedLineMesh);

        env.mergedLineMesh = mergedLineMesh;

        initialisedLineGroup = true;

    }

    //------------------------------------------

    // Component constructor
    function chart(nodeElement) {
        env.domNode = nodeElement;
        env._nodeCounter = []
        env.currentNodesVisible = []
        initTextNodeContainer(nodeElement)

        initStatic();

        digest();

        resizeCanvas();

        return chart;
    }

    //----------------------------------------
    // Getter/setter methods
    exposeProps.forEach(prop => {
        chart[prop.name] = getSetEnv(prop.name, prop.redigest, prop.onChange);
        env[prop.name] = prop.initVal;
        prop.onChange(prop.initVal);

        function getSetEnv(prop, redigest = false, onChange = newVal => {}) {
            return _ => {
                if (!arguments.length) {
                    return env[prop]
                }
                env[prop] = _;
                onChange(_);
                if (redigest) {
                    digest()

                }
                return chart;
            }
        }
    });

    // Reset to default state
    chart.resetState = function () {

        this.graphData({
            nodes: [],
            links: []
        })
            .nodeRelSize(4)
            .lineOpacity(0.1)
            .valAccessor(node => node.val)
            .nameAccessor(node => node.name)
            .colorAccessor(node => node.color)
            .shapeAccessor(node => node.shape)
            .groupAccessor(node => node.group)
            .initialEngineTicks(0) //TODO fiddle with values to find a nice approximation for different graphs
            .maxConvergeTime(7500) // ms
            .maxConvergeFrames(150);

        env.expand = undefined;
        env.net = undefined;

        return this;
    };

    chart.env = env;

    chart.resetState(); // Set defaults at instantiation

    return chart;
}


/***/ }),
/* 19 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Created by Frank on 08.06.2017.
 */

class BaseEdge {

    //FIXME fix offset of edges or add to rootcluster maybe? with offset per cluster? ...

    constructor(start,end) {

        this.mStart=start;
        this.mEnd=end;

   /*     this.mStart = new THREE.Vector3();
        if (start) this.mStart.copy(start);


        this.mEnd = new THREE.Vector3();
        if (end) this.mEnd.copy(end);
    */

    }

    getStart() {
        return this.mStart;

    }

    getEnd() {
        return this.mEnd;
    }


}
/* harmony export (immutable) */ __webpack_exports__["a"] = BaseEdge;


/***/ }),
/* 20 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__EdgeUtil__ = __webpack_require__(2);
/**
 * Created by Frank on 02.06.2017.
 */




/**
 * simple node implementation for interaction and basic visualisation
 *
 */
class BaseNode extends THREE.Mesh {

    /**
     * there are 3 types of events handled for a node
     * (1) mouse events via THREEx.domEvents
     * (2) keyboard hotkeys that are bound to "keyup" via jQuery.hotkeys
     * (3) any other custom event
     * NOTE: customise in sub class as needed
     */


    getRegisteredCustomEvents() {
        return this.mCustomEventNames

    }

    registerCustomEvent(eventName) {

        if (!this.mCustomEventNames) this.mCustomEventNames = [];

        this.mCustomEventNames.push(eventName);

    }


    isCustomEvent(eventName) {
        return this.getRegisteredCustomEvents().indexOf(eventName) >= 0
    }

    isMouseEvent(eventName) {
        return THREEx.DomEvents.eventNames.indexOf(eventName) >= 0
    }


    //------------------------------------------------
    onCustomEvent(eventName, eventhandler) {
        this.mCustomEvents.on(eventName, eventhandler.bind(this))
    }

    offCustomEvent(eventName, eventhandler) {
        this.mCustomEvents.off(eventName, eventhandler)
    }


    triggerCustomEvent(eventName, origDomEvent, intersect) {
        this.mCustomEvents.trigger(eventName, origDomEvent, intersect)
    }

    //------------------------------------------------


    // we need a single window keyup listener that listens for keyevents and forwards/triggers
    // them on the current element similar to how the mouse events do
    //Note: the current implementation only triggers keypresses every 300 ms
    onKey(eventName, eventhandler) {
        let handler = _.throttle(eventhandler.bind(this), 300)

        this.mKeyboardEvents.bind(eventName, handler, 'keydown');

    }

    //TODO wont work with debounced handler
    offKey(eventName, eventhandler) {
        this.mKeyboardEvents.unbind(eventName, eventhandler);
        // $(window).off(eventName, eventhandler);

    }

    triggerKey(eventName, origDomEvent, intersect) {
        this.mKeyboardEvents.trigger(eventName, origDomEvent, intersect);
        // $(window).trigger(eventName, origDomEvent, intersect);
    }

    /**
     * gets called on the node that the mouse is hovering over
     *
     */
    resolveKeyEvent(event) {


        this.mKeyboardEvents.handleKeyEvent(event)

    }


    //------------------------------------------------
    on(eventName, eventhandler) {


        for (let eName of eventName.split(" ")) {

            if (this.isCustomEvent(eName))
                this.onCustomEvent(eName, eventhandler);
            else if (this.isMouseEvent(eName))
                this.getDOMEvents().addEventListener(this, eName, eventhandler.bind(this), false);
            else
                this.onKey(eName, eventhandler)

        }
        ;

        return this;
    }

    off(eventName, eventhandler) {

        for (let eName of eventName.split(" "))


            for (let eName of eventName.split(" ")) {

                if (this.isCustomEvent(eName))
                    this.offCustomEvent(eName, eventhandler);
                else if (this.isMouseEvent(eName))
                    this.getDOMEvents().removeEventListener(this, eName, eventhandler, false);
                else
                    this.offKey(eName, eventhandler)

            }


        return this;


    }

    trigger(eventName, origDomEvent, intersect) {


        for (let eName of eventName.split(" ")) {


            if (this.isCustomEvent(eName))
                this.triggerCustomEvent(eName, origDomEvent, intersect);
            else if (this.isMouseEvent(eName))
                this.getDOMEvents()._notify(eName, this, origDomEvent, intersect);
            else
                this.triggerKey(eName, origDomEvent, intersect)

        }
        ;

        return this;


    }


    //---------------end of event definition part----------------------

    constructor(view) {


        BaseNode.initStatic()

        var material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            // wireframe: true,
            visible: true,
            opacity: 0.01,
            side: THREE.BackSide,
            // opacity: env.useDebugSphere ? 1 : 0,
            transparent: true,
            alphaTest: 0.99 //if set to 1.0 it somehow gets converted to int which will result in the shader failing

        });


        super(BaseNode.sphereGeometry, material);

        this.registerCustomEvent('before-render')


        // var axisHelper = new THREE.AxisHelper( 50 );
        // this.add( axisHelper );


        if (view instanceof HTMLElement)
            this.setView(view)


        this.mCustomEvents = $({})


        this.addDefaultHandlers();

        //custom events container

        //keyboard events container
        // TODO to be able to use event bubbling we'd need to append the html elements to the one of the parent cluster
        this.mKeyboardEvents = new Mousetrap(document.createElement("span"));


    }


    addDefaultHandlers() {

        //FIXME something is off with ordering an nesting .. preventing the correct node to be used
        //store the current cluster/node
        this.on("mouseover", function (e) {
            e.stopPropagation()
            BaseNode.lastHoveredNode = e.target
            // e.stopPropagation()

        })
        this.on("mouseout", function (e) {
            //  BaseNode.lastHoveredNode =null;
            //  e.stopPropagation()

        })


        // adding before-render event

        function onBeforeRender() {
            this.trigger("before-render",null,arguments)

        }

        Object.defineProperty(this, "onBeforeRender", {
            enumerable: false,
            configurable: false,
            get: function () {
                return onBeforeRender.bind(this);
            }.bind(this),
            set: function (newValue) {

                console.warn("onBeforeRender cannot be overridden use .on('before-render',function(){}) instead")


            }

        });
        //------------------

        // adding before-render event default handler
        this.on("before-render", function () {

            //the update is currently called from the view3D for the root element
            //and all child elements..
            // TODO check what impact this has on the workflow
            this.update()

        })


    }


    static initStatic() {
        if (BaseNode._static_initialised_) return

        //BaseNode.sphereGeometry = new THREE.SphereGeometry(1, 3, 2);
        BaseNode.sphereGeometry = new THREE.SphereGeometry(10, 10, 5);
        BaseNode.emptyGeometry = new THREE.Geometry();
        BaseNode.emptyGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3, 1);


        BaseNode.lastSelectedNode = null;

        BaseNode.lastHoveredNode = null;

        //FIXME set camera and domElement not via env attribute ...
        // BaseNode.domEvents = new THREEx.DomEvents(/*camera, renderer.domElement*/)
        // BaseNode.domEvents = globalEnv.domEvents


        BaseNode._static_initialised_ = true


        //have one gloabal listener for all nodes and let them
        $(window).on("keydown", function (e) {
            if (!BaseNode.lastHoveredNode) return

            BaseNode.lastHoveredNode.resolveKeyEvent(e)

        });


    }


    /**
     * update stub, override in descending class
     * NOTE:don't call update for any cluster directly,it will be called via before-render
     *
     */
    update() {
    }


    /**
     * stub
     *
     *
     */
    getDOMElement() {


        throw new Error("implement method 'getDOMElement' in sub class (return valid domElement) ")

    }


    /**
     * stub
     *
     *
     */
    getDOMEvents() {


        throw new Error("implement method 'getDOMEvents' in sub class (return valid THREEx.domEvents) ")

    }

}
/* harmony export (immutable) */ __webpack_exports__["a"] = BaseNode;


/***/ }),
/* 21 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__BaseEdge__ = __webpack_require__(19);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__EdgeUtil__ = __webpack_require__(2);
/**
 * Created by Frank on 08.06.2017.
 */






/**
 * NOTE: the nodes for this container need to be child elements of the  same cluster
 *
 *
 */

class EdgesContainer extends THREE.Object3D {
    constructor(...args) {
        super(...args);
        this.initLineMesh();

        this.mExternalNodesHelpers = [];


        this.setSkipParams(1);

        this.setRenderMode(true, true, true)


    }

    setSkipParams(numSkipEdges, numDefaultMinimum = 20) {
        if (numSkipEdges < 1) numSkipEdges = 1


        this.skipEdges = numSkipEdges;
        this.numDefaultMinimum = numDefaultMinimum;
        return this;
    }


    setRenderMode(drawInternalEdges, drawOutgoingEdges, drawIngoingEdges) {
        this.drawInternalEdges = drawInternalEdges;
        this.drawOutgoingEdges = drawOutgoingEdges;
        this.drawIngoingEdges = drawIngoingEdges;

        return this;
    }


    addEdge(_edge) {


        var that = this;

        function createExternalNodeHelper(node, internalOtherNode) {
            var nPos = node._bubble.position;
            var adjustedPos = new THREE.Vector3;

            return {
                position: adjustedPos,
                update: function () {

                    if (!node.getParentCluster()) return; //not connected
                    if (!internalOtherNode.getParentCluster()) return; //not connected

                    adjustedPos.setFromMatrixPosition(node.getParentCluster().matrixWorld);
                    //setFromMatrix
                    adjustedPos.add(nPos);
                    let other = new THREE.Vector3;
                    other.setFromMatrixPosition(internalOtherNode.getParentCluster().matrixWorld);
                    adjustedPos.sub(other)


                }
            }
        }

        //we need to keep track of  edges that are within it's container and those who are linked to outer elements
        //so all nodes within the edges that link into another cluster (!isSrcInternalNode)
        //are stored for later updating

        //        let newEdge = new BaseEdge(_edge.mStart,_edge.mEnd);
        let newEdge = new __WEBPACK_IMPORTED_MODULE_0__BaseEdge__["a" /* default */](_edge.source._bubble.position, _edge.target._bubble.position);


        if (!_edge.isSrcInternalNode) {
            let helper = createExternalNodeHelper(_edge.source, _edge.target);
            this.mExternalNodesHelpers.push(helper);
            this.mEdges.geometry.vertices.push(helper.position);

        }
        else
            this.mEdges.geometry.vertices.push(newEdge.getStart());


        if (!_edge.isTrgInternalNode) {
            let helper = createExternalNodeHelper(_edge.target, _edge.source);
            this.mExternalNodesHelpers.push(helper);
            this.mEdges.geometry.vertices.push(helper.position);

        }
        else
            this.mEdges.geometry.vertices.push(newEdge.getEnd());


        // this.mEdges.geometry.vertices.push(newEdge.getStart());
        // this.mEdges.geometry.vertices.push(newEdge.getEnd());


        return newEdge;
    }

    updateEdges() {

        if (this.mExternalNodesHelpers.length == 0) return;
        _.each(this.mExternalNodesHelpers, helper => helper.update());
        this.mEdges.geometry.verticesNeedUpdate = true;

    }

    setFromNodes(nodes) {


        let edges = __WEBPACK_IMPORTED_MODULE_1__EdgeUtil__["a" /* default */].getEdgesForNodes(nodes, this.drawInternalEdges, this.drawOutgoingEdges, this.drawIngoingEdges);


        //skip edges for better performance
        //TODO option to filter by size and take only most relevant n elements
        let edgeCounter = 0;

        let skip = this.skipEdges;

        if (nodes.length / this.skipEdges < this.numDefaultMinimum)
            skip = Math.floor(nodes.length / this.numDefaultMinimum, 1)

        edges = edges.filter(e => edgeCounter++ % skip == 0);


        for (let edge of edges)
            this.addEdge(edge)


        this.updateEdges();


    }


    initLineMesh() {

        var line_geom = new THREE.Geometry();
        var lineMaterial;
        var mergedLineMesh;

        function initLineGroup(options) {


            defaults = {
                opacity: 0.01,
                transparent: true,
                //lineIsVisible:true, // if disabled the line won't be shown on the scene
                color: 0xffffff
            };

            options = _.extend(defaults, options);

            lineMaterial = new THREE.MeshBasicMaterial({
                color: options.color,
                transparent: options.transparent,
                opacity: options.opacity,
                depthTest: true,
                depthWrite: false
            });


            mergedLineMesh = new THREE.Line(line_geom, lineMaterial, THREE.LineSegments);


            //TODO compute boundingbox to prevent flicker when edges are partially off screen
            //   mergedLineMesh.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3, 50000);


            return mergedLineMesh;
        }


        this.mEdges = initLineGroup({
            opacity: 0.2,
            color: 0x49616C,
            transparent: true,
        });

        this.add(this.mEdges)


    }


}
/* harmony export (immutable) */ __webpack_exports__["a"] = EdgesContainer;



/***/ }),
/* 22 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__distributions_BaseDistribution__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__distributions_DefaultDistribution__ = __webpack_require__(13);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__distributions_RandomDistribution__ = __webpack_require__(14);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__distributions_ForceGraphDistribution__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__distributions_SphericalDistribution__ = __webpack_require__(15);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__ClusterNodeArray__ = __webpack_require__(12);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__ClusterLeafElement__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__BaseCluster3D__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__Cluster3DExtended__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__RootCluster__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_10__GraphData__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_11__view_GraphView3D__ = __webpack_require__(17);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_12__view_SimpleForceGraphView3D__ = __webpack_require__(18);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_13__hull_BoxVolume__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_14__hull_BaseVolume__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_15__hull_ConvexVolume__ = __webpack_require__(16);
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "Cluster3DExtended", function() { return __WEBPACK_IMPORTED_MODULE_8__Cluster3DExtended__["a"]; });
/**
 *  TODO re-structure graph
 * -into graph + subgraphs or simply multiple graphs
 * -each graph may have distribution class/function which handles the layouting of the node/edges
 * -for example a node-set might divided into different sub-sets depending on current assosiations
 *  they may further contain sub-sets
 * - for rendering, these sets are going to be put into a container class like the "nodeClouds"
 * so a "nodesContainer" and a nodesClusterContainer will be needed which also have the distribution function
 */



THREE.EllipsoidGeometry = function (width, height, depth, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength) {

    THREE.SphereGeometry.call(this, width * 0.5, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength);

    var matrix = new THREE.Matrix4().makeScale(1.0, height / width, depth / width);

    this.applyMatrix(matrix);

    //this.boundingSphere.applyMatrix4( matrix );

};

THREE.EllipsoidGeometry.prototype = Object.create(THREE.Geometry.prototype);


























//-----------------------------------------
//-----------DEBUG-------------------------
//-----------------------------------------




/**
 * currently used for debugging purposes
 */
class MyMain {

    constructor(datasets) {
        this.setDataSets(datasets);
        this.setupViews()


        //  this.clusters = this.init();


    }


    getDefaultHullMaterial() {

        return new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            wireframe: false,
            transparent: true,
            opacity: 0.1,
            visible: false
        });

    }


    getEllipsoidHull(boundingBox) {

        let _center = boundingBox.getCenter();
        let _size = boundingBox.getSize();

        var sphereGeometry = new THREE.EllipsoidGeometry(_size.x, _size.y, _size.z);

        let hull = new THREE.Mesh(sphereGeometry, this.getDefaultHullMaterial());
        // hull.position.copy(_center)

        return hull

    }




    getRingHull(boundingBox) {

        let boundingSphere = new THREE.Sphere;
        //get center, radius
        let _center = boundingBox.getCenter();
        let _size = boundingBox.getSize();
        let radius = _size.length() / 2;
        //TODO
        if (radius < 40) radius = 40;

        boundingSphere.radius = radius;

        let ringGeometry = new THREE.RingGeometry(boundingSphere.radius * 0.95, boundingSphere.radius, 32);


        ringGeometry.boundingSphere = boundingSphere;


        let hull = new THREE.Mesh(ringGeometry, this.getDefaultHullMaterial());


        hull.onBeforeRender = function (renderer, scene, camera, geometry, material, group) {
            //billboard effect
            this.setRotationFromQuaternion(camera.quaternion)
            //     console.warn(camera.quaternion.x,camera.quaternion.y)

        };

        return hull
    }

    isDebug()
    {

       return window.location.hash=="#debug"

    }



    setupViews() {
        const thumbCSS = {
            "pointer-events": "all",
            height: 300,
            width: 400,
            display: "flex",
            "border": "1px solid rgba(128, 128, 128, 0.5)",
            margin: "0.2em"
        };


        function createContainer() {

            let containerCSS = {
                //"pointer-events": "none",
                // display: "flex",
                // "flex-flow": "row wrap",

                display: "grid",
                // "grid-template-rows": "repeat(10, 287px)",
                "grid-auto-rows": "300px",
                "grid-template-columns": "50% 50%",

                padding: "1em",

                position: "absolute",
                top: "10em",
                left: "20em",
                width: 840,//"60em",
                height: "40em"
                , "overflow-y": "scroll"
                , "overflow-x": "hidden",
                background: "rgba(255, 255, 255, 0.2)",
                border: "1px solid rgba(128, 128, 128, 0.5)",
            };


            var container = $("<div>")
                .css(containerCSS)//.hide()
                .appendTo("body");

            let title = $("<div>press 'space' to toggle menu, 'double-click' elements to maximise </div>")
                .css({
                    position: "absolute",
                    "pointer-events": "none",
                    width: "100%",
                    "font-size": "1em",
                    color: "rgba(255, 255, 255, 0.5)"
                });


            function toggleMenu() {
                container.toggle()
            }

            title.on("click", toggleMenu);

            container.append(title);


            Mousetrap.bind("space", toggleMenu);

            return container
        }

        var that = this;


        var container = createContainer();


        function createDefaultView(name = "View3D") {

            let mGraphView = document.createElement("simple-force-graph-view-3d");//("view-3d")

            if (that.isDebug())
                mGraphView.maxFPS=10;

            customElements.whenDefined("simple-force-graph-view-3d").then(function () {


                if (mGraphView.setCaption)
                    mGraphView.setCaption(name);

                $(mGraphView)
                    .css(thumbCSS);

                $(mGraphView).on("dblclick", function () {

                    if (mGraphView.isMaximised()) return;

                    container.hide();

                    let maximisedContainer = $("#3d-graph");

                    var prevMaximisedElement = maximisedContainer.children(".view-3d");//("graph-view-3d")

                    _.each(prevMaximisedElement, function (view) {

                        view.undoMaximise() //

                    });

                    container.append(prevMaximisedElement);

                    //--------
                    maximisedContainer.append(this);
                    this.maximise()


                })


            });
            var setData = mGraphView.setData;
            mGraphView.setData = function (data) {

                customElements.whenDefined("simple-force-graph-view-3d").then(function () {

                    setData.call(mGraphView, data)

                })

            };

            return mGraphView

        }






        function createView(name = "View3D", speccs,isMaximised=false) {

            function maximiseView() {

                if (mGraphView.isMaximised()) return;
                container.hide();

                let maximisedContainer = $("#3d-graph");
                //globalEnv.scene=mGraphView.mScene
                var prevMaximisedElement = maximisedContainer.children(".view-3d");//("graph-view-3d")

                _.each(prevMaximisedElement, function (view) {

                    view.undoMaximise()

                });

                container.append(prevMaximisedElement);


                //TODO remove small bug with connectCallback in view3D recursion
                maximisedContainer.append(this);

                this.maximise()

            }


            let mGraphView = document.createElement("graph-view-3d");
            mGraphView.setCaption(name);



            if (that.isDebug())
            {
                mGraphView.maxFPS=10;

            }

            mGraphView.showFPSCounter=that.isDebug()


            $(mGraphView)
                .css(thumbCSS);

            $(mGraphView).on("dblclick",maximiseView );


            mGraphView.setSpeccs(speccs);

            //TODO per view ... mGraphView.mRenderer.domElement
            let events= new Mousetrap();


           var edgesVisible=true;
            events.bind("e",function(){
                edgesVisible=!edgesVisible;
                _.each(mGraphView.mRootCluster.getLeafs(),function(leaf){
        console.log("TODO toggling edges won't work because of LOD impl")
                    leaf.mEdgesContainer.visible=edgesVisible
                    leaf.mEdgesContainer2.visible=edgesVisible

                })


            });

            var infoVisible=true;
            events.bind("h",function(){
                infoVisible=!infoVisible;
                $(".info-panel").toggle(infoVisible)


            });


            //FIXME
       if (isMaximised)
           $(mGraphView).on("loaded",function (){

                     maximiseView.bind(mGraphView)()
           } );



            return mGraphView

        }


        let views = [];



        if(that.isDebug()) {


            //NOTE: target rendering
            var speccs = this.getForceSpeccs();
            let view2 = createView("new force-graph", speccs,true)
                .loadDataSet(this.getDSByID(1));
            views.push(view2);


            var speccs = this.getPossibleClusterSpeccsArray();
            let view1 = createView("dist test", speccs)
                .loadDataSet(this.getDSByID(1));
            views.push(view1)



            let view0 = createDefaultView("previous force-graph")
                .loadDataSet(this.getDSByID(1));
            views.push(view0);




            /*
                        let view3 = createView("node distribution test case",
                            [{
                                distribution: new BaseDistribution(2000, 3),
                                options: { hull: new BoxVolume()}
                            }])
                            .loadDataSet(this.getDSByID(1))

                        views.push(view3)


                        var speccs = this.get2DChartSortedSpeccsArray()

                        let view4 = createView("2d-Barchart", speccs)
                            .loadDataSet(this.getDSByID(1))
                        views.push(view4)
            */



            /*  var speccs = this.getPossibleClusterSpeccsArray();
             let view1 = createView("View1", speccs)
             views.push(view1)*/

            /*
             var speccs = this.get2DPlaneCountryOnlySpeccs()
             let view5 = createView("2d-Plane country-only", speccs)
             views.push(view5)
             */

        } else {





            //NOTE: target rendering
             var speccs = this.getForceSpeccs();
             let view2 = createView("new force-graph", speccs,true)
             .loadDataSet(this.getDSByID(0));
             views.push(view2)



        }





        _.each(views, function (view) {
            if ($(view).parent().length==0)
            container.append(view)
        })


    }


    get2DChartSortedSpeccsArray() {


        function countrySetGenerator(groupFunction, node) {

            groupFunction(node.group, node)
        }

        function industrySetGenerator(groupFunction, node) {
            groupFunction(node.industry, node)
        }

        function mySort(a, b) {
            return (a.mNodes.length < b.mNodes.length) ? 1 : -1;
            //return (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1;
        }

        return [
            {
                generator: countrySetGenerator,
                distribution: new __WEBPACK_IMPORTED_MODULE_0__distributions_BaseDistribution__["a" /* default */](4000, 2).onSort(mySort),
                options: {minClusterSize: 15, hull:  __WEBPACK_IMPORTED_MODULE_13__hull_BoxVolume__["a" /* default */]}
            },
            {
                generator: industrySetGenerator,
                distribution: new __WEBPACK_IMPORTED_MODULE_0__distributions_BaseDistribution__["a" /* default */](2000, 1).onSort(mySort),
                options: {minClusterSize: 15, hull: __WEBPACK_IMPORTED_MODULE_13__hull_BoxVolume__["a" /* default */]}
            },
            {distribution: new __WEBPACK_IMPORTED_MODULE_0__distributions_BaseDistribution__["a" /* default */](200, 3), options: {minClusterSize: 15, hull: __WEBPACK_IMPORTED_MODULE_13__hull_BoxVolume__["a" /* default */]}}


        ]


    }


    get2DPlaneCountryOnlySpeccs() {


        function countrySetGenerator(groupFunction, node) {

            groupFunction(node.group, node)
        }

        function industrySetGenerator(groupFunction, node) {
            groupFunction(node.industry, node)
        }

        function mySort(a, b) {
            return (a.mNodes.length < b.mNodes.length) ? 1 : -1;
            //return (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1;
        }

        return [
            {
                generator: countrySetGenerator,
                distribution: new __WEBPACK_IMPORTED_MODULE_0__distributions_BaseDistribution__["a" /* default */](2000, 2).onSort(mySort),
                options: {minClusterSize: 15, hull: __WEBPACK_IMPORTED_MODULE_13__hull_BoxVolume__["a" /* default */]}
            },
            {distribution: new __WEBPACK_IMPORTED_MODULE_0__distributions_BaseDistribution__["a" /* default */](400, 2),  options: { hull:  new __WEBPACK_IMPORTED_MODULE_13__hull_BoxVolume__["a" /* default */]()}}


        ]


    }

    getPossibleClusterSpeccsArray() {

        function countrySetGenerator(groupFunction, node) {

            groupFunction(node.group, node)
        }

        function industrySetGenerator(groupFunction, node) {
            groupFunction(node.industry, node)
        }

        //using these 2 we should have a 2d plane with 3d cubes on it
        let sample1 = new __WEBPACK_IMPORTED_MODULE_0__distributions_BaseDistribution__["a" /* default */](40000, 2); //1000
        let sample2 = new __WEBPACK_IMPORTED_MODULE_3__distributions_ForceGraphDistribution__["a" /* default */](5000, 2);//200
        let sample3 = new __WEBPACK_IMPORTED_MODULE_0__distributions_BaseDistribution__["a" /* default */](100, 3);//50

        //  let rand2 = new RandomDistribution(200, 2)

        return [
            {generator: countrySetGenerator, distribution: sample1,     options: {minClusterSize: 5, hull: __WEBPACK_IMPORTED_MODULE_13__hull_BoxVolume__["a" /* default */]}},
            {generator: industrySetGenerator, distribution: sample2,      options: {minClusterSize: 5, hull: __WEBPACK_IMPORTED_MODULE_13__hull_BoxVolume__["a" /* default */]}},
            {distribution: sample3,      options: {hull: __WEBPACK_IMPORTED_MODULE_13__hull_BoxVolume__["a" /* default */]}}


        ]

    }


    getForceSpeccs2DChangesOnly(){

        let speccs=this.getForceSpeccs()


        speccs[0].distribution = new __WEBPACK_IMPORTED_MODULE_0__distributions_BaseDistribution__["a" /* default */](45000, 2); // countries get placed equally on a plane of size 15k X 15k
        speccs[1].distribution = new __WEBPACK_IMPORTED_MODULE_0__distributions_BaseDistribution__["a" /* default */](10000, 2);// industries within countries use the Force-Graph approach to position elements
        speccs[2].distribution = new __WEBPACK_IMPORTED_MODULE_0__distributions_BaseDistribution__["a" /* default */](500, 3);//same g

           return speccs

    }


    /**
     * this is a sample configuration for  the cluster.
     * it contains 2 subdivisions:  -first into countries
     *                              -followed by industry
     *
     */
    getForceSpeccs() {


        //the function that is called to create the  country groups
        function countrySetGenerator(groupFunction, node) {
            // the group function takes 2 arguments
            // the first is the value that will determine the key of the group
            //in this case node.group contains country names
            //the second argument is the node itself that is passed into the group created
            groupFunction(node.group, node)
        }

        //same goes for the industy clusters that are sub-clusters of the country clusters in this example
        function industrySetGenerator(groupFunction, node) {
            groupFunction(node.industry, node)
        }



        //there are several distribution classes defined
        //these handle how the current cluster positions it's sub-clusters when rendering
        //basically a distribution function does have 2 parameters
        // the first is the maximum size in x/y/z direction the elements within can be placed
        // the second defined the dimensions 1/2/3 that get used for the element placement


        let countryDistribution = new __WEBPACK_IMPORTED_MODULE_0__distributions_BaseDistribution__["a" /* default */](45000, 2); // countries get placed equally on a plane of size 15k X 15k
        let industryDistribution = new __WEBPACK_IMPORTED_MODULE_3__distributions_ForceGraphDistribution__["a" /* default */](15000, 3);// industries within countries use the Force-Graph approach to position elements
        let nodesWithinIndustryDistribution = new __WEBPACK_IMPORTED_MODULE_3__distributions_ForceGraphDistribution__["a" /* default */](500, 3);//same goes for the nodes within each industry

        //the final configuration for rendering
        //it contains an additional options attribute per array entry

        // @param options.minClusterSize ... is the lower bound for the nodes within the cluster
        // if the cluster has fewer elements all clusters previously generated are places within this "other" cluster
        // @param options. defaultMergeGroupName the name of the "other" cluster can be changed by this value
        // @param options.hull can be used to add a volume around the cluster
        //by default if no value gets set, the BaseVolume class is used which is invisible by default
        //but is necessary for other components like picking and tet rendering


        let rootHull=this.isDebug()?__WEBPACK_IMPORTED_MODULE_13__hull_BoxVolume__["a" /* default */]:__WEBPACK_IMPORTED_MODULE_14__hull_BaseVolume__["a" /* default */];

        return [

           {
                generator: countrySetGenerator,
                distribution: countryDistribution,
                options: {minClusterSize: 40, hull: rootHull }
            },
            {
                generator: industrySetGenerator,
                distribution: industryDistribution,
                options: {minClusterSize: 15,hull:__WEBPACK_IMPORTED_MODULE_15__hull_ConvexVolume__["a" /* default */] }// new BoxVolume() ConvexVolume//FIXME  this option is used twice for leaf and parent  and below is ignored
            }
            , {distribution: nodesWithinIndustryDistribution, hull: __WEBPACK_IMPORTED_MODULE_13__hull_BoxVolume__["a" /* default */] }  // this.getEllipsoidHull.bind(this)
            //FIXME getEllipsoidHullis not used

        ]

    }


    setDataSets(datasets) {
        this.mDataSets = datasets;

    }


    getDSByID(id) {
        return this.mDataSets[id]
    }

//-------------------------------
     getCurrentView()
    {
        return $(".view-3d.view-3d-maximised").get(0)

    }

    setGraph2D()
    {


        /**
         * FIXME if a cluster has subclusters and no clustering is given use the existsing
         * likewise with distributions
         * currently the cluster gets cleaned first before the new visualisation is generated
         *
         *
         *
         */

            //   let speccs=this.getPossibleClusterSpeccsArray();

         let speccs=this.getForceSpeccs2DChangesOnly();

        let view= this.getCurrentView();
        let rootCluster=view.mRootCluster;

        rootCluster.cleanUpLeafs();
        //clean up previous clusters
        __WEBPACK_IMPORTED_MODULE_7__BaseCluster3D__["a" /* default */].cleanUpClusters(rootCluster.findClusters("*"), rootCluster);


        rootCluster.applyClustering(speccs);


       // doZoomToPos(new THREE.Vector3(0,0,10000));
        //view.mControls.target.set(new THREE.Vector3(0,0,0));
      //  view.mControls.noRotate=true;
        doZoomToPos(new THREE.Vector3(0,0,0),10000);


    }



    setGraph3D()
    {

        let speccs=this.getForceSpeccs();
        let view= this.getCurrentView();
        let rootCluster=view.mRootCluster;

        rootCluster.cleanUpLeafs();
        //clean up previous clusters
        __WEBPACK_IMPORTED_MODULE_7__BaseCluster3D__["a" /* default */].cleanUpClusters(rootCluster.findClusters("*"), rootCluster);



        rootCluster.applyClustering(speccs);

        view.mControls.noRotate=false;


        doZoomToPos(new THREE.Vector3(0,0,0),10000);

    }



}
/* harmony export (immutable) */ __webpack_exports__["MyMain"] = MyMain;





	

/***/ })
/******/ ]);
//# sourceMappingURL=bundle.js.map