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
/******/ 	__webpack_require__.p = "/test_app/build/";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 25);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ClusterLeafElement__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__BaseNode__ = __webpack_require__(23);
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


        //initially have a value to ignore the lod while loading to make the animations visible for certain elements
        this.useLOD=false;



        this.registerCustomEvent("hull-updated"); // gets called if the hull got adjusted

        this.registerCustomEvent("cluster-ready"); //if the cluster animation is finished

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

        if ( this.mChildClustersEdgesMesh) {

            let vis= (1-mLOD)/2;


         //TODO the cluster edges should partially be dependant on the size of the hull..



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


            if (cluster.mHull) {
                cluster.mHull.dispose();
                delete (cluster.mHull);
                cluster.mHull = null;
            }



            cluster.removeEdges();


            if (cluster == self) return;//don't detach the current root element


            if (cluster.parent) {

                if (cluster.parent.mClusters && cluster.name)
                    delete(cluster.parent.mClusters[cluster.name]);
                cluster.parent.remove(cluster)
            }


            delete cluster._LeafsCached;



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

                that.addChildClusterEdgeMesh();
                that.updateChildClusterEdgeMeshWithHull();

                that.trigger("hull-updated");
            },50, {trailing: true, leading: false}))  //if leading is true it won't build up the hulls in a progressive manner
        });



        this.setDistributionHandler(entry.distribution, function () {
            that.mClusterRule = entry

            that.trigger("cluster-ready")
        })

    }



    removeEdges()
    {

        if (this.mChildClustersEdges) this.mChildClustersEdges = null; //delete edge references
        if (this.mChildClustersEdgesMesh) {
            this.mChildClustersEdgesMesh.geometry.dispose();

            this.remove( this.mChildClustersEdgesMesh)
            this.mChildClustersEdgesMesh = null; //delete edge-mesh  references

        }

    }




    /**
     * updates the edges of the clusters as soon as the hullf feature is rendered
     *
     *
     * @param options
     */


    updateChildClusterEdgeMeshWithHull(options) {



        //TODO
        if (!this.mChildClustersEdgesMesh) throw new Error("BaseCluster::addChildClusterEdgeMesh must be called first")

        let edges = this.createEdgesForChildClusters();


        var line_geom =new THREE.Geometry();


        this.mChildClustersEdgesMesh.geometry.dispose()
        this.mChildClustersEdgesMesh.geometry= line_geom


        for (let edge of edges)
        {
            //TODO we should unify the edges to not always have 2 separate ways to access certain elements
            //TODO also we should use the center of the hull feature instead
            //FIXME for cluster: add edges only if mHull exists

            let src,dst;



            if (edge.source._el && edge.target._el)
            {
                src=edge.source._el.mHull.mBoundingBox.getCenter();
                dst=edge.target._el.mHull.mBoundingBox.getCenter();
            }
            else if (edge.source.mHull &&  edge.target.mHull)
            {
                src=edge.source.mHull.mBoundingBox.getCenter();
                dst=edge.target.mHull.mBoundingBox.getCenter();
            }
            else
            {

                continue;
              //  throw new Error("hull should exist before calling this function...")

            }


            let src0=edge.source.position||edge.source._el.position;
            let dst0=edge.target.position||edge.target._el.position;
            src.add(src0)
            dst.add(dst0)

            line_geom.vertices.push(src);
            line_geom.vertices.push(dst);

        }


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
        //FIXME for cluster: add edges only if mHull exists

        let src,dst;

            src=edge.source.position||edge.source._el.position;
            dst=edge.target.position||edge.target._el.position;

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

                    //that.addChildClusterEdgeMesh();

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
            that.adjustHullSize();

            if (that.isLeaf())
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
     //   this.adjustHullSize();


        if (!this.mLeaf) return

      //  this.mLeaf._initDotParticles();
        this.mLeaf.updateDotParticlesColor()



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

        function animate(time) {


            _.each(tweens, function (tween) {
                tween.update(time)
                //  tween.end(time)

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
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__BaseCluster3D__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__distributions_BaseDistribution__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__distributions_ForceGraphDistribution__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__utils_ZoomUtil__ = __webpack_require__(11);
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


        //have a "cluster-ready" event
        this.on("cluster-ready",function(){

            this.addNodeCaptions();

        });




        var curr = 0;

        function onClickFactory(res, speccs) {


            return function clickAndSpeccHandler() {


                var _dist = speccs[curr++ % speccs.length].distribution;

                console.log("setting distribution function", _dist);
                res.setDistributionHandler(_dist, function onComplete() {


                    res.adjustHullSize();
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




    //FIXME performance
        if (this.isLeaf())
            if (this.mLeaf&& this.getView())
                this.mLeaf.updateDots(this.getView().mTime);


    }


    appendNodes(nodes) {

        var that = this;
        _.each(nodes, function (node) {
            if (node && node._bubble)
                that.add(node._bubble)


        })


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
/***/ (function(module, exports) {

var Point = function(x,y,z){
    if(x !== undefined && y !== undefined && z !== undefined){
        this.x = x.toFixed(3);
        this.y = y.toFixed(3);
        this.z = z.toFixed(3);
    }

    this.faces = [];
}

Point.prototype.subdivide = function(point, count, checkPoint){

    var segments = [];
    segments.push(this);

    for(var i = 1; i< count; i++){
        var np = new Point(this.x * (1-(i/count)) + point.x * (i/count),
            this.y * (1-(i/count)) + point.y * (i/count),
            this.z * (1-(i/count)) + point.z * (i/count));
        np = checkPoint(np);
        segments.push(np);
    }

    segments.push(point);

    return segments;

}

Point.prototype.segment = function(point, percent){
    percent = Math.max(0.01, Math.min(1, percent));

    var x = point.x * (1-percent) + this.x * percent;
    var y = point.y * (1-percent) + this.y * percent;
    var z = point.z * (1-percent) + this.z * percent;

    var newPoint = new Point(x,y,z);
    return newPoint;

};

Point.prototype.midpoint = function(point, location){
    return this.segment(point, .5);
}


Point.prototype.project = function(radius, percent){
    if(percent == undefined){
        percent = 1.0;
    }

    percent = Math.max(0, Math.min(1, percent));
    var yx = this.y / this.x;
    var zx = this.z / this.x;
    var yz = this.z / this.y;

    var mag = Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2));
    var ratio = radius/ mag;

    this.x = this.x * ratio * percent;
    this.y = this.y * ratio * percent;
    this.z = this.z * ratio * percent;
    return this;

};

Point.prototype.registerFace = function(face){
    this.faces.push(face);
}

Point.prototype.getOrderedFaces = function(){
    var workingArray = this.faces.slice();
    var ret = [];

    var i = 0;
    while(i < this.faces.length){
        if(i == 0){
            ret.push(workingArray[i]);
            workingArray.splice(i,1);
        } else {
            var hit = false;
            var j = 0;
            while(j < workingArray.length && !hit){
                if(workingArray[j].isAdjacentTo(ret[i-1])){
                    hit = true;
                    ret.push(workingArray[j]);
                    workingArray.splice(j, 1);
                }
                j++;
            }
        }
        i++;
    }

    return ret;
}

Point.prototype.findCommonFace = function(other, notThisFace){
    for(var i = 0; i< this.faces.length; i++){
        for(var j = 0; j< other.faces.length; j++){
            if(this.faces[i].id === other.faces[j].id && this.faces[i].id !== notThisFace.id){
                return this.faces[i];
            }
        }
    }

    return null;
}

Point.prototype.toJson = function(){
    return {
        x: this.x,
        y: this.y,
        z: this.z
    };
}

Point.prototype.toString = function(){
    return '' + this.x + ',' + this.y + ',' + this.z;
}

module.exports = Point;


/***/ }),
/* 6 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__EdgesContainer__ = __webpack_require__(24);
/**
 * Created by Frank on 30.05.2017.
 */





class ClusterLeafElement extends THREE.Mesh {
    constructor(nodes) {
        super();


        this.mNodes = nodes;

        this.mNodeParticles = this.createParticleNodeCloud();
        this.add(this.mNodeParticles.pointCloud);


        //add edges to the leaf
        this.createEdgesFromNodes(nodes);


        // add the nodes to the leaf
        this.appendNodes(nodes);


    }


    getView() {
        return this.parent.getView()


    }

    setLOD(levelOfDetail) {
        if (this.mNodeParticles && this.parent.useLOD)
            this.mNodeParticles.pointCloud.visible = levelOfDetail > 0.3;
        //TODO nodes,edges, ... as well

        let edgeFadeLOD = 0.3;
        let crossfade = 0.2;//TODO add crossfade

        if (this.mEdgesContainer) {

            this.mEdgesContainer.visible = levelOfDetail >= edgeFadeLOD;

            this.mEdgesContainer.mEdges.material.opacity = (levelOfDetail - edgeFadeLOD) / edgeFadeLOD;
        }

        if (this.mEdgesContainer2) {

            this.mEdgesContainer2.visible = levelOfDetail < edgeFadeLOD;

            this.mEdgesContainer2.mEdges.material.opacity = 1 - levelOfDetail / edgeFadeLOD;
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

        if (this.mParticles) {
            this.mParticles.remove();
            this.mParticles.pointCloud.geometry.dispose();
            this.mParticles = null;
        }


        if (this.mEdgesContainer && this.mEdgesContainer.geometry) {

            this.remove(this.mEdgesContainer);

            this.mEdgesContainer.geometry.dispose();
            this.mEdgesContainer = null;
        }


        if (this.mEdgesContainer2 && this.mEdgesContainer2.geometry) {


            this.mEdgesContainer2.geometry.dispose();
            this.mEdgesContainer2 = null;
        }


        if (this.mNodeMeshes && this.mNodeMeshes.geometry) {
            this.mNodeMeshes.geometry.dispose();
            this.mNodeMeshes = null;
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
        this.mEdgesContainer.setRenderMode(true, false, false).setSkipParams(30, 40).setFromNodes(nodes);
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


        }, function () {


            that._initDotParticles();

            onComplete()


        });

    }

    updateEdges() {


        if (this.mEdgesContainer)
            this.mEdgesContainer.updateEdges();

        if (this.mEdgesContainer2)
            this.mEdgesContainer2.updateEdges();

    }

    updateDots(time) {
        if (this.mParticles)
            this.mParticles.update(time);
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


    //create/update particleSystem (little dots inside nodes)
    //potentially add them at specific time
    _initDotParticles() {

        if (this.mParticles)
            this.mParticles.start();


        if (!this.mParticles) {

            var nodes = this.mNodes;
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


            //TODO this timeout currently fixes wrong positioning bug..
            setTimeout(function () {
                particles.start();
            }, 10)

            //TODO call start if distribution function is finished
            /*this.parent.on("distribution-complete", function () {

             particles.start()


             });*/


            this.mParticles = particles;
        }

    }


    updateDotParticlesColor() {

        if (this.mParticles) {
            this.mParticles.updateColors();


            //  this.mParticles.pointCloud.position.sub(this.position); //this.parent.position
        }


    }


}
/* harmony export (immutable) */ __webpack_exports__["a"] = ClusterLeafElement;




/***/ }),
/* 7 */
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
/* 8 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Cluster3DExtended__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__text_ClusterTextOverlay__ = __webpack_require__(26);
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
        // "cluster-ready" as alternative event
        this.on("hull-updated",function(){


         this.findClusters("*").forEach(function(cluster){
             cluster.useLOD=true
         })


        })

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
//FIXME performance
          //  return;
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




    }



   resetTextOverlay(){


        if (this.mTextOverlay) this.mTextOverlay.remove()

       this.mTextOverlay=$("<cluster-text-overlay>");

       $(this.mParentView).append(this.mTextOverlay)

   }




    applyClustering(mClusteringSpeccsArray) {

       //FIXME transitions betweens graphs
      //this.storeParentPositionInNodes()
        super.applyClustering(mClusteringSpeccsArray)

        this.resetTextOverlay()




       // this.restoreNodePositionFromExParent()
    }



}
/* harmony export (immutable) */ __webpack_exports__["a"] = RootCluster;


/***/ }),
/* 9 */
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
/* 10 */
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
/* 11 */
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
            tween.update(time);
            tween2.update(time);
        }


    }

}
/* harmony export (immutable) */ __webpack_exports__["a"] = ZoomUtil;


/***/ }),
/* 12 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__View3D__ = __webpack_require__(28);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__cluster_RootCluster__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__cluster_GraphData__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__coordinates_png__ = __webpack_require__(32);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__coordinates_png___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3__coordinates_png__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_hexasphere_js__ = __webpack_require__(30);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_hexasphere_js___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4_hexasphere_js__);
/**
 * Created by Frank on 13.06.2017.
 */














class GraphView3D extends __WEBPACK_IMPORTED_MODULE_0__View3D__["a" /* default */]
{

    constructor(...args)
    {
        super(...args);

        this.mRootCluster=null;




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



createSkyDome()
{



    var material = new THREE.MeshBasicMaterial();


    let scene=this.mScene;
/*
    var ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);
    var dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 3, 5);
    scene.add(dirLight);
    var geometry = new THREE.SphereGeometry(300000, 60, 40);
    var material = new THREE.MeshBasicMaterial();

   material.map = THREE.ImageUtils.loadTexture(skyDomeImage);
    material.side = THREE.BackSide;
    material.opacity=0.05;
    material.transparent=true;
    var skydome = new THREE.Mesh(geometry, material);

    this.mSkyDome=skydome


*/
 //   scene.add(skydome);


    //--------------------------------
    var meshMaterials = [];
    meshMaterials.push(new THREE.MeshBasicMaterial({color: 0x7cfc00, transparent: true}));
    meshMaterials.push(new THREE.MeshBasicMaterial({color: 0x397d02, transparent: true}));
    meshMaterials.push(new THREE.MeshBasicMaterial({color: 0x77ee00, transparent: true}));
    meshMaterials.push(new THREE.MeshBasicMaterial({color: 0x61b329, transparent: true}));
    meshMaterials.push(new THREE.MeshBasicMaterial({color: 0x83f52c, transparent: true}));
    meshMaterials.push(new THREE.MeshBasicMaterial({color: 0x83f52c, transparent: true}));
    meshMaterials.push(new THREE.MeshBasicMaterial({color: 0x4cbb17, transparent: true}));
    meshMaterials.push(new THREE.MeshBasicMaterial({color: 0x00ee00, transparent: true}));
    meshMaterials.push(new THREE.MeshBasicMaterial({color: 0x00aa11, transparent: true}));

    var oceanMaterial = []
    oceanMaterial.push(new THREE.MeshBasicMaterial({color: 0x0f2342, transparent: true}));
    oceanMaterial.push(new THREE.MeshBasicMaterial({color: 0x0f1e38, transparent: true}));


    var radius = 300000;        // Radius used to calculate position of tiles
    var subDivisions = 3;   // Divide each edge of the icosohedron into this many segments
    var tileSize = 0.9;    // Add padding (1.0 = no padding; 0.1 = mostly padding)


    function isLand(){

        return _.random(0,1)

    }

    var hexaGroup=new THREE.Group();

    var hexasphere = new __WEBPACK_IMPORTED_MODULE_4_hexasphere_js___default.a(radius, subDivisions, tileSize);
    for(var i = 0; i< hexasphere.tiles.length; i++){
        var t = hexasphere.tiles[i];
        var latLon = t.getLatLon(hexasphere.radius);

        var geometry = new THREE.Geometry();

        for(var j = 0; j< t.boundary.length; j++){
            var bp = t.boundary[j];
            geometry.vertices.push(new THREE.Vector3(bp.x, bp.y, bp.z));
        }
        geometry.faces.push(new THREE.Face3(0,1,2));
        geometry.faces.push(new THREE.Face3(0,2,3));
        geometry.faces.push(new THREE.Face3(0,3,4));
        if(geometry.vertices.length > 5){
            geometry.faces.push(new THREE.Face3(0,4,5));
        }

        if(isLand(latLon.lat, latLon.lon)){
            material = meshMaterials[Math.floor(Math.random() * meshMaterials.length)]
        } else {
            material = oceanMaterial[Math.floor(Math.random() * oceanMaterial.length)]
        }

        material.opacity = 0.3;

        material.side = THREE.BackSide;

        var mesh = new THREE.Mesh(geometry, material.clone());
        hexaGroup.add(mesh);
        hexasphere.tiles[i].mesh = mesh;

    }
    scene.add(hexaGroup);
    this.mSkyDome=hexaGroup



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

        //FIXME workflow below ..
        //IMPORTANT: must attach after clustering is applied because "tn" aka. globalTextNodes gets removed at the start of the clustering
        res.attachToView3D(this);
        res.applyClustering(speccs);




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
                  //  that.mRootCluster.updateRootTextNodes(visibleNodes);

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


        this.createSkyDome();


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

            if (root && root.mParentView && root.mTextOverlay) {

                root.mTextOverlay.height(root.mParentView.clientHeight);
                root.mTextOverlay.width(root.mParentView.clientWidth);
                console.log("maximised")
            }




    }

    undoMaximise(){
            super.undoMaximise();


            let root=this.mRootCluster;
            if (root&& root.mParentView && root.mTextOverlay) {

                root.mTextOverlay.height(root.mParentView.clientHeight);
                root.mTextOverlay.width(root.mParentView.clientWidth)
            }


    }


}
/* harmony export (immutable) */ __webpack_exports__["a"] = GraphView3D;


customElements.define("graph-view-3d", GraphView3D);


/***/ }),
/* 13 */
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
/* 14 */
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
/* 15 */
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
/* 16 */
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
/* 17 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__BoxVolume__ = __webpack_require__(10);
/**
 * Created by Frank on 23.06.2017.
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



    //geometry ... at best a convexGeometry
    //numSegments ... determines the smoothing of the rounded edges
    //margin ... the margin of the convex geometry around the original geometry
    myModifier(geometry,numSegments,margin)
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


    createFromBoundingBox(vertices, boundingBox) {

        console.log("FIXME convexVolume",vertices,boundingBox)
            //getVerticesFormLeaf in adjustHullSize does generate false values sometimes maybe due to some runtime concurrency problem
            //FIXME from time ti time this does not compute which will break the graph

           let vert= vertices.filter(v => !(v.x==0 &&v.y==0 &&v.z==0 ) )

            if (vert.length<4 && vertices.length>4) {
                vertices = [];
                boundingBox.min=new THREE.Vector3(-1,-1,-1);
                boundingBox.max=new THREE.Vector3(1,1,1);

           }




        //ConvexGeometry does need at least 4 vertices
        //so in case we don't have as much we do use the boundingbox instead to generate some more vertices
          if (vertices.length < 4)
            vertices = this.getVerticesFromBoundingBox(boundingBox);

        //we will create a sphere geometry with a radius==margin for each vertice and merge them beforehand

        //reduce the vertice count before adding margin
        let geo0
        try{
            geo0 =this.mGeometryZero= new THREE.ConvexGeometry(vertices);
        }
        catch(e){
            geo0=this.mGeometryZero=this.createBoxGeometryFromBoundingBox(boundingBox);
            console.warn(e)

        }



      this.mBoundingBox=boundingBox;




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
        let mesh = new THREE.Mesh(this.geo0, mat);

        mesh.geometry.boundingBox = boundingBox;


        if (this.mesh) this.remove(this.mesh);
        this.mesh = mesh;
        this.add(mesh);
        return this.mesh;

    }

    createBoxGeometryFromBoundingBox(boundingBox)
    {
        let _center = boundingBox.getCenter();
        let _size = boundingBox.getSize();

        let box = new THREE.BoxGeometry(_size.x, _size.y, _size.z);

        box.translate(_center.x, _center.y, _center.z);
    return box;
    }

    getVerticesFromBoundingBox(boundingBox) {

       let box= this.createBoxGeometryFromBoundingBox(boundingBox);


        return box.vertices
    }


    //TODO
    transferFunction(x) {
        return x
    }





    createResolutionGeometry(name,resolution){

        if (!this['geometry'+name]) {
            let margin = this.mBoundingBox.getSize().length() / 10;

            let geo2 = this.myModifier(this.mGeometryZero,resolution , margin);
            geo2.computeBoundingBox();
            this['geometry'+name] = geo2;

        }
        return this['geometry'+name]
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

        if (l < 0.2)
            this.mesh.geometry = this.createResolutionGeometry("Least",2);
       else
        if (l > 0.2 && l < 0.6)
            this.mesh.geometry = this.createResolutionGeometry("Low",5);
        else
        if (l >= 0.6)
            this.mesh.geometry =  this.createResolutionGeometry("Average",10);






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
/* 18 */
/***/ (function(module, exports) {

/**
 *	@author zz85 / http://twitter.com/blurspline / http://www.lab4games.net/zz85/blog
 *
 *	A general purpose camera, for setting FOV, Lens Focal Length,
 *		and switching between perspective and orthographic views easily.
 *		Use this only if you do not wish to manage
 *		both a Orthographic and Perspective Camera
 *
 */




THREE.CombinedCamera = function ( width, height, fov, near, far, orthoNear, orthoFar ) {

	THREE.Camera.call( this );

	this.fov = fov;

	this.far = far;
	this.near = near;

	this.left = - width / 2;
	this.right = width / 2;
	this.top = height / 2;
	this.bottom = - height / 2;

	this.aspect =  width / height;
	this.zoom = 1;
	this.view = null;
	// We could also handle the projectionMatrix internally, but just wanted to test nested camera objects

	this.cameraO = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, 	orthoNear, orthoFar );
	this.cameraP = new THREE.PerspectiveCamera( fov, width / height, near, far );

	this.toPerspective();

};

THREE.CombinedCamera.prototype = Object.create( THREE.Camera.prototype );
THREE.CombinedCamera.prototype.constructor = THREE.CombinedCamera;

THREE.CombinedCamera.prototype.toPerspective = function () {

	// Switches to the Perspective Camera

	this.near = this.cameraP.near;
	this.far = this.cameraP.far;

	this.cameraP.aspect = this.aspect;
	this.cameraP.fov =  this.fov / this.zoom ;
	this.cameraP.view = this.view;

	this.cameraP.updateProjectionMatrix();

	this.projectionMatrix = this.cameraP.projectionMatrix;

	this.inPerspectiveMode = true;
	this.inOrthographicMode = false;


   // The renderer needs world matrix data for the raycasting to work. Make the following modification to the CombinedCamera code:

	// Add to the .toPerspective() method:
	this.matrixWorldInverse = this.cameraP.matrixWorldInverse; //
    this.matrixWorld = this.cameraP.matrixWorld;               //




};

THREE.CombinedCamera.prototype.toOrthographic = function () {

	// Switches to the Orthographic camera estimating viewport from Perspective

	var fov = this.fov;
	var aspect = this.cameraP.aspect;
	var near = this.cameraP.near;
	var far = this.cameraP.far;

	// The size that we set is the mid plane of the viewing frustum

	var hyperfocus = ( near + far ) / 2;

	var halfHeight = Math.tan( fov * Math.PI / 180 / 2 ) * hyperfocus;
	var halfWidth = halfHeight * aspect;

	halfHeight /= this.zoom;
	halfWidth /= this.zoom;

	this.cameraO.left = - halfWidth;
	this.cameraO.right = halfWidth;
	this.cameraO.top = halfHeight;
	this.cameraO.bottom = - halfHeight;
	this.cameraO.view = this.view;

	this.cameraO.updateProjectionMatrix();

	this.near = this.cameraO.near;
	this.far = this.cameraO.far;
	this.projectionMatrix = this.cameraO.projectionMatrix;

	this.inPerspectiveMode = false;
	this.inOrthographicMode = true;

     // and to the .toOrthographic() method add:
    this.matrixWorldInverse = this.cameraO.matrixWorldInverse; //
    this.matrixWorld = this.cameraO.matrixWorld;               //


};



THREE.CombinedCamera.prototype.copy = function ( source ) {

	THREE.Camera.prototype.copy.call( this, source );

	this.fov = source.fov;
	this.far = source.far;
	this.near = source.near;

	this.left = source.left;
	this.right = source.right;
	this.top = source.top;
	this.bottom = source.bottom;

	this.zoom = source.zoom;
	this.view = source.view === null ? null : Object.assign( {}, source.view );
	this.aspect = source.aspect;

	this.cameraO.copy( source.cameraO );
	this.cameraP.copy( source.cameraP );

	this.inOrthographicMode = source.inOrthographicMode;
	this.inPerspectiveMode = source.inPerspectiveMode;

	return this;

};

THREE.CombinedCamera.prototype.setViewOffset = function( fullWidth, fullHeight, x, y, width, height ) {

	this.view = {
		fullWidth: fullWidth,
		fullHeight: fullHeight,
		offsetX: x,
		offsetY: y,
		width: width,
		height: height
	};

	if ( this.inPerspectiveMode ) {

		this.aspect = fullWidth / fullHeight;

		this.toPerspective();

	} else {

		this.toOrthographic();

	}

};

THREE.CombinedCamera.prototype.clearViewOffset = function() {

	this.view = null;
	this.updateProjectionMatrix();

};

THREE.CombinedCamera.prototype.setSize = function( width, height ) {

	this.cameraP.aspect =this.aspect= width / height;
	this.left = - width / 2;
	this.right = width / 2;
	this.top = height / 2;
	this.bottom = - height / 2;



};


THREE.CombinedCamera.prototype.setFov = function( fov ) {

	this.fov = fov;

	this.update();

};



THREE.CombinedCamera.prototype.setFar = function( far ) {

	this.cameraP.far=this.far=far;
    this.cameraO.far=this.far=far;
    this.update();

};

THREE.CombinedCamera.prototype.setNear = function( near ) {

    this.cameraP.near=this.near=near;
    this.update();

};




THREE.CombinedCamera.prototype.update = function(  ) {


    if ( this.inPerspectiveMode ) {

        this.toPerspective();

    } else {

        this.toOrthographic();

    }

};








// For maintaining similar API with PerspectiveCamera

THREE.CombinedCamera.prototype.updateProjectionMatrix = function() {

	if ( this.inPerspectiveMode ) {

		this.toPerspective();

	} else {

		this.toPerspective();
		this.toOrthographic();

	}

};

/*
* Uses Focal Length (in mm) to estimate and set FOV
* 35mm (full frame) camera is used if frame size is not specified;
* Formula based on http://www.bobatkins.com/photography/technical/field_of_view.html
*/
THREE.CombinedCamera.prototype.setLens = function ( focalLength, filmGauge ) {

	if ( filmGauge === undefined ) filmGauge = 35;

	var vExtentSlope = 0.5 * filmGauge /
			( focalLength * Math.max( this.cameraP.aspect, 1 ) );

	var fov = THREE.Math.RAD2DEG * 2 * Math.atan( vExtentSlope );

	this.setFov( fov );

	return fov;

};


THREE.CombinedCamera.prototype.setZoom = function( zoom ) {

	this.zoom = zoom;
	this.update();
};

THREE.CombinedCamera.prototype.toFrontView = function() {

	this.rotation.x = 0;
	this.rotation.y = 0;
	this.rotation.z = 0;

	// should we be modifing the matrix instead?

};

THREE.CombinedCamera.prototype.toBackView = function() {

	this.rotation.x = 0;
	this.rotation.y = Math.PI;
	this.rotation.z = 0;

};

THREE.CombinedCamera.prototype.toLeftView = function() {

	this.rotation.x = 0;
	this.rotation.y = - Math.PI / 2;
	this.rotation.z = 0;

};

THREE.CombinedCamera.prototype.toRightView = function() {

	this.rotation.x = 0;
	this.rotation.y = Math.PI / 2;
	this.rotation.z = 0;

};

THREE.CombinedCamera.prototype.toTopView = function() {

	this.rotation.x = - Math.PI / 2;
	this.rotation.y = 0;
	this.rotation.z = 0;

};

THREE.CombinedCamera.prototype.toBottomView = function() {

	this.rotation.x = Math.PI / 2;
	this.rotation.y = 0;
	this.rotation.z = 0;

};


/***/ }),
/* 19 */
/***/ (function(module, exports) {

/**
 * @author Mugen87 / https://github.com/Mugen87
 */

( function() {

	// ConvexGeometry

	function ConvexGeometry( points ) {

		THREE.Geometry.call( this );

		this.type = 'ConvexGeometry';

		this.fromBufferGeometry( new ConvexBufferGeometry( points ) );
		this.mergeVertices();

	}

	ConvexGeometry.prototype = Object.create( THREE.Geometry.prototype );
	ConvexGeometry.prototype.constructor = ConvexGeometry;

	// ConvexBufferGeometry

	function ConvexBufferGeometry( points ) {

	  THREE.BufferGeometry.call( this );

		this.type = 'ConvexBufferGeometry';

	  // buffers

	  var vertices = [];
	  var normals = [];

	  // execute QuickHull

		if ( THREE.QuickHull === undefined ) {

			console.error( 'THREE.ConvexBufferGeometry: ConvexBufferGeometry relies on THREE.QuickHull' );

		}

	  var quickHull = new THREE.QuickHull().setFromPoints( points );

	  // generate vertices and normals

	  var faces = quickHull.faces;

	  for ( var i = 0; i < faces.length; i ++ ) {

	    var face = faces[ i ];
	    var edge = face.edge;

	    // we move along a doubly-connected edge list to access all face points (see HalfEdge docs)

	    do {

	      var point = edge.head().point;

	      vertices.push( point.x, point.y, point.z );
	      normals.push( face.normal.x, face.normal.y, face.normal.z );

	      edge = edge.next;

	    } while ( edge !== face.edge );

	  }

	  // build geometry

	  this.addAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
	  this.addAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ) );

	}

	ConvexBufferGeometry.prototype = Object.create( THREE.BufferGeometry.prototype );
	ConvexBufferGeometry.prototype.constructor = ConvexBufferGeometry;

	// export

	THREE.ConvexGeometry = ConvexGeometry;
	THREE.ConvexBufferGeometry = ConvexBufferGeometry;

} ) ();


/***/ }),
/* 20 */
/***/ (function(module, exports) {

/**
 * @author Mugen87 / https://github.com/Mugen87
 *
 * Ported from: https://github.com/maurizzzio/quickhull3d/ by Mauricio Poppe (https://github.com/maurizzzio)
 *
 */

( function() {

	var Visible = 0;
	var Deleted = 1;

	function QuickHull() {

		this.tolerance = - 1;

		this.faces = []; // the generated faces of the convex hull
		this.newFaces = []; // this array holds the faces that are generated within a single iteration

		// the vertex lists work as follows:
		//
		// let 'a' and 'b' be 'Face' instances
		// let 'v' be points wrapped as instance of 'Vertex'
		//
		//     [v, v, ..., v, v, v, ...]
		//      ^             ^
		//      |             |
		//  a.outside     b.outside
		//
		this.assigned = new VertexList();
		this.unassigned = new VertexList();

		this.vertices = []; 	// vertices of the hull (internal representation of given geometry data)

	}

	Object.assign( QuickHull.prototype, {

		setFromPoints: function ( points ) {

			if ( Array.isArray( points ) !== true ) {

				console.error( 'THREE.QuickHull: Points parameter is not an array.' );

			}

			if ( points.length < 4 ) {

				console.error( 'THREE.QuickHull: The algorithm needs at least four points.' );

			}

			this.makeEmpty();

			for ( var i = 0, l = points.length; i < l; i ++ ) {

				this.vertices.push( new VertexNode( points[ i ] ) );

			}

			this.compute();

			return this;

		},

		setFromObject: function ( object ) {

			var points = [];

			object.updateMatrixWorld( true );

			object.traverse( function ( node ) {

				var i, l, point;

				var geometry = node.geometry;

				if ( geometry !== undefined ) {

					if ( geometry.isGeometry ) {

						var vertices = geometry.vertices;

						for ( i = 0, l = vertices.length; i < l; i ++ ) {

							point = vertices[ i ].clone();
							point.applyMatrix4( node.matrixWorld );

							points.push( point );

						}

					} else if ( geometry.isBufferGeometry ) {

						var attribute = geometry.attributes.position;

						if ( attribute !== undefined ) {

							for ( i = 0, l = attribute.count; i < l; i ++ ) {

								point = new THREE.Vector3();

								point.fromBufferAttribute( attribute, i ).applyMatrix4( node.matrixWorld );

								points.push( point );

							}

						}

					}

				}

			} );

			return this.setFromPoints( points );

		},

		makeEmpty: function () {

			this.faces = [];
			this.vertices = [];

			return this;

		},

		// Adds a vertex to the 'assigned' list of vertices and assigns it to the given face

		addVertexToFace: function ( vertex, face ) {

			vertex.face = face;

			if ( face.outside === null ) {

				this.assigned.append( vertex );

			} else {

				this.assigned.insertBefore( face.outside, vertex );

			}

			face.outside = vertex;

			return this;

		},

		// Removes a vertex from the 'assigned' list of vertices and from the given face

		removeVertexFromFace: function ( vertex, face ) {

			if ( vertex === face.outside ) {

				// fix face.outside link

				if ( vertex.next !== null && vertex.next.face === face ) {

					// face has at least 2 outside vertices, move the 'outside' reference

					face.outside = vertex.next;

				} else {

					// vertex was the only outside vertex that face had

					face.outside = null;

				}

			}

			this.assigned.remove( vertex );

			return this;

		},

		// Removes all the visible vertices that a given face is able to see which are stored in the 'assigned' vertext list

		removeAllVerticesFromFace: function ( face ) {

			if ( face.outside !== null ) {

				// reference to the first and last vertex of this face

				var start = face.outside;
				var end = face.outside;

				while ( end.next !== null && end.next.face === face ) {

					end = end.next;

				}

				this.assigned.removeSubList( start, end );

				// fix references

				start.prev = end.next = null;
				face.outside = null;

				return start;

			}

		},

		// Removes all the visible vertices that 'face' is able to see

		deleteFaceVertices: function ( face, absorbingFace ) {

			var faceVertices = this.removeAllVerticesFromFace( face );

			if ( faceVertices !== undefined ) {

				if ( absorbingFace === undefined ) {

					// mark the vertices to be reassigned to some other face

					this.unassigned.appendChain( faceVertices );


				} else {

					// if there's an absorbing face try to assign as many vertices as possible to it

					var vertex = faceVertices;

					do {

						// we need to buffer the subsequent vertex at this point because the 'vertex.next' reference
						// will be changed by upcoming method calls

						var nextVertex = vertex.next;

						var distance = absorbingFace.distanceToPoint( vertex.point );

						// check if 'vertex' is able to see 'absorbingFace'

						if ( distance > this.tolerance ) {

							this.addVertexToFace( vertex, absorbingFace );

						} else {

							this.unassigned.append( vertex );

						}

						// now assign next vertex

						vertex = nextVertex;

					} while ( vertex !== null );

				}

			}

			return this;

		},

		// Reassigns as many vertices as possible from the unassigned list to the new faces

		resolveUnassignedPoints: function ( newFaces ) {

			if ( this.unassigned.isEmpty() === false ) {

				var vertex = this.unassigned.first();

				do {

					// buffer 'next' reference, see .deleteFaceVertices()

					var nextVertex = vertex.next;

					var maxDistance = this.tolerance;

					var maxFace = null;

					for ( var i = 0; i < newFaces.length; i ++ ) {

						var face = newFaces[ i ];

						if ( face.mark === Visible ) {

							var distance = face.distanceToPoint( vertex.point );

							if ( distance > maxDistance ) {

								maxDistance = distance;
								maxFace = face;

							}

							if ( maxDistance > 1000 * this.tolerance ) break;

						}

					}

					// 'maxFace' can be null e.g. if there are identical vertices

					if ( maxFace !== null ) {

						this.addVertexToFace( vertex, maxFace );

					}

					vertex = nextVertex;

				} while ( vertex !== null );

			}

			return this;

		},

		// Computes the extremes of a simplex which will be the initial hull

		computeExtremes: function () {

			var min = new THREE.Vector3();
			var max = new THREE.Vector3();

			var minVertices = [];
			var maxVertices = [];

			var i, l, j;

			// initially assume that the first vertex is the min/max

			for ( i = 0; i < 3; i ++ ) {

				minVertices[ i ] = maxVertices[ i ] = this.vertices[ 0 ];

			}

			min.copy( this.vertices[ 0 ].point );
			max.copy( this.vertices[ 0 ].point );

			// compute the min/max vertex on all six directions

			for ( i = 0, l = this.vertices.length; i < l ; i ++ ) {

				var vertex = this.vertices[ i ];
				var point = vertex.point;

				// update the min coordinates

				for ( j = 0; j < 3; j ++ ) {

					if ( point.getComponent( j ) < min.getComponent( j ) ) {

						min.setComponent( j, point.getComponent( j ) );
						minVertices[ j ] = vertex;

					}

				}

				// update the max coordinates

				for ( j = 0; j < 3; j ++ ) {

					if ( point.getComponent( j ) > max.getComponent( j ) ) {

						max.setComponent( j, point.getComponent( j ) );
						maxVertices[ j ] = vertex;

					}

				}

			}

			// use min/max vectors to compute an optimal epsilon

			this.tolerance = 3 * Number.EPSILON * (
				Math.max( Math.abs( min.x ), Math.abs( max.x ) ) +
				Math.max( Math.abs( min.y ), Math.abs( max.y ) ) +
				Math.max( Math.abs( min.z ), Math.abs( max.z ) )
			);

			return { min: minVertices, max: maxVertices };

		},

		// Computes the initial simplex assigning to its faces all the points
		// that are candidates to form part of the hull

		computeInitialHull: function () {

			var line3, plane, closestPoint;

			return function computeInitialHull () {

				if ( line3 === undefined ) {

					line3 = new THREE.Line3();
					plane = new THREE.Plane();
					closestPoint = new THREE.Vector3();

				}

				var vertex, vertices = this.vertices;
				var extremes = this.computeExtremes();
				var min = extremes.min;
				var max = extremes.max;

				var v0, v1, v2, v3;
				var i, l, j;

				// 1. Find the two vertices 'v0' and 'v1' with the greatest 1d separation
				// (max.x - min.x)
				// (max.y - min.y)
				// (max.z - min.z)

				var distance, maxDistance = 0;
				var index = 0;

				for ( i = 0; i < 3; i ++ ) {

					distance = max[ i ].point.getComponent( i ) - min[ i ].point.getComponent( i );

					if ( distance > maxDistance ) {

						maxDistance = distance;
						index = i;

					}

				}

				v0 = min[ index ];
				v1 = max[ index ];

				// 2. The next vertex 'v2' is the one farthest to the line formed by 'v0' and 'v1'

				maxDistance = 0;
				line3.set( v0.point, v1.point );

				for ( i = 0, l = this.vertices.length; i < l; i ++ ) {

					vertex = vertices[ i ];

					if ( vertex !== v0 && vertex !== v1 ) {

						line3.closestPointToPoint( vertex.point, true, closestPoint );

						distance = closestPoint.distanceToSquared( vertex.point );

						if ( distance > maxDistance ) {

							maxDistance = distance;
							v2 = vertex;

						}

					}

				}

				// 3. The next vertex 'v3' is the one farthest to the plane 'v0', 'v1', 'v2'

				maxDistance = 0;
				plane.setFromCoplanarPoints( v0.point, v1.point, v2.point );

				for ( i = 0, l = this.vertices.length; i < l; i ++ ) {

					vertex = vertices[ i ];

					if ( vertex !== v0 && vertex !== v1 && vertex !== v2 ) {

						distance = Math.abs( plane.distanceToPoint( vertex.point ) );

						if ( distance > maxDistance ) {

							maxDistance = distance;
							v3 = vertex;

						}

					}

				}

				var faces = [];

				if ( plane.distanceToPoint( v3.point ) < 0 ) {

					// the face is not able to see the point so 'plane.normal' is pointing outside the tetrahedron

					faces.push(
						Face.create( v0, v1, v2 ),
						Face.create( v3, v1, v0 ),
						Face.create( v3, v2, v1 ),
						Face.create( v3, v0, v2 )
					);

					// set the twin edge

					for ( i = 0; i < 3; i ++ ) {

						j = ( i + 1 ) % 3;

						// join face[ i ] i > 0, with the first face

						faces[ i + 1 ].getEdge( 2 ).setTwin( faces[ 0 ].getEdge( j ) );

						// join face[ i ] with face[ i + 1 ], 1 <= i <= 3

						faces[ i + 1 ].getEdge( 1 ).setTwin( faces[ j + 1 ].getEdge( 0 ) );

					}

				} else {

					// the face is able to see the point so 'plane.normal' is pointing inside the tetrahedron

					faces.push(
						Face.create( v0, v2, v1 ),
						Face.create( v3, v0, v1 ),
						Face.create( v3, v1, v2 ),
						Face.create( v3, v2, v0 )
					);

					// set the twin edge

					for ( i = 0; i < 3; i ++ ) {

						j = ( i + 1 ) % 3;

						// join face[ i ] i > 0, with the first face

						faces[ i + 1 ].getEdge( 2 ).setTwin( faces[ 0 ].getEdge( ( 3 - i ) % 3 ) );

						// join face[ i ] with face[ i + 1 ]

						faces[ i + 1 ].getEdge( 0 ).setTwin( faces[ j + 1 ].getEdge( 1 ) );

					}

				}

				// the initial hull is the tetrahedron

				for ( i = 0; i < 4; i ++ ) {

					this.faces.push( faces[ i ] );

				}

				// initial assignment of vertices to the faces of the tetrahedron

				for ( i = 0, l = vertices.length; i < l; i ++ ) {

					vertex = vertices[i];

					if ( vertex !== v0 && vertex !== v1 && vertex !== v2 && vertex !== v3 ) {

						maxDistance = this.tolerance;
						var maxFace = null;

						for ( j = 0; j < 4; j ++ ) {

							distance = this.faces[ j ].distanceToPoint( vertex.point );

							if ( distance > maxDistance ) {

								maxDistance = distance;
								maxFace = this.faces[ j ];

							}

						}

						if ( maxFace !== null ) {

	          	this.addVertexToFace( vertex, maxFace );

	        	}

					}

				}

				return this;

			};

		}(),

		// Removes inactive faces

		reindexFaces: function () {

			var activeFaces = [];

			for ( var i = 0; i < this.faces.length; i ++ ) {

				var face = this.faces[ i ];

				if ( face.mark === Visible ) {

					activeFaces.push( face );

				}

			}

			this.faces = activeFaces;

			return this;

		},

		// Finds the next vertex to create faces with the current hull

		nextVertexToAdd: function () {

			// if the 'assigned' list of vertices is empty, no vertices are left. return with 'undefined'

			if ( this.assigned.isEmpty() === false ) {

				var eyeVertex, maxDistance = 0;

				// grap the first available face and start with the first visible vertex of that face

				var eyeFace = this.assigned.first().face;
				var vertex = eyeFace.outside;

				// now calculate the farthest vertex that face can see

				do {

					var distance = eyeFace.distanceToPoint( vertex.point );

					if ( distance > maxDistance ) {

						maxDistance = distance;
						eyeVertex = vertex;

					}

					vertex = vertex.next;

				} while ( vertex !== null && vertex.face === eyeFace );

				return eyeVertex;

			}

		},

		// Computes a chain of half edges in CCW order called the 'horizon'.
		// For an edge to be part of the horizon it must join a face that can see
		// 'eyePoint' and a face that cannot see 'eyePoint'.

		computeHorizon: function ( eyePoint, crossEdge, face, horizon ) {

			// moves face's vertices to the 'unassigned' vertex list

			this.deleteFaceVertices( face );

			face.mark = Deleted;

			var edge;

			if ( crossEdge === null ) {

				edge = crossEdge = face.getEdge( 0 );

			} else {

				// start from the next edge since 'crossEdge' was already analyzed
				// (actually 'crossEdge.twin' was the edge who called this method recursively)

				edge = crossEdge.next;

			}

			do {

				var twinEdge = edge.twin;
				var oppositeFace = twinEdge.face;

				if ( oppositeFace.mark === Visible ) {

					if ( oppositeFace.distanceToPoint( eyePoint ) > this.tolerance ) {

						// the opposite face can see the vertex, so proceed with next edge

						this.computeHorizon( eyePoint, twinEdge, oppositeFace, horizon );

					} else {

						// the opposite face can't see the vertex, so this edge is part of the horizon

						horizon.push( edge );

					}

				}

				edge = edge.next;

			} while ( edge !== crossEdge );

			return this;

		},

		// Creates a face with the vertices 'eyeVertex.point', 'horizonEdge.tail' and 'horizonEdge.head' in CCW order

		addAdjoiningFace: function ( eyeVertex, horizonEdge ) {

			// all the half edges are created in ccw order thus the face is always pointing outside the hull

			var face = Face.create( eyeVertex, horizonEdge.tail(), horizonEdge.head() );

			this.faces.push( face );

			// join face.getEdge( - 1 ) with the horizon's opposite edge face.getEdge( - 1 ) = face.getEdge( 2 )

			face.getEdge( - 1 ).setTwin( horizonEdge.twin );

			return face.getEdge( 0 ); // the half edge whose vertex is the eyeVertex


		},

		//  Adds 'horizon.length' faces to the hull, each face will be linked with the
		//  horizon opposite face and the face on the left/right

		addNewFaces: function ( eyeVertex, horizon ) {

			this.newFaces = [];

			var firstSideEdge = null;
			var previousSideEdge = null;

			for ( var i = 0; i < horizon.length; i ++ ) {

				var horizonEdge = horizon[ i ];

				// returns the right side edge

				var sideEdge = this.addAdjoiningFace( eyeVertex, horizonEdge );

				if ( firstSideEdge === null ) {

					firstSideEdge = sideEdge;

				} else {

					// joins face.getEdge( 1 ) with previousFace.getEdge( 0 )

					sideEdge.next.setTwin( previousSideEdge );

				}

				this.newFaces.push( sideEdge.face );
				previousSideEdge = sideEdge;

			}

			// perform final join of new faces

			firstSideEdge.next.setTwin( previousSideEdge );

			return this;

		},

		// Adds a vertex to the hull

		addVertexToHull: function ( eyeVertex ) {

			var horizon = [];
			var i, face;

			this.unassigned.clear();

			// remove 'eyeVertex' from 'eyeVertex.face' so that it can't be added to the 'unassigned' vertex list

			this.removeVertexFromFace( eyeVertex, eyeVertex.face );

			this.computeHorizon( eyeVertex.point, null, eyeVertex.face, horizon );

			this.addNewFaces( eyeVertex, horizon );

			// reassign 'unassigned' vertices to the new faces

			this.resolveUnassignedPoints( this.newFaces );

			return	this;

		},

		cleanup: function () {

			this.assigned.clear();
			this.unassigned.clear();
			this.newFaces = [];

			return this;

		},

		compute: function () {

			var vertex;

			this.computeInitialHull();

			// add all available vertices gradually to the hull

			while ( ( vertex = this.nextVertexToAdd() ) !== undefined ) {

				this.addVertexToHull( vertex );

			}

			this.reindexFaces();

			this.cleanup();

			return this;

		}

	} );

	//

	function Face() {

		this.normal = new THREE.Vector3();
		this.midpoint = new THREE.Vector3();
		this.area = 0;

		this.constant = 0; // signed distance from face to the origin
		this.outside = null; // reference to a vertex in a vertex list this face can see
		this.mark = Visible;
		this.edge = null;

	}

	Object.assign( Face, {

		create: function( a, b, c ) {

			var face = new Face();

			var e0 = new HalfEdge( a, face );
			var e1 = new HalfEdge( b, face );
			var e2 = new HalfEdge( c, face );

			// join edges

			e0.next = e2.prev = e1;
			e1.next = e0.prev = e2;
			e2.next = e1.prev = e0;

			// main half edge reference

			face.edge = e0;

			return face.compute();

		}

	} );

	Object.assign( Face.prototype, {

		getEdge: function ( i ) {

			var edge = this.edge;

			while ( i > 0 ) {

				edge = edge.next;
				i --;

			}

			while ( i < 0 ) {

				edge = edge.prev;
				i ++;

			}

			return edge;

		},

		compute: function () {

			var triangle;

			return function compute () {

				if ( triangle === undefined ) triangle = new THREE.Triangle();

				var a = this.edge.tail();
				var b = this.edge.head();
				var c = this.edge.next.head();

				triangle.set( a.point, b.point, c.point );

				triangle.normal( this.normal );
				triangle.midpoint( this.midpoint );
				this.area = triangle.area();

				this.constant = this.normal.dot( this.midpoint );

				return this;

			};

		}(),

		distanceToPoint: function ( point ) {

			return this.normal.dot( point ) - this.constant;

		}

	} );

	// Entity for a Doubly-Connected Edge List (DCEL).

	function HalfEdge( vertex, face ) {

		this.vertex = vertex;
		this.prev = null;
		this.next = null;
		this.twin = null;
		this.face = face;

	}

	Object.assign( HalfEdge.prototype, {

		head: function () {

			return this.vertex;

		},

		tail: function () {

			return this.prev ? this.prev.vertex : null;

		},

		length: function () {

			var head = this.head();
			var tail = this.tail();

			if ( tail !== null ) {

				return tail.point.distanceTo( head.point );

			}

			return - 1;

		},

		lengthSquared: function () {

			var head = this.head();
			var tail = this.tail();

			if ( tail !== null ) {

				return tail.point.distanceToSquared( head.point );

			}

			return - 1;

		},

		setTwin: function ( edge ) {

			this.twin = edge;
			edge.twin = this;

			return this;

		}

	} );

	// A vertex as a double linked list node.

	function VertexNode( point ) {

		this.point = point;
		this.prev = null;
		this.next = null;
		this.face = null; // the face that is able to see this vertex

	}

	// A double linked list that contains vertex nodes.

	function VertexList() {

		this.head = null;
		this.tail = null;

	}

	Object.assign( VertexList.prototype, {

		first: function () {

			return this.head;

		},

		last: function () {

			return this.tail;

		},

		clear: function () {

			this.head = this.tail = null;

			return this;

		},

		// Inserts a vertex before the target vertex

		insertBefore: function ( target, vertex ) {

			vertex.prev = target.prev;
			vertex.next = target;

			if ( vertex.prev === null ) {

				this.head = vertex;

			} else {

				vertex.prev.next = vertex;

			}

			target.prev = vertex;

			return this;

		},

		// Inserts a vertex after the target vertex

		insertAfter: function ( target, vertex ) {

			vertex.prev = target;
			vertex.next = target.next;

			if ( vertex.next === null ) {

				this.tail = vertex;

			} else {

				vertex.next.prev = vertex;

			}

			target.next = vertex;

			return this;

		},

		// Appends a vertex to the end of the linked list

		append: function ( vertex ) {

			if ( this.head === null ) {

				this.head = vertex;

			} else {

				this.tail.next = vertex;

			}

			vertex.prev = this.tail;
			vertex.next = null; // the tail has no subsequent vertex

			this.tail = vertex;

			return this;

		},

		// Appends a chain of vertices where 'vertex' is the head.

		appendChain: function ( vertex ) {

			if ( this.head === null ) {

				this.head = vertex;

			} else {

				this.tail.next = vertex;

			}

			vertex.prev = this.tail;

			// ensure that the 'tail' reference points to the last vertex of the chain

			while ( vertex.next !== null ) {

				vertex = vertex.next;

			}

			this.tail = vertex;

			return this;

		},

		// Removes a vertex from the linked list

		remove: function ( vertex ) {

			if ( vertex.prev === null ) {

				this.head = vertex.next;

			} else {

				vertex.prev.next = vertex.next;

			}

			if ( vertex.next === null ) {

				this.tail = vertex.prev;

			} else {

				vertex.next.prev = vertex.prev;

			}

			return this;

		},

		// Removes a list of vertices whose 'head' is 'a' and whose 'tail' is b

		removeSubList: function ( a, b ) {

			if ( a.prev === null ) {

				this.head = b.next;

			} else {

				a.prev.next = b.next;

			}

			if ( b.next === null ) {

				this.tail = a.prev;

			} else {

				b.next.prev = a.prev;

			}

			return this;

		},

		isEmpty: function() {

			return this.head === null;

		}

	} );

	// export

	THREE.QuickHull = QuickHull;


} ) ();


/***/ }),
/* 21 */
/***/ (function(module, exports) {

/**
 * @author Eberhard Graether / http://egraether.com/
 * @author Mark Lundin 	/ http://mark-lundin.com
 * @author Simone Manini / http://daron1337.github.io
 * @author Luca Antiga 	/ http://lantiga.github.io
 */

THREE.TrackballControls = function ( object, domElement ) {

    var _this = this;
    var STATE = { NONE: - 1, ROTATE: 0, ZOOM: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_ZOOM_PAN: 4 };

    this.object = object;
    this.domElement = ( domElement !== undefined ) ? domElement : document;

    // API

    this.enabled = true;

    this.screen = { left: 0, top: 0, width: 0, height: 0 };

    this.rotateSpeed = 1.0;
    this.zoomSpeed = 1.2;
    this.panSpeed = 0.3;

    this.noRotate = false;
    this.noZoom = false;
    this.noPan = false;

    this.staticMoving = false;
    this.dynamicDampingFactor = 0.2;

    this.minDistance = 0;
    this.maxDistance = Infinity;

    this.keys = [ 65 /*A*/, 83 /*S*/, 68 /*D*/ ];

    // internals

    this.target = new THREE.Vector3();

    var EPS = 0.000001;

    var lastPosition = new THREE.Vector3();

    var _state = STATE.NONE,
        _prevState = STATE.NONE,

        _eye = new THREE.Vector3(),

        _movePrev = new THREE.Vector2(),
        _moveCurr = new THREE.Vector2(),

        _lastAxis = new THREE.Vector3(),
        _lastAngle = 0,

        _zoomStart = new THREE.Vector2(),
        _zoomEnd = new THREE.Vector2(),

        _touchZoomDistanceStart = 0,
        _touchZoomDistanceEnd = 0,

        _panStart = new THREE.Vector2(),
        _panEnd = new THREE.Vector2();

    // for reset

    this.target0 = this.target.clone();
    this.position0 = this.object.position.clone();
    this.up0 = this.object.up.clone();

    // events

    var changeEvent = { type: 'change' };
    var startEvent = { type: 'start' };
    var endEvent = { type: 'end' };


    // methods

    this.handleResize = function () {

        if ( this.domElement === document ) {

            this.screen.left = 0;
            this.screen.top = 0;
            this.screen.width = window.innerWidth;
            this.screen.height = window.innerHeight;

        } else {

            var box = this.domElement.getBoundingClientRect();
            // adjustments come from similar code in the jquery offset() function
            var d = this.domElement.ownerDocument.documentElement;
            this.screen.left = box.left + window.pageXOffset - d.clientLeft;
            this.screen.top = box.top + window.pageYOffset - d.clientTop;
            this.screen.width = box.width;
            this.screen.height = box.height;

        }

    };

    this.handleEvent = function ( event ) {

        if ( typeof this[ event.type ] == 'function' ) {

            this[ event.type ]( event );

        }

    };

    var getMouseOnScreen = ( function () {

        var vector = new THREE.Vector2();

        return function getMouseOnScreen( pageX, pageY ) {

            vector.set(
                ( pageX - _this.screen.left ) / _this.screen.width,
                ( pageY - _this.screen.top ) / _this.screen.height
            );

            return vector;

        };

    }() );

    var getMouseOnCircle = ( function () {

        var vector = new THREE.Vector2();

        return function getMouseOnCircle( pageX, pageY ) {

            vector.set(
                ( ( pageX - _this.screen.width * 0.5 - _this.screen.left ) / ( _this.screen.width * 0.5 ) ),
                ( ( _this.screen.height + 2 * ( _this.screen.top - pageY ) ) / _this.screen.width ) // screen.width intentional
            );

            return vector;

        };

    }() );

    this.rotateCamera = ( function() {

        var axis = new THREE.Vector3(),
            quaternion = new THREE.Quaternion(),
            eyeDirection = new THREE.Vector3(),
            objectUpDirection = new THREE.Vector3(),
            objectSidewaysDirection = new THREE.Vector3(),
            moveDirection = new THREE.Vector3(),
            angle;

        return function rotateCamera() {

            moveDirection.set( _moveCurr.x - _movePrev.x, _moveCurr.y - _movePrev.y, 0 );
            angle = moveDirection.length();

            if ( angle ) {

                _eye.copy( _this.object.position ).sub( _this.target );

                eyeDirection.copy( _eye ).normalize();
                objectUpDirection.copy( _this.object.up ).normalize();
                objectSidewaysDirection.crossVectors( objectUpDirection, eyeDirection ).normalize();

                objectUpDirection.setLength( _moveCurr.y - _movePrev.y );
                objectSidewaysDirection.setLength( _moveCurr.x - _movePrev.x );

                moveDirection.copy( objectUpDirection.add( objectSidewaysDirection ) );

                axis.crossVectors( moveDirection, _eye ).normalize();

                angle *= _this.rotateSpeed;
                quaternion.setFromAxisAngle( axis, angle );

                _eye.applyQuaternion( quaternion );
                _this.object.up.applyQuaternion( quaternion );

                _lastAxis.copy( axis );
                _lastAngle = angle;

            } else if ( ! _this.staticMoving && _lastAngle ) {

                _lastAngle *= Math.sqrt( 1.0 - _this.dynamicDampingFactor );
                _eye.copy( _this.object.position ).sub( _this.target );
                quaternion.setFromAxisAngle( _lastAxis, _lastAngle );
                _eye.applyQuaternion( quaternion );
                _this.object.up.applyQuaternion( quaternion );

            }

            _movePrev.copy( _moveCurr );

        };

    }() );


    this.zoomCamera = function () {

        var factor;

        if ( _state === STATE.TOUCH_ZOOM_PAN ) {

            factor = _touchZoomDistanceStart / _touchZoomDistanceEnd;
            _touchZoomDistanceStart = _touchZoomDistanceEnd;
            _eye.multiplyScalar( factor );

        } else {

            factor = 1.0 + ( _zoomEnd.y - _zoomStart.y ) * _this.zoomSpeed;

            if ( factor !== 1.0 && factor > 0.0 ) {

                _eye.multiplyScalar( factor );

            }

            if ( _this.staticMoving ) {

                _zoomStart.copy( _zoomEnd );

            } else {

                _zoomStart.y += ( _zoomEnd.y - _zoomStart.y ) * this.dynamicDampingFactor;

            }

        }

    };

    this.panCamera = ( function() {

        var mouseChange = new THREE.Vector2(),
            objectUp = new THREE.Vector3(),
            pan = new THREE.Vector3();

        return function panCamera() {

            mouseChange.copy( _panEnd ).sub( _panStart );

            if ( mouseChange.lengthSq() ) {

                mouseChange.multiplyScalar( _eye.length() * _this.panSpeed );

                pan.copy( _eye ).cross( _this.object.up ).setLength( mouseChange.x );
                pan.add( objectUp.copy( _this.object.up ).setLength( mouseChange.y ) );

                _this.object.position.add( pan );
                _this.target.add( pan );

                if ( _this.staticMoving ) {

                    _panStart.copy( _panEnd );

                } else {

                    _panStart.add( mouseChange.subVectors( _panEnd, _panStart ).multiplyScalar( _this.dynamicDampingFactor ) );

                }

            }

        };

    }() );

    this.checkDistances = function () {

        if ( ! _this.noZoom || ! _this.noPan ) {

            if ( _eye.lengthSq() > _this.maxDistance * _this.maxDistance ) {

                _this.object.position.addVectors( _this.target, _eye.setLength( _this.maxDistance ) );
                _zoomStart.copy( _zoomEnd );

            }

            if ( _eye.lengthSq() < _this.minDistance * _this.minDistance ) {

                _this.object.position.addVectors( _this.target, _eye.setLength( _this.minDistance ) );
                _zoomStart.copy( _zoomEnd );

            }

        }

    };

    this.update = function () {

        _eye.subVectors( _this.object.position, _this.target );

        if ( ! _this.noRotate ) {

            _this.rotateCamera();

        }

        if ( ! _this.noZoom ) {

            _this.zoomCamera();

        }

        if ( ! _this.noPan ) {

            _this.panCamera();

        }

        _this.object.position.addVectors( _this.target, _eye );

        _this.checkDistances();

        _this.object.lookAt( _this.target );

        if ( lastPosition.distanceToSquared( _this.object.position ) > EPS ) {

            _this.dispatchEvent( changeEvent );

            lastPosition.copy( _this.object.position );

        }

    };

    this.reset = function () {

        _state = STATE.NONE;
        _prevState = STATE.NONE;

        _this.target.copy( _this.target0 );
        _this.object.position.copy( _this.position0 );
        _this.object.up.copy( _this.up0 );

        _eye.subVectors( _this.object.position, _this.target );

        _this.object.lookAt( _this.target );

        _this.dispatchEvent( changeEvent );

        lastPosition.copy( _this.object.position );

    };

    // listeners

    function keydown( event ) {

        if ( _this.enabled === false ) return;

        window.removeEventListener( 'keydown', keydown );

        _prevState = _state;

        if ( _state !== STATE.NONE ) {

            return;

        } else if ( event.keyCode === _this.keys[ STATE.ROTATE ] && ! _this.noRotate ) {

            _state = STATE.ROTATE;

        } else if ( event.keyCode === _this.keys[ STATE.ZOOM ] && ! _this.noZoom ) {

            _state = STATE.ZOOM;

        } else if ( event.keyCode === _this.keys[ STATE.PAN ] && ! _this.noPan ) {

            _state = STATE.PAN;

        }

    }

    function keyup( event ) {

        if ( _this.enabled === false ) return;

        _state = _prevState;

        window.addEventListener( 'keydown', keydown, false );

    }

    function mousedown( event ) {

        if ( _this.enabled === false ) return;

        event.preventDefault();
        event.stopPropagation();

        if ( _state === STATE.NONE ) {

            _state = event.button;

        }

        if ( _state === STATE.ROTATE && ! _this.noRotate ) {

            _moveCurr.copy( getMouseOnCircle( event.pageX, event.pageY ) );
            _movePrev.copy( _moveCurr );

        } else if ( _state === STATE.ZOOM && ! _this.noZoom ) {

            _zoomStart.copy( getMouseOnScreen( event.pageX, event.pageY ) );
            _zoomEnd.copy( _zoomStart );

        } else if ( _state === STATE.PAN && ! _this.noPan ) {

            _panStart.copy( getMouseOnScreen( event.pageX, event.pageY ) );
            _panEnd.copy( _panStart );

        }

        document.addEventListener( 'mousemove', mousemove, false );
        document.addEventListener( 'mouseup', mouseup, false );

        _this.dispatchEvent( startEvent );

    }

    function mousemove( event ) {

        if ( _this.enabled === false ) return;

        event.preventDefault();
        event.stopPropagation();

        if ( _state === STATE.ROTATE && ! _this.noRotate ) {

            _movePrev.copy( _moveCurr );
            _moveCurr.copy( getMouseOnCircle( event.pageX, event.pageY ) );

        } else if ( _state === STATE.ZOOM && ! _this.noZoom ) {

            _zoomEnd.copy( getMouseOnScreen( event.pageX, event.pageY ) );

        } else if ( _state === STATE.PAN && ! _this.noPan ) {

            _panEnd.copy( getMouseOnScreen( event.pageX, event.pageY ) );

        }

    }

    function mouseup( event ) {

        if ( _this.enabled === false ) return;

        event.preventDefault();
        event.stopPropagation();

        _state = STATE.NONE;

        document.removeEventListener( 'mousemove', mousemove );
        document.removeEventListener( 'mouseup', mouseup );
        _this.dispatchEvent( endEvent );

    }

    function mousewheel( event ) {

        if ( _this.enabled === false ) return;

        event.preventDefault();
        event.stopPropagation();

        switch ( event.deltaMode ) {

            case 2:
                // Zoom in pages
                _zoomStart.y -= event.deltaY * 0.025;
                break;

            case 1:
                // Zoom in lines
                _zoomStart.y -= event.deltaY * 0.01;
                break;

            default:
                // undefined, 0, assume pixels
                _zoomStart.y -= event.deltaY * 0.00025;
                break;

        }

        _this.dispatchEvent( startEvent );
        _this.dispatchEvent( endEvent );

    }

    function touchstart( event ) {

        if ( _this.enabled === false ) return;

        switch ( event.touches.length ) {

            case 1:
                _state = STATE.TOUCH_ROTATE;
                _moveCurr.copy( getMouseOnCircle( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY ) );
                _movePrev.copy( _moveCurr );
                break;

            default: // 2 or more
                _state = STATE.TOUCH_ZOOM_PAN;
                var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
                var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
                _touchZoomDistanceEnd = _touchZoomDistanceStart = Math.sqrt( dx * dx + dy * dy );

                var x = ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX ) / 2;
                var y = ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY ) / 2;
                _panStart.copy( getMouseOnScreen( x, y ) );
                _panEnd.copy( _panStart );
                break;

        }

        _this.dispatchEvent( startEvent );

    }

    function touchmove( event ) {

        if ( _this.enabled === false ) return;

        event.preventDefault();
        event.stopPropagation();

        switch ( event.touches.length ) {

            case 1:
                _movePrev.copy( _moveCurr );
                _moveCurr.copy( getMouseOnCircle( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY ) );
                break;

            default: // 2 or more
                var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
                var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
                _touchZoomDistanceEnd = Math.sqrt( dx * dx + dy * dy );

                var x = ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX ) / 2;
                var y = ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY ) / 2;
                _panEnd.copy( getMouseOnScreen( x, y ) );
                break;

        }

    }

    function touchend( event ) {

        if ( _this.enabled === false ) return;

        switch ( event.touches.length ) {

            case 0:
                _state = STATE.NONE;
                break;

            case 1:
                _state = STATE.TOUCH_ROTATE;
                _moveCurr.copy( getMouseOnCircle( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY ) );
                _movePrev.copy( _moveCurr );
                break;

        }

        _this.dispatchEvent( endEvent );

    }

    function contextmenu( event ) {

        if ( _this.enabled === false ) return;

        event.preventDefault();

    }

    this.dispose = function() {

        this.domElement.removeEventListener( 'contextmenu', contextmenu, false );
        this.domElement.removeEventListener( 'mousedown', mousedown, false );
        this.domElement.removeEventListener( 'wheel', mousewheel, false );

        this.domElement.removeEventListener( 'touchstart', touchstart, false );
        this.domElement.removeEventListener( 'touchend', touchend, false );
        this.domElement.removeEventListener( 'touchmove', touchmove, false );

        document.removeEventListener( 'mousemove', mousemove, false );
        document.removeEventListener( 'mouseup', mouseup, false );

        window.removeEventListener( 'keydown', keydown, false );
        window.removeEventListener( 'keyup', keyup, false );

    };

    this.domElement.addEventListener( 'contextmenu', contextmenu, false );
    this.domElement.addEventListener( 'mousedown', mousedown, false );
    this.domElement.addEventListener( 'wheel', mousewheel, false );

    this.domElement.addEventListener( 'touchstart', touchstart, false );
    this.domElement.addEventListener( 'touchend', touchend, false );
    this.domElement.addEventListener( 'touchmove', touchmove, false );

    window.addEventListener( 'keydown', keydown, false );
    window.addEventListener( 'keyup', keyup, false );

    this.handleResize();

    // force an update at start
    this.update();

};

THREE.TrackballControls.prototype = Object.create( THREE.EventDispatcher.prototype );
THREE.TrackballControls.prototype.constructor = THREE.TrackballControls;

/***/ }),
/* 22 */
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
/* 23 */
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
/* 24 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__BaseEdge__ = __webpack_require__(22);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__EdgeUtil__ = __webpack_require__(2);
/**
 * Created by Frank on 08.06.2017.
 */






/**
 * NOTE: the nodes for this container need to be child elements of the  same cluster
 *
 *  TODO the edgescontainer should have some sort of line factory which we can plugin a specific line implementation
 *  this way we can have something like the basic line which does have a geometry for each line
 *  and alternativly some implementation like the line-mesh
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

        this.mEdges.geometry.verticesNeedUpdate = true;

        if (this.mExternalNodesHelpers.length == 0) return;
        _.each(this.mExternalNodesHelpers, helper => helper.update());


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
/* 25 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__lib_CombinedCamera__ = __webpack_require__(18);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__lib_CombinedCamera___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__lib_CombinedCamera__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__lib_TrackballControls__ = __webpack_require__(21);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__lib_TrackballControls___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__lib_TrackballControls__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__lib_ConvexGeometry__ = __webpack_require__(19);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__lib_ConvexGeometry___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2__lib_ConvexGeometry__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__lib_QuickHull__ = __webpack_require__(20);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__lib_QuickHull___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3__lib_QuickHull__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__distributions_BaseDistribution__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__distributions_DefaultDistribution__ = __webpack_require__(14);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__distributions_RandomDistribution__ = __webpack_require__(15);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__distributions_ForceGraphDistribution__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__distributions_SphericalDistribution__ = __webpack_require__(16);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__ClusterNodeArray__ = __webpack_require__(13);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_10__ClusterLeafElement__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_11__BaseCluster3D__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_12__Cluster3DExtended__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_13__RootCluster__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_14__GraphData__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_15__view_GraphView3D__ = __webpack_require__(12);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_16__hull_BoxVolume__ = __webpack_require__(10);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_17__hull_BaseVolume__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_18__hull_ConvexVolume__ = __webpack_require__(17);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_19__utils_ZoomUtil__ = __webpack_require__(11);
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "Cluster3DExtended", function() { return __WEBPACK_IMPORTED_MODULE_12__Cluster3DExtended__["a"]; });
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


//--------------------------------

//TODO find a better way to import libraries as simple scripts
//NOTE:don't remove imports


//import THREE0 from "../lib/three.min"

//used by View3D



//used by ConvexVolume




// --------------------------------




























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

    isDebug() {

        return window.location.hash == "#debug"

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


        function createView(name = "View3D", speccs, isMaximised = false) {

            function maximiseView() {

                if (this.isMaximised()) return;
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


            if (that.isDebug()) {
                mGraphView.maxFPS = 10;

            }

            mGraphView.showFPSCounter = that.isDebug();


            $(mGraphView)
                .css(thumbCSS);

            $(mGraphView).on("dblclick", maximiseView);


            mGraphView.setSpeccs(speccs);

            //TODO per view ... mGraphView.mRenderer.domElement
            let events = new Mousetrap();


            var edgesVisible = true;
            events.bind("e", function () {
                edgesVisible = !edgesVisible;
                _.each(mGraphView.mRootCluster.getLeafs(), function (leaf) {
                    console.log("TODO toggling edges won't work because of LOD impl");
                    leaf.mEdgesContainer.visible = edgesVisible;
                    leaf.mEdgesContainer2.visible = edgesVisible

                })


            });

            var infoVisible = true;
            events.bind("h", function () {
                infoVisible = !infoVisible;
                $(".info-panel").toggle(infoVisible)


            });

            //FIXME
            if (isMaximised)
                maximiseView.bind(mGraphView)();
            /*$(mGraphView).on("loaded",function (){

             maximiseView.bind(mGraphView)()
             } );
             */

            $(window).on("resize", _.throttle(function () {
                //TODO use native events

                if (!mGraphView.isMaximised()) return;

                $(mGraphView).trigger("resize")
                //console.warn("TODO handle window resize + (f11)")
            }, 100));


            return mGraphView

        }


        let views = [];


        if (that.isDebug()) {


            //NOTE: target rendering
            var speccs = this.getForceSpeccs();
            let view2 = createView("new force-graph", speccs, true)
                .loadDataSet(this.getDSByID(1));
            views.push(view2);


            //TODO views should only be loaded when visible
            /*
             var speccs = this.getPossibleClusterSpeccsArray();
             let view1 = createView("dist test", speccs)
             .loadDataSet(this.getDSByID(1));
             views.push(view1)
             */


            /*

             let view3 = createView("node distribution test case",
             [{
             distribution: new BaseDistribution(2000, 3),
             options: { hull: new BoxVolume()}
             }])
             .loadDataSet(this.getDSByID(1))

             views.push(view3)
             */


            /*

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
            let view2 = createView("new force-graph", speccs, true)
                .loadDataSet(this.getDSByID(0));
            views.push(view2)


        }


        _.each(views, function (view) {
            if ($(view).parent().length == 0)
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
                distribution: new __WEBPACK_IMPORTED_MODULE_4__distributions_BaseDistribution__["a" /* default */](4000, 2).onSort(mySort),
                options: {minClusterSize: 15, hull: __WEBPACK_IMPORTED_MODULE_16__hull_BoxVolume__["a" /* default */]}
            },
            {
                generator: industrySetGenerator,
                distribution: new __WEBPACK_IMPORTED_MODULE_4__distributions_BaseDistribution__["a" /* default */](2000, 1).onSort(mySort),
                options: {minClusterSize: 15, hull: __WEBPACK_IMPORTED_MODULE_16__hull_BoxVolume__["a" /* default */]}
            },
            {distribution: new __WEBPACK_IMPORTED_MODULE_4__distributions_BaseDistribution__["a" /* default */](200, 3), options: {minClusterSize: 15, hull: __WEBPACK_IMPORTED_MODULE_16__hull_BoxVolume__["a" /* default */]}}


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
                distribution: new __WEBPACK_IMPORTED_MODULE_4__distributions_BaseDistribution__["a" /* default */](2000, 2).onSort(mySort),
                options: {minClusterSize: 15, hull: __WEBPACK_IMPORTED_MODULE_16__hull_BoxVolume__["a" /* default */]}
            },
            {distribution: new __WEBPACK_IMPORTED_MODULE_4__distributions_BaseDistribution__["a" /* default */](400, 2), options: {hull: new __WEBPACK_IMPORTED_MODULE_16__hull_BoxVolume__["a" /* default */]()}}


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
        let sample1 = new __WEBPACK_IMPORTED_MODULE_4__distributions_BaseDistribution__["a" /* default */](40000, 2); //1000
        let sample2 = new __WEBPACK_IMPORTED_MODULE_7__distributions_ForceGraphDistribution__["a" /* default */](5000, 2);//200
        let sample3 = new __WEBPACK_IMPORTED_MODULE_4__distributions_BaseDistribution__["a" /* default */](100, 3);//50

        //  let rand2 = new RandomDistribution(200, 2)

        return [
            {generator: countrySetGenerator, distribution: sample1, options: {minClusterSize: 5, hull: __WEBPACK_IMPORTED_MODULE_16__hull_BoxVolume__["a" /* default */]}},
            {generator: industrySetGenerator, distribution: sample2, options: {minClusterSize: 5, hull: __WEBPACK_IMPORTED_MODULE_16__hull_BoxVolume__["a" /* default */]}},
            {distribution: sample3, options: {hull: __WEBPACK_IMPORTED_MODULE_16__hull_BoxVolume__["a" /* default */]}}


        ]

    }


    getForceSpeccs2DChangesOnly() {

        let speccs = this.getForceSpeccs();


        speccs[0].distribution = new __WEBPACK_IMPORTED_MODULE_4__distributions_BaseDistribution__["a" /* default */](45000, 2); // countries get placed equally on a plane of size 15k X 15k
        speccs[1].distribution = new __WEBPACK_IMPORTED_MODULE_4__distributions_BaseDistribution__["a" /* default */](10000, 2);// industries within countries use the Force-Graph approach to position elements
        speccs[2].distribution = new __WEBPACK_IMPORTED_MODULE_4__distributions_BaseDistribution__["a" /* default */](500, 3);//same g

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


        let countryDistribution = new __WEBPACK_IMPORTED_MODULE_4__distributions_BaseDistribution__["a" /* default */](45000, 2); // countries get placed equally on a plane of size 15k X 15k
        let industryDistribution = new __WEBPACK_IMPORTED_MODULE_7__distributions_ForceGraphDistribution__["a" /* default */](15000, 3);// industries within countries use the Force-Graph approach to position elements
        let nodesWithinIndustryDistribution = new __WEBPACK_IMPORTED_MODULE_7__distributions_ForceGraphDistribution__["a" /* default */](500, 3);//same goes for the nodes within each industry

        //the final configuration for rendering
        //it contains an additional options attribute per array entry

        // @param options.minClusterSize ... is the lower bound for the nodes within the cluster
        // if the cluster has fewer elements all clusters previously generated are places within this "other" cluster
        // @param options. defaultMergeGroupName the name of the "other" cluster can be changed by this value
        // @param options.hull can be used to add a volume around the cluster
        //by default if no value gets set, the BaseVolume class is used which is invisible by default
        //but is necessary for other components like picking and tet rendering


        let rootHull = this.isDebug() ? __WEBPACK_IMPORTED_MODULE_16__hull_BoxVolume__["a" /* default */] : __WEBPACK_IMPORTED_MODULE_17__hull_BaseVolume__["a" /* default */];

        return [

            {
                generator: countrySetGenerator,
                distribution: countryDistribution,
                options: {minClusterSize: 40, hull: rootHull}
            },
            {
                generator: industrySetGenerator,
                distribution: industryDistribution,
                options: {minClusterSize: 15, hull: __WEBPACK_IMPORTED_MODULE_18__hull_ConvexVolume__["a" /* default */]}// new BoxVolume() ConvexVolume//FIXME  this option is used twice for leaf and parent  and below is ignored
            }
            , {distribution: nodesWithinIndustryDistribution, hull: __WEBPACK_IMPORTED_MODULE_16__hull_BoxVolume__["a" /* default */]}  // this.getEllipsoidHull.bind(this)
            //FIXME getEllipsoidHullis not used

        ]

    }


    get2DPlaneForceSpeccs() {


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


        //  let countryDistribution = new BaseDistribution(45000, 2); // countries get placed equally on a plane of size 15k X 15k
        let industryDistribution = new __WEBPACK_IMPORTED_MODULE_4__distributions_BaseDistribution__["a" /* default */](80000, 2);// industries within countries use the Force-Graph approach to position elements
        let nodesWithinIndustryDistribution = new __WEBPACK_IMPORTED_MODULE_7__distributions_ForceGraphDistribution__["a" /* default */](1000, 2);//same goes for the nodes within each industry

        //the final configuration for rendering
        //it contains an additional options attribute per array entry

        // @param options.minClusterSize ... is the lower bound for the nodes within the cluster
        // if the cluster has fewer elements all clusters previously generated are places within this "other" cluster
        // @param options. defaultMergeGroupName the name of the "other" cluster can be changed by this value
        // @param options.hull can be used to add a volume around the cluster
        //by default if no value gets set, the BaseVolume class is used which is invisible by default
        //but is necessary for other components like picking and tet rendering


        let rootHull = this.isDebug() ? __WEBPACK_IMPORTED_MODULE_16__hull_BoxVolume__["a" /* default */] : __WEBPACK_IMPORTED_MODULE_17__hull_BaseVolume__["a" /* default */];

        return [

            /* {
             generator: countrySetGenerator,
             distribution: countryDistribution,
             options: {minClusterSize: 40, hull: rootHull }
             },*/
            {
                generator: industrySetGenerator,
                distribution: industryDistribution,
                options: {minClusterSize: 15, hull: __WEBPACK_IMPORTED_MODULE_18__hull_ConvexVolume__["a" /* default */]}// new BoxVolume() ConvexVolume//FIXME  this option is used twice for leaf and parent  and below is ignored
            }
            , {distribution: nodesWithinIndustryDistribution, hull: __WEBPACK_IMPORTED_MODULE_16__hull_BoxVolume__["a" /* default */]}  // this.getEllipsoidHull.bind(this)
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


    zoomToPosition(position, onComplete) {


        let view = this.getCurrentView();

        __WEBPACK_IMPORTED_MODULE_19__utils_ZoomUtil__["a" /* default */].moveToPosition(position, view.mCamera, view.mControls, 0, onComplete)
    }


    getCurrentView() {
        return $(".view-3d.view-3d-maximised").get(0)

    }

    setGraph2D() {


        /**
         * FIXME if a cluster has subclusters and no clustering is given use the existsing
         * likewise with distributions
         * currently the cluster gets cleaned first before the new visualisation is generated
         *
         *
         *
         */

            //   let speccs=this.getPossibleClusterSpeccsArray();

            //  let speccs=this.getForceSpeccs2DChangesOnly();
        let speccs = this.get2DPlaneForceSpeccs();

        let view = this.getCurrentView();
        let rootCluster = view.mRootCluster;

        rootCluster.cleanUpLeafs();
        //clean up previous clusters
        __WEBPACK_IMPORTED_MODULE_11__BaseCluster3D__["a" /* default */].cleanUpClusters(rootCluster.findClusters("*"), rootCluster);


        rootCluster.applyClustering(speccs);

        //TODO
        $(view).trigger("graph-changed");


        this.zoomToPosition(new THREE.Vector3(0, 0, 150000), () => {
            //TODO moake it work without line below...  currently needs another zoom call to be able to use controls again
            this.getCurrentView().mRootCluster.zoomToCluster(150000)

        });

        view.mControls.target.set(new THREE.Vector3(0, 0, 0));
        view.mControls.noRotate = true;
        view.mControls.reset();



       // view.mSkyDome.visible=false;

    }


    setGraph3D() {

        let speccs = this.getForceSpeccs();
        let view = this.getCurrentView();
        let rootCluster = view.mRootCluster;

        rootCluster.cleanUpLeafs();
        //clean up previous clusters
        __WEBPACK_IMPORTED_MODULE_11__BaseCluster3D__["a" /* default */].cleanUpClusters(rootCluster.findClusters("*"), rootCluster);


        rootCluster.applyClustering(speccs);

        //TODO text is shown to early on update
        $(view).trigger("graph-changed");


        view.mControls.noRotate = false;

        //view.mSkyDome.visible=true;


        this.getCurrentView().mRootCluster.zoomToCluster()
    }


}
/* harmony export (immutable) */ __webpack_exports__["MyMain"] = MyMain;





	

/***/ }),
/* 26 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__TextNodesFactory__ = __webpack_require__(27);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__view_GraphView3D__ = __webpack_require__(12);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__Cluster3DExtended__ = __webpack_require__(3);
/**
 * Created by Frank on 12.07.2017.
 */



/**
 * the text overlay class can be used to put text elements on top of an other container element
 *
 *
 *
 *  ...
 *  TODO
 collect onbefore render of eeach cluster and nodeMixin(
 order from node which is more relevant to cluster
 if visible nodes => show them else show cluster elements
 *
 */








class ClusterTextOverlay extends HTMLElement {

    constructor() {
        super();

        this.possibleClusters = [];
        this.possibleLeafClusters = [];

    }

    /**
     *
     * init css and wait for data/graph to be loaded
     * then create overlay
     */

    connectedCallback() {
        let view = this.parentElement;
        if (!view instanceof __WEBPACK_IMPORTED_MODULE_1__view_GraphView3D__["a" /* default */])
            throw new Error("parent must be instance of GraphView3D");


        this.initCSS();

        $(view).on("loaded graph-changed", () => {

            if (!this.parentElement) return ;

        this.bindToCluster(this.parentElement.mRootCluster);
            this.addGlobalNodeCaptions(this.parentElement)

       })

    }


    /**
     *
     * add listeners to collect the visible cluster and leaf elements
     *
     */


    bindToCluster(rootcluster) {


        var $view = $(rootcluster.getView());

        var that = this;


        $view.on("before-render", function () {

            //reset nodes
            that.possibleClusters = [];
            that.possibleLeafClusters = [];
        });


        $view.on("after-render", () => {

            this.tn.update();
            this.mTextNodes.update();

        });


        rootcluster.findClusters().forEach(function (cluster) {

            //push clusters that are rendered and therefore are within frustum
            cluster.on("before-render", function () {

                //in any case push the cluster to the potential visible clusters
                that.possibleClusters.push(this);

                //in addition push it onto the leaf stack
                if (this.isLeaf()) {

                    //TODO make a distance check for the leaf including the boundingbox
                    that.possibleLeafClusters.push(this)

                }
            })

        })


    }

    /**
     * add style attributes to the overlay
     *
     * TODO import css directly
     *
     */
    initCSS() {


        $(this).addClass("graph-captions-container").css({
            width: "100%",
            height: "100%",
            // top: 0,
            // left: 0,
            overflow: "hidden",
            position: "absolute",
            "pointer-events": "none"//, border: "1px solid red"
        });

    }


    /**
     *
     * TODO the root cluster manages the visibility of all of it's currently visible nodes
     * we do have a hierarchical structure that we can use to speed up the rendering a bit
     *
     */

    addGlobalNodeCaptions(view) {


        /**
         * for the method to work the "env" object  needs to contain the following params :
         * env={
         *  renderer.domElement,  for get dimensions and text pos
         *   currentNodesVisible,   // ... nodes visible==all nodes in set is to harsh let rootcluster handle it probably
         *	textNode,               // node container that is overlay with pointerevents none
         *  camera
         *  }
         */


        var mTextNode = $(this)
            .height(view.clientHeight)
            .width(view.clientWidth)
            .empty();


        var that = this;
        let env = {
            renderer: view.mRenderer,
            currentNodesVisible: [],//can be left empty if below nodes function is used
            textNode: mTextNode,
            camera: view.mCamera

        };



        function getDistance(cluster){
            let point1 = view.mCamera.position;
            let point2 = cluster.localToWorld(new THREE.Vector3);
            let distance = point1.distanceTo(point2);

          return distance

        }

        function getNodesForLeaf() {
            //return only the closest cluster
            if (!that.possibleLeafClusters) return [];

            // get closest leaf only

            var res=_.map(that.possibleLeafClusters,function(leaf){

            return{item:leaf,distance:getDistance(leaf)}
            })
            res= _.sortBy(res, [function(o) { return o.distance; }]);

            //TODO nodes aren't in order so we should sort them also

            //FIXME deplace overlay after changing 3d => 2d view or have an event to track changing leafs/clusters
            //check for empty array which can happen if graph data changes and clusters get deleted
            if (!res[0] ||!res[0] .item) return [];

            let leaf1 =res[0].item;
            return leaf1.mNodes ? leaf1.mNodes : []


        }


        //the handler for the leaf text
        if (!this.tn)
            this.tn = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__TextNodesFactory__["a" /* default */])(env, {
                maxVisibleCount: 10,
                onNodeText: (node) => node.name ? node.name : node.id,
                getNodes:getNodesForLeaf
            });


        // TODO the bounding volume determines the visibility of the text nodes
        //TODO so currently with no volume generated properly the text nodes are invisible


        //the handler for the cluster text
        this.mTextNodes = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__TextNodesFactory__["a" /* default */])(env, {
            maxVisibleCount: 50,
            maxDistance: function (node) {
                return node.parent.getRadius(node.parent.mNodes.length) / 3 * 10
            },//30000
            minDistance: function (node) {
                return node.parent.getRadius(node.parent.mNodes.length) / 3 * 3
            }, //3000
            getNodes: function () {
                return that.possibleClusters
            },
            onNodeText: function (node) {

                if (node.name) return node.name;

                return node.id;

            },
            getCSSClasses: function () {
                return 'graph-country-caption'

            },
            getNodePosition: function (node) {

                var mVec3 = new THREE.Vector3();
                mVec3.setFromMatrixPosition(node.matrixWorld);

                //fixing the offset/position as soon as the hull is created
                if (node.mHull)
                    mVec3.add(node.mHull.mBoundingBox.getCenter())

                return mVec3; //node.position.clone()
            },
            interactable: true,
            onAfterCreateTextField: function (node, el) {

                var newSize;
                if (node instanceof __WEBPACK_IMPORTED_MODULE_2__Cluster3DExtended__["a" /* default */]) {
                    newSize = 12 + Math.ceil(Math.log2(node.mNodes.length) - 5);


                }
                else
                    newSize = 12 + Math.ceil(Math.log2(node.nodes.length) - 5);

                newSize = _.round(newSize / 12, 3) + "em";

                el.css("font-size", newSize);

                el.on("click", function () {
                    node.zoomToCluster();
                })

            }
        })


    }

}
/* unused harmony export default */



customElements.define("cluster-text-overlay", ClusterTextOverlay);











/***/ }),
/* 27 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = TextNodesFactory;

/**
 * 2.5d text feature
 * text nodes get rendered from a finite subset of given nodes depending on parameters like min/max distance
 */

/**
 *
 * for the method to work env  needs to contain the following paraams :
 * env={..
 *  renderer.domElement
 *   currentNodesVisible to select visible text nodes from
 *	textNode node container that is overlay with pointerevents none
 *  camera
 *  }
 */





function TextNodesFactory(env, options) {
	var domEl = env.renderer.domElement

		options = _.extend({
			interactable: false, //node can't be clicked, selected
			minVisibleCount:0, //the minimum amount of items ignoring distance
			maxVisibleCount: 10, //the max amount of rendered text labels
			maxDistance: 700, //the maximum distance between the node and the observer/camera to be accepted as a valid visible node
			minDistance: 10, //the minimum distance between the node and the observer/camera to be accepted as a valid visible node
			getNodes: function () {
				//the default implementation to retrieve the set of nodes for the text labels
				//override to implement any other
				return env.currentNodesVisible ? env.currentNodesVisible : nodes

			},
			getCSSClasses: function () {
				//the css class which gets applied to the text label
				return 'node-caption'

			},
			getNodePosition: function (node) {
				//should return a THREE.Vector3 represention the source nodes poistion in 3d space

                var vector = new THREE.Vector3();
                vector.setFromMatrixPosition( node._bubble.matrixWorld );
				return vector;

				//return node._bubble.position
			},
			onAfterCreateTextField: function (node, el) {}, //gets called after a text label is generated to be able to make adjustments
			onNodeText: function (node) {
				return node.id //returns the text shown by the text label
			}
		}, options)

		//--------------------------------
		//create text node

		var lastNodeID,
	lastNode;

	function createTextNode(node) {

		if (typeof node.text != "undefined")
			return node.text

			var _id = options.onNodeText(node)

				lastNodeID = _id
				lastNode = node;

		node.text = $("<span>").hide().addClass(options.getCSSClasses())
			.addClass("noselect").
			on("mousewheel", e => e.preventDefault())
			.attr('unselectable', 'on')
			.css('user-select', 'none')
			.on('selectstart', false)
			.html(_id).css({
				position: "absolute"
			});

		if (options.interactable)
			node.text.css({
				"pointer-events": "all"
			});
		else
			node.text.css({
				"pointer-events": "none"
			});

		options.onAfterCreateTextField(node, node.text);

		//TODO make the container variable
		env.textNode.append(node.text);
		return node.text;
	}

	//--------------------------------
	//update text nodes

	//@deprecated
	function getScreenPos2(p, domEl) {

		var vector = p.clone();

		vector.project(env.camera);

		vector.x = (vector.x + 1) / 2 * domEl.offsetWidth + domEl.offsetLeft;
		vector.y =  - (vector.y - 1) / 2 * domEl.offsetHeight + domEl.offsetTop;

		return vector;
	}


    /**
	 *
	 *
     * @param p THREE.Vector3 .. position of element
     * @param camera ... camera object
     * @param viewOffsetWidthBy2  .. the relative screen offset of the container (view) divided by two
     * @param viewOffsetHeightBy2 .. the relative screen offset of the container (view)divided by two
     */
    function getScreenPos(p, camera,viewOffsetWidthBy2,viewOffsetHeightBy2,viewOffsetX,viewOffsetY) {

        var vector = p.clone();

        vector.project(camera);

        vector.x = (vector.x + 1) * viewOffsetWidthBy2 + viewOffsetX
        vector.y =  - (vector.y - 1) * viewOffsetHeightBy2 +viewOffsetY

        return vector;
    }

	//--------------------------------
	//test if node matches criterias to be part of the current text node set
	function testIfRelevantNode(node) {

		var point1 = env.camera.position;
		var point2 = options.getNodePosition(node);
		var distance = point1.distanceTo(point2);
		//var scaling=1
		//var size=500/distance*10*scaling

        //calc angle to discard nodes that are to far at the sides of the screen or possible behind the camera
		let dir1=new THREE.Vector3().copy(point2).sub(point1)
		let dir2=env.camera.getWorldDirection()
		var angle = dir1.angleTo(dir2)


		//TODO is size still relevant somehow?
		var size = 12


		let _minDistance=typeof options.minDistance=="function"?options.minDistance(node):options.minDistance
        let _maxDistance=typeof options.maxDistance=="function"?options.maxDistance(node):options.maxDistance

        //return the result of the comparision
		//angle  90° == pi/4 => 45° fov for text nodes to each side
			if (size < 10 || size > 80 || angle>Math.PI/4 ||distance > _maxDistance || distance <_minDistance)
				return {
					distance,angle,
					addNodeToSet: false,
					node
				};
			else
				return {
					distance,angle,
					addNodeToSet: true,
					node
				};

	}

	//--------------------------------


	var previousVisibleNodes = []

	var maxVisibleTextNodes = options.maxVisibleCount

	function compareAndHidePreviousBatch(nodeInfosCurrentBatch) {




  if (previousVisibleNodes.length == 0 && nodeInfosCurrentBatch.length == 0  ) return;


    	// vars to safe some ms later on
		var camera=env.camera;

        var dw=domEl.offsetWidth /2;
        var dh=domEl.offsetHeight /2;

        var dl=domEl.offsetLeft;
        var dt=domEl.offsetTop;



		//updates the positions of the text labels matching it's 3d node counterparts positions
		function updatePos(node, distance = 0) {

			if (typeof node.text == "undefined")
				return;

			var pos = options.getNodePosition(node);
		//	var coords = getScreenPos(pos, domEl);

			var coords = getScreenPos(pos,camera,dw,dh,dl,dt);

			//TODO this offset stuff might need some parameters in the options section
			var centered = coords.x - node.text.width() / 2;
			var adjustedTop = coords.y - 500 / distance * 10

				node.text.css({
					top: adjustedTop,
					left: centered
				})

		}

		//contains the new node array that will be the previous nodes to run tests against in the next iteration
		var newPreviousVisibleNodes = []

		for (var preNode of previousVisibleNodes) {

			//hide prevNode, if the current batch does not contain the prevNode

			var mPos = nodeInfosCurrentBatch.findIndex((i) => i.node == preNode)
				if (mPos < 0) //not element of next iteration
				{

					if (typeof preNode.text != "undefined") {

						preNode.text.stop().hide()
						preNode.text.remove();
						delete (preNode.text)

						//FIXME elements wont disappear the way they are supposed to

						/*
						preNode.text._marked_for_deletion_=true


						preNode.text.stop().fadeOut(100
					, function() { $(this).remove(); delete(preNode.text) ;preNode.text=undefined  }
						);

						if (typeof preNode.text!="undefined")
					{
						updatePos(preNode)
						newPreviousVisibleNodes.push(preNode) //re-add the previous node that needs to be rendered/handled until it is deleted
						// preNode.text=null
						}
						 */

					}

				}

		}

		var nodesCurrentBatch = nodeInfosCurrentBatch.map((v) => v.node);

		previousVisibleNodes = newPreviousVisibleNodes.concat(nodesCurrentBatch)

			for (var nodeInfo of nodeInfosCurrentBatch) {
				if (nodeInfo.node.text && !nodeInfo.node.text._marked_for_deletion_)

                    if (!nodeInfo.node.text.is( ":animated"))
                    nodeInfo.node.text.stop().fadeIn(100);

				updatePos(nodeInfo.node, nodeInfo.distance);
			}



	}
	//--------------------------------
	//update function that finds relevant text labels and positions them on top of the 3d elements
	function simpleUpdate() {

		//let's take the result set of the last renderer loop as a start
		//the data is ordered in approximate descending distance from farthest to closest
		var mNodes = options.getNodes();
       // console.error("textnodes",mNodes.length)
		var maxVisibleTextNodes = options.maxVisibleCount;


		//next let's find the closest x nodes that match the criterias to be displayed
		var nodesCurrentBatch = [];

		for (var i = mNodes.length - 1; i >= 0 && maxVisibleTextNodes > nodesCurrentBatch.length; i--) {

			let node = mNodes[i];

			var res = testIfRelevantNode(node);
			if (res.addNodeToSet)
				nodesCurrentBatch.push(res);

			if (res.distance > options.maxDistance * 1.5)
				break; //shorten the search for large graphs


		}



		//TODO keep track of potential nodes that where discarded due to distance but should be readded due to minVisibleCount

		//------------------------------------------
		//now that we should have an array containing only relevant nodes, let's create and (compare+ update) nodes
		//ok node is relevant, so first of all check if node text element needs to be created

		nodesCurrentBatch = _.uniq(nodesCurrentBatch)

			if (nodesCurrentBatch.length > 0)
				for (var nodeInfo of nodesCurrentBatch)
					if (typeof nodeInfo.node.text == "undefined")
						createTextNode(nodeInfo.node); //.stop().fadeIn(150)


			//second compare and hide/show nodes
			compareAndHidePreviousBatch(nodesCurrentBatch);




	}

	return {
		update: _.throttle(simpleUpdate, 20, {
			leading: true,
			trailing: false
		}),
		remove: function () {

			compareAndHidePreviousBatch([])

		}
	}
}


/***/ }),
/* 28 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Created by Frank on 13.06.2017.
 *
 * a view class to be able to use multiple views and switch between them
 * also can limit fps to lower gpu impact
 * see shadertoy for possible usage as thumbnail or preview
 */






class View3D extends HTMLElement {

    constructor(...args) {
        super(...args);


        this.createCSSRule();
        this.mTime = -1;
        this.mActualFPS = 0;
        this.showFPSCounter = false;

        //   this.initStatic()

        // Setup renderer
        this.mRenderer = new THREE.WebGLRenderer({
            antialias: true
        });

        $(this).on("resize", () => this.resizeCanvas())


    }


    //FIXME have accesss methods for camera controls and domEvents to be able to change controls and camera mode

    initCamera() {

        // Setup camera
         this.mCameraP = new THREE.PerspectiveCamera();


        this.mCameraO = new THREE.OrthographicCamera();
        this.mCameraO.far = 5000000;
        this.mCameraO.lookAt(this.mScene.position);
        this.mCameraO.position.z = 150000;



        this.mCamera =    new THREE.CombinedCamera();

       // this.mCamera =   this.mCameraO// new THREE.CombinedCamera();


        if (this.mCamera instanceof THREE.CombinedCamera) {
            this.mCamera.setFar(5000000);

            this.mCamera.setFov(50);
        }
        else
            this.mCamera.far = 5000000;


        this.mCamera.lookAt(this.mScene.position);
        this.mCamera.position.z = 150000;


    }

    setControls() {
        // Add camera interaction
        this.mControls = new THREE.TrackballControls(this.mCamera, this.mRenderer.domElement);
        // this.mControls.rotateSpeed = 0.3
        this.mControls.maxDistance = Math.min(this.mCamera.far,200000);


        this.mControls.addEventListener("change", (...args) => $(this).trigger("change", ...args));


    }

    setDomEvents() {

        //throttle move events to about 50 fps
        //let origMouseMove=THREEx.DomEvents.prototype._onMouseMove;
        THREEx.DomEventsAlt.prototype._onMouseMove = _.throttle(function (domEvent)
            //THREEx.DomEvents.prototype._onMouseMove	=_.throttle(function(domEvent)
        {
            var mouseCoords = this._getRelativeMouseXY(domEvent);
            this._onMove('mousemove', mouseCoords.x, mouseCoords.y, domEvent);
            this._onMove('mouseover', mouseCoords.x, mouseCoords.y, domEvent);
            this._onMove('mouseout', mouseCoords.x, mouseCoords.y, domEvent);
        }, 40);  //25 (f)ps

        //init domEnvents
        //this.mDomEvents = new THREEx.DomEvents(this.mCamera,this.mRenderer.domElement);
        this.mDomEvents = new THREEx.DomEventsAlt(this.mCamera, this.mRenderer.domElement, this.mScene);

        //Note: have a factory in case we need this kind of injection multiple times
        // THREEx.DomEvents.prototype._onMouseMove=origMouseMove;//restore non throttled work flow to not interfere with other implementations


    }



     updateCamera()
     {
         this.mCamera.updateProjectionMatrix();


     //update controls
     this.mControls.object=this.mCamera

     //update domEvents camera with current camera
     this.mDomEvents._camera=this.mCamera


     }

    set2D()
    {

     //   this.mCameraO.copy( this.mCamera);

        this.mCamera=this.mCameraO



        this.updateCamera()

    }

    set3D()
    {
      //  this.mCameraP.copy( this.mCamera);

        this.mCamera=this.mCameraP

        this.updateCamera()

    }






    //TODO remove little redundancy
    createCSSRule() {

        var style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = '.view-3d-maximised {  border: 0px solid rgba(128, 128, 128, 0.5) !important; margin: 0 !important; position: absolute !important;   top: 0  !important;   left: 0  !important;   height: 100% !important;    width: 100% !important; }';
        document.getElementsByTagName('head')[0].appendChild(style);


    }


    resizeCanvas() {
        if (this.mRenderer) {
            this.mRenderer.setSize(this.clientWidth, this.clientHeight);
            this.mCamera.aspect = this.clientWidth / this.clientHeight;


            if (this.mCamera instanceof THREE.CombinedCamera)
                this.mCamera.setSize(this.clientWidth, this.clientHeight);
            this.mCamera.updateProjectionMatrix();

            //adjust orthographic camera
        let camFactor=2
            this.mCameraO.left = - this.clientWidth / camFactor;
            this.mCameraO.right =  this.clientWidth / camFactor;
            this.mCameraO.top =  this.clientHeight / camFactor;
            this.mCameraO.bottom = - this.clientHeight / camFactor;
            this.mCameraO.updateProjectionMatrix();


        }

        if (this.mRenderer)
            this.mControls.panSpeed = this.mControls.rotateSpeed = 1600 / this.clientWidth * 0.3


    }


    /* get scene() {
     return ""+ this.mScene
     }
     set scene(scene) {
     this.mScene=scene
     }
     */
    setCaption(text) {


        let captionCSS = {
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
            this.mCaption = $("<span></span>").html(this.name).css(captionCSS);

        this.mCaption.html("").append(text);
        return this
    }


    /**
     *   set up controls,  scene,   renderer,     animation
     *
     */
    initStatic() {

        if (this._inited_static_) return;
        var that = this;


        this.mFPS = 0.5;
        this.minFPS = this.minFPS || 0;
        this.maxFPS = this.maxFPS || 144;


        this.mLastFrameTime = -1;

        let captionCSS = {
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
            this.mCaption = $("<span></span>").html(this.name).css(captionCSS);

        $(this).append(this.mCaption).addClass("view-3d");


        // Setup scene

        this.mScene = new THREE.Scene();

        // Add nav info section
        //createTooltip()

        this.initCamera();

        this.mRenderer.setClearColor(0x000000);
        this.mRenderer.setPixelRatio(window.devicePixelRatio);

        this.appendChild(this.mRenderer.domElement);


        $(this.mRenderer.domElement).css({position: "absolute", width: "100%", height: "100%"});


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

        this.mFpsCounter = $("<span     style='color: white;position: absolute;' >");
        $(this).append(this.mFpsCounter);


        //------------------------------------------------
        this.setDomEvents();

        //------------------------------------------------


        //FIXME binding events will interfere with controls
        $(this.mRenderer.domElement).on("mouseover", function (e) {

            if (that.isMaximised()) return;

            e.stopPropagation();
            that.setActive();

            $(that).attr("hasFocus", true);


            that.mCaption.stop(true, false).fadeOut(200)


        });


        $(this.mRenderer.domElement).on("mouseout", function (e) {

            if (that.isMaximised()) return;

            e.stopPropagation();


            $(that).removeAttr("hasFocus");
            if (!$(that).hasClass("view-3d-maximised")) {

                that.mCaption.stop(true, false).delay(400).fadeIn();

                //keep maximised element active or whatever state it currently holds
                that.setInactive();


            }

        });


        this.setControls();

        this.resizeCanvas();


        this._inited_static_ = true;

        return this

    }

    // Kick-off renderer
    animate() {

        var initialFrames = 1;
        var that = this;
        var accTime = 0, accFrames = 0;

        function animate(time) {
            that.mTime = time;


            initialFrames--;
            if (that.mFPS == 0) {

                if (initialFrames < 0) {
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
            accTime += time - that.mLastFrameTime;
            accFrames++;

            if (accTime > 1000) {
                that.mActualFPS = accFrames;

                if (that.showFPSCounter)
                    that.mFpsCounter.html(that.mActualFPS);

                accTime = 0;
                accFrames = 0;


            }


            that.mLastFrameTime = time;

            that.mControls.update();


            $(that).trigger("before-render", time);
            // $(that).trigger("animate")

            that.mRenderer.render(that.mScene, that.mCamera);

            $(that).trigger("after-render", time);

            that.mFrameId = requestAnimationFrame(animate);
        }

        animate(-1)

    }


    add(object3D) {
        this.mScene.add(object3D)

    }


    maximise() {
        $(this).addClass("view-3d-maximised");

        this.mCaption.fadeOut();

        this.setActive()


    }

    isMaximised() {

        return $(this).hasClass("view-3d-maximised")

    }


    undoMaximise() {
        $(this).removeClass("view-3d-maximised");

        this.setInactive()


    }


    setActive() {

        //fps
        this.mFPS = this.maxFPS;

        this.resizeCanvas();
        this.start();

    }

    setInactive() {
        //  $(this).removeClass("view-3d-maximised")
        this.mFPS = this.minFPS;

        this.resizeCanvas()
    }


    start() {

        this.stop();

        this.animate()


    }

    stop() {
        window.cancelAnimationFrame(this.mFrameId)
    }

    resume() {

        this.start()

    }


    show() {
        this.resume()


    }

    hide() {
        this.stop()
    }


    connectedCallback() {

        this.createTooltip();


        this.initStatic();
        this.start();

        $(this).trigger("connected")


    }


    createTooltip() {

        // Setup tooltip
        if (this.toolTipElem) return;

        this.toolTipElem = document.createElement('div');
        this.toolTipElem.classList.add('graph-tooltip');

        $(this.toolTipElem).css({
            "z-index": 1,
            position: "relative",
            "user-select": "none"
        });

        this.appendChild(this.toolTipElem);

        // Capture mouse coords on move

        this.mouse = new THREE.Vector2();
        this.mouse.x = -2; // Initialize off canvas
        this.mouse.y = -2;
        this.addEventListener("mousemove", ev => {
            // update the mouse pos


            //$(env.toolTipElem).show()

            const offset = getOffset(this),
                relPos = {
                    x: ev.pageX - offset.left,
                    y: ev.pageY - offset.top
                };
            this.mouse.x = (relPos.x / this.clientWidth) * 2 - 1;
            this.mouse.y = -(relPos.y / this.clientHeight) * 2 + 1;
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
    setTooltip(text) {

        $(this.toolTipElem).html("").append(text).show()

    }


}
/* harmony export (immutable) */ __webpack_exports__["a"] = View3D;



customElements.define("view-3d", View3D);


/***/ }),
/* 29 */
/***/ (function(module, exports, __webpack_require__) {

var Point = __webpack_require__(5);

var _faceCount = 0;

var Face = function(point1, point2, point3, register){
    this.id = _faceCount++;

    if(register == undefined){
        register = true;
    }

    this.points = [
        point1,
        point2,
        point3
        ];
    if(register){
        point1.registerFace(this);
        point2.registerFace(this);
        point3.registerFace(this);
    }
};

Face.prototype.getOtherPoints = function(point1){
    var other = [];
    for(var i = 0; i < this.points.length; i++){
        if(this.points[i].toString() !== point1.toString()){
            other.push(this.points[i]);
        }
    }
    return other;
}

Face.prototype.findThirdPoint = function(point1, point2){
    for(var i = 0; i < this.points.length; i++){
        if(this.points[i].toString() !== point1.toString() && this.points[i].toString() !== point2.toString()){
            return this.points[i];
        }
    }
}

Face.prototype.isAdjacentTo = function(face2){
    // adjacent if 2 of the points are the same
    
    var count = 0;
    for(var i = 0; i< this.points.length; i++){
        for(var j =0 ; j< face2.points.length; j++){
            if(this.points[i].toString() == face2.points[j].toString()){
                count++;
                
            }
        }
    }

    return (count == 2);
}

Face.prototype.getCentroid = function(clear){
    if(this.centroid && !clear){
        return this.centroid;
    }

    var x = (this.points[0].x + this.points[1].x + this.points[2].x)/3;
    var y = (this.points[0].y + this.points[1].y + this.points[2].y)/3;
    var z = (this.points[0].z + this.points[1].z + this.points[2].z)/3;

    var centroid = new Point(x,y,z);

    this.centroid = centroid;

    return centroid;

}

module.exports = Face;


/***/ }),
/* 30 */
/***/ (function(module, exports, __webpack_require__) {

var Tile = __webpack_require__(31),
    Face = __webpack_require__(29),
    Point = __webpack_require__(5);

var Hexasphere = function(radius, numDivisions, hexSize){

    this.radius = radius;
    var tao = 1.61803399;
    var corners = [
        new Point(1000, tao * 1000, 0),
        new Point(-1000, tao * 1000, 0),
        new Point(1000,-tao * 1000,0),
        new Point(-1000,-tao * 1000,0),
        new Point(0,1000,tao * 1000),
        new Point(0,-1000,tao * 1000),
        new Point(0,1000,-tao * 1000),
        new Point(0,-1000,-tao * 1000),
        new Point(tao * 1000,0,1000),
        new Point(-tao * 1000,0,1000),
        new Point(tao * 1000,0,-1000),
        new Point(-tao * 1000,0,-1000)
    ];

    var points = {};

    for(var i = 0; i< corners.length; i++){
        points[corners[i]] = corners[i];
    }

    var faces = [
        new Face(corners[0], corners[1], corners[4], false),
        new Face(corners[1], corners[9], corners[4], false),
        new Face(corners[4], corners[9], corners[5], false),
        new Face(corners[5], corners[9], corners[3], false),
        new Face(corners[2], corners[3], corners[7], false),
        new Face(corners[3], corners[2], corners[5], false),
        new Face(corners[7], corners[10], corners[2], false),
        new Face(corners[0], corners[8], corners[10], false),
        new Face(corners[0], corners[4], corners[8], false),
        new Face(corners[8], corners[2], corners[10], false),
        new Face(corners[8], corners[4], corners[5], false),
        new Face(corners[8], corners[5], corners[2], false),
        new Face(corners[1], corners[0], corners[6], false),
        new Face(corners[11], corners[1], corners[6], false),
        new Face(corners[3], corners[9], corners[11], false),
        new Face(corners[6], corners[10], corners[7], false),
        new Face(corners[3], corners[11], corners[7], false),
        new Face(corners[11], corners[6], corners[7], false),
        new Face(corners[6], corners[0], corners[10], false),
        new Face(corners[9], corners[1], corners[11], false)
    ];

    var getPointIfExists = function(point){
        if(points[point]){
            // console.log("EXISTING!");
            return points[point];
        } else {
            // console.log("NOT EXISTING!");
            points[point] = point;
            return point;
        }
    };


    var newFaces = [];

    for(var f = 0; f< faces.length; f++){
        // console.log("-0---");
        var prev = null;
        var bottom = [faces[f].points[0]];
        var left = faces[f].points[0].subdivide(faces[f].points[1], numDivisions, getPointIfExists);
        var right = faces[f].points[0].subdivide(faces[f].points[2], numDivisions, getPointIfExists);
        for(var i = 1; i<= numDivisions; i++){
            prev = bottom;
            bottom = left[i].subdivide(right[i], i, getPointIfExists);
            for(var j = 0; j< i; j++){
                var nf = new Face(prev[j], bottom[j], bottom[j+1]); 
                newFaces.push(nf);

                if(j > 0){
                    nf = new Face(prev[j-1], prev[j], bottom[j]);
                    newFaces.push(nf);
                }
            }
        }
    }

    faces = newFaces;

    var newPoints = {};
    for(var p in points){
        var np = points[p].project(radius);
        newPoints[np] = np;
    }

    points = newPoints;

    this.tiles = [];
    this.tileLookup = {};

    // create tiles and store in a lookup for references
    for(var p in points){
        var newTile = new Tile(points[p], hexSize);
        this.tiles.push(newTile);
        this.tileLookup[newTile.toString()] = newTile;
    }

    // resolve neighbor references now that all have been created
    for(var t in this.tiles){
        var _this = this;
        this.tiles[t].neighbors = this.tiles[t].neighborIds.map(function(item){return _this.tileLookup[item]});
    }

};

Hexasphere.prototype.toJson = function() {

    return JSON.stringify({
        radius: this.radius,
        tiles: this.tiles.map(function(tile){return tile.toJson()})
    });
}

Hexasphere.prototype.toObj = function() {

    var objV = [];
    var objF = [];
    var objText = "# vertices \n";
    var vertexIndexMap = {};

    for(var i = 0; i< this.tiles.length; i++){
        var t = this.tiles[i];
        
        var F = []
        for(var j = 0; j< t.boundary.length; j++){
            var index = vertexIndexMap[t.boundary[j]];
            if(index == undefined){
                objV.push(t.boundary[j]);
                index = objV.length;
                vertexIndexMap[t.boundary[j]] = index;
            }
            F.push(index)
        }

        objF.push(F);
    }

    for(var i =0; i< objV.length; i++){
        objText += 'v ' + objV[i].x + ' ' + objV[i].y + ' ' + objV[i].z + '\n';
    }

    objText += '\n# faces\n';
    for(var i =0; i< objF.length; i++){
        faceString = 'f';
        for(var j = 0; j < objF[i].length; j++){
            faceString = faceString + ' ' + objF[i][j];
        }
        objText += faceString + '\n';
    }

    return objText;
}

module.exports = Hexasphere;


/***/ }),
/* 31 */
/***/ (function(module, exports, __webpack_require__) {

var Point = __webpack_require__(5);

function vector(p1, p2){
    return {
        x: p2.x - p1.x,
        y: p2.y - p1.y,
        z: p2.z - p1.z
    }

}

// https://www.khronos.org/opengl/wiki/Calculating_a_Surface_Normal
// Set Vector U to (Triangle.p2 minus Triangle.p1)
// Set Vector V to (Triangle.p3 minus Triangle.p1)
// Set Normal.x to (multiply U.y by V.z) minus (multiply U.z by V.y)
// Set Normal.y to (multiply U.z by V.x) minus (multiply U.x by V.z)
// Set Normal.z to (multiply U.x by V.y) minus (multiply U.y by V.x)
function calculateSurfaceNormal(p1, p2, p3){

    U = vector(p1, p2)
    V = vector(p1, p3)
    
    N = {
        x: U.y * V.z - U.z * V.y,
        y: U.z * V.x - U.x * V.z,
        z: U.x * V.y - U.y * V.x
    };

    return N;

}

function pointingAwayFromOrigin(p, v){
    return ((p.x * v.x) >= 0) && ((p.y * v.y) >= 0) && ((p.z * v.z) >= 0)
}

function normalizeVector(v){
    var m = Math.sqrt((v.x * v.x) + (v.y * v.y) + (v.z * v.z));

    return {
        x: (v.x/m),
        y: (v.y/m),
        z: (v.z/m)
    };

}

var Tile = function(centerPoint, hexSize){
    
    if(hexSize == undefined){
        hexSize = 1;
    }

    hexSize = Math.max(.01, Math.min(1.0, hexSize));

    this.centerPoint = centerPoint;
    this.faces = centerPoint.getOrderedFaces();
    this.boundary = [];
    this.neighborIds = []; // this holds the centerpoints, will resolve to references after
    this.neighbors = []; // this is filled in after all the tiles have been created

    var neighborHash = {};
    for(var f=0; f< this.faces.length; f++){
        // build boundary
        this.boundary.push(this.faces[f].getCentroid().segment(this.centerPoint, hexSize));

        // get neighboring tiles
        var otherPoints = this.faces[f].getOtherPoints(this.centerPoint);
        for(var o = 0; o < 2; o++){
            neighborHash[otherPoints[o]] = 1;
        }

    }

    this.neighborIds = Object.keys(neighborHash);

    // Some of the faces are pointing in the wrong direction
    // Fix this.  Should be a better way of handling it
    // than flipping them around afterwards

    var normal = calculateSurfaceNormal(this.boundary[1], this.boundary[2], this.boundary[3]);

    if(!pointingAwayFromOrigin(this.centerPoint, normal)){
        this.boundary.reverse();
    }



};

Tile.prototype.getLatLon = function(radius, boundaryNum){
    var point = this.centerPoint;
    if(typeof boundaryNum == "number" && boundaryNum < this.boundary.length){
        point = this.boundary[boundaryNum];
    }
    var phi = Math.acos(point.y / radius); //lat 
    var theta = (Math.atan2(point.x, point.z) + Math.PI + Math.PI / 2) % (Math.PI * 2) - Math.PI; // lon
    
    // theta is a hack, since I want to rotate by Math.PI/2 to start.  sorryyyyyyyyyyy
    return {
        lat: 180 * phi / Math.PI - 90,
        lon: 180 * theta / Math.PI
    };
};



Tile.prototype.scaledBoundary = function(scale){

    scale = Math.max(0, Math.min(1, scale));

    var ret = [];
    for(var i = 0; i < this.boundary.length; i++){
        ret.push(this.centerPoint.segment(this.boundary[i], 1 - scale));
    }

    return ret;
};

Tile.prototype.toJson = function(){
    // this.centerPoint = centerPoint;
    // this.faces = centerPoint.getOrderedFaces();
    // this.boundary = [];
    return {
        centerPoint: this.centerPoint.toJson(),
        boundary: this.boundary.map(function(point){return point.toJson()})
    };

}

Tile.prototype.toString = function(){
    return this.centerPoint.toString();
};

module.exports = Tile;


/***/ }),
/* 32 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "3b30479746a603ca6eeb0fa522427a01.png";

/***/ })
/******/ ]);
//# sourceMappingURL=bundle.js.map