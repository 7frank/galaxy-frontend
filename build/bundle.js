var clusters =
webpackJsonpclusters([0],[
/* 0 */,
/* 1 */,
/* 2 */,
/* 3 */,
/* 4 */,
/* 5 */,
/* 6 */,
/* 7 */,
/* 8 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ClusterLeafElement__ = __webpack_require__(123);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__BaseNode__ = __webpack_require__(122);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__EdgeUtil__ = __webpack_require__(34);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__hull_BaseVolume__ = __webpack_require__(25);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__utils_MaterialFadeMixin__ = __webpack_require__(19);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_easy_color__ = __webpack_require__(88);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_easy_color___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_5_easy_color__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__edges_ClusterBaseEdges__ = __webpack_require__(66);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7_three__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8_lodash__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8_lodash___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_8_lodash__);
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
        this.useLOD = false;

        //FIXME
        this.bClusterEdgesVisible = true;

        // this.bClusterEdgesVisible = false; //initially invisible
        //add collapse/expand stuff
        //  this.mExpanded = true;
        this.mClusterClusteringApplied = false;
        this.mCollapsedGroup = new __WEBPACK_IMPORTED_MODULE_7_three__["Group"]();
        this.mExpandedGroup = new __WEBPACK_IMPORTED_MODULE_7_three__["Group"]();

        this.mCollapsedGroup.name = "CollapsedGroup"
        this.mExpandedGroup.name = "ExpandedGroup"

        this.add(this.mCollapsedGroup);
        this.add(this.mExpandedGroup);

//some helpers for testing
        /*        var axisHelper = new THREE.AxisHelper( 2500 );
                this.add( axisHelper );
                this.mCollapsedGroup.add( axisHelper );
                this.mExpandedGroup.add( axisHelper );
        */

        this.registerCustomEvent("hull-updated"); // gets called if the hull got adjusted

        this.registerCustomEvent("initial-expand"); //triggered when a collapsed cluster gets expanded


        this.registerCustomEvent("cluster-ready"); //if the cluster animation is finished

        this.mClusters = {};
        //Cluster if present, use to cluster nodes into sub-clusters
        if (__WEBPACK_IMPORTED_MODULE_8_lodash__["isArray"](clusteringHandlers) && clusteringHandlers.length > 0) {
            this.applyClustering(clusteringHandlers);
        }
        // else this.updateCluster()


        //add collapse behaviour to left click
        //TODO this interferes with zoom.. we can't bind everything from the gerhobelt demo to the same mouse button


        /*    this.on("click", function (e) {

                e.stopPropagation();

                this.getClusterOptions().click.bind(this)()

            });*/


        //update lod //TODO the function should forward onBeforeRender args in a way
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

            //no need for updates if nothing changed
            if (this.mLastCamDistance == distance) return
            this.mLastCamDistance = distance


            //TODO how to handle max distance with the lod approach of meshes
            let maxDistance = this.getRadius(this.mNodes.length) * 25;
            let minDistance = 0;//this.getRadius() ;

            let L = maxDistance - minDistance;


            var lod = 1 - (distance - minDistance) / (maxDistance - minDistance);

            this.setLOD(lod)

        })


    }

    /**
     * free the given gclusters again
     *
     *
     * TODO check if changes to collapsed/expanded groups are relevant to cleaning up clusters
     */

    static cleanUpClusters(clusters, self) {
        clusters.push(self);

        __WEBPACK_IMPORTED_MODULE_8_lodash__["each"](clusters, function (cluster) {

            cluster.mClusterClusteringApplied = false;//reset initial state

            cluster.mCollapsedGroup.remove(cluster.mCollapsedClusterHull);
            cluster.mCollapsedClusterHull = null


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

    setLeafsVisible(bVisible) {

        this.getLeafs().forEach(l => l.visible = bVisible)

    }

    setParticlesVisible(bVisible) {

        this.getLeafs().forEach(l => l.setParticlesVisible(bVisible))

    }

    setNodesVisible(bVisible) {

        this.getLeafs().forEach(l => l.setNodesVisible(bVisible))

    }

//FIXME does not work
    setEdgesVisible(bVisible) {

        //TODO interference with lod
        this.findClusters("*").forEach(function (c) {
            c.bClusterEdgesVisible = bVisible;
            if (c.mChildClustersEdgesMesh) {
                c.mChildClustersEdgesMesh.material.visible = bVisible;


                c.mChildClustersEdgesMesh.material.needsUpdate = true;

            }

        })

        this.getLeafs().forEach(l => l.setEdgesVisible(bVisible))

    }

    //TODO update position and radius
    getSphereHull(boundingBox) {
        let boundingSphere;

        if (this.mCollapsedClusterHull != null) {

            //FIXME hull offset
            if (this.mHull) {
                let boundingBox = this.mHull.mBoundingBox;
                boundingSphere = boundingBox.getBoundingSphere();


                //  this.mCollapsedClusterHull.position.copy(boundingSphere.center);
            }

            var that = this
            setTimeout(function () {

                that.trigger("hull-updated")

            }, 50)

            return this.mCollapsedClusterHull
        }


        var parser = new __WEBPACK_IMPORTED_MODULE_5_easy_color___default.a("#00AAFF");
        var table = parser.CSSColorTable


        let id = __WEBPACK_IMPORTED_MODULE_8_lodash__["random"](0, Object.keys(table).length - 1)
        var color = new __WEBPACK_IMPORTED_MODULE_5_easy_color___default.a(Object.values(table)[id]);


//FIXME MeshPhongMaterial does not get light
        let materialInnerRing = new __WEBPACK_IMPORTED_MODULE_7_three__["MeshBasicMaterial"]({
            color: 0x00FFFF, // 0xfaebd7, //antique-white
            wireframe: false,
            transparent: true,
            opacity: 1.0,
            visible: true,
            polygonOffset: true,
            polygonOffsetFactor: -4,
            depthTest: false, //enabled, it will half way hide BaseVolume lines //TODO this is because the ring is only a flat surface in 3d space ...
            blending: __WEBPACK_IMPORTED_MODULE_7_three__["NoBlending"]
        });


        materialInnerRing.color = new __WEBPACK_IMPORTED_MODULE_7_three__["Color"](color.rgb.r / 255, color.rgb.g / 255, color.rgb.b / 255)

        let materialOtherBlue = new __WEBPACK_IMPORTED_MODULE_7_three__["MeshBasicMaterial"]({
            color: 0x555555, //0x6a5acd, //slate-blue
            wireframe: false,
            transparent: true,
            // opacity: 0.8,
            visible: true,
            polygonOffset: true,
            polygonOffsetFactor: -4,
            depthTest: false
        });


        if (boundingBox)
            boundingSphere = boundingBox.getBoundingSphere();
        else
            boundingSphere = new __WEBPACK_IMPORTED_MODULE_7_three__["Sphere"](new __WEBPACK_IMPORTED_MODULE_7_three__["Vector3"], this.mNodes.length * 7);
        //FIXME estimated hull size differs from forcegraph collision box

        let ringGeometryOuter = new __WEBPACK_IMPORTED_MODULE_7_three__["RingGeometry"](boundingSphere.radius * 0.85, boundingSphere.radius, 64);
        //  ringGeometryOuter.boundingSphere = boundingSphere;


        let ringGeometryInner = new __WEBPACK_IMPORTED_MODULE_7_three__["CircleGeometry"](boundingSphere.radius * 0.85, 64);
        //  ringGeometryInner.boundingSphere = boundingSphere;


        let inner = new __WEBPACK_IMPORTED_MODULE_7_three__["Mesh"](ringGeometryInner, materialInnerRing);
        let outer = new __WEBPACK_IMPORTED_MODULE_7_three__["Mesh"](ringGeometryOuter, materialOtherBlue);

        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_4__utils_MaterialFadeMixin__["a" /* default */])(materialInnerRing)
        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_4__utils_MaterialFadeMixin__["a" /* default */])(materialOtherBlue)


        let _hull = new __WEBPACK_IMPORTED_MODULE_7_three__["Group"]();

        _hull.name = "CollapsedHull"

        _hull.add(outer);
        _hull.add(inner);

        _hull.animate = function (fade, duration, onComplete) {
            //  materialInnerRing.animate(...arguments)
            materialOtherBlue.animate(...arguments)
        }


        function beforeRender(renderer, scene, camera, geometry, material, group) {
            //billboard effect
            //  this.position.set(0, 0, 0)

            this.setRotationFromQuaternion(camera.quaternion)


            /*   var vec3 = new THREE.Vector3(0, 0, 1)// camera.position.clone().sub(this.position).normalize()

               // translate the object 10% of it's size into the foreground
               //TODO smaller collapsed hulls should be in front of bigger ones
               this.translateOnAxis(vec3, boundingSphere.radius / 10)
           */
        };


        this.addHullStencilBeforeRender(outer, beforeRender)
        this.addHullStencilBeforeRender(inner, beforeRender)


        _hull.position.copy(boundingSphere.center);

        //inner.geometry.boundingSphere=boundingSphere;
        //inner.geometry.boundingBox=boundingSphere.getBoundingBox();

        //FIXME creates problems with interactions
        //the geometry that is necessary to be able to click stuff is generated in ajdustHullSize which isn't called when cluster is collapsed
        //TODO make it more robust

        if (!this.geometry) this.geometry = new __WEBPACK_IMPORTED_MODULE_7_three__["SphereGeometry"](boundingSphere.radius, 10, 5);
        if (!this.geometry.boundingSphere)
            this.geometry.boundingSphere = boundingSphere;
        if (!this.geometry.boundingBox)
            this.geometry.boundingBox = boundingSphere.getBoundingBox();


        //------

        // _hull.renderOrder = -1

        // hull.onBeforeRender = function( renderer ) { renderer.clearDepth(); };


        this.mCollapsedClusterHull = _hull;
        this.mCollapsedGroup.add(this.mCollapsedClusterHull);
        //------

        var origScale;
        this.on("mouseover", function () {

            if (this.mExpanded == false)
                if (this.mCollapsedClusterHull) {
                    origScale = this.mCollapsedClusterHull.scale.clone()
                    this.mCollapsedClusterHull.scale.multiplyScalar(1.05)

                }

        })
        this.on("mouseout", function () {

            if (this.mExpanded == false)
                if (this.mCollapsedClusterHull && origScale)
                    this.mCollapsedClusterHull.scale.copy(origScale)


        })


        this.trigger("hull-updated") //the collapsed sphere hull functions the same as the actual hull in terms of this event


        return _hull

    }

    toggleCollapse() {


        this.mExpanded = !this.mExpanded;

        console.log(this.name, "expanded:", this.mExpanded)


        if (this.mExpanded)
            this.expand();
        else
            this.collapse();


    }

    collapse() {


        //create/show collapse element (SphereGeometry)
        //if cluster is not initialised and no hull exists then use the node count to aproximate the size
        //use SphereHullGeometry

        //hide group/countainer that holds
        // -child edges
        // -subclusters
        // - mHull

        //hide all child elements
        //TODO have a container for children so deferred elements are hidden too
        // _.each(this.children,el => el.visible=false )

        var pos_offset = new __WEBPACK_IMPORTED_MODULE_7_three__["Vector3"]
        //change position of mCollapsedGroup based on center of mHull
        if (this.mHull.mBoundingBox)
            pos_offset = this.mHull.mBoundingBox.getCenter()//.multiplyScalar(-1);


        var that = this

        //scale collapsed nodes only to 70% of the size of the actual cluster
        this.animate({mCollapsedGroup: {scale: {x: 0.7, y: 0.7, z: 0.7}, position: {x: 0, y: 0, z: 0}}}, 200)
        this.animate({mExpandedGroup: {scale: {x: 0.001, y: 0.001, z: 0.001}, position: pos_offset}}, 200, function () {
            this.mExpandedGroup.visible = false
        }, function onAnimate() {

            this.trigger("hull-updated")

        })


        this.getSphereHull(this.mHull ? this.mHull.mBoundingBox : null)


        //TODO togging the group will have strange effect
        //   if (this.mCollapsedGroup)
        //      this.mCollapsedGroup.visible = true

        this.mCollapsedClusterHull.animate({fade: 1}, 200)


        //change position of mCollapsedGroup based on center of mHull
        if (!this.mHull.mBoundingBox) console.warn("hull should have a bounding box", this.mHull)
        else {
            var offset = this.mHull.mBoundingBox.getCenter()//.multiplyScalar(3);

            //this.mCollapsedGroup.position.copy(offset)

            this.mCollapsedClusterHull.position.copy(offset)

        }


    }

    expand() {

        var that = this;

        if (this.mCollapsedClusterHull)
            this.mCollapsedClusterHull.animate({fade: 0.1}, 200)


        if (!this.mClusterClusteringApplied) {


            this.applyClustering(this.getEntries(), true); //initialise sub-clusters if necessary


            // primarily notify text overlay here
            $(this.getRoot().getView()).trigger("graph-changed");

            this.trigger("initial-expand");


        }


        //TODO handle if not created.. via callback/event
        //also currently if not already created the placeholder sphere gets removed again (restructure)

        var pos_offset = new __WEBPACK_IMPORTED_MODULE_7_three__["Vector3"]
        //change position of mCollapsedGroup based on center of mHull
        if (this.mHull && this.mHull.mBoundingBox)
            pos_offset = this.mHull.mBoundingBox.getCenter()//.multiplyScalar(-1);


        this.animate({mCollapsedGroup: {scale: {x: 0.001, y: 0.001, z: 0.001}, position: pos_offset}}, 200)


        this.mExpandedGroup.visible = true
        this.animate({mExpandedGroup: {scale: {x: 1, y: 1, z: 1}, position: {x: 0, y: 0, z: 0}}}, 200, function () {
        }, function onAnimate() {

            this.trigger("hull-updated")

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

            let vis = (1 - mLOD) / 2;


            //TODO the cluster edges should partially be dependant on the size of the hull..

            let opa = vis
            if (opa > 0.02) opa = 0.02;

            this.mChildClustersEdgesMesh.material.opacity = opa//*this.mEdgeFadeInVal ;

            this.mChildClustersEdgesMesh.material.visible = this.bClusterEdgesVisible ? vis > 0.02 && vis < 0.9 : false;

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

        if (__WEBPACK_IMPORTED_MODULE_8_lodash__["isArray"](nodes))
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

        __WEBPACK_IMPORTED_MODULE_8_lodash__["each"](this.mClusters, (cluster) => this.mExpandedGroup.add(cluster))

    }

    /**
     *  used for recursive cluster generation if class is used for inheritance
     */

    getChildClusterConstructor() {
        return this.constructor

    }

    /**
     * free leaf elements
     *
     *
     */


    cleanUpLeafs() {
        __WEBPACK_IMPORTED_MODULE_8_lodash__["each"](this.getLeafs(), function (leaf) {

            //TODO to leaf specific clean up

            //for now at least remove the particle cloud
            leaf.parent.mLeaf = null;

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
        __WEBPACK_IMPORTED_MODULE_8_lodash__["each"](leafElements, function (leaf) {
            let mNodes = leaf.mNodes;
            __WEBPACK_IMPORTED_MODULE_8_lodash__["each"](mNodes, function (node) {


                var c1 = new __WEBPACK_IMPORTED_MODULE_7_three__["Vector3"]();
                c1.setFromMatrixPosition(leaf.matrixWorld);

                node._parentPosAbs = c1;

            })
        })


    }

    restoreNodePositionFromExParent() {


        var leafElements = this.getLeafs();
        __WEBPACK_IMPORTED_MODULE_8_lodash__["each"](leafElements, function (leaf) {
            let mNodes = leaf.mNodes;
            __WEBPACK_IMPORTED_MODULE_8_lodash__["each"](mNodes, function (node) {
                //get current parent pos
                let c1 = node._parentPosAbs;

                if (!c1) return;
                var c2 = new __WEBPACK_IMPORTED_MODULE_7_three__["Vector3"]();
                c2.setFromMatrixPosition(leaf.matrixWorld);

                node._bubble.position.add(c1).sub(c2);
                __WEBPACK_IMPORTED_MODULE_8_lodash__["extend"](node, node._bubble.position)

            })
        })


    }


    setEntry(entry) {
        this.mEntry = entry
    }

    getEntry() {
        return this.mEntry
    }

    setEntries(entries) {
        this.mEntrys = entries;
        this.setEntry(entries[0])

    }

    getEntries() {
        return this.mEntrys || []
    }


    getClusterOptions() {


        let options = __WEBPACK_IMPORTED_MODULE_8_lodash__["extend"]({
            minClusterSize: 10,
            defaultMergeGroupName: "other",
            hull: __WEBPACK_IMPORTED_MODULE_3__hull_BaseVolume__["a" /* default */],
            onHullCreated: function () {
            },
            edges: __WEBPACK_IMPORTED_MODULE_6__edges_ClusterBaseEdges__["a" /* default */],
            //isCollapsable:false, //TODO the behaviour to toggle collapse state should be handled by the specific handler of the visualisation not by the cluster itself
            expanded: true,  //determines if a cluster is initially expanded or not
            text: function noop() {
            },
            colors: {}
        }, this.mEntry.options);


        //we want to have to color option defaults copied from the parent if it exists
        //or set otherwise
        let parent = this.getParentCluster()
        if (!parent) //is root
        {

            options.colors =
                __WEBPACK_IMPORTED_MODULE_8_lodash__["extend"]({
                    edge: [0x999999, 1],

                    hull: [0xffffff, 0.03]//     color: 0xffffff,    opacity: 0.03,
                }, options.colors);

        }
        else
            options.colors =
                __WEBPACK_IMPORTED_MODULE_8_lodash__["extend"](parent.getClusterOptions().colors, options.colors);


        //TODO have more utility for global options


        return options

    }


    /**
     * while generating clusters an"events" object can be used to bind events to specific groups of clusters.
     * the object key in this case is the event name.
     * this method returns the object for BaseCluster::addOptionEvents to bind them
     *
     */

    getEvents() {

        let events = __WEBPACK_IMPORTED_MODULE_8_lodash__["extend"]({
            click: function () {
            }

        }, this.mEntry.events);

        return events

    }


    /**
     *
     * iterates through all given event options and attaches the event handlers  to the cluster
     * event names can be mouse events, special-events, or keyboard events like "ctrl+a"
     */


    addOptionEvents() {
        var that = this;


        if (this.mEventsBound == true) return

        //bind event options to cluster
        __WEBPACK_IMPORTED_MODULE_8_lodash__["each"](this.getEvents(), function (handler, eventName) {
            that.on(eventName, function (e) {

                e.stopPropagation();

                handler.bind(this)()

            });

        })

        this.mEventsBound = true

    }


    /**
     * this method can be re-run to change the sub-clusters
     * -which will result in deleting old clusters
     * -adding new ones to the container
     * TODO this should re-build all child clusters if another ordering is provided
     *
     */

    applyClustering(mClusteringSpeccsArray, overrideExpand = false) {


        if (mClusteringSpeccsArray.length >= 0) {
            this.setEntries(mClusteringSpeccsArray);
        }
        else throw new Error("must be array of length > 0");


        this.addOptionEvents();


        //delay clustering if options expanded == false
        if (!overrideExpand) {
            let isClusterExpanded = this.getClusterOptions().expanded
            if (typeof isClusterExpanded == "function")
                isClusterExpanded = isClusterExpanded.bind(this)()

            this.mExpanded = isClusterExpanded

            if (isClusterExpanded == false) {
                //     console.log("creating collapsed hull for", this.name)
                this.getSphereHull(); //create the placeholder for the cluster instead
                //     console.log("collapsed hull:", this.mCollapsedClusterHull)
                return;
            }

        }


        //e. g. result should be .. {china:instanceof BaseCluster3D}

        if (mClusteringSpeccsArray.length == 1) {

            let prevClusters = this.findClusters("*");
            this.cleanUpLeafs();
            this.createParticlePointCloud(mClusteringSpeccsArray[0]);

            //clean up previous clusters if they exist
            BaseCluster3D.cleanUpClusters(prevClusters, this);

            this.mClusterClusteringApplied = true;

            return false;
        }


        var entry = mClusteringSpeccsArray[0];

        //store previous clusters
        let prevClusters = this.findClusters("*");

        //create new clusters
        this.doClusteringForOnlyThis(entry);


        __WEBPACK_IMPORTED_MODULE_8_lodash__["each"](this.mClusters, function (mCluster, key) {

            var nextDepthSpeccsArray = [].concat(mClusteringSpeccsArray);
            nextDepthSpeccsArray.shift();

            if (nextDepthSpeccsArray.length >= 1)
                mCluster.applyClustering(nextDepthSpeccsArray);

        });


        // elements are added elsewhere
        //this.updateCluster();


        //clean up previous clusters
        BaseCluster3D.cleanUpClusters(prevClusters, this);


        this.mClusterClusteringApplied = true;

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
        __WEBPACK_IMPORTED_MODULE_8_lodash__["each"](elements, function (_cluster, key) {

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


        __WEBPACK_IMPORTED_MODULE_8_lodash__["extend"](this.mClusters, _clustersObj);

        //TODO add clusters to parent so getParentCluster Works within options
        this.addAllSubClustersToContainer()

        /**
         * add listeners to child elements if the hull was update
         * in which case we bubble up the tree to notify for changes and readjust parent elements
         *
         */
        __WEBPACK_IMPORTED_MODULE_8_lodash__["each"](this.mClusters, function (childCluster) {
            childCluster.on("hull-updated", __WEBPACK_IMPORTED_MODULE_8_lodash__["throttle"](function () {


                that.adjustHullSize();


                let o = that.getClusterOptions()
                that.addChildClusterEdges({color: o.colors.edge[0], opacity: o.colors.edge[1]});
                that.updateChildClusterEdges();

                that.trigger("hull-updated");
            }, 50/*, {trailing: true, leading: false}*/))  //if leading is true it won't build up the hulls in a progressive manner
        });


        this.setDistributionHandler(entry.distribution, function () {

            that.mClusterRule = entry;
            that.trigger("cluster-ready")


            that.adjustHullSize();

        }, __WEBPACK_IMPORTED_MODULE_8_lodash__["throttle"](function () {




            // that.trigger("hull-updated")
            //FIXME on expand, the "hull-updated" event for child elements is not triggered
            //check if hull is created but is not big  enough or not visible
            that.adjustHullSize();
            //use on step with throttle to create hull every 500ms and on complete once again
            //dont use this for leaf elements bc the convex hull will take too lng
            //remove events for hull that are no longer necessary this way?


        }, 50))

    }


    removeEdges() {

        if (this.mChildClustersEdges) this.mChildClustersEdges = null; //delete edge references
        if (this.mChildClustersEdgesMesh) {
            this.mChildClustersEdgesMesh.geometry.dispose();

            this.mChildClustersEdgesMesh.parent.remove(this.mChildClustersEdgesMesh);
            this.mChildClustersEdgesMesh = null; //delete edge-mesh  references

        }

    }


    /**
     * updates the edges of the clusters as soon as the hull feature is rendered
     *
     *
     * @param options
     */


    updateChildClusterEdges(options) {

        this.mChildClustersEdgesMesh.setClusters(this.mClusters)
        this.mChildClustersEdgesMesh.update()


        //TODO this should enable stencil testing for the current two implementations of edges
        if (this.mChildClustersEdgesMesh.children.length > 0)
        //for (let i=0;i<this.mChildClustersEdgesMesh.children.length;i++)
        //this.addEdgeStencilBeforeRender(this.mChildClustersEdgesMesh.children[i])
            this.addEdgeStencilBeforeRender(this.mChildClustersEdgesMesh.children[0])
        else
            this.addEdgeStencilBeforeRender(this.mChildClustersEdgesMesh)


    }


    //TODO refactor into class like EdgesContainer for leaf/node edges

    /**
     * generated and updates edges between clusters
     *
     */
    addChildClusterEdges(options) {


        //TODO
        if (this.mChildClustersEdgesMesh) {

            this.mChildClustersEdgesMesh.geometry.verticesNeedUpdate = true;
            return;
        }


        let edgeClass = this.getClusterOptions().edges

        if (!(  __WEBPACK_IMPORTED_MODULE_6__edges_ClusterBaseEdges__["a" /* default */] == edgeClass || __WEBPACK_IMPORTED_MODULE_6__edges_ClusterBaseEdges__["a" /* default */].isPrototypeOf(edgeClass))) {
            edgeClass = __WEBPACK_IMPORTED_MODULE_6__edges_ClusterBaseEdges__["a" /* default */];
            console.error("cluster option edges must be instanceof ClusterBaseEdges, using default")
        }


        this.mChildClustersEdgesMesh = new edgeClass(null, options)

        /*
                //TODO this should enable stencil testing for the current two implementations of edges
                 if (this.mChildClustersEdgesMesh.children.length > 0)
                      //for (let i=0;i<this.mChildClustersEdgesMesh.children.length;i++)
                      //this.addEdgeStencilBeforeRender(this.mChildClustersEdgesMesh.children[i])
                     this.addEdgeStencilBeforeRender(this.mChildClustersEdgesMesh.children[0])
                  else
                this.addEdgeStencilBeforeRender(this.mChildClustersEdgesMesh)
        */

        this.mExpandedGroup.add(this.mChildClustersEdgesMesh);


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

        for (let el of this.mNodes)
            filterFunction(groupFunction, el)


        return container

    }


    getVerticesFromBoundingBox(boundingBox) {


        let _center = boundingBox.getCenter();
        let _size = boundingBox.getSize();

        let box = new __WEBPACK_IMPORTED_MODULE_7_three__["BoxGeometry"](_size.x, _size.y, _size.z);

        box.translate(_center.x, _center.y, _center.z);

        return box.vertices
    }


    //TODO it  seems, the vertices aren't calculated properly
    getCompoundBoundingBoxInfo() {
        var that = this;
        var box = new __WEBPACK_IMPORTED_MODULE_7_three__["Box3"];
        var vertices = [];
        __WEBPACK_IMPORTED_MODULE_8_lodash__["each"](this.mClusters, function (subCluster) {
            let boundingBox = new __WEBPACK_IMPORTED_MODULE_7_three__["Box3"];

            if (!subCluster.geometry.boundingBox) return; //not computed bbox, ignore
            boundingBox.copy(subCluster.geometry.boundingBox);


            let offset_parent = that.localToWorld(new __WEBPACK_IMPORTED_MODULE_7_three__["Vector3"]);
            let offset_world = subCluster.localToWorld(new __WEBPACK_IMPORTED_MODULE_7_three__["Vector3"]);
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

        let offset_parent = that.localToWorld(new __WEBPACK_IMPORTED_MODULE_7_three__["Vector3"]);
        let offset_world = el.localToWorld(new __WEBPACK_IMPORTED_MODULE_7_three__["Vector3"]);


        let translateOffset = offset_world.sub(offset_parent);

        let geometry = el.geometry;
        var attributes = geometry.attributes;
        var positions = attributes.position.array;
        let vert = [];
        for (var i = 0; i < positions.length; i += 3) {

            let v = new __WEBPACK_IMPORTED_MODULE_7_three__["Vector3"](positions[i], positions[i + 1], positions[i + 2]);
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
    }, onStep = function () {
    }) {
        var that = this;
        var values = Object.values(this.mClusters);
        //TODO translation,rotation,scale by using different per-node function


        //FIXME redundant updating multiple edges and potentially leafs
        var updateLeafsEdges = __WEBPACK_IMPORTED_MODULE_8_lodash__["throttle"](function (cluster) {

            //TODO the timeout fixes the problem that the edges aren't on spot but this should be reviewed and fixed without it


            let leafs = cluster.getLeafs();
            __WEBPACK_IMPORTED_MODULE_8_lodash__["each"](leafs, function (leaf) {
                leaf.updateEdges();
            });

        }, 100);

//TODO it seems as if this part was no longer in use
        /*    if (this.isLeaf())
                this.mLeaf.setDistributionHandler(distribution, onComplete,function(){
                    updateLeafsEdges(that);
                    onStep()   });
            else*/
        distribution.setNodes(this,
            function onNodePositionChanged(vecPosition, i) {
            },
            function _onStep(p) {

                updateLeafsEdges(that);


                onStep()
                //that.addChildClusterEdges();

            }, function () {

                onComplete();
            });


    }


    setHullColorFromOptions(hull) {
        let o = this.getClusterOptions()

        if (hull.canBeVisible()) {

            hull.mesh.material.color = new __WEBPACK_IMPORTED_MODULE_7_three__["Color"](o.colors.hull[0])

            //TODO test this
            //hull.mesh.material.transparent =o.colors.hull[0]!=1

            hull.maxOpacity = o.colors.hull[1]
        }

    }


    addHullStencilBeforeRender(mesh, callback) {
        var that = this

        mesh.onBeforeRender = function (renderer) {

            var depth = that.getDepth()

            let opt = renderer.debug.stencil
            opt.state(true)
            var gl = renderer.context;
            // config the stencil buffer to collect data for testing
            let func = opt.func[0]
            gl.stencilFunc(func[0], depth + func[1], func[2]);
            gl.stencilOp(... opt.op[0]);

            if (callback)
                callback.bind(this)(...arguments)

        }

        mesh.onAfterRender = function (renderer) {

            let opt = renderer.debug.stencil
//            opt.state(false)
        }

    }

    addEdgeStencilBeforeRender(mesh, callback) {
        var that = this

        mesh.onBeforeRender = function (renderer) {

            var depth = that.getDepth()
            let opt = renderer.debug.stencil
            opt.state(true)
            var gl = renderer.context;
            // config the stencil buffer to collect data for testing
            let func = opt.func[1]
            gl.stencilFunc(func[0], depth + func[1], func[2]);
            gl.stencilOp(... opt.op[1]);

            if (callback)
                callback.bind(this)(...arguments)
        }

        mesh.onAfterRender = function (renderer) {

            //   let opt = renderer.debug.stencil
            //   opt.state(false)
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


        //for now update the collapsed hull if the sub-cluster is not expanded
        if (this.mExpanded == false) {

            this.getSphereHull();
            return;
        }


        let info = {box: new __WEBPACK_IMPORTED_MODULE_7_three__["Box3"](), vertices: []};

        //generate the boundingBox for the node particles if the clster is a leaf
        if (this.isLeaf()) {


            if (!this.mLeaf.mNodeParticles) return //FIXME stops thrown errors after 3d -2d -3d

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


            //it  can happen initially
            if (info.box.min.x == Infinity) info.box = new __WEBPACK_IMPORTED_MODULE_7_three__["Box3"](new __WEBPACK_IMPORTED_MODULE_7_three__["Vector3"](-1, -1, -1), new __WEBPACK_IMPORTED_MODULE_7_three__["Vector3"](1, 1, 1))

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

                this.mHull.name = "HullElement"

                // this.mHull.renderOrder = -1

                // mOptions.onHullCreated(this.mHull)
                this.mExpandedGroup.add(this.mHull);

            }
            else throw new Error("option hull must have superclass BaseVolume");

        //--------------
        let vertices = info.vertices;
        this.mHull.createFromBoundingBox(vertices, boundingBox);

        mOptions.onHullCreated(this.mHull)

        //--------------
        //copy the geometry for the doeEvents to work
        if (!this.mHull && this.mHull.geometry) {

            this.geometry = this.mHull.geometry;

        }
        else {

            //have some default geometry for the domEvents //TODO find out why it fails without this part
            let boundingSphere = boundingBox.getBoundingSphere();
            //TODO this is currently used for the mouse interactions but should be refactored and removed
            var sphereGeometry = new __WEBPACK_IMPORTED_MODULE_7_three__["SphereGeometry"](boundingSphere.radius, 10, 5);
            sphereGeometry.boundingBox = boundingBox;
            this.geometry = sphereGeometry;
        }


        this.setHullColorFromOptions(this.mHull)

        var that = this
        this.addHullStencilBeforeRender(this.mHull.mesh)

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

    getParentCluster() {
        let expContainer = this.parent;
        if (expContainer) return expContainer.parent


    }


    createParticlePointCloud(entry) {
        // console.log("reached leaf cluster", this)
        var that = this;

        let domEvents = this.getDOMEvents()

        let leaf = new __WEBPACK_IMPORTED_MODULE_0__ClusterLeafElement__["a" /* default */](this.mNodes, domEvents);
        this.mLeaf = leaf;
        this.mExpandedGroup.add(leaf);

        var updateLeafsEdges = __WEBPACK_IMPORTED_MODULE_8_lodash__["throttle"](function (cluster) {

            //TODO the timeout fixes the problem that the edges aren't on spot but this should be reviewed and fixed without it


            let leafs = cluster.getLeafs();
            __WEBPACK_IMPORTED_MODULE_8_lodash__["each"](leafs, function (leaf) {
                leaf.updateEdges();
                that.adjustHullSize();
            });

        }, 50);


        leaf.setDistributionHandler(entry.distribution, function () {

            //create/update the hull element after the animation has finished
            that.adjustHullSize();


            if (that.isLeaf())
                that.updateIfIsLeaf()


        }, function () {

            updateLeafsEdges(that)

        })

    }


    updateIfIsLeaf() {
        if (!this.mLeaf) return;

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

        if (this.mChildClustersEdges) return this.mChildClustersEdges;

        return this.mChildClustersEdges = __WEBPACK_IMPORTED_MODULE_2__EdgeUtil__["a" /* default */].createEdgesBetweenClustersFromMap(this.mClusters);

    }

    /**
     *
     *
     * @params defaultRadius if the radius is not yet determined the default value is used instead
     * @returns the radius of the cluster
     */
    getRadius(defaultRadius = 100) {

        //TODO maybe use mCollapsedClusterHull  if collapsed?

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
    findClusters(selector = "*") {
        var clusters = [];

        this.traverse(function (item) {

            if (!(item instanceof BaseCluster3D)) return

            if (selector == "*") {

                clusters.push(item)
                return
            }

            if (item.name.indexOf(selector) > -1)
                clusters.push(item)


        });

        if (selector == "*")
            clusters.shift(); //remove first element as it is "this"

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

            //the actual parent cluster has one group element where the sub-cluster resides
            if (r instanceof __WEBPACK_IMPORTED_MODULE_7_three__["Group"] && r.parent instanceof BaseCluster3D) r = r.parent;

            if (!(r instanceof BaseCluster3D)) return parents;
            _root = r;

            parents.unshift(_root)

        }

        return parents;

    }

    //TODO performance wise this is too redundant
    getDepth() {
        return this.getParents().length
    }


}
/* harmony export (immutable) */ __webpack_exports__["a"] = BaseCluster3D;


/***/ }),
/* 9 */,
/* 10 */,
/* 11 */,
/* 12 */,
/* 13 */,
/* 14 */,
/* 15 */,
/* 16 */,
/* 17 */,
/* 18 */,
/* 19 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = MaterialFadeMixin;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__AnimationMixin__ = __webpack_require__(73);
/**
 extends any given THREE.Material
 with a fadeTo method,
 and overrides opacity attribute

 */




function MaterialFadeMixin(material) {
    if (!material instanceof THREE.Material) throw new Error("must be THREE.Material")


    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__AnimationMixin__["a" /* default */])(material)

    material.fade = 1;
    material._opacity = material.opacity;

    Reflect.defineProperty(material, "opacity", {
        enumerable: false,
        configurable: false,
        get: function () {
            return this._opacity * this.fade
        },
        set: function (newOpacity) {

            this._opacity = newOpacity;


            if (this instanceof THREE.ShaderMaterial)
                if (this.uniforms.opacity)
                    this.uniforms.opacity.value = newOpacity

        }

    });


    material.fadeTo = function (fade, mDuration, onComplete) {

        if (fade == material.fade) mDuration = 0; //TODO

        return material.animate({fade: fade}, mDuration, onComplete)
    }


    return material

}





/***/ }),
/* 20 */,
/* 21 */,
/* 22 */,
/* 23 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["c"] = computeCompanyNodeColor;
/* harmony export (immutable) */ __webpack_exports__["b"] = computeGroupNodeColorHelper;
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return GUI; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_jquery__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_jquery__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_jquery_ui_themes_base_core_css__ = __webpack_require__(57);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_jquery_ui_themes_base_core_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_jquery_ui_themes_base_core_css__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_jquery_ui_ui_core__ = __webpack_require__(52);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_jquery_ui_ui_core___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_jquery_ui_ui_core__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_jquery_ui_ui_widgets_slider__ = __webpack_require__(284);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_jquery_ui_ui_widgets_slider___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3_jquery_ui_ui_widgets_slider__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_jquery_ui_ui_widgets_draggable__ = __webpack_require__(280);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_jquery_ui_ui_widgets_draggable___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4_jquery_ui_ui_widgets_draggable__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_jquery_ui_ui_widgets_resizable__ = __webpack_require__(283);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_jquery_ui_ui_widgets_resizable___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_5_jquery_ui_ui_widgets_resizable__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__gui_company_details_CompanyDetails__ = __webpack_require__(144);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__AppDataService__ = __webpack_require__(60);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8_lodash__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8_lodash___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_8_lodash__);


//import 'jquery-ui/themes/base/theme.css';
//import 'jquery-ui/themes/base/selectable.css';












function formatNumber(num) {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
}

var curr = 0
var currentGradientColors = [0x218D20, 0x439229, 0x8CCB84, 0x14B0BF, 0x9DC9CA, 0xCAB81A, 0xBBC42D, 0xC8A6BF, 0xCF73B4, 0x816365, 0x7D5C53, 0xAE5E29, 0xB62729]

function getNextGradient() {


    var availGradients = [

        [0x218D20, 0x439229, 0x8CCB84, 0x14B0BF, 0x9DC9CA, 0xCAB81A, 0xBBC42D, 0xC8A6BF, 0xCF73B4, 0x816365, 0x7D5C53, 0xAE5E29, 0xB62729],
        [0x111111, 0x111111, 0x111111, 0x111111, 0x111111, 0x111111, 0x111111, 0x111111, 0x111111, 0xff0000, 0x00ff00, 0x0000ff, 0xffffff],
        [0xffffff, 0x0000ff, 0x111111, 0x111111, 0x111111, 0x111111, 0x111111, 0x111111, 0x111111, 0x111111, 0x111111, 0x111111, 0x111111]
    ]

    var next = ++curr % availGradients.length
    return currentGradientColors = availGradients[next]

}

function computeCompanyNodeColor(val = 0, attr = "sent") {


    var sentRanges = [[92, Number.MAX_SAFE_INTEGER], [85, 92], [78, 85], [71, 78], [64, 71], [57, 64], [50, 57], [43, 50], [36, 43], [29, 36], [22, 29], [15, 22], [Number.MIN_SAFE_INTEGER, 22]]
    var priceRangesInPct = [[18, Number.MAX_SAFE_INTEGER], [18, 15], [12, 15], [9, 12], [6, 9], [3, 6], [0, 3], [-3, 0], [-6, -3], [-9, -6], [-12, -9], [-18, -15], [Number.MIN_SAFE_INTEGER, -18]]

    var arr

    if (attr == "sent") arr = sentRanges
    if (attr == "priceRanges") arr = priceRangesInPct;

    var i;
    for (i = 0; i < arr.length; i++) {
        var range = arr[i];

        if (range[0] < val && val < range[1])
            return currentGradientColors[i]

        if (range[1] < val && val < range[0])
            return currentGradientColors[i]
    }

    return 0xffffff
}

function computeGroupNodeColorHelper(distinctGroupIDS) {
    var colors = []

    for (let i in distinctGroupIDS) {
        colors.push(__WEBPACK_IMPORTED_MODULE_8_lodash__["random"](0, 255) * __WEBPACK_IMPORTED_MODULE_8_lodash__["random"](0, 255) * __WEBPACK_IMPORTED_MODULE_8_lodash__["random"](0, 255))

    }


    return {
        getColor: function (groupID) {

            var i = distinctGroupIDS.indexOf(groupID)
            return colors[i] || 0xFFFFFF
        }

    }

}


function changeGradientBar(colorArray) {
    var gradientString = colorArray.map((c) => "#" + c.toString(16).padStart(6, "0")).join(",")

    var tpl = `.companyGradient {
		  background: lightgrey;
		  
		  background: -webkit-linear-gradient(left,${gradientString});
		 
		  background: -o-linear-gradient(left,${gradientString});
		  
		  background: -moz-linear-gradient(left,${gradientString});
		 
		  background: linear-gradient(to right,${gradientString}); 
		}
`
    __WEBPACK_IMPORTED_MODULE_0_jquery___default()("<style>").text(tpl).appendTo("head")


}


__WEBPACK_IMPORTED_MODULE_0_jquery___default()(function () {

    var selectTemplate = `
	<select class="cloudNodeColorSelect">
	<option value="sent">sentiment</option>
	<option value="priceRanges">price ranges</option>
	<option value="group">group</option>
	</select> 
	`
    var $sel = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(selectTemplate)

    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(".companyGradient").on("click", function () {

        var array = getNextGradient()
        changeGradientBar(array)
        $sel.trigger("change")
    })


    $sel.on("change", function (e, ui) {
        var val = $sel.val()

        __WEBPACK_IMPORTED_MODULE_0_jquery___default()(window).trigger("node-color-change", val)

        /*
                var helper=computeGroupNodeColorHelper(globalEnv.nodeClouds.groupIdList)


                if (val=="group")
                    globalNodes.forEach(function(v){ v.color=helper.getColor(v.group)});
                else
                    globalNodes.forEach(function(v){ v.color=computeCompanyNodeColor(parseInt(v.sent),val)   } )

                globalEnv.nodeClouds.update()

                globalEnv.particles.updateColors()

        */


    }).appendTo(getBody())

})


function getBody() {
    return __WEBPACK_IMPORTED_MODULE_0_jquery___default()("sample-cluster-application graph-hud")

}


var GUI = {
    createAccordion(items) {
        function createSection(caption, content, id) {
            var sectionTpl = `<h3 class="accordion-header ui-accordion-header ui-helper-reset ui-state-default ui-accordion-icons ui-corner-all" > ${caption}</h3>
		<div id="${id}" class="ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom">
			
		</div>`
            var section = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(sectionTpl)


            section.find(".ui-accordion-content").addBack('.ui-accordion-content').append(content)

            return section
        }

        var acc = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('<div class=" ui-accordion ui-widget ui-helper-reset my-accordion">')
        for (let item of items) {
            item = __WEBPACK_IMPORTED_MODULE_8_lodash__["extend"]({caption: "missing 'caption'", content: "missing 'content'"}, item)
            var sec = createSection(item.caption, item.content, item.id)
            acc.append(sec)
        }

        //acc.accordion({ header: "h3", active: false, collapsible: true })
        return acc
    },
    createSlider: function () {


        var slider = __WEBPACK_IMPORTED_MODULE_0_jquery___default()("<div>").slider({
            min: 10, max: 1000,
            slide: function (event, ui) {


                doZoomByVal(ui.value)

            }

        }).addClass("zoom-slider")
            .css({
                width: 200,
                "margin-left": "2em",
                "margin-top": "0.5em",
            })

        slider.appendTo(getBody())


    },
    createSample() {

        let a = GUI.createAccordion([{
            caption: "<span style=\"color:reg(255,255,255);font-family: 'roboto';font-size:16px;\">Top Sectors </span><img src=\"include/images/Triangle.png\" style=\"width:10px;\">",
            id: "companyIndustry",
            content: "Technology, 33%<br>Consumer Discretionary, 20%<br>Consumer Staples, 20%"
        }, {
            caption: "<span style=\"color:reg(255,255,255);font-family: 'roboto';font-size:16px;\">Top Countries</span> <img src=\"include/images/Triangle.png\" style=\"width:10px;\">",
            id: "companyCountry",
            content: "United States, 80%<br>Japan, 10%<br>Germany, 4%"
        }])
        a.css({top: 80, left: 10, position: "absolute", zIndex: 999, width: 200}).appendTo(getBody())
        GUI.$el = a


        GUI.createSlider()
        GUI.info = GUI.createNodeInfoPanel()


    },
    createNodeInfoPanel() {

        GUI.$info = __WEBPACK_IMPORTED_MODULE_0_jquery___default()("<div>")


        GUI.$info.hide().appendTo(getBody())

        GUI.$info.addClass("graph-node-info").draggable().resizable()

        var $header = __WEBPACK_IMPORTED_MODULE_0_jquery___default()("<div>").addClass("graph-node-info-header")


        var $search = __WEBPACK_IMPORTED_MODULE_0_jquery___default()("<span>").addClass("graph-node-info-search").html("Yahoo Search")
        var $price = __WEBPACK_IMPORTED_MODULE_0_jquery___default()("<span>").addClass("graph-node-info-price").html("USD 36.5 (-0.5%)")
        var $close = __WEBPACK_IMPORTED_MODULE_0_jquery___default()("<span style=\"margin-left:420px;cursor:pointer;\">").addClass("graph-node-info-close").html("<i class=\"fa fa-times\" aria-hidden=\"true\" style=\"font-family:'FontAwesome' !important;\"></i> CLOSE")

        var stockPrice = "<span style=\"margin-left:20px;margin-top:7px;\">USD <span style=\"color:#f7685e;font-family:'roboto-bold'  !important;\">36.5</span> (-0.5%)</span>";
        // var headBar = "<span style=\"margin-left:400px;margin-top:7px;\" ></span>";


        $close.on("click", function () {
            GUI.$info.fadeOut(50)

        })

        $header.append($search, stockPrice, $close)


        var $body = __WEBPACK_IMPORTED_MODULE_0_jquery___default()("<div>").addClass("graph-node-info-body")


        $body.html("")

        $body.append("<company-details></company-details>")


        var $news = __WEBPACK_IMPORTED_MODULE_0_jquery___default()("<div>").addClass("graph-node-info-news")

        //$news.html("RSS or Twitter or News")

        var $newsHeader = __WEBPACK_IMPORTED_MODULE_0_jquery___default()("<div>").addClass("graph-node-info-news-header").html("News")
        var $newsBody = __WEBPACK_IMPORTED_MODULE_0_jquery___default()("<div>").addClass("graph-node-info-news-body")
        $news.append($newsHeader, $newsBody)

        GUI.$info.append($header, $body, $news)


        return {
            setNode: function (node) {

                ////////////////////////////////////////////////////////
                console.warn("TODO implement node data from database")

                let link = "<a target='_blank' href='https://www.iqbanker.com/charts/" + node.id + "/supply_chain'>iq maps</a>"
                __WEBPACK_IMPORTED_MODULE_0_jquery___default()("company-details").get(0).setStuff({name: node.name, link})

                return;


                var news = ["U.S., China agree to first trade steps under 100-day plan",
                    "Wall Street falls, department stores take a drubbing",
                    "Behind Kushner Companies, a Chinese agency skirts visa-for-investment rules",
                    "In blow to Trump, GE backs NAFTA and plans growth in Mexico"]

                let lorem = "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet."


                //header


                $search.html(__WEBPACK_IMPORTED_MODULE_0_jquery___default()("<a style=\"text-decoration:none;\">").html("<div style=\"float:left;\">Go to Company Page </div><div  style=\"float:right;padding-left:5px;padding-top:1px;\"> >></div>").attr({
                    target: "_blank",
                    href: "#",
                    title: "Open new Tab for " + node.name
                }))


                //price

                var companyLookupName = node.name
                if (node.ticker)
                    companyLookupName = node.ticker.split(":")[1]

                __WEBPACK_IMPORTED_MODULE_7__AppDataService__["a" /* AppDataService */].getCompanyInfo(companyLookupName).then(function (data) {

                    /*if (!data.LastTradePriceOnly)
                    {
                        console.error("'"+node.name+"' not found",data)
                        $price.html("-/-")
                        return
                    }*/

                    var str = `${data.Currency} ${data.LastTradePriceOnly} (${data.ChangeinPercent})`
                    $price.html(str)

                })


                //body
                $body.html("")
                __WEBPACK_IMPORTED_MODULE_7__AppDataService__["a" /* AppDataService */].getWiki(node.name).then(function (data) {

                    if (data.content == "Redirect to:") {
                        $body.html("<h2>" + node.name + "</h2><br>").append("TODO handle redirects for wikipedia")
                        /*
                        AppDataService.getWiki(data.page).then(function(data){
                            $body.html("<h2>"+node.name+"</h2><br>").append(data.content)

                        })*/
                    }
                    else
                        $body.html("<h2>" + node.name + "</h2><br>").append(data.content)

                }).catch(function (e) {


                    if (e.code == "missingtitle")
                        $body.html("Wiki info not found for: " + node.name)
                    else
                        $body.html(e.code)

                })


                $newsBody.html("")


                function getNews() {
                    var n = news[__WEBPACK_IMPORTED_MODULE_8_lodash__["random"](0, 3)]
                    var el = __WEBPACK_IMPORTED_MODULE_0_jquery___default()("<p>").append(n)
                    $newsBody.append(el)
                }

                getNews()

                getNews()
                getNews()

            }
        }

    },
    updateNodeInfo(node, bShow = true) {


        GUI.$info.toggle(bShow)
        if (bShow)
            GUI.info.setNode(node)


    },

    updateFromVisibleNodes(nodes) {

        if (!GUI.$el) return


        GUI.$el.parent().find(".graph-info-companys-visible").html(formatNumber(nodes.length.toLocaleString('en-US')))


        var industries = {}
        var countries = {}
        nodes.forEach(function (n) {

            if (!n.industry) return

            if (!n.group) return

            if (!industries[n.industry]) industries[n.industry] = 0
            industries[n.industry]++

            if (!countries[n.group]) countries[n.group] = 0
            countries[n.group]++

        })


        var sortedIndustries = __WEBPACK_IMPORTED_MODULE_8_lodash__["sortBy"](__WEBPACK_IMPORTED_MODULE_8_lodash__["toPairs"](industries), 1).reverse()
        var sortedCountries = __WEBPACK_IMPORTED_MODULE_8_lodash__["sortBy"](__WEBPACK_IMPORTED_MODULE_8_lodash__["toPairs"](countries), 1).reverse()

        var totalCountries = __WEBPACK_IMPORTED_MODULE_8_lodash__["sum"](sortedCountries.map((v) => v[1]))
        var totalIndustries = __WEBPACK_IMPORTED_MODULE_8_lodash__["sum"](sortedIndustries.map((v) => v[1]))

        var $industry = GUI.$el.find("#companyIndustry")
        var $country = GUI.$el.find("#companyCountry")


        function pct(val, total) {
            return ", " + __WEBPACK_IMPORTED_MODULE_8_lodash__["round"](100 * val / total, 1) + "%"

        }

        $industry.html("")
        for (var industry of sortedIndustries.slice(0, 3)) {
            var resHTML = "<table style=\"width:100%;padding:0px;margin:0px;\"><tr><td style=\"padding:0px;margin:0px;text-align:center;width:25px;\" ><img src=\"img/industryIcons/" + industry[0] + ".png\" style=\"width:22px;height:22px;\"></td><td style=\"width:80%;padding:0px;margin:0px;text-align:left; font-family: 'roboto';color:rgb(208, 206, 206);font-size:14px;\">" + industry[0].trim() + "" + pct(industry[1], totalIndustries) + "</td></tr></table>";
            var $row = __WEBPACK_IMPORTED_MODULE_0_jquery___default()("<div>").addClass("industry-info-row").append(resHTML)
            $industry.append($row)
        }


        $country.html("")
        for (var country of sortedCountries.slice(0, 3)) {
            var $row = __WEBPACK_IMPORTED_MODULE_0_jquery___default()("<div>").append("<span style=\" font-family: 'roboto';color:rgb(208, 206, 206);font-size:14px;\">" + country[0] + "" + pct(country[1], totalCountries) + "</span>")
            $country.append($row)

        }
        //TODO percentage


    }


}


__WEBPACK_IMPORTED_MODULE_0_jquery___default()(function () {

    GUI.createSample()

    __WEBPACK_IMPORTED_MODULE_0_jquery___default()(".rightCompanyInfo").draggable()


})
	

/***/ }),
/* 24 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__BaseDistribution__ = __webpack_require__(65);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__BaseCluster3D__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__utils_RoundRobin__ = __webpack_require__(140);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_three__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_lodash__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_lodash___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4_lodash__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_d3_force_3d__ = __webpack_require__(205);
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


        this.initialEngineTicks = 0;

        // NOTE: using values lower than 3000ms and 90 frames to stop the force graph will sometimes show the nodes in a line instead
        this.maxConvergeTime = 9000//2000;//ms ... 5 seconds upper bound for loading phase
        this.maxConvergeFrames = 700//90//frames  ... for slower machines the time will be reached earlier for faster it will hit th frame limit earlier

    }

    queue() {
        if (!this.constructor._queue) this.constructor._queue = new __WEBPACK_IMPORTED_MODULE_2__utils_RoundRobin__["a" /* default */]()
        return this.constructor._queue

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


        var that = this;


        // Add force-directed layout
        let layout = __WEBPACK_IMPORTED_MODULE_5_d3_force_3d__["a" /* forceSimulation */]();


        var scale = this.mScale;

        //TODO containers need links
        layout
            .numDimensions(this.dimensions)
            .nodes(nodes)
            .force('link', __WEBPACK_IMPORTED_MODULE_5_d3_force_3d__["b" /* forceLink */]().id(function (d) {
                    return d._id
                })
                    .distance(function computeLinkDistance() {
                        return scale / 5;

                    })
                    .links(edges)
            )
            .force('charge', (node) => -scale / 5)
            .force('linkStrength', (link) => 1)
            // .force("collide", d3_force.forceCollide(scale/10).iterations(1))
            .stop();


        //enable collision only for clusters not for leafs to improve performance
        if (nodes.length > 0 && nodes[0]._el && nodes[0]._el instanceof __WEBPACK_IMPORTED_MODULE_1__BaseCluster3D__["a" /* default */])
            layout.force("collide", __WEBPACK_IMPORTED_MODULE_5_d3_force_3d__["c" /* forceCollide */](scale / 2)

                /*
                //TODO this isn't doing much for us currently
                 //-improve node size value by updating it when hull is generated to
                 //
                .radius(function (node) {

                    //NOTE: can't use radius here because it is not already generated
                    //   let backupVal=1//that.dimensions*scale/nodes.length;
                    //   let rad=backupVal//node._el?node._el.getRadius()*10: backupVal;
                    return scale/nodes.length  //  node.size * 10 || 1//rad
                })
                */
                .iterations(2))


        for (let i = 0; i < this.initialEngineTicks; i++) {
            layout.tick();
        } // Initial ticks before starting to render

        let cntTicks = 0;
        const startTickTime = new Date();
        var alphaAbort = 0.2

        this.queue().add(function onQueue() {

            if (cntTicks++ > that.maxConvergeFrames || (new Date()) - startTickTime > that.maxConvergeTime || layout.alpha() < alphaAbort) {
                layout.alpha(0); //trigger end
                layout.stop(); // Stop ticking graph
            }

            layout.tick();
            onTick(layout, nodes, edges)
            if (layout.alpha() == 0) {
                that.queue().remove(onQueue)
                if (onComplete) onComplete()
            }
        })


        layout// .on('start', start)
        /*  .on("tick", function () {

              if (cntTicks++ > that.maxConvergeFrames || (new Date()) - startTickTime > that.maxConvergeTime ) {
                  layout.alpha(0); //trigger end
                  layout.stop(); // Stop ticking graph
              }

              onTick(layout, nodes, edges)

          })*/
            .on('end', function () {

                if (onComplete) onComplete()

            })
        //.restart();


    }


    //TODO nodes + setNodes should provide an instanceof BaseCluster3D as default or an array of node primitives
    //in both cases we can determine the edges from it

    setNodes(nodes, onNodePositionChange, onStep, onComplete) {


        if (!nodes instanceof __WEBPACK_IMPORTED_MODULE_1__BaseCluster3D__["a" /* default */] && !__WEBPACK_IMPORTED_MODULE_4_lodash__["isArray"](nodes)) throw new Error("not supported, must be array of nodes or BaseClester3D");


        let mEdges = [];
        let mNodes = [];
        //in case nodes are instance of BaseNode3D
        if (nodes instanceof __WEBPACK_IMPORTED_MODULE_1__BaseCluster3D__["a" /* default */]) {


            //TODO this part might not to be used at all currently
            mEdges = nodes.createEdgesForChildClusters();


            mEdges.forEach(function (edge) {
                edge.source = edge.source.position;
                edge.target = edge.target.position;

            });

            mNodes = Object.values(nodes.mClusters).map(function (n) {
                //add a back reference to the cluster
                n.position._el = n;

                return n.position;
            });


        }
        else if (__WEBPACK_IMPORTED_MODULE_4_lodash__["isArray"](nodes)) {
            mNodes = nodes.map(function (n) {
                //mEdges   = EdgeUtil.getEdgesForNodes(nodes, true, false);
                mEdges = mEdges.concat(n.edges);
                n.x = n.x || 0;
                n.y = n.y || 0;
                n.z = n.z || 0;
                return n;
            });
        }

        var that = this
        __WEBPACK_IMPORTED_MODULE_4_lodash__["each"](mNodes, function (n) {
            //reset y,z dimension of dist to to animate node onto the plane it should be
            if (that.dimensions < 3) n.z = 0;
            if (that.dimensions < 2) n.y = 0;

        })

        this.startSimulation(mNodes, mEdges, function layoutTick(layout, d3Nodes, d3Links) {

            //handle each node callback
            __WEBPACK_IMPORTED_MODULE_4_lodash__["each"](d3Nodes, onNodePositionChange);
            //handle step callback
            if (onStep)
                onStep(layout.alpha())

        }, onComplete);


    }

    //this is called to distribute the elements
    //TODO add rotation as well in the future

    distribute(node, dx, dy, dz) {

        return {position: new __WEBPACK_IMPORTED_MODULE_3_three__["Vector3"](0, 0, 0)}

        //  return {position:new THREE.Vector3(dx,dy,dz).multiplyScalar(this.mScale)};

    }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = ForceGraphDistribution;




/***/ }),
/* 25 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_three__ = __webpack_require__(1);
/**
 * Created by Frank on 22.06.2017.
 */

/**
 * the default implementation for a hull/volume around a cluster/sub-cluster
 *
 *
 */




class BaseVolume extends __WEBPACK_IMPORTED_MODULE_0_three__["Object3D"] {

    constructor(...args) {
        super(...args);
        this.lod = 1;
        this.maxOpacity = 0.0
    }


    /**
     * lod is  value between 0 and 1 that can be used to render elements level-of-detail specific
     * eg. depending on the distance of camera and object
     *
     * @param newLOD
     */
    setLOD(newLOD) {


        if (newLOD < 0) newLOD = 0;
        if (newLOD > 1) newLOD = 1;


        this.lod = newLOD


    }


    getMaterial() {
        if (this.mMaterial) return this.mMaterial;

        this.mMaterial = new __WEBPACK_IMPORTED_MODULE_0_three__["LineBasicMaterial"]({
            color: 0xffffff,
            linewidth: 5,
            opacity: this.maxOpacity,
            transparent: false
        });

        this.mMaterial.visible = this.canBeVisible();

        return this.mMaterial

    }


    /**
     * determines if the volume is can be made visible to the user
     *
     * @returns {boolean}
     */

    canBeVisible() {
        return false
    }


//FIXME have a better approach to generate the hull
//? rather: create from vertices
    createFromBoundingBox(vertices, boundingBox) {

        this.mBoundingBox = boundingBox;


        let _center = boundingBox.getCenter();
        let _size = boundingBox.getSize();

        let box = new __WEBPACK_IMPORTED_MODULE_0_three__["BoxGeometry"](_size.x, _size.y, _size.z);

        let geo = new __WEBPACK_IMPORTED_MODULE_0_three__["EdgesGeometry"](box); // or WireframeGeometry( geometry )

        let mat = this.getMaterial();

        let wireframe = new __WEBPACK_IMPORTED_MODULE_0_three__["LineSegments"](geo, mat);
        wireframe.position.add(_center);
        wireframe.geometry.boundingBox = boundingBox;


        if (this.mesh) this.remove(this.mesh);
        this.mesh = wireframe;
        this.add(wireframe);


        return this.mesh


    }


    setActive() {

        this.maxOpacity = 1

    }


    setInactive() {

        this.maxOpacity = 0.3

    }


    dispose() {
        this.mesh.geometry.dispose()
        this.mesh.material.dispose()

        if (this.parent)
            this.parent.remove(this)

    }


}
/* harmony export (immutable) */ __webpack_exports__["a"] = BaseVolume;




/***/ }),
/* 26 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = removeSelections;
/* harmony export (immutable) */ __webpack_exports__["c"] = highlightNodeElements;
/* harmony export (immutable) */ __webpack_exports__["d"] = unhighlightNodeElements;
/* harmony export (immutable) */ __webpack_exports__["e"] = doOnClickNode;
/* harmony export (immutable) */ __webpack_exports__["b"] = extendGraphElements;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__f5_arrows__ = __webpack_require__(136);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__utils_ZoomUtil__ = __webpack_require__(35);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__SpecificDataUtils__ = __webpack_require__(23);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_lodash__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_lodash___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3_lodash__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_jquery__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4_jquery__);
/**
 * Created by Frank on 16.07.2017.
 */

/**
 NOTE: set initialEngineTicks to a appropriate value to speed up bigger graphs


 FIXME put arrows nodemixin and linkmixin into separate classes, curent implementations work but are in no way useable for other developers


 TODO scale arrow depending on  group link size
 TODO expanding nodes will result in still showing group tooltips
 probably remove group nodes from raycaster or something like that

 TODO ?when using hull feature? sometimes nodes cannot be clicked .. probably due to hull back or front preventing events from triggering on nodes
 TODO search filter for hidden nodes.. expand before zoom

 */









//current selected node
var previousNodeClicked = [];
var previousNodeDblClicked;

//------------------------------------------------
//Feature 1

var previousNodes;


/**
 * removes/cleans up all selections from previous selected elements
 *
 */
function removeSelections() {

    function undoStuff(node) {

        unhighlightNodeElements.apply(node);

    }


    __WEBPACK_IMPORTED_MODULE_3_lodash__["each"](previousNodeClicked, undoStuff)
    __WEBPACK_IMPORTED_MODULE_3_lodash__["each"](previousNodes, undoStuff)


}

function highlightNodeElements(bShowOtherNodes = false, bShowEdgeArrows = true) {


    //TODO
    /*if (previousNodes&& previousNodes!=this)
     {
     unhighlightNodeElements.apply(previousNodes)
     previousNodes=this

     }*/

    this.showHighlight();


    if (bShowOtherNodes) {
        for (let childNode of this.children)
            childNode.showHighlight()

        for (let parentNode of this.parents)
            parentNode.showHighlight()
    }

    if (bShowEdgeArrows)
        for (let edge of this.edges) {
            var color = edge.source == this ? 0x99ff99 : 0xffb2b2;


            __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__f5_arrows__["a" /* addArrow */])(edge, color)
        }
}

function unhighlightNodeElements() {

    this.hideHighlight();

    for (let childNode of this.children)
        childNode.hideHighlight()

    for (let parentNode of this.parents)
        parentNode.hideHighlight()

    //console.log("unhighlighting edges:" + (this.edges.length))

    //  for (let edge of this.edges)
    //     edge.hideHighlight()

    for (let edge of this.edges)
        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__f5_arrows__["b" /* removeArrow */])(edge)

}


function extendElement(elements, attrName, options, env) {

    var mDomEvents = env.domEvents;

    function _TODO(typeName) {
        return function () {
            console.warn("implement handler for", typeName);
            console.log(this, arguments)
        }
    }

    var defaults = {
        mousemove: _TODO("mousemove"),
        mouseleave: _TODO("mouseleave"),
        click: _TODO("click"),
        dblclick: _TODO("dblclick")
    };
    options = __WEBPACK_IMPORTED_MODULE_4_jquery__["extend"](true, {}, defaults, options);


    for (let el of elements) {


        var mesh = el[attrName];


        mDomEvents.addEventListener(mesh, 'click', options.click, false);
        mDomEvents.addEventListener(mesh, 'dblclick', options.dblclick, false);

        mDomEvents.addEventListener(mesh, 'mouseover', function (e) {
            options.mousemove.apply(e.target.node || e.target.edge)
        }, false);
        mDomEvents.addEventListener(mesh, 'mouseout', function (e) {
            options.mouseleave.apply(e.target.node || e.target.edge)
        }, false);


        el.showHighlight = function () {
            el.show()

            if (this.isHighlighted) return;
            this.isHighlighted = true;

            if (attrName == "_bubble" && this["_bubble"] == null) console.error("FIXME ");

            if (this._bubble) {
                this.addClass("node-highlighted")

            }


            if (this.text) {
                this.text.addClass("node-caption-highlighted")
            }


        };


        el.hideHighlight = function () {

            el.hide()
            if (!this.isHighlighted) return;
            this.isHighlighted = false;

            if (this._bubble) {
                this.removeClass("node-highlighted")

            }


            if (this.text) {
                this.text.removeClass("node-caption-highlighted")
            }


        }

    }

}

//TODO
function doZoomToMesh(mesh, onEnd, minMaxDistance = 400) {


    let view = __WEBPACK_IMPORTED_MODULE_4_jquery__(".view-3d[hasFocus]")[0];

    if (!view) view = __WEBPACK_IMPORTED_MODULE_4_jquery__(".view-3d.view-3d-maximised").get(0);

    if (!view) console.warn("no view focused to be able to zoom");


    let camera = view.mCamera;
    let controls = view.mControls;

    __WEBPACK_IMPORTED_MODULE_1__utils_ZoomUtil__["a" /* default */].moveToMesh(mesh, camera, controls, minMaxDistance, onEnd)


}


//helper to being able to handle click events
//isSelected == false will prevent the actual node selection and only will trigger the zoom+highlight parts
function doOnClickNode(currNodeClicked, stack = false, onAnimationEnd, isSelected = true, doHighlighNeighbours = true, doHighlighEdges = true, doZoomIn = true) {

    if (previousNodeClicked.indexOf(currNodeClicked) < 0)
    //if (previousNodeClicked!=currNodeClicked)
    {
        //node selected
        highlightNodeElements.apply(currNodeClicked, [doHighlighNeighbours, doHighlighEdges]);

        currNodeClicked.show()//make sure


        if (doZoomIn)
            doZoomToMesh(currNodeClicked._bubble, onAnimationEnd);


        if (isSelected) {

            currNodeClicked.addClass("basic-selection");


            //if (previousNodeClicked)
            if (!stack)
                if (previousNodeClicked.length > 0)
                    for (let p of previousNodeClicked) {
                        p.removeClass("basic-selection");
                        unhighlightNodeElements.apply(p)
                    }

            if (!stack)
                previousNodeClicked = [currNodeClicked];
            else
                previousNodeClicked.push(currNodeClicked)

        }


    }
    else {
        //GUI.updateNodeInfo(currNodeClicked,false)
        //node unselected
        unhighlightNodeElements.apply(currNodeClicked);

        //previousNodeClicked=[]
        previousNodeClicked.splice(currNodeClicked);

        currNodeClicked.removeClass("basic-selection")

    }

}

/*

 as long as node is current selection => mouse enter return mouse leave return

 if clicked and not current selection trigger mouse leave on last


        mixin additional functionality
 */

function extendGraphElements(d3Nodes, d3Links, env) {

    addGraphHierarchy(d3Nodes, d3Links);


    extendElement(d3Nodes, "_bubble", {
        mousemove: function (e) {

            if (previousNodeClicked.indexOf(this) >= 0) return;

            highlightNodeElements.apply(this, [true, false])


        },
        mouseleave: function () {

            if (previousNodeClicked.indexOf(this) >= 0) return;
            unhighlightNodeElements.apply(this)

        },
        click: function (e) {
            var currNodeClicked = e.target.node;
            e.stopPropagation();

            if (previousNodeClicked.length > 0 && previousNodeClicked.indexOf(currNodeClicked) < 0)
                for (let p of previousNodeClicked)
                    unhighlightNodeElements.apply(p)

            doOnClickNode(currNodeClicked, e.origDomEvent.ctrlKey);

            return false;
        },
        dblclick: function (e) {
            e.stopPropagation();
            //setCollapsedSateOfChildNodesAndEdgesOfNode(e.target.node)
            var currNodeDblClicked = e.target.node;

            __WEBPACK_IMPORTED_MODULE_2__SpecificDataUtils__["a" /* GUI */].updateNodeInfo(currNodeDblClicked, currNodeDblClicked != previousNodeDblClicked);

            if (previousNodeDblClicked == currNodeDblClicked)
                previousNodeDblClicked = null;
            else
                previousNodeDblClicked = currNodeDblClicked;
            //unhighlightNodeElements.apply(e.target.node)
            return false;
        }
    }, env);


}

/**
 * build a helper structure for parent child relation
 *
 * this is primarily used for highlighting the src and dst nodes
 *
 */

function addGraphHierarchy(d3Nodes, d3Links) {

    /*
     node:
     group:1
     id:"2"
     shape:"sphere" | "cube"
     _bubble: instanceof THREE.Mesh //SphereGeometry
     _id:"2"

     link:
     source:"1"
     target:"3"
     */

    //prepare nodes
    for (let node of d3Nodes) {

        if (!node.edges)
            node.edges = [];
        if (!node.children)
            node.children = [];
        if (!node.parents)
            node.parents = [];

        node._bubble.node = node

    }

    for (let item of d3Links) {

        // item._line.edge = item;

        //add edge list to nodes
        if (item.source.edges.indexOf(item) < 0)
            item.source.edges.push(item);
        if (item.target.edges.indexOf(item) < 0)
            item.target.edges.push(item);


        //add target of current link to children list of source
        if (item.source.children.indexOf(item.target) < 0)
            item.source.children.push(item.target);

        //add source of current link to parent list of target
        if (item.target.parents.indexOf(item.source) < 0)
            item.target.parents.push(item.source);


    }

}


/***/ }),
/* 27 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process) {var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/**
 * Tween.js - Licensed under the MIT license
 * https://github.com/tweenjs/tween.js
 * ----------------------------------------------
 *
 * See https://github.com/tweenjs/tween.js/graphs/contributors for the full list of contributors.
 * Thank you all, you're awesome!
 */

var TWEEN = TWEEN || (function () {

	var _tweens = {};
	var _tweensAddedDuringUpdate = {};
	var _nextId = 0;

	return {

		getAll: function () {

			return Object.keys(_tweens).map(function (tweenId) {
				return _tweens[tweenId];
			});

		},

		removeAll: function () {

			_tweens = {};

		},

		add: function (tween) {

			_tweens[tween.getId()] = tween;
			_tweensAddedDuringUpdate[tween.getId()] = tween;

		},

		remove: function (tween) {

			delete _tweens[tween.getId()];
			delete _tweensAddedDuringUpdate[tween.getId()];

		},

		update: function (time, preserve) {

			var tweenIds = Object.keys(_tweens);

			if (tweenIds.length === 0) {
				return false;
			}

			time = time !== undefined ? time : TWEEN.now();

			// Tweens are updated in "batches". If you add a new tween during an update, then the
			// new tween will be updated in the next batch.
			// If you remove a tween during an update, it will normally still be updated. However,
			// if the removed tween was added during the current batch, then it will not be updated.
			while (tweenIds.length > 0) {
				_tweensAddedDuringUpdate = {};

				for (var i = 0; i < tweenIds.length; i++) {
					if (_tweens[tweenIds[i]].update(time) === false && !preserve) {
						delete _tweens[tweenIds[i]];
					}
				}

				tweenIds = Object.keys(_tweensAddedDuringUpdate);
			}

			return true;

		},

		nextId: function () {
			return _nextId++;
		}
	};

})();


// Include a performance.now polyfill.
// In node.js, use process.hrtime.
if (typeof (window) === 'undefined' && typeof (process) !== 'undefined') {
	TWEEN.now = function () {
		var time = process.hrtime();

		// Convert [seconds, nanoseconds] to milliseconds.
		return time[0] * 1000 + time[1] / 1000000;
	};
}
// In a browser, use window.performance.now if it is available.
else if (typeof (window) !== 'undefined' &&
         window.performance !== undefined &&
		 window.performance.now !== undefined) {
	// This must be bound, because directly assigning this function
	// leads to an invocation exception in Chrome.
	TWEEN.now = window.performance.now.bind(window.performance);
}
// Use Date.now if it is available.
else if (Date.now !== undefined) {
	TWEEN.now = Date.now;
}
// Otherwise, use 'new Date().getTime()'.
else {
	TWEEN.now = function () {
		return new Date().getTime();
	};
}


function assign(target, source) {
	var keys = Object.keys(source);
	var length = keys.length;

	for (var i = 0; i < length; i += 1) {
		target[keys[i]] = source[keys[i]];
	}

	return target;
}


TWEEN.Tween = function (object) {

	this._object = object;
	this._valuesStart = {};
	this._valuesEnd = {};
	this._valuesStartRepeat = {};
	this._duration = 1000;
	this._repeat = 0;
	this._repeatDelayTime = undefined;
	this._yoyo = false;
	this._isPlaying = false;
	this._reversed = false;
	this._delayTime = 0;
	this._startTime = null;
	this._easingFunction = TWEEN.Easing.Linear.None;
	this._interpolationFunction = TWEEN.Interpolation.Linear;
	this._chainedTweens = [];
	this._onStartCallback = null;
	this._onStartCallbackFired = false;
	this._onUpdateCallback = null;
	this._onCompleteCallback = null;
	this._onStopCallback = null;
	this._id = TWEEN.nextId();

};

TWEEN.Tween.prototype = assign(Object.create(Object.prototype), {
	getId: function getId() {
		return this._id;
	},

	to: function to(properties, duration) {

		this._valuesEnd = properties;

		if (duration !== undefined) {
			this._duration = duration;
		}

		return this;

	},

	start: function start(time) {

		TWEEN.add(this);

		this._isPlaying = true;

		this._onStartCallbackFired = false;

		this._startTime = time !== undefined ? time : TWEEN.now();
		this._startTime += this._delayTime;

		for (var property in this._valuesEnd) {

			// Check if an Array was provided as property value
			if (this._valuesEnd[property] instanceof Array) {

				if (this._valuesEnd[property].length === 0) {
					continue;
				}

				// Create a local copy of the Array with the start value at the front
				this._valuesEnd[property] = [this._object[property]].concat(this._valuesEnd[property]);

			}

			// If `to()` specifies a property that doesn't exist in the source object,
			// we should not set that property in the object
			if (this._object[property] === undefined) {
				continue;
			}

			// Save the starting value.
			this._valuesStart[property] = this._object[property];

			if ((this._valuesStart[property] instanceof Array) === false) {
				this._valuesStart[property] *= 1.0; // Ensures we're using numbers, not strings
			}

			this._valuesStartRepeat[property] = this._valuesStart[property] || 0;

		}

		return this;

	},

	stop: function stop() {

		if (!this._isPlaying) {
			return this;
		}

		TWEEN.remove(this);
		this._isPlaying = false;

		if (this._onStopCallback !== null) {
			this._onStopCallback.call(this._object, this._object);
		}

		this.stopChainedTweens();
		return this;

	},

	end: function end() {

		this.update(this._startTime + this._duration);
		return this;

	},

	stopChainedTweens: function stopChainedTweens() {

		for (var i = 0, numChainedTweens = this._chainedTweens.length; i < numChainedTweens; i++) {
			this._chainedTweens[i].stop();
		}

	},

	delay: function delay(amount) {

		this._delayTime = amount;
		return this;

	},

	repeat: function repeat(times) {

		this._repeat = times;
		return this;

	},

	repeatDelay: function repeatDelay(amount) {

		this._repeatDelayTime = amount;
		return this;

	},

	yoyo: function yoyo(yoyo) {

		this._yoyo = yoyo;
		return this;

	},

	easing: function easing(easing) {

		this._easingFunction = easing;
		return this;

	},

	interpolation: function interpolation(interpolation) {

		this._interpolationFunction = interpolation;
		return this;

	},

	chain: function chain() {

		this._chainedTweens = arguments;
		return this;

	},

	onStart: function onStart(callback) {

		this._onStartCallback = callback;
		return this;

	},

	onUpdate: function onUpdate(callback) {

		this._onUpdateCallback = callback;
		return this;

	},

	onComplete: function onComplete(callback) {

		this._onCompleteCallback = callback;
		return this;

	},

	onStop: function onStop(callback) {

		this._onStopCallback = callback;
		return this;

	},

	update: function update(time) {

		var property;
		var elapsed;
		var value;

		if (time < this._startTime) {
			return true;
		}

		if (this._onStartCallbackFired === false) {

			if (this._onStartCallback !== null) {
				this._onStartCallback.call(this._object, this._object);
			}

			this._onStartCallbackFired = true;
		}

		elapsed = (time - this._startTime) / this._duration;
		elapsed = elapsed > 1 ? 1 : elapsed;

		value = this._easingFunction(elapsed);

		for (property in this._valuesEnd) {

			// Don't update properties that do not exist in the source object
			if (this._valuesStart[property] === undefined) {
				continue;
			}

			var start = this._valuesStart[property] || 0;
			var end = this._valuesEnd[property];

			if (end instanceof Array) {

				this._object[property] = this._interpolationFunction(end, value);

			} else {

				// Parses relative end values with start as base (e.g.: +10, -3)
				if (typeof (end) === 'string') {

					if (end.charAt(0) === '+' || end.charAt(0) === '-') {
						end = start + parseFloat(end);
					} else {
						end = parseFloat(end);
					}
				}

				// Protect against non numeric properties.
				if (typeof (end) === 'number') {
					this._object[property] = start + (end - start) * value;
				}

			}

		}

		if (this._onUpdateCallback !== null) {
			this._onUpdateCallback.call(this._object, value);
		}

		if (elapsed === 1) {

			if (this._repeat > 0) {

				if (isFinite(this._repeat)) {
					this._repeat--;
				}

				// Reassign starting values, restart by making startTime = now
				for (property in this._valuesStartRepeat) {

					if (typeof (this._valuesEnd[property]) === 'string') {
						this._valuesStartRepeat[property] = this._valuesStartRepeat[property] + parseFloat(this._valuesEnd[property]);
					}

					if (this._yoyo) {
						var tmp = this._valuesStartRepeat[property];

						this._valuesStartRepeat[property] = this._valuesEnd[property];
						this._valuesEnd[property] = tmp;
					}

					this._valuesStart[property] = this._valuesStartRepeat[property];

				}

				if (this._yoyo) {
					this._reversed = !this._reversed;
				}

				if (this._repeatDelayTime !== undefined) {
					this._startTime = time + this._repeatDelayTime;
				} else {
					this._startTime = time + this._delayTime;
				}

				return true;

			} else {

				if (this._onCompleteCallback !== null) {

					this._onCompleteCallback.call(this._object, this._object);
				}

				for (var i = 0, numChainedTweens = this._chainedTweens.length; i < numChainedTweens; i++) {
					// Make the chained tweens start exactly at the time they should,
					// even if the `update()` method was called way past the duration of the tween
					this._chainedTweens[i].start(this._startTime + this._duration);
				}

				return false;

			}

		}

		return true;

	}
});


TWEEN.Easing = {

	Linear: {

		None: function (k) {

			return k;

		}

	},

	Quadratic: {

		In: function (k) {

			return k * k;

		},

		Out: function (k) {

			return k * (2 - k);

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return 0.5 * k * k;
			}

			return - 0.5 * (--k * (k - 2) - 1);

		}

	},

	Cubic: {

		In: function (k) {

			return k * k * k;

		},

		Out: function (k) {

			return --k * k * k + 1;

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return 0.5 * k * k * k;
			}

			return 0.5 * ((k -= 2) * k * k + 2);

		}

	},

	Quartic: {

		In: function (k) {

			return k * k * k * k;

		},

		Out: function (k) {

			return 1 - (--k * k * k * k);

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return 0.5 * k * k * k * k;
			}

			return - 0.5 * ((k -= 2) * k * k * k - 2);

		}

	},

	Quintic: {

		In: function (k) {

			return k * k * k * k * k;

		},

		Out: function (k) {

			return --k * k * k * k * k + 1;

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return 0.5 * k * k * k * k * k;
			}

			return 0.5 * ((k -= 2) * k * k * k * k + 2);

		}

	},

	Sinusoidal: {

		In: function (k) {

			return 1 - Math.cos(k * Math.PI / 2);

		},

		Out: function (k) {

			return Math.sin(k * Math.PI / 2);

		},

		InOut: function (k) {

			return 0.5 * (1 - Math.cos(Math.PI * k));

		}

	},

	Exponential: {

		In: function (k) {

			return k === 0 ? 0 : Math.pow(1024, k - 1);

		},

		Out: function (k) {

			return k === 1 ? 1 : 1 - Math.pow(2, - 10 * k);

		},

		InOut: function (k) {

			if (k === 0) {
				return 0;
			}

			if (k === 1) {
				return 1;
			}

			if ((k *= 2) < 1) {
				return 0.5 * Math.pow(1024, k - 1);
			}

			return 0.5 * (- Math.pow(2, - 10 * (k - 1)) + 2);

		}

	},

	Circular: {

		In: function (k) {

			return 1 - Math.sqrt(1 - k * k);

		},

		Out: function (k) {

			return Math.sqrt(1 - (--k * k));

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return - 0.5 * (Math.sqrt(1 - k * k) - 1);
			}

			return 0.5 * (Math.sqrt(1 - (k -= 2) * k) + 1);

		}

	},

	Elastic: {

		In: function (k) {

			if (k === 0) {
				return 0;
			}

			if (k === 1) {
				return 1;
			}

			return -Math.pow(2, 10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI);

		},

		Out: function (k) {

			if (k === 0) {
				return 0;
			}

			if (k === 1) {
				return 1;
			}

			return Math.pow(2, -10 * k) * Math.sin((k - 0.1) * 5 * Math.PI) + 1;

		},

		InOut: function (k) {

			if (k === 0) {
				return 0;
			}

			if (k === 1) {
				return 1;
			}

			k *= 2;

			if (k < 1) {
				return -0.5 * Math.pow(2, 10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI);
			}

			return 0.5 * Math.pow(2, -10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI) + 1;

		}

	},

	Back: {

		In: function (k) {

			var s = 1.70158;

			return k * k * ((s + 1) * k - s);

		},

		Out: function (k) {

			var s = 1.70158;

			return --k * k * ((s + 1) * k + s) + 1;

		},

		InOut: function (k) {

			var s = 1.70158 * 1.525;

			if ((k *= 2) < 1) {
				return 0.5 * (k * k * ((s + 1) * k - s));
			}

			return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);

		}

	},

	Bounce: {

		In: function (k) {

			return 1 - TWEEN.Easing.Bounce.Out(1 - k);

		},

		Out: function (k) {

			if (k < (1 / 2.75)) {
				return 7.5625 * k * k;
			} else if (k < (2 / 2.75)) {
				return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75;
			} else if (k < (2.5 / 2.75)) {
				return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375;
			} else {
				return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375;
			}

		},

		InOut: function (k) {

			if (k < 0.5) {
				return TWEEN.Easing.Bounce.In(k * 2) * 0.5;
			}

			return TWEEN.Easing.Bounce.Out(k * 2 - 1) * 0.5 + 0.5;

		}

	}

};

TWEEN.Interpolation = {

	Linear: function (v, k) {

		var m = v.length - 1;
		var f = m * k;
		var i = Math.floor(f);
		var fn = TWEEN.Interpolation.Utils.Linear;

		if (k < 0) {
			return fn(v[0], v[1], f);
		}

		if (k > 1) {
			return fn(v[m], v[m - 1], m - f);
		}

		return fn(v[i], v[i + 1 > m ? m : i + 1], f - i);

	},

	Bezier: function (v, k) {

		var b = 0;
		var n = v.length - 1;
		var pw = Math.pow;
		var bn = TWEEN.Interpolation.Utils.Bernstein;

		for (var i = 0; i <= n; i++) {
			b += pw(1 - k, n - i) * pw(k, i) * v[i] * bn(n, i);
		}

		return b;

	},

	CatmullRom: function (v, k) {

		var m = v.length - 1;
		var f = m * k;
		var i = Math.floor(f);
		var fn = TWEEN.Interpolation.Utils.CatmullRom;

		if (v[0] === v[m]) {

			if (k < 0) {
				i = Math.floor(f = m * (1 + k));
			}

			return fn(v[(i - 1 + m) % m], v[i], v[(i + 1) % m], v[(i + 2) % m], f - i);

		} else {

			if (k < 0) {
				return v[0] - (fn(v[0], v[0], v[1], v[1], -f) - v[0]);
			}

			if (k > 1) {
				return v[m] - (fn(v[m], v[m], v[m - 1], v[m - 1], f - m) - v[m]);
			}

			return fn(v[i ? i - 1 : 0], v[i], v[m < i + 1 ? m : i + 1], v[m < i + 2 ? m : i + 2], f - i);

		}

	},

	Utils: {

		Linear: function (p0, p1, t) {

			return (p1 - p0) * t + p0;

		},

		Bernstein: function (n, i) {

			var fc = TWEEN.Interpolation.Utils.Factorial;

			return fc(n) / fc(i) / fc(n - i);

		},

		Factorial: (function () {

			var a = [1];

			return function (n) {

				var s = 1;

				if (a[n]) {
					return a[n];
				}

				for (var i = n; i > 1; i--) {
					s *= i;
				}

				a[n] = s;
				return s;

			};

		})(),

		CatmullRom: function (p0, p1, p2, p3, t) {

			var v0 = (p2 - p0) * 0.5;
			var v1 = (p3 - p1) * 0.5;
			var t2 = t * t;
			var t3 = t * t2;

			return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (- 3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1;

		}

	}

};

// UMD (Universal Module Definition)
(function (root) {

	if (true) {

		// AMD
		!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function () {
			return TWEEN;
		}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

	} else if (typeof module !== 'undefined' && typeof exports === 'object') {

		// Node.js
		module.exports = TWEEN;

	} else if (root !== undefined) {

		// Global variable
		root.TWEEN = TWEEN;

	}

})(this);

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(11)))

/***/ }),
/* 28 */,
/* 29 */,
/* 30 */,
/* 31 */,
/* 32 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__view_GraphView3D__ = __webpack_require__(33);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__BaseCluster3D__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__utils_IndustrialSectorIcon__ = __webpack_require__(139);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__hull_ConvexVolume__ = __webpack_require__(130);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__hull_BaseVolume__ = __webpack_require__(25);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__distributions_ForceGraphDistribution__ = __webpack_require__(24);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__utils_ZoomUtil__ = __webpack_require__(35);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__refactor_f1__ = __webpack_require__(26);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8_three__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9_jquery__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_9_jquery__);














class Default3DGraphConfig {


    constructor(target, backgroundColor = 0x000000, cssClass = "darker") {

        this.setView(target)


        this.mBackgroundColor = backgroundColor
        this.mCssClass = cssClass

    }

    setView(target) {

        this.mView = target
        return this

    }

    setControls() {

        //TODO instead of setting true and false we should create new controls by cloning the current with default options
        let view = this.getView();


        view.mControls.target.set(new __WEBPACK_IMPORTED_MODULE_8_three__["Vector3"](0, 0, 0));
        view.mControls.noRotate = false;

        view.mControls.reset();

    }


    /**
     * this is a sample configuration for  the cluster.
     * it contains 2 subdivisions:  -first into countries
     *                              -followed by industry
     *
     */

    getSpeccs() {


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


        let countryDistribution = new __WEBPACK_IMPORTED_MODULE_5__distributions_ForceGraphDistribution__["a" /* default */](40000, 3); // countries get placed equally on a plane of size 15k X 15k
        let industryDistribution = new __WEBPACK_IMPORTED_MODULE_5__distributions_ForceGraphDistribution__["a" /* default */](15000, 3);// industries within countries use the Force-Graph approach to position elements
        let nodesWithinIndustryDistribution = new __WEBPACK_IMPORTED_MODULE_5__distributions_ForceGraphDistribution__["a" /* default */](8000, 3);//same goes for the nodes within each industry

        //the final configuration for rendering
        //it contains an additional options attribute per array entry

        // @param options.minClusterSize ... is the lower bound for the nodes within the cluster
        // if the cluster has fewer elements all clusters previously generated are places within this "other" cluster
        // @param options. defaultMergeGroupName the name of the "other" cluster can be changed by this value
        // @param options.hull can be used to add a volume around the cluster
        //by default if no value gets set, the BaseVolume class is used which is invisible by default
        //but is necessary for other components like picking and tet rendering


        // let rootHull = this.isDebug() ? BoxVolume : BaseVolume;

        //TODO these options are a little bit confusing atm.. the mCS option refers to the dist of the sub-clusters
        // while the hull option is used by the cluster itself

        return [

            {
                generator: countrySetGenerator,
                distribution: countryDistribution,
                options: {minClusterSize: 40, hull: __WEBPACK_IMPORTED_MODULE_4__hull_BaseVolume__["a" /* default */]}// rootHull}
            },
            {
                generator: industrySetGenerator,
                distribution: industryDistribution,
                events: {
                    click: function () {
                        // this.toggleCollapse()
                    },
                    mouseover: function () {
                        this.mHull.visible = true
                        // this.bClusterEdgesVisible= true

                    },
                    mouseout: function () {
                        this.mHull.visible = false
                        //  this.bClusterEdgesVisible= false
                    }
                },
                options: {
                    minClusterSize: 15
                    // ,hull:BoxVolume
                    , hull: __WEBPACK_IMPORTED_MODULE_3__hull_ConvexVolume__["a" /* default */],
                    onHullCreated: function (volume) {
                        volume.visible = false
                    }

                }// new BoxVolume() ConvexVolume//FIXME  this option is used twice for leaf and parent  and below is ignored
            }
            , {
                distribution: nodesWithinIndustryDistribution,
                options: {
                    hull: __WEBPACK_IMPORTED_MODULE_3__hull_ConvexVolume__["a" /* default */],

                    text: function () {
                        //return IndustrialSectorIcon(this.name)
                        return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils_IndustrialSectorIcon__["a" /* IndustrialSectorAbbreviation */])(this.name)
                    }
                },
                events: {
                    click: function () {
                        console.log("idle")
                    }
                },
            }

        ]

    }


    //-----------------------------------------


    setDomElements() {
        __WEBPACK_IMPORTED_MODULE_9_jquery__(".my-accordion,.searchbar-container input, mode-select span,company-info,.graph-node-info,#sig_menu").removeClass(this.mCssClass)
        //  $("cluster-text-overlay").removeClass(    this.mCssClass)

    }


    getView() {

        if (!(this.mView instanceof __WEBPACK_IMPORTED_MODULE_0__view_GraphView3D__["a" /* default */])) throw new Error("view mst be set previously and must be instanceof Graph3DView")

        return this.mView

    }


    restartGraph() {
        let speccs = this.getSpeccs();
        let view = this.getView();
        let rootCluster = view.mRootCluster;

        rootCluster.cleanUpLeafs();
        //clean up previous clusters
        __WEBPACK_IMPORTED_MODULE_1__BaseCluster3D__["a" /* default */].cleanUpClusters(rootCluster.findClusters("*"), rootCluster);

        rootCluster.applyClustering(speccs);
        view.addCompanyCountListenersToCluster(rootCluster);

        //TODO text is shown to early on update
        __WEBPACK_IMPORTED_MODULE_9_jquery__(view).trigger("graph-changed");

    }


    setMode(onComplete = function () {
    }) {

        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_7__refactor_f1__["a" /* removeSelections */])()


        let speccs = this.getSpeccs();
        let view = this.getView();
        let rootCluster = view.mRootCluster;


        if (!rootCluster || rootCluster.isLocked()) {
            console.warn("can't setGraph3D wait until animation has finished");
            //  return
        }

        rootCluster.setLock(true);


        // view.mScene.background.copy(new THREE.Color(0x000000));
        view.mRenderer.setClearColor(this.mBackgroundColor)


        this.setDomElements()
        this.restartGraph()
        this.setControls()

        //view.mSkyDome.visible=true;


        var that = this
        rootCluster.on("hull-updated", function () {

            //FIXME called too often
            //  that.doZoomToRelevant(rootCluster)

            rootCluster.setLock(false)
            onComplete()

            //    rootCluster.findClusters("*").forEach(function(c){
            //       c.bClusterEdgesVisible=false
            //   })


        })


    }


    doZoomToRelevant(rootCluster) {

        setTimeout(function () {

            //TODO zoom to usa
            /* if (rootCluster.mClusters["United States"])
                 rootCluster.mClusters["United States"].zoomToCluster()
             else*/


            this.zoomToPosition(new __WEBPACK_IMPORTED_MODULE_8_three__["Vector3"](0, 0, 150000), () => {
                //TODO moake it work without line below...  currently needs another zoom call to be able to use controls again
                this.getView().mRootCluster.zoomToCluster(150000)

            });


        }.bind(this), 3000)


        //   this.getView().mRootCluster.zoomToCluster()


    }


    zoomToPosition(position, onComplete) {


        let view = this.getView();

        __WEBPACK_IMPORTED_MODULE_6__utils_ZoomUtil__["a" /* default */].moveToPosition(position, view.mCamera, view.mControls, 0, onComplete)
    }


}
/* harmony export (immutable) */ __webpack_exports__["a"] = Default3DGraphConfig;


/***/ }),
/* 33 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__View3D__ = __webpack_require__(153);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__cluster_RootCluster__ = __webpack_require__(126);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__cluster_GraphData__ = __webpack_require__(125);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__cluster_utils_DefaultColorScheme__ = __webpack_require__(69);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__gui_GraphHUD__ = __webpack_require__(143);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__cluster_refactor_SpecificDataUtils__ = __webpack_require__(23);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6_jquery__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_6_jquery__);
/**
 * Created by Frank on 13.06.2017.
 */















//import skyDomeImage from "./coordinates.png"

//import Hexasphere from "hexasphere.js"


class GraphView3D extends __WEBPACK_IMPORTED_MODULE_0__View3D__["a" /* default */] {

    constructor(...args) {
        super(...args);

        this.mRootCluster = null;


        //debug code
        //options to be used in onBeforeRender for hull and edges

        var gl = this.mRenderer.context;

        window.test = {gl: gl, renderer: this.mRenderer}

        if (this.mRenderer.debug) throw new Error("already exists")


        //gl=test.gl;st=test.renderer.debug.stencil;st.state(true);st.func=[[gl.ALWAYS, 1, 0xFF], [gl.GEQUAL, 1, 0xFF]];st.op=[[gl.REPLACE, gl.REPLACE, gl.REPLACE], [gl.KEEP, gl.KEEP, gl.KEEP]];

        this.mRenderer.debug = {
            stencil: {
                func: [[gl.ALWAYS, 1, 0xFF], [gl.GEQUAL, 1, 0xff]],
                op: [[gl.REPLACE, gl.REPLACE, gl.REPLACE], [gl.KEEP, gl.KEEP, gl.KEEP]],
                state: (b) => this.setStencil(b)
            }
        }


    }

    static get observedAttributes() {
        return ['text-visible'];
    }

    connectedCallback() {
        super.connectedCallback();

    }

    // Respond to attribute changes.
    attributeChangedCallback(attr, oldValue, newValue) {
        console.warn("attr changed", arguments)
        if (attr == 'text-visible') {


            let visible;
            if (newValue == "true") visible = true;
            else if (newValue == "false") visible = false;
            else
                visible = Boolean(newValue)

            if (this.mRootCluster && this.mRootCluster.mTextOverlay)
                this.mRootCluster.mTextOverlay.get(0).enabled = visible;

        }
    }


    setSpeccs(speccs) {
        this.mSpeccs = speccs;
        return this
    }

    getSpeccs() {

        return this.mSpeccs
    }


    createSkyDome() {


        var material = new THREE.MeshBasicMaterial();


        let scene = this.mScene;

        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.5);
        scene.add(ambientLight);
        /* var dirLight = new THREE.DirectionalLight(0xffffff, 1);
         dirLight.position.set(0, 10000, 0);
         dirLight.intensity = 1;
         scene.add(dirLight);
     */
        /* var pointLight = new THREE.PointLight( 0xffffff, 100, 1000000000 );
         pointLight.position.set( 0, 0, 20000 );
         scene.add(pointLight);
     */
        /*  var geometry = new THREE.SphereGeometry(300000, 60, 40);
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
        meshMaterials.push(new THREE.MeshPhongMaterial({color: 0x7cfc00, transparent: true}));
        meshMaterials.push(new THREE.MeshPhongMaterial({color: 0x397d02, transparent: true}));
        meshMaterials.push(new THREE.MeshPhongMaterial({color: 0x77ee00, transparent: true}));
        meshMaterials.push(new THREE.MeshPhongMaterial({color: 0x61b329, transparent: true}));
        meshMaterials.push(new THREE.MeshPhongMaterial({color: 0x83f52c, transparent: true}));
        meshMaterials.push(new THREE.MeshPhongMaterial({color: 0x83f52c, transparent: true}));
        meshMaterials.push(new THREE.MeshPhongMaterial({color: 0x4cbb17, transparent: true}));
        meshMaterials.push(new THREE.MeshPhongMaterial({color: 0x00ee00, transparent: true}));
        meshMaterials.push(new THREE.MeshPhongMaterial({color: 0x00aa11, transparent: true}));

        var oceanMaterial = []
        oceanMaterial.push(new THREE.MeshPhongMaterial({color: 0x0f2342, transparent: true}));
        oceanMaterial.push(new THREE.MeshPhongMaterial({color: 0x0f1e38, transparent: true}));


        var radius = 300000;        // Radius used to calculate position of tiles
        var subDivisions = 3;   // Divide each edge of the icosohedron into this many segments
        var tileSize = 0.9;    // Add padding (1.0 = no padding; 0.1 = mostly padding)


        function isLand() {

            return _.random(0, 1)

        }

        var hexaGroup = new THREE.Group();

        var hexasphere = new Hexasphere(radius, subDivisions, tileSize);
        for (var i = 0; i < hexasphere.tiles.length; i++) {
            var t = hexasphere.tiles[i];
            var latLon = t.getLatLon(hexasphere.radius);

            var geometry = new THREE.Geometry();

            for (var j = 0; j < t.boundary.length; j++) {
                var bp = t.boundary[j];
                geometry.vertices.push(new THREE.Vector3(bp.x, bp.y, bp.z));
            }
            geometry.faces.push(new THREE.Face3(0, 1, 2));
            geometry.faces.push(new THREE.Face3(0, 2, 3));
            geometry.faces.push(new THREE.Face3(0, 3, 4));
            if (geometry.vertices.length > 5) {
                geometry.faces.push(new THREE.Face3(0, 4, 5));
            }

            if (isLand(latLon.lat, latLon.lon)) {
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
        this.mSkyDome = hexaGroup


    }


    addCompanyCountListenersToCluster(rootCluster) {


        var visibleNodes = [];
        var _____skipFrames = 0;


        function attachListeners(cluster) {


            _.each(cluster.findClusters("*"), function (cluster) {
                cluster.on('before-render', function () {

                    if (_____skipFrames % 20 != 0) return;

                    if (cluster.mExpanded == false) {
                        visibleNodes.push(cluster);
                    }


                    if (cluster.isLeaf()) {
                        visibleNodes.push(cluster);
                    }


                })

                cluster.on('initial-expand', function () {

                    attachListeners(this)


                })


            });
        }


        attachListeners(rootCluster);


        var that = this;


        //$(that).off();

        // if (!$(that).hasClass("before-render-inited"))
        __WEBPACK_IMPORTED_MODULE_6_jquery__(that).// .addClass("before-render-inited").
        on("before-render", onBeforeRender);


        function onBeforeRender() {


            if (that.isMaximised()) {

                //update company info only every 20 frames to increse overall performance
                if (_____skipFrames++ % 20 == 0) {
                    let vl = _.flatten(visibleNodes.map(leaf => leaf.mNodes))

                    if (vl.length != 0) //FIXME this should prevent the flickering but it does not solve the underlying problem that the handlers are bound incorrect
                        __WEBPACK_IMPORTED_MODULE_5__cluster_refactor_SpecificDataUtils__["a" /* GUI */].updateFromVisibleNodes(vl);
                    visibleNodes = []
                }
            }


        }


    }


    initClusterForView(rawGraphData, parentEl3D) {


        if (!rawGraphData) return;

        let speccs = this.getSpeccs();

        let graphData = new __WEBPACK_IMPORTED_MODULE_2__cluster_GraphData__["a" /* default */](rawGraphData);


        let preparedData = graphData.createClusterNodesAndEdges(this);


        var res = new __WEBPACK_IMPORTED_MODULE_1__cluster_RootCluster__["a" /* default */](preparedData.nodes, undefined, this);


        parentEl3D.add(res);
        res.position.set(0, 0, 0);

        //FIXME workflow below ..
        //IMPORTANT: must attach after clustering is applied because "tn" aka. globalTextNodes gets removed at the start of the clustering
        res.attachToView3D(this);
        res.applyClustering(speccs);


        this.start();

        return res


    }


    setData(mGraphData) {
        this.initStatic();


        //this.createSkyDome();


        if (!this.mRootCluster) {
            this.mRootCluster = this.initClusterForView(mGraphData, this.mScene);

            //debug code..
            window.test.root = this.mRootCluster

            this.addCompanyCountListenersToCluster(this.mRootCluster);


            __WEBPACK_IMPORTED_MODULE_6_jquery__(this).append("<default-color-scheme>")

        }


        __WEBPACK_IMPORTED_MODULE_6_jquery__(this).trigger("loaded")


    }

    loadDataSet(ds) {

        var that = this;

        ds(null, function onSuccess(mGraphData) {
            console.log("data loaded");
            that.setData(mGraphData);


            //TODO element does not jet exist.. create webcomponent for that
            function triggerColorChange() {
                let selectEl = __WEBPACK_IMPORTED_MODULE_6_jquery__(".cloudNodeColorSelect")

                if (selectEl.length == 0) setTimeout(triggerColorChange, 100)
                else
                    selectEl.val("group").trigger("change")
            }

            triggerColorChange();


        });

        return this
    }

    resizeCanvas() {
        super.resizeCanvas()

        var root = this.mRootCluster;

        if (root && root.mParentView && root.mTextOverlay) {

            root.mTextOverlay.height(root.mParentView.clientHeight);
            root.mTextOverlay.width(root.mParentView.clientWidth);

        }

    }

    /**
     * override default renderer call
     * this provides stencil based per cluster edge masking
     * by rendering all objects but cluster edges first
     */

    render() {


        var that = this
        //that.setStencil(true);
        that.mRenderer.autoClear = false
        that.mRenderer.autoClearStencil = false
        that.mRenderer.clear();
        that.mCamera.layers.set(0) //render the other objects which should mask the stencil buffer for lines to be hidden as they should be


        that.mRenderer.render(that.mScene, that.mCamera);

        that.mCamera.layers.set(1) //render lines in background
        // that.mRenderer.clearDepth();
        that.mRenderer.render(that.mScene, that.mCamera);

    }


}
/* harmony export (immutable) */ __webpack_exports__["a"] = GraphView3D;


customElements.define("graph-view-3d", GraphView3D);


/***/ }),
/* 34 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__BaseCluster3D__ = __webpack_require__(8);
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

                //  let linkStrength = Object.keys(edgesForCluster).length

                let linkStrength = _.sum(_.map(edgesForCluster, el => el.length))


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
/* 35 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__lib_Tween__ = __webpack_require__(27);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__lib_Tween___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__lib_Tween__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__cluster_BaseCluster3D__ = __webpack_require__(8);
/**
 * Created by Frank on 08.06.2017.
 */
//import TWEEN from "@tweenjs/tween.js"




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


    static moveToMesh(mesh, camera, controls, cameraDistanceToMesh = 400, onComplete = function () {
    }) {

        var position = new THREE.Vector3();
        position.setFromMatrixPosition(mesh.matrixWorld);


        //fixes cluster hull center if one is present
        if (mesh instanceof __WEBPACK_IMPORTED_MODULE_1__cluster_BaseCluster3D__["a" /* default */] && mesh.mHull) {
            console.log(mesh.mHull.mBoundingBox.getCenter())
            let hullCenterPos = mesh.mHull.mBoundingBox.getCenter()
            position = mesh.localToWorld(hullCenterPos)
        }


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
    static moveToPosition(position, camera, controls, cameraDistanceToMesh = 400, onComplete = function () {
    }) {


        var mTimeout;

        var cameraTargetPosition = controls.target
        var vec3Start = camera.position


        var isComplete1 = false
        var isComplete2 = false

        //  var vec3End = new THREE.Vector3();
        //  vec3End.setFromMatrixPosition(mesh.matrixWorld);
        var vec3End = position

        //we want to have a fixed distance to a node when selecting
        var distVec = vec3End.clone().sub(vec3Start)
        var len = distVec.length()
        distVec.normalize()
        distVec.multiplyScalar(cameraDistanceToMesh) //apply fixed distance to the target

        var alteredVecEnd = vec3End.clone().sub(distVec)

        //-------------------------------------
        //rotate the vector to be orientated on 0,0,1   //this will have not much impact on the 3d zoom but will prevent the 2d zoom from rotating
        //TODO find an alternative solution

        let distVec2d = new THREE.Vector3(0, 0, -1).multiplyScalar(distVec.length())
        alteredVecEnd = vec3End.clone().sub(distVec2d)

        // -------------------------------------


        //change distance to target
        var tween = new __WEBPACK_IMPORTED_MODULE_0__lib_Tween___default.a.Tween(vec3Start)
            .to(alteredVecEnd, 400)
            //.onUpdate(function () {})
            .onComplete(function () {
                onComplete.bind(this)();
                cancelAnimationFrame(mTimeout)
                isComplete1 = true
            })
            .start();

        //lookat target
        var tween2 = new __WEBPACK_IMPORTED_MODULE_0__lib_Tween___default.a.Tween(cameraTargetPosition)
            .to(vec3End, 400).onComplete(function () {
                isComplete2 = true
            })
            .start();

        requestAnimationFrame(animate);

        function animate(time) {

            if (isComplete1 && isComplete2) return;

            mTimeout = requestAnimationFrame(animate);
            tween.update(time);
            tween2.update(time);
        }


    }

}
/* harmony export (immutable) */ __webpack_exports__["a"] = ZoomUtil;


/***/ }),
/* 36 */,
/* 37 */,
/* 38 */,
/* 39 */,
/* 40 */,
/* 41 */,
/* 42 */,
/* 43 */,
/* 44 */,
/* 45 */,
/* 46 */,
/* 47 */,
/* 48 */,
/* 49 */,
/* 50 */,
/* 51 */,
/* 52 */,
/* 53 */,
/* 54 */,
/* 55 */,
/* 56 */,
/* 57 */,
/* 58 */,
/* 59 */,
/* 60 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return AppDataService; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_jquery__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_jquery__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_lodash__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_lodash___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_lodash__);
/*
* File: jquery.wikiblurb.js
* Version: 1.0.0
* Description: A simple jQuery plugin to get sections of Wikipedia and other Wikis
* Author: 9bit Studios
* Copyright 2012, 9bit Studios
* http://www.9bitstudios.com
* Free to use and abuse under the MIT license.
* http://www.opensource.org/licenses/mit-license.php
*/





(function ($) {

    $.fn.wikiblurb = function (options) {

        var defaults = $.extend({
            wikiURL: "http://en.wikipedia.org/",
            apiPath: 'w',
            section: 0,
            page: 'Jimi_Hendrix',
            removeLinks: false,
            type: 'all',
            customSelector: '',
            filterSelector: '',
            callback: function () {
            }, errorCallback: function () {
            }
        }, options);

        /******************************
         Private Variables
         *******************************/

        var object = $(this);
        var settings = $.extend(defaults, options);

        /******************************
         Public Methods
         *******************************/

        var methods = {

            init: function () {
                return this.each(function () {
                    methods.appendHTML();
                    methods.initializeItems();
                });
            },

            /******************************
             Utilities
             *******************************/

            addUnderscores: function (page) {
                if (page.trim().indexOf(' ') !== -1) {
                    page.replace(' ', '_');
                }
                return page;
            },

            /******************************
             Append HTML
             *******************************/

            appendHTML: function () {
                // nothiing to append
            },

            /******************************
             Initialize
             *******************************/

            initializeItems: function () {

                var page = methods.addUnderscores(settings.page);

                $.ajax({
                    type: "GET",
                    url: settings.wikiURL + settings.apiPath + "/api.php?action=parse&format=json&prop=text&section=" + settings.section + "&page=" + settings.page + "&callback=?",
                    contentType: "application/json; charset=utf-8",
                    async: true,
                    dataType: "json",
                    success: function (data, textStatus, jqXHR) {

                        try {
                            var markup = data.parse.text["*"];
                            var blurb = $('<div class="nbs-wikiblurb"></div>').html(markup);

                            // remove links?

                            if (settings.removeLinks) {
                                blurb.find('a').each(function () {
                                    $(this).replaceWith($(this).html());
                                });
                            }
                            else {
                                blurb.find('a').each(function () {
                                    var link = $(this);
                                    var relativePath = link.attr('href').substring(1); // remove leading slash
                                    link.attr('href', settings.wikiURL + relativePath);
                                });
                            }

                            // remove any references
                            blurb.find('sup').remove();

                            // remove cite error
                            blurb.find('.mw-ext-cite-error').remove();

                            // filter elements
                            if (settings.filterSelector) {
                                blurb.find(settings.filterSelector).remove();
                            }

                            switch (settings.type) {
                                case 'text':
                                    object.html($(blurb).find('p'));
                                    break;

                                case 'blurb':
                                    object.html($(blurb).find('p:first'));
                                    break;

                                case 'infobox':
                                    object.html($(blurb).find('.infobox'));
                                    break;

                                case 'custom':
                                    object.html($(blurb).find(settings.customSelector));
                                    break;

                                default:
                                    object.html(blurb);
                                    break;
                            }

                            settings.callback();

                        }
                        catch (e) {
                            methods.showError();
                            settings.errorCallback(e, data)
                        }

                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        methods.showError();
                        settings.errorCallback(errorThrown, jqXHR, textStatus)
                    }
                });
            },

            showError: function () {
                object.html('<div class="nbs-wikiblurb-error">There was an error locating your wiki data</div>');
            }

        };

        if (methods[options]) { // $("#element").pluginName('methodName', 'arg1', 'arg2');
            return methods[options].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof options === 'object' || !options) { 	// $("#element").pluginName({ option: 1, option:2 });
            return methods.init.apply(this);
        } else {
            $.error('Method "' + method + '" does not exist in wikiblurb plugin!');
        }
    };

})(__WEBPACK_IMPORTED_MODULE_0_jquery___default.a);
//use promise pattern only
//have all methods return a json object
//also have a simple check for keys within json =>   getCompanyInfo("Yahoo",['misc.stats','misc.info','stock.price'])

//TODO html5 cors + server side  vs jsonp vulnerabilities

//TODO throttle and stack api calls so they won't be called too often
//use qwest?
/*
var DataService=function(){
	
	registerSrc(name,options){
	
			//"wiki",{attrs:"",result:"'misc.stats,misc.info,"}
		//if ()
			return this
	}
	
	
	
}
AppDataService=new DataService("app").registerSrc("wiki",{required:"page",result:"misc.stats,misc.info",url:"http://fallout.wikia.com/"}) //templateurl?
AppDataService.getWiki({page:""})
*/
var AppDataService = {
    getWiki: function (page) {


        return new Promise(function (ok, fail) {
            if (!page) fail("no page name")

            var container = $('<span>');

            container.wikiblurb({
                wikiURL: "http://en.wikipedia.org/w/", //"http://fallout.wikia.com/",
                apiPath: '',
                section: 0,
                page: page,
                removeLinks: false,
                type: 'text',
                customSelector: '',
                callback: function () {


                    var content = container.text()

                    ok({page, content})

                }, errorCallback(e, response) {

                    //TODO error.warnings
                    if (response.error.code)
                        if (response.error.code == "missingtitle")
                            fail(response.error)


                        else {

                            fail(response.error)
                            debugger
                        }

                }
            });

        })

    },

    getCompanyInfo: function (name) {

        return new Promise(function (ok, fail) {
            if (!name) fail("no company name")
            $.ajax({
                url: "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%3D%22" + encodeURI(name) + "%22&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=quote",
                dataType: "jsonp",
                jsonp: "callback",
                jsonpCallback: "quote"
            });

            quote = function (data) {

                //$(".price").text("$" + data.query.results.quote.AskRealtime);
                ok(data.query.results.quote)

            };

        })

    }

    /*,
    getCompanyNews:function(name){


    return new Promise(function(ok,fail){
        if (!name) fail("no company name")
            $.ajax({

                        //																							 select%20*%20from%20xml%20where%20url%20%3D%20'https%3A%2F%2Fnews.ycombinator.com%2Frss'&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=mycallback
                url:"https://news.google.com/news?q="+name+"&output=rss" "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%3D%22"+name+"%22&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=quote",
                dataType: "jsonp",
                jsonp: "callback",
                jsonpCallback: "quote"
            });

            quote = function(data) {
                //$(".price").text("$" + data.query.results.quote.AskRealtime);
            ok(data.query.results.quote)

            };

      })

    }*/

}





/***/ }),
/* 61 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_jquery__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_jquery__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_jquery_ui_themes_base_core_css__ = __webpack_require__(57);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_jquery_ui_themes_base_core_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_jquery_ui_themes_base_core_css__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_jquery_ui_themes_base_autocomplete_css__ = __webpack_require__(316);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_jquery_ui_themes_base_autocomplete_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_jquery_ui_themes_base_autocomplete_css__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_jquery_ui_themes_base_menu_css__ = __webpack_require__(317);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_jquery_ui_themes_base_menu_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3_jquery_ui_themes_base_menu_css__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_jquery_ui_ui_core__ = __webpack_require__(52);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_jquery_ui_ui_core___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4_jquery_ui_ui_core__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_jquery_ui_ui_widgets_autocomplete__ = __webpack_require__(279);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_jquery_ui_ui_widgets_autocomplete___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_5_jquery_ui_ui_widgets_autocomplete__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__cluster_refactor_f1__ = __webpack_require__(26);
/**
 * the searchbar for the graph
 *
 *
 */












//import 'jquery-ui/themes/base/theme.css';


__WEBPACK_IMPORTED_MODULE_0_jquery___default()(function () {


    function getNodes() {

        let view = __WEBPACK_IMPORTED_MODULE_0_jquery___default()(".view-3d.view-3d-maximised").get(0)

        return (view && view.mRootCluster && view.mRootCluster.mNodes) ? view.mRootCluster.mNodes : []


    }


    var filterResult = [];

    var container = __WEBPACK_IMPORTED_MODULE_0_jquery___default()("<div>")
        .addClass("searchbar-container")
        .append("<span><span class='searchbar-search'><span>")
        .appendTo("sample-cluster-application graph-hud")

    var searchbar = __WEBPACK_IMPORTED_MODULE_0_jquery___default()("<input placeholder='Search company name, ticker, people, sector, country'>")

    /**
     *  the actual filter for the graph data
     */

    //TODO possible "zoom fit" results and highlight

    function doFilterList() {

        if (filterResult)
            filterResult.forEach(function (v) {
                __WEBPACK_IMPORTED_MODULE_6__cluster_refactor_f1__["d" /* unhighlightNodeElements */].apply(v)
            })

        filterResult = getNodes().filter(function (v) {
            var val = searchbar.val().toLowerCase()
            //name:r.name,group:r.country,industry:r.industry
            var isName,
                isCountry,
                isId,
                isIndustry,
                isTicker;
            if (typeof v.name == "string")
                isName = v.name.toLowerCase().indexOf(val) == 0; //only start of string

            if (typeof v.group == "string")
                isCountry = v.group.toLowerCase().indexOf(val) >= 0;

            if (typeof v.industry == "string")
                isIndustry = v.industry.toLowerCase().indexOf(val) >= 0;

            if (typeof v.ticker == "string") {
                var offset = v.ticker.indexOf(":");
                isTicker = v.ticker.toLowerCase().indexOf(val) >= 0 + offset;
            }

            if (typeof v.id == "string")
                isId = v.id.toLowerCase().indexOf(val) >= 0;

            return isName || isCountry || isId || isIndustry || isTicker
        })

        /*if (filterResult.length > 0) { //doZoomToMesh(filterResult[0]._bubble)

            doOnClickNode(filterResult[0])

        }*/


    }

    //
    /*  function moveToNode(node) {
        doOnClickNode(node, false, function () {

            setTimeout(function () {

                //defined in force-graph.js
                globalEnv.updateTextWhenCameraIsMoving()

            }, 400)

        }, false)

    }*/

    //-----------------
    //un/highlight all results
    var lastResults = []

    function showSuggestions(mResult) {


        lastResults.forEach(function (v) {
            __WEBPACK_IMPORTED_MODULE_6__cluster_refactor_f1__["d" /* unhighlightNodeElements */].apply(v)
        })


        mResult.forEach(function (v) {
            __WEBPACK_IMPORTED_MODULE_6__cluster_refactor_f1__["c" /* highlightNodeElements */].apply(v, [true, false])
        })

        lastResults = mResult


    }


    //-----------------
    var ac_instance = searchbar.autocomplete({
        minLength: 3,
        source: function (request, successCallback) {

            successCallback(filterResult.slice(0, 80))

        },
        //focus: doFilterList,
        focus: function (event, ui) {

            searchbar.val(ui.item.name)


            //last impl to give the user a feedback
            //showSuggestions([ui.item])


            //doFilterList()
            //moveToNode(ui.item)

            return false;
        },
        select: function (event, ui) {

            searchbar.val(ui.item.name)

            //moveToNode(ui.item)
            __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_6__cluster_refactor_f1__["e" /* doOnClickNode */])(ui.item, false, function () {
                //    globalEnv.updateTextWhenCameraIsMoving2()
                console.warn("TODO updateTextWhenCameraIsMoving2 ")
            }, false, false, false, true)

            //we set the selection to false but want the node to appear like it was selected
            ui.item.addClass("basic-selection")


            return false;
        }
    }).autocomplete("instance")

    searchbar.on("blur", function () {

        searchbar.val("")
        showSuggestions([])

    })


    ac_instance._renderItem = function (ul, item) {

        var tcr = ""
        if (item.ticker)
            tcr = "Ticker:" + item.ticker

        var val = searchbar.val()

        var rowOutput = `<div>  ${item.name} (${tcr})</div>`

        var
            re = new RegExp(val, "gi");

        rowOutput = _.replace(rowOutput, re, "<b>" + val + "</b>")


        ul.addClass("searchbar-autocomplete-popup")


        var $row = __WEBPACK_IMPORTED_MODULE_0_jquery___default()("<li>").addClass('searchbar-search-row')
            .append(rowOutput)
            .append(rowOutput)
            .appendTo(ul);

//FIXME have a more robust  autocomplete
        if (searchbar.hasClass("darker")) {
            let css = window.getComputedStyle(searchbar.get(0), null)

            $row.css({
                "background-color": css.getPropertyValue("background-color"),
                "color": css.getPropertyValue("color")
            })
        }


        return $row
    };

    //searchbar initially hidden
    //container.hide()


    searchbar
        .prependTo(container)
        .on("keypress", doFilterList)

    //TODO plugin won't trigger ctrl+f without disabling default behaviour in advance
    window.addEventListener("keydown", function (e) {

        //ignore ctrl+f
        if (e.keyCode === 114 || (e.ctrlKey && e.keyCode === 70)) {
            e.preventDefault();
        }
        //ignore ctrl+s
        if (e.keyCode === 114 || (e.ctrlKey && e.keyCode === 83)) {
            e.preventDefault();
        }

    })

    function toggleSearch(e) {

        container.toggle()
        searchbar.focus()
        e.stopPropagation()
        e.preventDefault()

    }

    Mousetrap.bind('ctrl+f', toggleSearch);

    Mousetrap(searchbar.get(0)).bind('ctrl+f', toggleSearch);


})


/***/ }),
/* 62 */,
/* 63 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__BaseCluster3D__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__distributions_BaseDistribution__ = __webpack_require__(65);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__distributions_ForceGraphDistribution__ = __webpack_require__(24);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__utils_ZoomUtil__ = __webpack_require__(35);
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
        /*  this.on("cluster-ready",function(){

              this.addNodeCaptions();

          });*/


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

                this.mHull.mesh.material.visible = this.mHull.canBeVisible();
                this.mHull.setActive();

            }

            let name = (this.name ? this.name : this.id);

            let parents = this.getParents();


            //hide tooltip for root cluster
            if (parents.length == 0) {
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
            if (this.mHull) {
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
            if (this.mLeaf && this.getView())
                this.mLeaf.updateDots(this.getView().mTime);


    }


    appendNodes(nodes) {

        var that = this;
        _.each(nodes, function (node) {
            if (node && node._bubble)
                that.mExpandedGroup.add(node._bubble)


        })


    }

    /**
     * add some text to the sub-clusters providing informations
     *
     * deprecated, text is handled via overlay
     *
     */

    /*
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
        */

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
/* 64 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Default3DGraphConfig__ = __webpack_require__(32);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__distributions_ForceGraphDistribution__ = __webpack_require__(24);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__hull_BaseVolume__ = __webpack_require__(25);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__edges_ClusterMeshEdges__ = __webpack_require__(129);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__hull_FlatVolume__ = __webpack_require__(68);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_three__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6_jquery__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_6_jquery__);











class Default2DGraphConfig extends __WEBPACK_IMPORTED_MODULE_0__Default3DGraphConfig__["a" /* default */] {


    constructor(target, backgroundColor = 0xFFFFFF) {

        super(target, backgroundColor)


    }


    setControls() {

        //TODO instead of setting true and false we should create new controls by cloning the current with default options
        let view = this.getView();


        view.mControls.target.set(new __WEBPACK_IMPORTED_MODULE_5_three__["Vector3"](0, 0, 0));
        view.mControls.noRotate = true;
        view.mControls.reset();


    }


    //TODO refactor to support multiple classes instead of add remove darker
    setDomElements() {
        __WEBPACK_IMPORTED_MODULE_6_jquery__(".my-accordion,.searchbar-container input, mode-select span,company-info,.graph-node-info,#sig_menu").addClass(this.mCssClass)
        //  $("cluster-text-overlay").removeClass(    this.mCssClass)

    }


    /**
     * this is a plane 2d configuration for the graph
     */

    getSpeccs() {


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


        let countryDistribution = new __WEBPACK_IMPORTED_MODULE_1__distributions_ForceGraphDistribution__["a" /* default */](60000, 2); // countries get placed equally on a plane of size 15k X 15k
        let industryDistribution = new __WEBPACK_IMPORTED_MODULE_1__distributions_ForceGraphDistribution__["a" /* default */](10000, 2);// industries within countries use the Force-Graph approach to position elements
        let nodesWithinIndustryDistribution = new __WEBPACK_IMPORTED_MODULE_1__distributions_ForceGraphDistribution__["a" /* default */](5000, 2);//same goes for the nodes within each industry

        //the final configuration for rendering
        //it contains an additional options attribute per array entry

        // @param options.minClusterSize ... is the lower bound for the nodes within the cluster
        // if the cluster has fewer elements all clusters previously generated are places within this "other" cluster
        // @param options. defaultMergeGroupName the name of the "other" cluster can be changed by this value
        // @param options.hull can be used to add a volume around the cluster
        //by default if no value gets set, the BaseVolume class is used which is invisible by default
        //but is necessary for other components like picking and tet rendering


        //   let rootHull = this.isDebug() ? BoxVolume : BaseVolume;


        return [

            {
                generator: countrySetGenerator,
                distribution: countryDistribution,
                options: {
                    minClusterSize: 40,
                    hull: __WEBPACK_IMPORTED_MODULE_2__hull_BaseVolume__["a" /* default */],// rootHull,
                    edges: __WEBPACK_IMPORTED_MODULE_3__edges_ClusterMeshEdges__["a" /* default */],
                    colors: {
                        edge: [0x000000, 0.8],
                        hull: [0x6A5ACD, 0.8] //TODO maxOpacity for convexHull is a bit bugged.. initially its set correct but due to transfer it is changed again on hover

                    }
                }
            },
            {
                generator: industrySetGenerator,
                distribution: industryDistribution,
                events: {
                    click: function () {
                        this.toggleCollapse()

                        console.log("toggled country?", this.name)
                    }
                },
                options: {
                    minClusterSize: 15,
                    hull: __WEBPACK_IMPORTED_MODULE_4__hull_FlatVolume__["a" /* default */],//ConvexVolume,
                    edges: __WEBPACK_IMPORTED_MODULE_3__edges_ClusterMeshEdges__["a" /* default */],
                    expanded: function () {
                        // return true
                        return this.name == "United States"
                    }
                }// new BoxVolume() ConvexVolume//FIXME  this option is used twice for leaf and parent  and below is ignored
            }
            , {
                distribution: nodesWithinIndustryDistribution,
                events: {
                    click: function () {
                        this.toggleCollapse()
                        console.log("toggled leaf", this.name)
                    },
                    mouseover: function () {

                        //  this.bClusterEdgesVisible= true

                    },
                    mouseout: function () {

                        //  this.bClusterEdgesVisible= false
                    }
                },
                options: {
                    hull: __WEBPACK_IMPORTED_MODULE_4__hull_FlatVolume__["a" /* default */],

                    expanded: function () {

                        let par = this.getParentCluster()
                        if (!par) return false

                        return /*par.getParentCluster().name == "United States" &&*/ this.name == "Healthcare"// false //true// return false//

                    }
                }
            }

        ]

    }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = Default2DGraphConfig;


/***/ }),
/* 65 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__BaseCluster3D__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__lib_Tween__ = __webpack_require__(27);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__lib_Tween___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__lib_Tween__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_three__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_lodash__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_lodash___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3_lodash__);
/**
 * Created by Frank on 29.05.2017.
 */

/**
 * TODO  possible different ways to distribute elements => moveTo, goTo, stack?
 *
 *
 */


//import TWEEN from "@tweenjs/tween.js"






class BaseDistribution {
    constructor(scale = 50, dimensions = 1) {

        //TODO have some kind of dynamic width function as alternative to the static scale value
        //this way it would be possible to have equal with child nodes for example
        let defaults = {scale: () => 50, dimensions: 1}


        this.mDuration = 2000 //FIXME longer duration does not render as intended

        this.dimensions = dimensions //TODO
        this.mScale = scale
        this.mEasingFunction = __WEBPACK_IMPORTED_MODULE_1__lib_Tween___default.a.Easing.Quadratic.In
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
        else if (!__WEBPACK_IMPORTED_MODULE_3_lodash__["isArray"](nodes)) throw new Error("not supported, must be array of nodes or BaseClester3D")


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

        __WEBPACK_IMPORTED_MODULE_3_lodash__["each"](nodes, function (n) {

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

            //reset y,z dimension of dist to to animate node onto the plane it should be
            //   if (that.dimensions<3) dist.position.z=0;
            //   if (that.dimensions<2) dist.position.y=0;


            let tween = new __WEBPACK_IMPORTED_MODULE_1__lib_Tween___default.a.Tween(origPos)
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


            __WEBPACK_IMPORTED_MODULE_3_lodash__["each"](tweens, function (tween) {
                tween.update(time)
                //  tween.end(time)

            })

            if (notTweenFinished)
                mTimeout = requestAnimationFrame(animate);

        }


    }

    stop() {


        __WEBPACK_IMPORTED_MODULE_3_lodash__["each"](this.mTweens, function (tween) {

            __WEBPACK_IMPORTED_MODULE_1__lib_Tween___default.a.remove(tween)

        })

    }


    //TODO this should be called to distribute the elements of the country layer when finished
    //TODO also it will be useful to add rotation as well in the future


    distribute(node, dx, dy, dz) {

        return {position: new __WEBPACK_IMPORTED_MODULE_2_three__["Vector3"](dx, dy, dz).multiplyScalar(this.mScale)};
    }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = BaseDistribution;




/***/ }),
/* 66 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__EdgeUtil__ = __webpack_require__(34);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__utils_MaterialFadeMixin__ = __webpack_require__(19);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__BaseCluster3D__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_three__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_lodash__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_lodash___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4_lodash__);








/**
 * the default implementation for the cluster-to-neighboring-clusters edges
 *
 *
 * simple/fast/no width support (line width = 1)
 *
 * usage:
 * initialize using: setClusters()
 * run the drawing process: update()
 * TODO add support to only recreate cluster edges if clusters have changed this way  supporting streaming clusters in the future
 */




class ClusterBaseEdges extends __WEBPACK_IMPORTED_MODULE_3_three__["Line"] {


    constructor(siblingClustersObj, materialOptions) {
        super();

        this.layers.set(1)


        if (siblingClustersObj)
            this.setClusters(siblingClustersObj);

        this.name = "EdgesElement";

        this.initEdgeMesh(materialOptions)


    }

    getDefaultMaterial(options) {


        let defaults = {
            opacity: 1.0,
            transparent: true,
            //lineIsVisible:true, // if disabled the line won't be shown on the scene
            color: 0x999999
        };

        options = __WEBPACK_IMPORTED_MODULE_4_lodash__["extend"](defaults, options);


        var lineMaterial = new __WEBPACK_IMPORTED_MODULE_3_three__["LineBasicMaterial"]({
            color: options.color,
            transparent: options.transparent,
            opacity: options.opacity,
            depthTest: true,
            depthWrite: false
            //depthFunc:THREE.NeverDepth
        });

        /*     var lineMaterial = new THREE.LineBasicMaterial({
                 color: 0xffffff,//options.color,
                 transparent:false,// options.transparent,
                 opacity: 1,//options.opacity,
                 depthTest: true,
                 depthWrite: true//,
                 //depthFunc:THREE.NeverDepth
             });*/

        //   FIXME lines should not interfere with it's cluster (currently are overdrawing)
        /*
          lineMaterial = this.getShaderLineMaterial();
          lineMaterial.color = new THREE.Color(options.color);
          lineMaterial.opacity = options.opacity;

          if (!window["lineMaterial"]) window["lineMaterial"] = []
          window["lineMaterial"].push(lineMaterial)

          */


        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__utils_MaterialFadeMixin__["a" /* default */])(lineMaterial);


        return lineMaterial;

    }


    getShaderLineMaterial() {


        let fragmentShader = `
        
        	uniform vec3 color;
			uniform float opacity;

			//varying vec3 vColor;

			void main() {

            //if (gl_FragCoord.z > 0.001) discard;
            if (gl_FragColor.w > 0.5) discard;


				gl_FragColor = vec4(// vColor *
                 color,opacity*gl_FragCoord.z );

			}
        
        `;


        let attributes = {

            displacement: {type: 'v3', value: []},
            customColor: {type: 'c', value: []}

        };

        let uniforms = {

            amplitude: {type: "f", value: 5.0},
            opacity: {type: "f", value: 0.3},
            color: {type: "c", value: new __WEBPACK_IMPORTED_MODULE_3_three__["Color"](0xff0000)}

        };

        var lineMaterial = new __WEBPACK_IMPORTED_MODULE_3_three__["ShaderMaterial"]({

            uniforms: uniforms,
            // attributes:     attributes,
            //  vertexShader:   vertexShader,
            fragmentShader: fragmentShader,
            blending: __WEBPACK_IMPORTED_MODULE_3_three__["AdditiveBlending"],
            depthTest: false,
            transparent: true

        });

        lineMaterial.linewidth = 1;


        lineMaterial._color = lineMaterial.color;
        Reflect.defineProperty(lineMaterial, "color", {
            enumerable: false,
            configurable: false,
            get: function () {
                return this._color
            },
            set: function (c) {

                this._color = c;
                this.uniforms.color.value = c

            }
        });


        return lineMaterial
    }

    /**
     * TODO have a mechaminsm that resets this stae in case other clsuters get streamed afterwards
     *
     *
     * @param clusters
     */
    createEdgesForClusters(clusters) {

        if (this.mChildClustersEdges) return this.mChildClustersEdges;

        return this.mChildClustersEdges = __WEBPACK_IMPORTED_MODULE_0__EdgeUtil__["a" /* default */].createEdgesBetweenClustersFromMap(clusters);

    }

    /**
     * generated and updates edges between clusters
     *
     */
    initEdgeMesh(options) {


        var line_geom = new __WEBPACK_IMPORTED_MODULE_3_three__["Geometry"]();

        var lineMaterial = this.getDefaultMaterial(options);


        // this.mChildClustersEdgesMesh = new THREE.Line(line_geom, lineMaterial, THREE.LineSegments);
        this.geometry = line_geom;
        this.material = lineMaterial;

        //TODO check if this might be helpful to put edges behind nodes

        // this.renderOrder = -2;


        this.geometry.boundingBox = new __WEBPACK_IMPORTED_MODULE_3_three__["Box3"];
        this.geometry.boundingSphere = new __WEBPACK_IMPORTED_MODULE_3_three__["Sphere"](new __WEBPACK_IMPORTED_MODULE_3_three__["Vector3"], 1);


        lineMaterial.fade = 0;
        lineMaterial.fadeTo(1, 2000)


    }

    setClusters(clusters) {
        this.mClusters = clusters

    }


    getPositionForElement(el) {
        let pos;
        if (el.mExpanded == true) {
            //expanded: we use the bounding box of the hull if it exists
            if (el.mHull)
                pos = el.mHull.mBoundingBox.getCenter();


        }
        else {
            //collapsed: we use the center of the bBox that should have been set when creating the mCollapsedClusterHull
            if (el.mCollapsedClusterHull)
            //pos = el.geometry.boundingBox.getCenter();
                pos = el.mCollapsedClusterHull.position.clone();


        }

        if (!pos) pos = new __WEBPACK_IMPORTED_MODULE_3_three__["Vector3"];

        //above elements do only contain the relative position to its container, so we'll add the position of the cluster
        pos.add(el.position);

        return pos

    }


    /**
     * updates the edges of the clusters as soon as the hull feature is rendered
     *
     *
     */


    update() {


        let edges = this.createEdgesForClusters(this.mClusters);


        var line_geom = new __WEBPACK_IMPORTED_MODULE_3_three__["Geometry"]();


        this.geometry.dispose();
        this.geometry = line_geom;


        var invalidEdges = [];

        for (let edge of edges) {

            let src, dst;

            let s, d;
            s = edge.source instanceof __WEBPACK_IMPORTED_MODULE_2__BaseCluster3D__["a" /* default */] ? edge.source : edge.source._el;
            d = edge.target instanceof __WEBPACK_IMPORTED_MODULE_2__BaseCluster3D__["a" /* default */] ? edge.target : edge.target._el;

            if (!s || !d) {
                invalidEdges.push(edge);
                continue
            }

            src = this.getPositionForElement(s);
            dst = this.getPositionForElement(d);

            //Note: currently there is no need to cut off edges because they are only drawn from src to dest
            //cut off dst at 50% because the element should occure twice
            // let l_50=dst.clone().sub(src).multiplyScalar(0.5)
            // dst.sub(l_50)

            line_geom.vertices.push(src);
            line_geom.vertices.push(dst);

        }


        if (invalidEdges.length > 0)
            console.error("invalid edges", invalidEdges)


    }


}
/* harmony export (immutable) */ __webpack_exports__["a"] = ClusterBaseEdges;



/***/ }),
/* 67 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__BaseVolume__ = __webpack_require__(25);
/**
 * Created by Frank on 22.06.2017.
 */



/**
 * a slight derivative of it's base class
 * allowing for user to add to sub-cluster
 *
 */

class BoxVolume extends __WEBPACK_IMPORTED_MODULE_0__BaseVolume__["a" /* default */] {

    constructor(...args) {
        super(...args);
        this.maxOpacity = 0.1;
        this.getMaterial().transparent = true;
    }


    transferFunction(x) {
        return 1
    }

    /**
     * lod is  value between 0 and 1 that can be used to render elements level-of-detail specific
     * eg. depending on the distance of camera and object
     *
     * @param newLOD
     */
    setLOD(newLOD) {
        super.setLOD(newLOD);

        //by default just set the opacity and visibility accordingly
        let y = this.transferFunction(newLOD)
        if (this.mesh && this.mesh.material) {
            this.mesh.material.opacity = this.maxOpacity * y; //TODO add transferFunction

            if (y <= 0)
                this.mesh.material.visible = false;
            else
                this.mesh.material.visible = true;


        }

    }


    canBeVisible() {
        return true
    }


}
/* harmony export (immutable) */ __webpack_exports__["a"] = BoxVolume;


/***/ }),
/* 68 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__BoxVolume__ = __webpack_require__(67);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__utils_MaterialFadeMixin__ = __webpack_require__(19);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_three__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_lodash__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_lodash___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3_lodash__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_monotone_convex_hull_2d__ = __webpack_require__(293);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_monotone_convex_hull_2d___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4_monotone_convex_hull_2d__);
//technically not a "volume" but for naming convenience


/**
 * Created by Frank on 23.06.2017.
 */


//FIXME this is only a cheap bad performing version of the 3d hull with minor changes to match a 2d hull










class FlatVolume extends __WEBPACK_IMPORTED_MODULE_0__BoxVolume__["a" /* default */] {


    //leaf- bbox => geometry => sum(vertex)
    //ConvexGeometry
    //NOTE also have compute different detailed hulls to set by lod factor
    //eg. if lod <0.3 this.mesh.geometry=this.lowpolyMesh

    constructor(...args) {
        super(...args);

        this.setInactive();

    }


    createConvexShapeGeometry(vertices) {
        var pts = __WEBPACK_IMPORTED_MODULE_3_lodash__["map"](vertices, v => [v.x, v.y]);

        let ids = __WEBPACK_IMPORTED_MODULE_4_monotone_convex_hull_2d___default()(pts);

        var resArr = [];
        __WEBPACK_IMPORTED_MODULE_3_lodash__["each"](ids, function (id) {

            //resArr.push(new THREE.Vector2(pts[id][0],pts[id][1]))
            resArr.push(vertices[id])

        })


        var resShape = new __WEBPACK_IMPORTED_MODULE_2_three__["Shape"](resArr);
        var resGeo = new __WEBPACK_IMPORTED_MODULE_2_three__["ShapeGeometry"](resShape);


        return resGeo

    }

    //geometry ... at best a convexGeometry
    //numSegments ... determines the smoothing of the rounded edges
    //margin ... the margin of the convex geometry around the original geometry
    myModifier(geometry, numSegments, margin) {

        let marginGeo = new __WEBPACK_IMPORTED_MODULE_2_three__["Geometry"]();

        for (let v of geometry.vertices) {
            let sphere = new __WEBPACK_IMPORTED_MODULE_2_three__["CircleGeometry"](margin, numSegments);  //use circle geo for 2d instead of sphere
            sphere.translate(v.x, v.y, v.z);

            marginGeo.merge(sphere, sphere.matrix)

        }


        let convexGeoWithMargin = this.createConvexShapeGeometry(marginGeo.vertices) //new THREE.ConvexGeometry(marginGeo.vertices);


        return convexGeoWithMargin

    }


    createFromBoundingBox(vertices, boundingBox) {

        //adding a timestamp for the different lods of the mesh
        this.mTime = Date.now();

        let vert = vertices.filter(v => !(v.x == 0 && v.y == 0 && v.z == 0 ));

        if (vert.length < 4 && vertices.length > 4) {
            vertices = [];
            boundingBox.min = new __WEBPACK_IMPORTED_MODULE_2_three__["Vector3"](-1, -1, -1);
            boundingBox.max = new __WEBPACK_IMPORTED_MODULE_2_three__["Vector3"](1, 1, 1);

        }


        //ConvexGeometry does need at least 4 vertices
        //so in case we don't have as much we do use the boundingbox instead to generate some more vertices
        if (vertices.length < 4) {

            //test if the boudningBox is valid, else (f)make it so. this way it does not interrupt the work flow and generates a minimal hull
            //TODO   alternativly an empty Geometry would also be sufficient
            if (boundingBox.getSize().length() == 0)
                boundingBox.max.add(new __WEBPACK_IMPORTED_MODULE_2_three__["Vector3"](0.1, 0.1, 0.1));

            vertices = this.getVerticesFromBoundingBox(boundingBox);


        }

        //we will create a sphere geometry with a radius==margin for each vertice and merge them beforehand
        //reduce the vertice count before adding margin
        let geo0;
        try {


            geo0 = this.mGeometryZero = this.createConvexShapeGeometry(vertices)// new THREE.ConvexGeometry(vertices);
        }
        catch (e) {
            geo0 = this.mGeometryZero = this.createBoxGeometryFromBoundingBox(boundingBox);
            console.warn(e, vertices)

        }


        this.mBoundingBox = boundingBox;


        let mat = new __WEBPACK_IMPORTED_MODULE_2_three__["MeshBasicMaterial"]({
            color: 0xffffff,
            opacity: 0.03,
            transparent: true,
            depthWrite: true,
            depthTest: false //disabling depth test instead of using polygonOffset to prevent flickering
            // side: THREE.BackSide
            //  ,   wireframe:true
        });


        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__utils_MaterialFadeMixin__["a" /* default */])(mat);

        //FIXME test if previous material exists and take its fade value to prevent flickering
        /* if (this.mesh && this.mesh.material && this.mesh.material.fade)
             mat.fade = this.mesh.material.fade;
         else*/
        mat.fade = 0;

        mat.fadeTo(1, 400);


        //   let mesh = new THREE.Mesh(geo, mat);
        let mesh = new __WEBPACK_IMPORTED_MODULE_2_three__["Mesh"](this.geo0, mat);


        mesh.geometry.boundingBox = boundingBox;
        mesh.geometry.boundingSphere = boundingBox.getBoundingSphere();

        //this part is to prevent an exception in the raycaster where position is not present but element initialised
        //TODO maybe change the element itself so it stays in a valid state
        var rc = mesh.raycast;
        mesh.raycast = function (raycaster, intersects) {

            if (this.geometry && this.geometry.attributes && !this.geometry.attributes.position)
                return;

            return rc.apply(this, arguments)

        };


        if (this.mesh) this.remove(this.mesh);
        this.mesh = mesh;
        this.add(mesh);

        return this.mesh;

    }

    createBoxGeometryFromBoundingBox(boundingBox) {
        let _center = boundingBox.getCenter();
        let _size = boundingBox.getSize();

        let box = new __WEBPACK_IMPORTED_MODULE_2_three__["BoxGeometry"](_size.x, _size.y, _size.z);

        box.translate(_center.x, _center.y, _center.z);
        return box;
    }

    getVerticesFromBoundingBox(boundingBox) {

        let box = this.createBoxGeometryFromBoundingBox(boundingBox);


        return box.vertices
    }


    //TODO
    transferFunction(x) {
        return x
    }


    createResolutionGeometry(name, resolution) {

        if (!this['geometry' + name] || this['geometry' + name].mTime != this.mTime) {

            let margin = this.mBoundingBox.getSize().length() / 10;

            let geo2 = this.myModifier(this.mGeometryZero, resolution, margin);
            geo2.computeBoundingBox();
            geo2.mTime = this.mTime;
            this['geometry' + name] = geo2;

        }
        return this['geometry' + name]
    }


    //TODO it is probably better to separate the LOD from the visiblility/opacity
    //
    setLOD(l) {


        if (l < 0) l = 0;
        if (l > 1) l = 1;

        var minOpacity = 0.00;

        function mTransfer(x) {
            //transfer function y= 0.5*sin(1.5*pi+x*pi*2)+0.5
            return 0.5 * Math.sin(1.5 * Math.PI + x * Math.PI * 2) + 0.5 + minOpacity


        }

        let y = mTransfer(l);

        super.setLOD(y * this.maxOpacity * 2);


        /*     if (l < 0.8) this.mesh.geometry = this.geometryLowPoly;
         if (l >= 0.8 && l <= 0.95) this.mesh.geometry = this.geometryAveragePoly;
         if (l > 0.95) this.mesh.geometry = this.geometryHighPoly*/


        if (l < 0.2)
            this.mesh.geometry = this.createResolutionGeometry("Least", 1);
        else if (l > 0.2 && l < 0.6)
            this.mesh.geometry = this.createResolutionGeometry("Low", 4);
        else if (l >= 0.6)
            this.mesh.geometry = this.createResolutionGeometry("Average", 6);


    }


    setActive() {
        this.maxOpacity = 0.4;
    }


    setInactive() {
        this.maxOpacity = 0.2;
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
/* harmony export (immutable) */ __webpack_exports__["a"] = FlatVolume;


/***/ }),
/* 69 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_easy_color__ = __webpack_require__(88);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_easy_color___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_easy_color__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_jquery__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_jquery__);
/**
 *
 * manage color for cluster
 * have listeners so that listeners can handle changes
 *
 *
 */



//OptionsManager
// colors
//TODO currently not in use
class DefaultColorScheme extends HTMLElement {


    constructor() {
        super();


        __WEBPACK_IMPORTED_MODULE_1_jquery__(this).on("edge-color-changed", function () {
            console.warn(arguments)


        })


        this.setAttribute("edge-color", "#00AAFFFF")
        this.setAttribute("background-color", "black")

    }

    static get observedAttributes() {
        return ['edge-color', "background-color"];
    }

    // Respond to attribute changes.
    attributeChangedCallback(attr, oldValue, newValue) {


        var parser = new __WEBPACK_IMPORTED_MODULE_0_easy_color___default.a(newValue); // You can also add: # 0af, rgb (0, 170, 255), hsl (..., etc ...

        newValue = parser.toRGBA();
        if (oldValue != newValue)
            this.trigger(attr + "-changed", [newValue, oldValue])
    }

    on(evntName, handler) {
        __WEBPACK_IMPORTED_MODULE_1_jquery__(this).on(evntName, handler.bind(this))
        return this
    }


    //have some utils to convert colors
    //maybe generate materials also

    trigger(evntName, args) {
        __WEBPACK_IMPORTED_MODULE_1_jquery__(this).trigger(evntName, args)
        return this
    }

}
/* harmony export (immutable) */ __webpack_exports__["a"] = DefaultColorScheme;


customElements.define("default-color-scheme", DefaultColorScheme)



/***/ }),
/* 70 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = DomEventsAlt;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_three__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_lodash__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_lodash___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_lodash__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__lib_CombinedCamera__ = __webpack_require__(72);
// This THREEx helper makes it easy to handle the mouse events in your 3D scene
//
// * CHANGES NEEDED
//   * handle drag/drop
//   * notify events not object3D - like DOM
//     * so single object with property
//   * DONE bubling implement bubling/capturing
//   * DONE implement event.stopPropagation()
//   * DONE implement event.type = "click" and co
//   * DONE implement event.target
//
// # Lets get started
//
// First you include it in your page
//
// ```<script src='domevent.js'>< /script>```
//
// # use the object oriented api
//
// You bind an event like this
// 
// ```mesh.on('click', function(object3d){ ... })```
//
// To unbind an event, just do
//
// ```mesh.off('click', function(object3d){ ... })```
//
// As an alternative, there is another naming closer DOM events.
// Pick the one you like, they are doing the same thing
//
// ```mesh.addEventListener('click', function(object3d){ ... })```
// ```mesh.removeEventListener('click', function(object3d){ ... })```
//
// # Supported Events
//
// Always in a effort to stay close to usual pratices, the events name are the same as in DOM.
// The semantic is the same too.
// Currently, the available events are
// [click, dblclick, mouseup, mousedown](http://www.quirksmode.org/dom/events/click.html),
// [mouseover and mouse out](http://www.quirksmode.org/dom/events/mouseover.html).
//
// # use the standalone api
//
// The object-oriented api modifies THREE.Object3D class.
// It is a global class, so it may be legitimatly considered unclean by some people.
// If this bother you, simply do ```DomEvents.noConflict()``` and use the
// standalone API. In fact, the object oriented API is just a thin wrapper
// on top of the standalone API.
//
// First, you instanciate the object
//
// ```var domEvent = new DomEvent();```
// 
// Then you bind an event like this
//
// ```domEvent.bind(mesh, 'click', function(object3d){ object3d.scale.x *= 2; });```
//
// To unbind an event, just do
//
// ```domEvent.unbind(mesh, 'click', callback);```
//
// 
// # Code

//

/** @namespace */
//var THREEx		= THREEx 		|| {};


/**
 * DomEventsAlt is a partial rewrite for nested graph-like structures
 * it prioritises distanceToRay and depth of element within render graph to find best matiching elements for interaction
 * also it speeds up comparisons for meshes by using the scene element to raycast for relevant meshes and bubbling up the render graph of  results,
 * for objects with events context
 */







// # Constructor
function DomEventsAlt(camera, domElement, scene) {
    this._camera = camera || null;
    this._domElement = domElement || document;
    this._raycaster = new __WEBPACK_IMPORTED_MODULE_0_three__["Raycaster"]();


    this._selected = null;
    this._boundObjs = {};

    this.scene = scene

    // Bind dom event for mouse and touch
    var _this = this;

    this._$onClick = function () {
        _this._onClick.apply(_this, arguments);
    };
    this._$onDblClick = function () {
        _this._onDblClick.apply(_this, arguments);
    };
    this._$onMouseMove = function () {
        _this._onMouseMove.apply(_this, arguments);
    };
    this._$onMouseDown = function () {
        _this._onMouseDown.apply(_this, arguments);
    };
    this._$onMouseUp = function () {
        _this._onMouseUp.apply(_this, arguments);
    };
    this._$onTouchMove = function () {
        _this._onTouchMove.apply(_this, arguments);
    };
    this._$onTouchStart = function () {
        _this._onTouchStart.apply(_this, arguments);
    };
    this._$onTouchEnd = function () {
        _this._onTouchEnd.apply(_this, arguments);
    };
    this._$onContextmenu = function () {
        _this._onContextmenu.apply(_this, arguments);
    };
    this._domElement.addEventListener('click', this._$onClick, false);
    this._domElement.addEventListener('dblclick', this._$onDblClick, false);
    this._domElement.addEventListener('mousemove', this._$onMouseMove, false);
    this._domElement.addEventListener('mousedown', this._$onMouseDown, false);
    this._domElement.addEventListener('mouseup', this._$onMouseUp, false);
    this._domElement.addEventListener('touchmove', this._$onTouchMove, false);
    this._domElement.addEventListener('touchstart', this._$onTouchStart, false);
    this._domElement.addEventListener('touchend', this._$onTouchEnd, false);
    this._domElement.addEventListener('contextmenu', this._$onContextmenu, false);

}

// # Destructor
DomEventsAlt.prototype.destroy = function () {
    // unBind dom event for mouse and touch
    this._domElement.removeEventListener('click', this._$onClick, false);
    this._domElement.removeEventListener('dblclick', this._$onDblClick, false);
    this._domElement.removeEventListener('mousemove', this._$onMouseMove, false);
    this._domElement.removeEventListener('mousedown', this._$onMouseDown, false);
    this._domElement.removeEventListener('mouseup', this._$onMouseUp, false);
    this._domElement.removeEventListener('touchmove', this._$onTouchMove, false);
    this._domElement.removeEventListener('touchstart', this._$onTouchStart, false);
    this._domElement.removeEventListener('touchend', this._$onTouchEnd, false);
    this._domElement.removeEventListener('contextmenu', this._$onContextmenu, false);
}

DomEventsAlt.eventNames = [
    "click",
    "dblclick",
    "mouseover",
    "mouseout",
    "mousemove",
    "mousedown",
    "mouseup",
    "contextmenu",
    "touchstart",
    "touchend"
];

DomEventsAlt.prototype._getRelativeMouseXY = function (domEvent) {
    var element = domEvent.target || domEvent.srcElement;
    if (element.nodeType === 3) {
        element = element.parentNode; // Safari fix -- see http://www.quirksmode.org/js/events_properties.html
    }

    //get the real position of an element relative to the page starting point (0, 0)
    //credits go to brainjam on answering http://stackoverflow.com/questions/5755312/getting-mouse-position-relative-to-content-area-of-an-element
    var elPosition = {x: 0, y: 0};
    var tmpElement = element;
    //store padding
    var style = getComputedStyle(tmpElement, null);
    elPosition.y += parseInt(style.getPropertyValue("padding-top"), 10);
    elPosition.x += parseInt(style.getPropertyValue("padding-left"), 10);
    //add positions
    do {
        elPosition.x += tmpElement.offsetLeft;
        elPosition.y += tmpElement.offsetTop;
        style = getComputedStyle(tmpElement, null);

        elPosition.x += parseInt(style.getPropertyValue("border-left-width"), 10);
        elPosition.y += parseInt(style.getPropertyValue("border-top-width"), 10);
    } while (tmpElement = tmpElement.offsetParent);

    var elDimension = {
        width: (element === window) ? window.innerWidth : element.offsetWidth,
        height: (element === window) ? window.innerHeight : element.offsetHeight
    };

    return {
        x: +((domEvent.pageX - elPosition.x) / elDimension.width ) * 2 - 1,
        y: -((domEvent.pageY - elPosition.y) / elDimension.height) * 2 + 1
    };
};


/********************************************************************************/
/*		domevent context						*/
/********************************************************************************/

// handle domevent context in object3d instance

DomEventsAlt.prototype._objectCtxInit = function (object3d) {
    object3d._3xDomEvent = {};
}
DomEventsAlt.prototype._objectCtxDeinit = function (object3d) {
    delete object3d._3xDomEvent;
}
DomEventsAlt.prototype._objectCtxIsInit = function (object3d) {
    return object3d._3xDomEvent ? true : false;
}
DomEventsAlt.prototype._objectCtxGet = function (object3d) {
    return object3d._3xDomEvent;
}

/********************************************************************************/
/*										*/
/********************************************************************************/

/**
 * Getter/Setter for camera
 */
DomEventsAlt.prototype.camera = function (value) {
    if (value) this._camera = value;
    return this._camera;
}

DomEventsAlt.prototype.bind = function (object3d, eventName, callback, useCapture) {
    console.assert(DomEventsAlt.eventNames.indexOf(eventName) !== -1, "not available events:" + eventName);

    if (!this._objectCtxIsInit(object3d)) this._objectCtxInit(object3d);
    var objectCtx = this._objectCtxGet(object3d);
    if (!objectCtx[eventName + 'Handlers']) objectCtx[eventName + 'Handlers'] = [];

    objectCtx[eventName + 'Handlers'].push({
        callback: callback,
        useCapture: useCapture
    });

    // add this object in this._boundObjs
    if (this._boundObjs[eventName] === undefined) {
        this._boundObjs[eventName] = [];
    }
    this._boundObjs[eventName].push(object3d);
}
DomEventsAlt.prototype.addEventListener = DomEventsAlt.prototype.bind

DomEventsAlt.prototype.unbind = function (object3d, eventName, callback, useCapture) {
    console.assert(DomEventsAlt.eventNames.indexOf(eventName) !== -1, "not available events:" + eventName);

    if (!this._objectCtxIsInit(object3d)) this._objectCtxInit(object3d);

    var objectCtx = this._objectCtxGet(object3d);
    if (!objectCtx[eventName + 'Handlers']) objectCtx[eventName + 'Handlers'] = [];

    var handlers = objectCtx[eventName + 'Handlers'];
    for (var i = 0; i < handlers.length; i++) {
        var handler = handlers[i];
        if (callback != handler.callback) continue;
        if (useCapture != handler.useCapture) continue;
        handlers.splice(i, 1)
        break;
    }
    // from this object from this._boundObjs
    var index = this._boundObjs[eventName].indexOf(object3d);
    console.assert(index !== -1);
    this._boundObjs[eventName].splice(index, 1);
}
DomEventsAlt.prototype.removeEventListener = DomEventsAlt.prototype.unbind

DomEventsAlt.prototype._bound = function (eventName, object3d) {
    var objectCtx = this._objectCtxGet(object3d);
    if (!objectCtx) return false;
    return objectCtx[eventName + 'Handlers'] ? true : false;
}

/********************************************************************************/
/*		onMove								*/
/********************************************************************************/

// # handle mousemove kind of events

DomEventsAlt.prototype._onMove = function (eventName, mouseX, mouseY, origDomEvent) {
//console.log('eventName', eventName, 'boundObjs', this._boundObjs[eventName])
    // get objects bound to this event
    // var boundObjs	= this._boundObjs[eventName];
    // if( boundObjs === undefined || boundObjs.length === 0 )	return;
    // compute the intersection
    var vector = new __WEBPACK_IMPORTED_MODULE_0_three__["Vector2"]();

    // update the picking ray with the camera and mouse position
    vector.set(mouseX, mouseY);

    let mCamera;

    if (this._camera instanceof __WEBPACK_IMPORTED_MODULE_0_three__["CombinedCamera"]) {

        if (this._camera.inPerspectiveMode) mCamera = this._camera.cameraP;
        if (this._camera.inOrthographicMode) mCamera = this._camera.cameraO;

    }
    else
        mCamera = this._camera;

    this._raycaster.setFromCamera(vector, mCamera);

    //@frank4711 altering intersection from flat array will improve mouse move performance for many elements bound
    var intersects = this._raycaster.intersectObjects(this.scene.children, true);
    // intersects=  intersects.filter( i => this._objectCtxIsInit(i.object) );
    intersects = this.getRelevantIntersections(intersects)
    //var intersects = this._raycaster.intersectObjects( boundObjs );

    var oldSelected = this._selected;

    if (intersects.length > 0) {

        var notifyOver, notifyOut, notifyMove;
        var intersect = intersects[0];
        var newSelected = intersect.object;
        this._selected = newSelected;
        // if newSelected bound mousemove, notify it
        notifyMove = this._bound('mousemove', newSelected);

        if (oldSelected != newSelected) {
            // if newSelected bound mouseenter, notify it
            notifyOver = this._bound('mouseover', newSelected);
            // if there is a oldSelect and oldSelected bound mouseleave, notify it
            notifyOut = oldSelected && this._bound('mouseout', oldSelected);
        }
    } else {
        // if there is a oldSelect and oldSelected bound mouseleave, notify it
        notifyOut = oldSelected && this._bound('mouseout', oldSelected);
        this._selected = null;
    }


    // notify mouseMove - done at the end with a copy of the list to allow callback to remove handlers
    notifyMove && this._notify('mousemove', newSelected, origDomEvent, intersect);
    // notify mouseEnter - done at the end with a copy of the list to allow callback to remove handlers
    notifyOver && this._notify('mouseover', newSelected, origDomEvent, intersect);
    // notify mouseLeave - done at the end with a copy of the list to allow callback to remove handlers
    notifyOut && this._notify('mouseout', oldSelected, origDomEvent, intersect);
}


//@author frank1147
//retrieves the bound objects for the intersected elements using the recursive approach
DomEventsAlt.prototype.getRelevantIntersections = function getRelevantIntersections(intersects) {


    if (intersects.length === 0) return intersects;

    var relevant = [];
    var that = this;
    intersects.forEach(function (i) {


        if (that._objectCtxIsInit(i.object)) relevant.push(i)
        else {
            var el = i.object
            while (el = el.parent) {
                //NOTE: using this recursive approach will return parent element of a intersected element that has the context
                //this can result in a difference between the clicked point of a child element and the assumed point of the bound geometry of the parent element
                if (that._objectCtxIsInit(el)) {
                    i.object = el
                    relevant.push(i);
                    break;//we found the parent element that has the given context, so we can break the loop
                }
            }


        }

    });


    if (relevant.length == 0) return relevant

    return this.sortByDepth(relevant);

}


DomEventsAlt.prototype.sortByDepth = function (intersects) {


    //calculate depth in scene
    intersects.forEach(function (i) {

        var el = i.object
        var depth = 0;

        //TODO check alternatives
        //our ClusterLeafElements do get a depth property attached bythe raycaster

        if (i.depth)
            return i.depth

        while (el = el.parent) {
            depth++;
        }
        i.depth = depth;

    });

    //we want to sort elements by ASC distance first like originally
    // and DESC depth
    //so elements that are closer and deeper within the scene are more relevant

    intersects = __WEBPACK_IMPORTED_MODULE_1_lodash__["sortBy"](intersects, [(o) => -o.depth, o => o.distanceToRay]);  //,o => o.distance


    return intersects
}

/********************************************************************************/
/*		onEvent								*/
/********************************************************************************/

// # handle click kind of events

DomEventsAlt.prototype._onEvent = function (eventName, mouseX, mouseY, origDomEvent) {
    //console.log('eventName', eventName, 'boundObjs', this._boundObjs[eventName])
    // get objects bound to this event


    var boundObjs = this._boundObjs[eventName];
    if (boundObjs === undefined || boundObjs.length === 0) return;
    // compute the intersection
    var vector = new __WEBPACK_IMPORTED_MODULE_0_three__["Vector2"]();

    // update the picking ray with the camera and mouse position
    vector.set(mouseX, mouseY);


    let mCamera;

    if (this._camera instanceof __WEBPACK_IMPORTED_MODULE_0_three__["CombinedCamera"]) {

        if (this._camera.inPerspectiveMode) mCamera = this._camera.cameraP;
        if (this._camera.inOrthographicMode) mCamera = this._camera.cameraO;

    }
    else
        mCamera = this._camera

    this._raycaster.setFromCamera(vector, mCamera);

    //var intersects = this._raycaster.intersectObjects( boundObjs, true);

    //@frank4711 altering intersection from flat array will improve mouse move performance for many elements bound
    var intersects = this._raycaster.intersectObjects(this.scene.children, true);
    // intersects=  intersects.filter( i => this._objectCtxIsInit(i.object) );
    intersects = this.getRelevantIntersections(intersects)
    // if there are no intersections, return now
    if (intersects.length === 0) return;

    // init some variables
    var intersect = intersects[0];
    var object3d = intersect.object;


    // notify handlers
    this._notify(eventName, object3d, origDomEvent, intersect);
}

DomEventsAlt.prototype._notify = function (eventName, object3d, origDomEvent, intersect) {
    var objectCtx = this._objectCtxGet(object3d);
    var handlers = objectCtx ? objectCtx[eventName + 'Handlers'] : null;

    // parameter check
    console.assert(arguments.length === 4)

    // do bubbling
    if (!objectCtx || !handlers || handlers.length === 0) {
        object3d.parent && this._notify(eventName, object3d.parent, origDomEvent, intersect);
        return;
    }

    // notify all handlers
    var handlers = objectCtx[eventName + 'Handlers'];
    for (var i = 0; i < handlers.length; i++) {
        var handler = handlers[i];
        var toPropagate = true;
        handler.callback({
            type: eventName,
            target: object3d,
            origDomEvent: origDomEvent,
            intersect: intersect,
            stopPropagation: function () {
                toPropagate = false;
            }
        });
        if (!toPropagate) continue;
        // do bubbling
        if (handler.useCapture === false) {
            object3d.parent && this._notify(eventName, object3d.parent, origDomEvent, intersect);
        }
    }
}

/********************************************************************************/
/*		handle mouse events						*/
/********************************************************************************/
// # handle mouse events

DomEventsAlt.prototype._onMouseDown = function (event) {
    return this._onMouseEvent('mousedown', event);
}
DomEventsAlt.prototype._onMouseUp = function (event) {
    return this._onMouseEvent('mouseup', event);
}


DomEventsAlt.prototype._onMouseEvent = function (eventName, domEvent) {
    var mouseCoords = this._getRelativeMouseXY(domEvent);
    this._onEvent(eventName, mouseCoords.x, mouseCoords.y, domEvent);
}

/*
DomEventsAlt.prototype._onMouseMove	= function(domEvent)
{
    var mouseCoords = this._getRelativeMouseXY(domEvent);
    this._onMove('mousemove', mouseCoords.x, mouseCoords.y, domEvent);
   // this._onMove('mouseover', mouseCoords.x, mouseCoords.y, domEvent);
   // this._onMove('mouseout' , mouseCoords.x, mouseCoords.y, domEvent);
}*/

DomEventsAlt.prototype._onClick = function (event) {
    // TODO handle touch ?
    this._onMouseEvent('click', event);
}
DomEventsAlt.prototype._onDblClick = function (event) {
    // TODO handle touch ?
    this._onMouseEvent('dblclick', event);
}

DomEventsAlt.prototype._onContextmenu = function (event) {
    //TODO don't have a clue about how this should work with touch..
    this._onMouseEvent('contextmenu', event);
}

/********************************************************************************/
/*		handle touch events						*/
/********************************************************************************/
// # handle touch events


DomEventsAlt.prototype._onTouchStart = function (event) {
    return this._onTouchEvent('touchstart', event);
}
DomEventsAlt.prototype._onTouchEnd = function (event) {
    return this._onTouchEvent('touchend', event);
}

DomEventsAlt.prototype._onTouchMove = function (domEvent) {
    if (domEvent.touches.length != 1) return undefined;

    domEvent.preventDefault();

    var mouseX = +(domEvent.touches[0].pageX / window.innerWidth ) * 2 - 1;
    var mouseY = -(domEvent.touches[0].pageY / window.innerHeight) * 2 + 1;
    this._onMove('mousemove', mouseX, mouseY, domEvent);
    //  this._onMove('mouseover', mouseX, mouseY, domEvent);
    //  this._onMove('mouseout' , mouseX, mouseY, domEvent);
}

DomEventsAlt.prototype._onTouchEvent = function (eventName, domEvent) {
    if (domEvent.touches.length != 1) return undefined;

    domEvent.preventDefault();

    var mouseX = +(domEvent.touches[0].pageX / window.innerWidth ) * 2 - 1;
    var mouseY = -(domEvent.touches[0].pageY / window.innerHeight) * 2 + 1;
    this._onEvent(eventName, mouseX, mouseY, domEvent);
}


//throttle move events to about 50 fps
//let origMouseMove=THREEx.DomEvents.prototype._onMouseMove;
DomEventsAlt.prototype._onMouseMove = __WEBPACK_IMPORTED_MODULE_1_lodash__["throttle"](function (domEvent) {
    var mouseCoords = this._getRelativeMouseXY(domEvent);
    this._onMove('mousemove', mouseCoords.x, mouseCoords.y, domEvent);
    // this._onMove('mouseover', mouseCoords.x, mouseCoords.y, domEvent);
    // this._onMove('mouseout', mouseCoords.x, mouseCoords.y, domEvent);
}, 40);  //25 (f)ps


/***/ }),
/* 71 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_apollo_client__ = __webpack_require__(160);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_graphql_tag__ = __webpack_require__(93);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_graphql_tag___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_graphql_tag__);



class ApolloDS {

    constructor(url) {


        this.connect(url)

    }

    connect(url = "http://localhost:8088/graphql") {

        this.client = new __WEBPACK_IMPORTED_MODULE_0_apollo_client__["a" /* default */]({
            networkInterface: __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_apollo_client__["b" /* createBatchingNetworkInterface */])({
                uri: url,
                batchInterval: 10,
                opts: {
                    credentials: 'same-origin',
                },
            }),
        });


    }


    /*   example `
                 query TodoApp {
                   todos {
                     id
                     text
                     completed
                   }
                 }
             `
    */


    query(qry, onResult) {


        this.client.query({
            query: __WEBPACK_IMPORTED_MODULE_1_graphql_tag___default()(qry),
        })
            .then(data => onResult(data))
            .catch(error => console.error(error));


    }


}
/* harmony export (immutable) */ __webpack_exports__["a"] = ApolloDS;


/***/ }),
/* 72 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_three__ = __webpack_require__(1);
/**
 *	@author zz85 / http://twitter.com/blurspline / http://www.lab4games.net/zz85/blog
 *
 *	A general purpose camera, for setting FOV, Lens Focal Length,
 *		and switching between perspective and orthographic views easily.
 *		Use this only if you do not wish to manage
 *		both a Orthographic and Perspective Camera
 *
 */





__WEBPACK_IMPORTED_MODULE_0_three__["CombinedCamera"] = function ( width, height, fov, near, far, orthoNear, orthoFar ) {

	__WEBPACK_IMPORTED_MODULE_0_three__["Camera"].call( this );

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

	this.cameraO = new __WEBPACK_IMPORTED_MODULE_0_three__["OrthographicCamera"]( width / - 2, width / 2, height / 2, height / - 2, 	orthoNear, orthoFar );
	this.cameraP = new __WEBPACK_IMPORTED_MODULE_0_three__["PerspectiveCamera"]( fov, width / height, near, far );

	this.toPerspective();

};

__WEBPACK_IMPORTED_MODULE_0_three__["CombinedCamera"].prototype = Object.create( __WEBPACK_IMPORTED_MODULE_0_three__["Camera"].prototype );
__WEBPACK_IMPORTED_MODULE_0_three__["CombinedCamera"].prototype.constructor = __WEBPACK_IMPORTED_MODULE_0_three__["CombinedCamera"];

__WEBPACK_IMPORTED_MODULE_0_three__["CombinedCamera"].prototype.toPerspective = function () {

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

__WEBPACK_IMPORTED_MODULE_0_three__["CombinedCamera"].prototype.toOrthographic = function () {

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



__WEBPACK_IMPORTED_MODULE_0_three__["CombinedCamera"].prototype.copy = function ( source ) {

	__WEBPACK_IMPORTED_MODULE_0_three__["Camera"].prototype.copy.call( this, source );

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

__WEBPACK_IMPORTED_MODULE_0_three__["CombinedCamera"].prototype.setViewOffset = function( fullWidth, fullHeight, x, y, width, height ) {

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

__WEBPACK_IMPORTED_MODULE_0_three__["CombinedCamera"].prototype.clearViewOffset = function() {

	this.view = null;
	this.updateProjectionMatrix();

};

__WEBPACK_IMPORTED_MODULE_0_three__["CombinedCamera"].prototype.setSize = function( width, height ) {

	this.cameraP.aspect =this.aspect= width / height;
	this.left = - width / 2;
	this.right = width / 2;
	this.top = height / 2;
	this.bottom = - height / 2;



};


__WEBPACK_IMPORTED_MODULE_0_three__["CombinedCamera"].prototype.setFov = function( fov ) {

	this.fov = fov;

	this.update();

};



__WEBPACK_IMPORTED_MODULE_0_three__["CombinedCamera"].prototype.setFar = function( far ) {

	this.cameraP.far=this.far=far;
    this.cameraO.far=this.far=far;
    this.update();

};

__WEBPACK_IMPORTED_MODULE_0_three__["CombinedCamera"].prototype.setNear = function( near ) {

    this.cameraP.near=this.near=near;
    this.update();

};




__WEBPACK_IMPORTED_MODULE_0_three__["CombinedCamera"].prototype.update = function(  ) {


    if ( this.inPerspectiveMode ) {

        this.toPerspective();

    } else {

        this.toOrthographic();

    }

};








// For maintaining similar API with PerspectiveCamera

__WEBPACK_IMPORTED_MODULE_0_three__["CombinedCamera"].prototype.updateProjectionMatrix = function() {

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
__WEBPACK_IMPORTED_MODULE_0_three__["CombinedCamera"].prototype.setLens = function ( focalLength, filmGauge ) {

	if ( filmGauge === undefined ) filmGauge = 35;

	var vExtentSlope = 0.5 * filmGauge /
			( focalLength * Math.max( this.cameraP.aspect, 1 ) );

	var fov = __WEBPACK_IMPORTED_MODULE_0_three__["Math"].RAD2DEG * 2 * Math.atan( vExtentSlope );

	this.setFov( fov );

	return fov;

};


__WEBPACK_IMPORTED_MODULE_0_three__["CombinedCamera"].prototype.setZoom = function( zoom ) {

	this.zoom = zoom;
	this.update();
};

__WEBPACK_IMPORTED_MODULE_0_three__["CombinedCamera"].prototype.toFrontView = function() {

	this.rotation.x = 0;
	this.rotation.y = 0;
	this.rotation.z = 0;

	// should we be modifing the matrix instead?

};

__WEBPACK_IMPORTED_MODULE_0_three__["CombinedCamera"].prototype.toBackView = function() {

	this.rotation.x = 0;
	this.rotation.y = Math.PI;
	this.rotation.z = 0;

};

__WEBPACK_IMPORTED_MODULE_0_three__["CombinedCamera"].prototype.toLeftView = function() {

	this.rotation.x = 0;
	this.rotation.y = - Math.PI / 2;
	this.rotation.z = 0;

};

__WEBPACK_IMPORTED_MODULE_0_three__["CombinedCamera"].prototype.toRightView = function() {

	this.rotation.x = 0;
	this.rotation.y = Math.PI / 2;
	this.rotation.z = 0;

};

__WEBPACK_IMPORTED_MODULE_0_three__["CombinedCamera"].prototype.toTopView = function() {

	this.rotation.x = - Math.PI / 2;
	this.rotation.y = 0;
	this.rotation.z = 0;

};

__WEBPACK_IMPORTED_MODULE_0_three__["CombinedCamera"].prototype.toBottomView = function() {

	this.rotation.x = Math.PI / 2;
	this.rotation.y = 0;
	this.rotation.z = 0;

};


/***/ }),
/* 73 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = AnimationMixin;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__lib_Tween__ = __webpack_require__(27);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__lib_Tween___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__lib_Tween__);
/**
 * extends any given object
 * with an animate method
 *
 * animate(options:Object, mDuration : Number, onComplete:function)
 *
 * options does contain all the animated properties
 */
//import TWEEN from "@tweenjs/tween.js"


function AnimationMixin(origObject) {
    if (typeof origObject == "undefined") throw new Error("must be an object");


    //https://github.com/tweenjs/tween.js/issues/78
    //Flatten/Deflate an object
    var flatten = function (source, pathArray, result) {
        pathArray = (typeof pathArray === 'undefined') ? [] : pathArray;
        result = (typeof result === 'undefined') ? {} : result;
        var key, value, newKey;
        for (var i in source) {
            if (source.hasOwnProperty(i)) {
                key = i;
                value = source[i];
                pathArray.push(key);

                if (typeof value === 'object' && value !== null) {
                    result = flatten(value, pathArray, result);
                } else {
                    newKey = pathArray.join('.');
                    result[newKey] = value;
                }
                pathArray.pop();
            }
        }
        return result;
    };

    function ref(obj, str) {
        return str.split(".").reduce(function (o, x) {
            return o[x]
        }, obj);
    }

//Move values from a flatten object to its original object
    function returnValue(obj, flattened, key) {
        let parts = key.split(/\.(?=[^.]+$)/)  // Split "foo.bar.baz" into ["foo.bar", "baz"]
        if (parts.length == 1) {
            obj[parts[0]] = flattened[key];
        } else {
            ref(obj, parts[0])[parts[1]] = flattened[key];
        }
    }

    function getValue(obj, key) {
        let parts = key.split(/\.(?=[^.]+$)/)  // Split "foo.bar.baz" into ["foo.bar", "baz"]
        if (parts.length == 1) {
            return obj[parts[0]]
        } else {
            return ref(obj, parts[0])[parts[1]]
        }
    }


    origObject.animate = function (options = {}, mDuration = 400, onComplete, onUpdate) {
        var mTimeout;
        var that = this;
        var stopped = false

        var flattened_to = flatten(options);

        var keys = Object.keys(flattened_to)
        var flattened_from = {}
        keys.forEach(k => flattened_from[k] = getValue(that, k))

        var tween = new __WEBPACK_IMPORTED_MODULE_0__lib_Tween___default.a.Tween(flattened_from);
        tween.to(flattened_to, mDuration)
            .onUpdate(function () {

                //Move the values from the flattened and tweening object
                //to the original object
                for (let key in this) {
                    returnValue(that, this, key);
                }
                if (typeof onUpdate == "function") onUpdate.bind(that)()

            })
            .onComplete(function () {

                cancelAnimationFrame(mTimeout);

                stopped = true
                if (typeof onComplete == "function")
                    onComplete.bind(origObject)()
            })
            .start();

        mTimeout = requestAnimationFrame(animate);

        function animate(time) {
            if (stopped) return

            tween.update(time);
            mTimeout = requestAnimationFrame(animate);

        }

        return this;
    };

    return origObject

}




/***/ }),
/* 74 */,
/* 75 */,
/* 76 */,
/* 77 */,
/* 78 */,
/* 79 */,
/* 80 */,
/* 81 */,
/* 82 */,
/* 83 */,
/* 84 */,
/* 85 */,
/* 86 */,
/* 87 */,
/* 88 */,
/* 89 */,
/* 90 */,
/* 91 */,
/* 92 */,
/* 93 */,
/* 94 */,
/* 95 */,
/* 96 */,
/* 97 */,
/* 98 */,
/* 99 */,
/* 100 */,
/* 101 */,
/* 102 */,
/* 103 */,
/* 104 */,
/* 105 */,
/* 106 */,
/* 107 */,
/* 108 */,
/* 109 */,
/* 110 */,
/* 111 */,
/* 112 */,
/* 113 */,
/* 114 */,
/* 115 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Datasource__ = __webpack_require__(141);


class CompanyNewsDS extends __WEBPACK_IMPORTED_MODULE_0__Datasource__["a" /* default */] {

    constructor(url) {
        super(url);


        // Initial set of notes, loop through and add to list
        /*   socket.on('initial notes', function(data){
               var html = ''
               for (var i = 0; i < data.length; i++){
                   // We store html as a var then add to DOM after for efficiency
                   html += '<li>' + data[i].note + '</li>'
               }
               console.warn("'initial notes':",html)
           })

           // New note emitted, add it to our list of current notes
           socket.on('new note', function(data){
               $('#notes').append('<li>' + data.note + '</li>')
           })

           // New socket connected, display new count on page
           socket.on('users connected', function(data){
               console.warn('users connected:','Users connected: ' + data)
           })

           // Add a new (random) note, emit to server to let others know
           $('#newNote').click(function(){
               var newNote = 'This is a random ' + (Math.floor(Math.random() * 100) + 1)  + ' note'
               socket.emit('new note', {note: newNote})
           })

   */


    }


    onNewsReceived(callback) {
        //TODO work in progress .. we might not need such convenience functions
        this.mSocket.on('read news', callback)

    }


}
/* harmony export (immutable) */ __webpack_exports__["a"] = CompanyNewsDS;


/***/ }),
/* 116 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = getGraphDataSets;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_jquery__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_jquery__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_jquery_ui_themes_base_core_css__ = __webpack_require__(57);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_jquery_ui_themes_base_core_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_jquery_ui_themes_base_core_css__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_jquery_ui_ui_core__ = __webpack_require__(52);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_jquery_ui_ui_core___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_jquery_ui_ui_core__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_jquery_ui_ui_widgets_progressbar__ = __webpack_require__(282);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_jquery_ui_ui_widgets_progressbar___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3_jquery_ui_ui_widgets_progressbar__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__gui_searchbar__ = __webpack_require__(61);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_qwest__ = __webpack_require__(298);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_qwest___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_5_qwest__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6_papaparse__ = __webpack_require__(295);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6_papaparse___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_6_papaparse__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__deprecated_gpu_info__ = __webpack_require__(142);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__ApolloDS__ = __webpack_require__(71);


//import 'jquery-ui/themes/base/theme.css';
//import 'jquery-ui/themes/base/selectable.css';














function createDlg() {

    const dialogTemplate = `<div id="dialog-confirm" title="Load the Graph anyway?">
	  <p><span class="ui-icon ui-icon-alert" style="float:left; margin:12px 12px 20px 0;"></span>Your graphics card might be too slow or your browser does use the onboard card. The page might show 3d content in suboptimal form. </p>
</div>`
    return __WEBPACK_IMPORTED_MODULE_0_jquery___default()(dialogTemplate)
}

function openGraphConfirmDialog(fileName, nodeCount, acceptCallback) {

    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_7__deprecated_gpu_info__["a" /* gpuInfo */])().lt(5000, function () {

        console.warn("gpu might be too slow or onboard graphics are used")


        acceptCallback()
        /*

         //FIXME
         if (!window["mGraph"]) setTimeout(waitForGraphToInit,100)
         else waitForGraphToInit()

         function waitForGraphToInit()
         {
         console.log("whoot")


         if (!window["mGraph"]) setTimeout(waitForGraphToInit,100)
         else
         mGraph.nodeDistancePromise.then(() => acceptCallback()  )

         }
         */
        /*
         createDlg().dialog({
         resizable: false,
         height: "auto",
         width: 400,
         modal: true,
         buttons: {
         "Load graph anyway!": function() {
         $( this ).dialog( "close" );

         acceptCallback()

         },
         Cancel: function() {
         $( this ).dialog( "close" );
         }
         }
         });*/

    }).run()


}

function getGraphDataSets() {

    // Color brewer paired set
    const colors = ['#f90500', '#e9e916', '#55c64c', '#FF0000', '#00FF00', '#0000FF', '#FF00FF', '#C0C0C0', '#808080', '#800000', '#808000', '#008000', '#800080', '#008080', '#000080'];


    function defaultLoadFile(fileName) {

        //add progressbar
        var progressbar = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('<div id="progressbar"></div>')
        var progressLabel = __WEBPACK_IMPORTED_MODULE_0_jquery___default()('<div class="progress-label">Loading... ' + fileName + '</div>')
        progressbar.append(progressLabel)

        progressbar.progressbar({
            value: false,
            change: function () {
                progressLabel.text(fileName + " " + progressbar.progressbar("value") + "%");
            },
            complete: function () {
                progressbar.fadeOut()
                progressLabel.text(fileName + " Complete!");
            }
        });


        if (_.endsWith(fileName, ".json")) {
            //the load function itself
            const loadJSON = function (Graph) {

                __WEBPACK_IMPORTED_MODULE_5_qwest___default.a.get(fileName, null, null, function (xhr) {

                    xhr.onprogress = function (e) {

                        var val = progressbar.progressbar("value") || 0;
                        console.log(e)
                        progressbar.progressbar("value", e.loaded / e.total * 100);

                    };

                    xhr.onloadstart = function (e) {
                        console.log("onloadstart")
                        progressbar.show()
                        progressbar.appendTo("body")
                    };

                }).then(defaultLoadSuccess).catch(console.warn);


            };
            loadJSON.description = "<em>" + fileName + "</em>";
            return loadJSON;
        }
        else if (_.endsWith(fileName, ".csv")) {




            //the load function itself
            const loadCSV = function (Graph, alternativehandler) {

                var nodes = []


                progressbar.show()
                progressbar.appendTo("body")

                __WEBPACK_IMPORTED_MODULE_6_papaparse___default.a.parse(fileName, {
                    download: true,
                    //worker: true,
                    header: true,
                    dynamicTyping: true,
                    step: function (row) {


                        var curr = row.meta.cursor
                        var max = 450000//TODO file.size
                        progressbar.progressbar("value", curr / max * 100);

                        //id,name,industry,country,sent,price,itemCount
                        //4488	alnc.	Consumer Staples	United States	64	12%	8
                        var r = row.data[0]

                        //TODO having proper groupings probably needs a tree approach that contains order of groups

                        var data = {
                            id: r.id,
                            name: r.name,
                            group: r.country,
                            industry: r.industry,
                            sent: r.sent,
                            price: r.price,
                            itemCount: r.itemCount
                        }

                        data.color = 0x00ff00

                        nodes.push(data)

                    },
                    complete: function () {

                        defaultLoadSuccess(_, {nodes: nodes})
                        progressbar.hide()
                    }
                });


            };
            loadCSV.description = "<em>" + fileName + "</em>";
            return loadCSV;


        }


    }


    /*******************************************************************************************************/
    /**
     * adding some database functions to query the remote server
     *
     *
     * @param countryName
     * @returns {string}
     */
    function getCountryQuery(countryName) {
        var str = ""
        if (countryName)
            str = `(country:"${countryName}")`

        return `        
              query GraphCountryData  {
                        nodes ${str} {
                          id
                          name
                          country
                          industry
                          ticker
                          sentiment
                          price
                          itemCount
                        }
                          edges ${str}{
                            source
                            target
                            strength
                            
                          }     
            }
        `
    }

    function getCountryQueryDB(countryName) {
        var str = ""
        if (countryName)
            str = `country:"${countryName}", `

        return `        
              query GraphCountryData  {
                       
              companies( ${str} limit:25000)
                {
            
                id
                name
                    ticker   
                    trend
              
                industry
                country
               
               #FIXME sentiment takes waaay to long to be calculated
               # sentiment{
               #   sentiment
               # }
                newsCount
                
 
              }
              
                dbedges
              {
                source
                target
              }
              
              
                              
              countries{
                id
                name
                   
              }
  
 			 industries{
             id 
              name
             }
            
              
              
        }
        `
    }


    var db = new __WEBPACK_IMPORTED_MODULE_8__ApolloDS__["a" /* default */]()


    //convert the current(prototypical) data structure of the data provider into our notation
    function alterDBResponse(data) {
        window.dbdata = data
        var newdata = {nodes: [], edges: []}

        var companyByNameAsID = {}


        var countriesByID = {}
        countriesByID[-1] = "-no country-"
        data.countries.forEach(function (country) {
            countriesByID[country.id] = country.name
        })


        var industrialSectorsByID = {}
        industrialSectorsByID[-1] = "-no sector-"
        data.industries.forEach(function (industry) {
            industrialSectorsByID[industry.id] = industry.name
        })


        data.companies.forEach(function (_company) {


            var company = {}
            _.extend(company, _company)

            companyByNameAsID[company.name] = company

            if (!company.country)
                company.country = -1

            if (!company.industry)
                company.industry = -1

            //FIXME
            var _sentiment = company.sentiment
            if (!_sentiment)
                _sentiment = {sentiment: _.random(0, 100)}


            var countryName = countriesByID[company.country]
            var industryName = industrialSectorsByID[company.industry]

            newdata.nodes.push({
                "id": company.id,
                "name": company.name,
                "country": countryName,
                "industry": industryName,
                "ticker": company.ticker,
                "sentiment": _sentiment.sentiment,
                "price": "" + (company.trend * 100) + "%",
                "itemCount": company.newsCount //FIXME not real values in db
            })


        })


        data.dbedges.forEach(function (edge) {

            if (companyByNameAsID[edge.target])
                newdata.edges.push({
                    "source": edge.source,
                    "target": companyByNameAsID[edge.target].id,
                    "strength": 42 //FIXME not real values in db
                })

        })


        return newdata
    }


    function queryDatabase(query, successCallback) {
        return function (notUsed, onSuccess) {

            console.log(query)
            db.query(query, function (response) {

                var rdata = response.data
                if (successCallback)
                    rdata = successCallback(rdata)


                var _nodes = rdata.nodes.map(function (r) {

                    var data = {
                        id: "" + r.id,
                        name: r.name,
                        group: r.country,
                        industry: r.industry,
                        sent: r.sentiment,
                        price: r.price,
                        itemCount: r.itemCount,
                        ticker: r.ticker
                    }

                    data.color = 0x0000ff
                    return data
                })

                var _links = []

                rdata.edges.forEach(function (edge) {
                    let link = {
                        source: "" + edge.source,
                        target: "" + edge.target,
                        strength: edge.strength
                    }
                    _links.push(link)
                })


                var data = {
                    expanded: ["United States"],
                    nodes: _nodes,
                    links: _links,
                    isRealData: true
                }

                //FIXME the work flow in here needs some proper refactoring to be more efficient..
                defaultLoadHandler(_, data, onSuccess)


            })

        }
    }


    function loadRealDataSampleOnly(fileName, fileName2, onLoadSuccess) {


        function streamCSVFile(fileName, onRowCallback, onComplete) {
            return new Promise(function (ok, fail) {


                __WEBPACK_IMPORTED_MODULE_6_papaparse___default.a.parse(fileName, {
                    download: true,

                    header: true,
                    dynamicTyping: true,
                    step: onRowCallback,
                    complete: function () {
                        if (typeof onComplete == "function") onComplete();
                        ok()
                    }
                });


            })

        }


        //the load function itself
        const loadCSV = function (Graph, alternativehandler) {

            var nodes = []
            var links = []

            var nodesPromise = streamCSVFile(fileName, function (row) {

                if (row.errors.length > 0) return

                //id,name,industry,country,sent,price,itemCount
                //4488	alnc.	Consumer Staples	United States	64	12%	8
                var r = row.data[0]

                //TODO having proper groupings probably needs a tree approach that contains order of groups

                var data = {
                    id: r.id,
                    name: r.name,
                    group: r.country,
                    industry: r.industry,
                    sent: r.sent,
                    price: r.price,
                    itemCount: r.itemCount,
                    ticker: r.ticker
                }

                data.color = 0x00ff00

                nodes.push(data)

            })


            var invalidLinks = 0
            var linksPromise = streamCSVFile(fileName2, function (row) {

                if (row.errors.length > 0) return

                //SourceID,TargetID,Relationship Strenght
                //4488	448338	12%
                var r = row.data[0]

                //TODO having proper groupings probably needs a tree approach that contains order of groups

                if (!r.SourceID || !r.TargetID) {
                    invalidLinks++;
                    return
                }

                var data = {source: "" + r.SourceID, target: "" + r.TargetID, strength: r['Relationship Strenght']}


                links.push(data)

            }, function onComplete() {

                console.log("invalid links while loading csv:" + fileName2, invalidLinks)
                console.log("valid links:", links)

            })


            Promise.all([nodesPromise, linksPromise])
                .then(function () {


                    defaultLoadSuccess(_, {
                        expanded: ["United States"],
                        nodes: nodes,
                        links: links,
                        isRealData: true
                    }, alternativehandler)

                    if (onLoadSuccess)
                        onLoadSuccess(Graph)


                });


        };
        loadCSV.description = "<em>" + fileName + " " + fileName2 + "</em>";
        return loadCSV;


    }


    function defaultLoadSuccess(_, data, alternativehandler) {


        if (data.nodes.length > 1000)
            openGraphConfirmDialog("filename.filetodo", data.nodes.length, function acceptCallback() {

                defaultLoadHandler(_, data, alternativehandler)

            })
        else
            defaultLoadHandler(_, data, alternativehandler)

    }


    function defaultLoadHandler(_, data, alternativehandler) {
        const nodes = {};


        data.nodes.forEach(node => {
            nodes["" + node.id] = node
        }); // Index by ID


        var alpha = (typeof data.alpha == "number") ? data.alpha : undefined

        const expanded = {};
        if (data.expanded)
            data.expanded.forEach(e => {
                expanded[e] = true
            });


        if (!data.links) {
            console.warn("graph does not contain links")
            data.links = []

        }

        var alteredLinks = data.links.map(link => [link.source, link.target])


        var invalidLinks = 0
        alteredLinks = alteredLinks.filter(function (link) {
            if (!link[0] || !link[1]) {
                invalidLinks++
                return
            }
            return link
        });

        console.log("invalid links after loading", invalidLinks)


        let mGraphData = {
            nodes: nodes,
            links: alteredLinks,// net.links.map(link => [link.source, link.target]),
            expand: expanded,
            alpha: alpha,
            hasCountryGroups: data.isRealData
        }

        //TODO refactor loading .. currently this is quite messy..
        if (typeof alternativehandler == "function")
            alternativehandler(mGraphData)
        else
            throw new Error("using deprecated approach with only one graph instance. use alternativehandler property instead")


    }


    var url = new URL(window.location.href);
    var c = url.searchParams.get("countries");
    let extraCountriesTODO
    if (c) extraCountriesTODO = c.replace(new RegExp("_", "gi"), " ")

    return [
        // queryDatabase(getCountryQueryDB(extraCountriesTODO),alterDBResponse),
        //   queryDatabase(getCountryQueryDB(extraCountriesTODO ? extraCountriesTODO : "France,Taiwan"),alterDBResponse),


        //   queryDatabase(getCountryQuery(extraCountriesTODO)),
        //  queryDatabase(getCountryQuery(extraCountriesTODO ? extraCountriesTODO : "France,Taiwan")),


        loadRealDataSampleOnly("assets/realDataNodesv5_ticker.csv", "assets/realDataLinksv5.csv", function (graph) {
        }),
        loadRealDataSampleOnly("assets/realDataNodesv1_with_ticker.csv", "assets/realDataLinksv1.csv", function (graph) {
        }),
        //loadRealDataSampleOnly("assets/realDataNodesv1.csv","assets/realDataLinksv1.csv",function(graph){graph.numSkipEdgesRendered(1)  }),
        //loadRealDataSampleOnly("assets/realDataNodes.csv","assets/realDataLinks.csv",function(graph){graph.numSkipEdgesRendered(20)  }),

        defaultLoadFile("assets/miserables.json"),
        defaultLoadFile("assets/orig.json"),
        defaultLoadFile("assets/collapse_test.json"),
        defaultLoadFile("assets/miserables_fixed.json"),
        defaultLoadFile("assets/blocks.json"),
        defaultLoadFile("assets/blocks_fixed.json")
    ];
}


/***/ }),
/* 117 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ModeSelect_css__ = __webpack_require__(313);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ModeSelect_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__ModeSelect_css__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__cluster_configs_Extendend2DGraphConfig__ = __webpack_require__(128);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__cluster_configs_Default3DGraphConfig__ = __webpack_require__(32);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__cluster_configs_Default2DGraphConfig__ = __webpack_require__(64);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_jquery__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4_jquery__);







class ModeSelect extends HTMLElement {

    constructor(...args) {
        super(...args);

    }


    addModeBtn(caption, mode, bSelected) {

        var that = this

        if (!(mode instanceof __WEBPACK_IMPORTED_MODULE_2__cluster_configs_Default3DGraphConfig__["a" /* default */])) throw new Error("must be instanceof Default3DGraphConfig")


        function selectBtn(btn) {
            btn.parent().find(".selected").removeClass("selected")
            btn.addClass("selected")

        }

        let modeBtn = __WEBPACK_IMPORTED_MODULE_4_jquery__("<span>").html(caption).on("click", onModeClick);

        if (bSelected) {

            that.prevMode == caption
            modeBtn.addClass("selected")
        }

        function onModeClick() {

            let main = __WEBPACK_IMPORTED_MODULE_4_jquery__("sample-cluster-application").get(0)

            if (that.prevMode == caption) return;//  prevMode = mode;


            mode.setView(main.getCurrentView()).setMode(function () {

                that.prevMode = caption

                selectBtn(modeBtn)

            }.bind(this));

        }

        __WEBPACK_IMPORTED_MODULE_4_jquery__(this).append(modeBtn)

    }

    connectedCallback() {

        this.addModeBtn("3D", new __WEBPACK_IMPORTED_MODULE_2__cluster_configs_Default3DGraphConfig__["a" /* default */](), true)
        this.addModeBtn("2D", new __WEBPACK_IMPORTED_MODULE_3__cluster_configs_Default2DGraphConfig__["a" /* default */]())
        this.addModeBtn("2D+", new __WEBPACK_IMPORTED_MODULE_1__cluster_configs_Extendend2DGraphConfig__["a" /* default */]())

    }
}


customElements.define("mode-select", ModeSelect);

/***/ }),
/* 118 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(176);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {}
options.transform = transform
// add the styles to the DOM
var update = __webpack_require__(6)(content, options);
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../node_modules/css-loader/index.js!./force-graph.css", function() {
			var newContent = require("!!../node_modules/css-loader/index.js!./force-graph.css");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),
/* 119 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(177);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {}
options.transform = transform
// add the styles to the DOM
var update = __webpack_require__(6)(content, options);
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../node_modules/css-loader/index.js!./style.css", function() {
			var newContent = require("!!../node_modules/css-loader/index.js!./style.css");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),
/* 120 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(178);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {}
options.transform = transform
// add the styles to the DOM
var update = __webpack_require__(6)(content, options);
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../../node_modules/css-loader/index.js!./SampleClusterApplication.css", function() {
			var newContent = require("!!../../node_modules/css-loader/index.js!./SampleClusterApplication.css");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),
/* 121 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Created by Frank on 08.06.2017.
 */

class BaseEdge {

    //FIXME fix offset of edges or add to rootcluster maybe? with offset per cluster? ...

    constructor(start, end) {

        this.mStart = start;
        this.mEnd = end;

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
/* 122 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__utils_AnimationMixin__ = __webpack_require__(73);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__utils_DomEventsAlt__ = __webpack_require__(70);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_three__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_lodash__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_lodash___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3_lodash__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_mousetrap__ = __webpack_require__(62);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_mousetrap___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4_mousetrap__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_jquery__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_5_jquery__);
/**
 * Created by Frank on 02.06.2017.
 */












/**
 * simple node implementation for interaction and basic visualisation
 *
 */
class BaseNode extends __WEBPACK_IMPORTED_MODULE_2_three__["Mesh"] {

    constructor(view) {


        BaseNode.initStatic()

        var material = new __WEBPACK_IMPORTED_MODULE_2_three__["MeshBasicMaterial"]({
            color: 0xffffff,
            // wireframe: true,
            visible: true,
            opacity: 0.01,
            side: __WEBPACK_IMPORTED_MODULE_2_three__["BackSide"],
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


        this.mCustomEvents = __WEBPACK_IMPORTED_MODULE_5_jquery__({})


        this.addDefaultHandlers();

        //custom events container

        //keyboard events container
        // TODO to be able to use event bubbling we'd need to append the html elements to the one of the parent cluster
        this.mKeyboardEvents = new __WEBPACK_IMPORTED_MODULE_4_mousetrap__(document.createElement("span"));


        //add animate method via mixin
        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__utils_AnimationMixin__["a" /* default */])(this)


    }

    static initStatic() {
        if (BaseNode._static_initialised_) return

        //BaseNode.sphereGeometry = new THREE.SphereGeometry(1, 3, 2);
        BaseNode.sphereGeometry = new __WEBPACK_IMPORTED_MODULE_2_three__["SphereGeometry"](10, 10, 5);
        BaseNode.emptyGeometry = new __WEBPACK_IMPORTED_MODULE_2_three__["Geometry"]();
        BaseNode.emptyGeometry.boundingSphere = new __WEBPACK_IMPORTED_MODULE_2_three__["Sphere"](new __WEBPACK_IMPORTED_MODULE_2_three__["Vector3"], 1);


        BaseNode.lastSelectedNode = null;

        BaseNode.lastHoveredNode = null;

        //FIXME set camera and domElement not via env attribute ...
        // BaseNode.domEvents = new THREEx.DomEvents(/*camera, renderer.domElement*/)
        // BaseNode.domEvents = globalEnv.domEvents


        BaseNode._static_initialised_ = true


        //have one gloabal listener for all nodes and let them
        __WEBPACK_IMPORTED_MODULE_5_jquery__(window).on("keydown", function (e) {
            if (!BaseNode.lastHoveredNode) return

            BaseNode.lastHoveredNode.resolveKeyEvent(e)

        });


    }

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
        return __WEBPACK_IMPORTED_MODULE_1__utils_DomEventsAlt__["a" /* default */].eventNames.indexOf(eventName) >= 0
    }

    //------------------------------------------------
    onCustomEvent(eventName, eventhandler) {
        this.mCustomEvents.on(eventName, eventhandler.bind(this))
    }

    //------------------------------------------------


    // we need a single window keyup listener that listens for keyevents and forwards/triggers
    // them on the current element similar to how the mouse events do

    offCustomEvent(eventName, eventhandler) {
        this.mCustomEvents.off(eventName, eventhandler)
    }

    triggerCustomEvent(eventName, origDomEvent, intersect) {
        this.mCustomEvents.trigger(eventName, origDomEvent, intersect)
    }

    //Note: the current implementation only triggers keypresses every 300 ms
    onKey(eventName, eventhandler) {
        let handler = __WEBPACK_IMPORTED_MODULE_3_lodash__["throttle"](eventhandler.bind(this), 300)

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


    //---------------end of event definition part----------------------

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

    addDefaultHandlers() {


        //store the current cluster/node
        //TODO mouseover seems not to work correct  if a childcluster was hovered before

        this.on("mouseover", function (e) {
            e.stopPropagation()
            BaseNode.lastHoveredNode = e.target

        })

        this.on("mouseout", function (e) {
            //reset hover state to work if child element was selected
            BaseNode.lastHoveredNode = null;
            e.stopPropagation()

        })


        // adding before-render event

        function onBeforeRender() {
            this.trigger("before-render", null, arguments)

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
/* 123 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__EdgesContainer__ = __webpack_require__(124);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__particles_NodesParticleSystem__ = __webpack_require__(131);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__particles_ParticleNodeGroup__ = __webpack_require__(132);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__lib_Tween__ = __webpack_require__(27);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__lib_Tween___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3__lib_Tween__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_three__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_lodash__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_lodash___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_5_lodash__);
/**
 * Created by Frank on 30.05.2017.
 */












class ClusterLeafElement extends __WEBPACK_IMPORTED_MODULE_4_three__["Mesh"] {
    constructor(nodes, domEvents) {
        super();

        this.mDomEvents = domEvents


        this.mNodes = nodes;

        this.bNodesVisible = true;
        this.bEdgesVisible = true;
        this.mNodeParticles = this.createParticleNodeCloud();


        this.addNodeCloudInteractions(this.mNodeParticles)

        this.add(this.mNodeParticles.pointCloud);


        //add edges to the leaf
        this.createEdgesFromNodes(nodes);


        // add the nodes to the leaf
        this.appendNodes(nodes);


    }

    addNodeCloudInteractions(pcWrapper) {
        var that = this
        //TODO handle node size in here?
        //TODO all DomEventsAlt.eventNames
        //current ccs3dclasses are bound to node mesh itself..


        //on node click => highlight node and such => add cssclass
        //? how to forward existing behaviour from nodes to pointcloud?


        pcWrapper.pointCloud.raycast = ( function () {


            var inverseMatrix = new __WEBPACK_IMPORTED_MODULE_4_three__["Matrix4"]();
            var ray = new __WEBPACK_IMPORTED_MODULE_4_three__["Ray"]();
            var sphere = new __WEBPACK_IMPORTED_MODULE_4_three__["Sphere"]();

            return function raycast(raycaster, intersects) {

                if (this.visible == false)
                    return


                var object = this;
                var geometry = this.geometry;
                var matrixWorld = this.matrixWorld;
                var threshold = raycaster.params.Points.threshold;

                // Checking boundingSphere distance to ray

                if (geometry.boundingSphere === null) geometry.computeBoundingSphere();

                sphere.copy(geometry.boundingSphere);
                sphere.applyMatrix4(matrixWorld);
                sphere.radius += threshold;

                if (raycaster.ray.intersectsSphere(sphere) === false) return;

                //

                inverseMatrix.getInverse(matrixWorld);
                ray.copy(raycaster.ray).applyMatrix4(inverseMatrix);


                //param size is threshold in original implementation
                var that = this;

                function thresholdFromSize(size) {
                    var mLocalThreshold = size / ( ( that.scale.x + that.scale.y + that.scale.z ) / 3 );
                    var mThresholdSq = mLocalThreshold * mLocalThreshold;
                    return mThresholdSq
                }


                var position = new __WEBPACK_IMPORTED_MODULE_4_three__["Vector3"]();

                function testPoint(point, index, size = 1) {

                    var rayPointDistanceSq = ray.distanceSqToPoint(point);

                    if (rayPointDistanceSq < thresholdFromSize(size)) {

                        var intersectPoint = ray.closestPointToPoint(point);
                        intersectPoint.applyMatrix4(matrixWorld);

                        var distance = raycaster.ray.origin.distanceTo(intersectPoint);

                        if (distance < raycaster.near || distance > raycaster.far) return;

                        /*                        intersects.push({

                                                    distance: distance,
                                                    distanceToRay: Math.sqrt(rayPointDistanceSq),
                                                    point: intersectPoint.clone(),
                                                    index: index,
                                                    face: null,
                                                    object: object

                                                });
                        */

                        let n = pcWrapper.nodes[index]
                        if (!n || !n.get3DRoot) {
                            console.warn("ClusterLeaf Node Element not initialised properly")
                            return

                        }


                        //TODO unclear
                        function getDepthForDomEventsAlt(el) {

                            var depth = 0;

                            while (el = el.parent) {
                                depth++;
                            }
                            return depth
                        }


                        let node = n.get3DRoot()
                        let newDepth = getDepthForDomEventsAlt(pcWrapper.pointCloud) + 1

                        intersects.push({
                            depth: newDepth,
                            distance: distance,
                            distanceToRay: Math.sqrt(rayPointDistanceSq),
//                            point: intersectPoint.clone(),
//                            index: index,
                            face: null,
                            object: node

                        });


                    }

                }

                if (geometry.isBufferGeometry) {

                    var index = geometry.index;
                    var attributes = geometry.attributes;
                    var positions = attributes.position.array;

                    var sizes = attributes.size ? attributes.size.array : [];


                    if (index !== null) {

                        var indices = index.array;

                        for (var i = 0, il = indices.length; i < il; i++) {

                            var a = indices[i];

                            position.fromArray(positions, a * 3);

                            testPoint(position, a, sizes[a]);

                        }

                    } else {

                        for (var i = 0, l = positions.length / 3; i < l; i++) {

                            position.fromArray(positions, i * 3);

                            testPoint(position, i, sizes[i]);

                        }

                    }

                } else {

                    var vertices = geometry.vertices;

                    for (var i = 0, l = vertices.length; i < l; i++) {

                        testPoint(vertices[i], i, threshold); //for non-buffer gemoetries we use the global threshold

                    }

                }

            };

        }() )

        /*
                pcWrapper.on("click dblclick mouseover mousemove", function (e) {

                  //  e[0].stopPropagation()
                    //  this.show()

        //FIXME forward events view::domeevents notify (event, this ...)


                    //this contains the node which has been clicked


                })

                //TODO mouseout this missing
                pcWrapper.on("mouseout", function (e) {

                    //    that.mNodeMeshes.remove(this._bubble);
                    //    this.trigger (e.type, e.intersect, this)

                })
        */

    }


    setParticlesVisible(bVisible) {

        this.mParticles.pointCloud.visible = bVisible

    }

    setNodesVisible(bVisible) {
        this.bNodesVisible = bVisible;
        this.mNodeParticles.pointCloud.visible = bVisible

    }

    setEdgesVisible(bVisible) {


        this.bEdgesVisible = bVisible;
        this.mEdgesContainer.visible = bVisible;
    }


    getView() {

        return this.getParentCluster().getView()

    }

    getRoot() {

        return this.getParentCluster().getRoot()

    }

    getParentCluster() {
        let expContainer = this.parent;
        if (expContainer) return expContainer.parent


    }


    setLOD(levelOfDetail) {
        console.error("!!!FIXME!!! setLOD")
        return  //FIXME interferes with collapse feature not showing anything while in transition

        if (this.mNodeParticles)
            if (this.getParentCluster().useLOD)
                this.mNodeParticles.pointCloud.visible = this.bNodesVisible ? levelOfDetail > 0.3 : false;
            else
                this.mNodeParticles.pointCloud.visible = levelOfDetail > 0.75;
        //TODO nodes,edges, ... as well

        let edgeFadeLOD = 0.3;
        let crossfade = 0.2;//TODO add crossfade

        if (this.mEdgesContainer) {

            this.mEdgesContainer.visible = this.bEdgesVisible ? levelOfDetail > 0.75 : false;// levelOfDetail >= edgeFadeLOD;

            this.mEdgesContainer.mEdges.material.opacity = 0.04//levelOfDetail/4// (levelOfDetail - edgeFadeLOD) / edgeFadeLOD;
        }

        /*   if (this.mEdgesContainer2) {

               this.mEdgesContainer2.visible = levelOfDetail < edgeFadeLOD;

               this.mEdgesContainer2.mEdges.material.opacity = 1 - levelOfDetail / edgeFadeLOD;
           }*/


        if (this.mNodeMeshes)
            this.mNodeMeshes.visible = levelOfDetail > 0.2;


        if (this.mParticles) {

            let scale = Math.cbrt(levelOfDetail)
            if (scale < 0.1) scale = 0.1 //make sure that at all times at least 10pct of particles per leaf are rendered
            if (scale > 0.8) scale = 1
            let max = Math.floor(scale * this.mParticles.particleCount)
            this.mParticles.pointCloud.geometry.setDrawRange(0, max)

        }

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
            this.mNodeMeshes = new __WEBPACK_IMPORTED_MODULE_4_three__["Object3D"];
            this.add(this.mNodeMeshes)

        }

//adding invisible node meshes for domEvents
// TODO use the point cloud itself for events to prevent potential unnecessary bindings?

        var that = this.mNodeMeshes;//this;
        __WEBPACK_IMPORTED_MODULE_5_lodash__["each"](nodes, function (node) {

            //TODO change the way parent gets set
            node._parent = that  //set a parent element to the placeholder mesh
            // if (node && node._bubble)
            //     that.add(node._bubble)


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
    setDistributionHandler(distribution, onComplete = () => 0, onStep = () => 0) {

        var that = this;
        distribution.setNodes(this.mNodes, function (vec, i) {

            let n = that.mNodes[i];
            if (n._bubble) n._bubble.position.set(n.x, n.y, n.z);

            //check f particles are still valid and not being cleaned up for example
            if (that.mNodeParticles)
                that.mNodeParticles.updateNodePosition(i);

        }, function _onStep() {

            onStep()
        }, function () {
            that.updateEdges();
//FIXME init dot particles if (root)cluster is done animating?
            //FIXME update color of particles only for clusters that need an update
            //by adding a timeout the color is yellow again because the event triggered is too early
            setTimeout(() => that._initDotParticles(), 50);

            onComplete()


        });

    }

    updateEdges() {


        if (this.mEdgesContainer)
            this.mEdgesContainer.updateEdges();

        //  if (this.mEdgesContainer2)
        //     this.mEdgesContainer2.updateEdges();

    }

    updateDots(time) {
        if (this.mParticles)
            this.mParticles.update(time);
    }


    getDOMEvents() {
        return this.mDomEvents

    }

    /**
     * creates a structure that contains a point cloud for the nodes for mre effiecient rendering
     *
     * @returns {{nodes, pointCloud, updateCrossFade, update, updateNode, updateNodePosition, updateNodeColor, updateNodeSize, on, remove}|*}
     */

    createParticleNodeCloud() {

        let domEvents = this.getDOMEvents()

        var elem = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__particles_ParticleNodeGroup__["a" /* default */])(this.mNodes, {
            nodeDefaultSize: 10,
            nodeDefaultScale: 10,
            nodeTexture: "img/dot7.png"
        }, domEvents);


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
                easing: __WEBPACK_IMPORTED_MODULE_3__lib_Tween___default.a.Easing.Exponential.Out,
                position: {
                    x: (__WEBPACK_IMPORTED_MODULE_5_lodash__["random"](0, 2) - 1) * __WEBPACK_IMPORTED_MODULE_5_lodash__["random"](50000, 150000),
                    y: (__WEBPACK_IMPORTED_MODULE_5_lodash__["random"](0, 2) - 1) * __WEBPACK_IMPORTED_MODULE_5_lodash__["random"](50000, 150000),
                    z: 0
                }
            };

            if (!nodes) //FIXME this only works that way because to realData is not generated properly
                demoOptions.npc = function (n) {

                    return n.itemCount || 5
                    //return 5
                };


            //TODO refactor force-graph-utils

            var particles = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__particles_NodesParticleSystem__["a" /* default */])(nodes, demoOptions);
            this.add(particles.pointCloud);


            //TODO this timeout currently fixes wrong positioning bug..
            setTimeout(function () {
                particles.start();
            }, 500);

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
/* 124 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__BaseEdge__ = __webpack_require__(121);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__EdgeUtil__ = __webpack_require__(34);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_three__ = __webpack_require__(1);
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

class EdgesContainer extends __WEBPACK_IMPORTED_MODULE_2_three__["Object3D"] {
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
            var adjustedPos = new __WEBPACK_IMPORTED_MODULE_2_three__["Vector3"];

            return {
                position: adjustedPos,
                update: function () {

                    if (!node.getParentCluster()) return; //not connected
                    if (!internalOtherNode.getParentCluster()) return; //not connected

                    adjustedPos.setFromMatrixPosition(node.getParentCluster().matrixWorld);
                    //setFromMatrix
                    adjustedPos.add(nPos);
                    let other = new __WEBPACK_IMPORTED_MODULE_2_three__["Vector3"];
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

        var line_geom = new __WEBPACK_IMPORTED_MODULE_2_three__["Geometry"]();
        var lineMaterial;
        var mergedLineMesh;

        function initLineGroup(options) {


            let defaults = {
                opacity: 0.01,
                transparent: true,
                //lineIsVisible:true, // if disabled the line won't be shown on the scene
                color: 0xffffff
            };

            options = _.extend(defaults, options);

            lineMaterial = new __WEBPACK_IMPORTED_MODULE_2_three__["MeshBasicMaterial"]({
                color: options.color,
                transparent: options.transparent,
                opacity: options.opacity,
                depthTest: true,
                depthWrite: false
            });


            mergedLineMesh = new __WEBPACK_IMPORTED_MODULE_2_three__["Line"](line_geom, lineMaterial, __WEBPACK_IMPORTED_MODULE_2_three__["LineSegments"]);


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
/* 125 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__refactor_f0_nodemixin__ = __webpack_require__(135);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__refactor_f1__ = __webpack_require__(26);
/**
 * Created by Frank on 11.06.2017.
 */





class GraphData {

    constructor(graphData) {

        this.mGraphData = graphData
    }

    getClonedRawNodes() {
        var mNodes = {};

        _.each(this.mGraphData.nodes, function (node, id) {
            mNodes[id] = _.extend({x: 0, y: 0, z: 0}, node)
        });


        this.mDataNodeCopy = mNodes;


        // Build graph with data
        var d3Nodes = [];
        for (let nodeId in mNodes) { // Turn nodes into array
            const node = mNodes[nodeId]; // _.extend({},mNodes);
            node._id = nodeId;
            d3Nodes.push(node);
        }
        return d3Nodes

    }

    getAlteredRawLinks() {
        var mDataNodeCopy = this.mDataNodeCopy;

        var links = this.mGraphData.links;

        //FIXME this sets src and dst to the graph data nodes but it should instead link to the cloned nodes so no interference occures
        var d3Links = links.map(link => {
            return {
                source: mDataNodeCopy[link[0]],
                target: mDataNodeCopy[link[1]]
            };
        });

//TODO again invalid links are discared this time because of the database that send potentially invalid edges that lead to other potentially already existing notes if the whole structure is streamed in the near future
        d3Links = d3Links.filter(l => {
            return l.source && l.target ? l : undefined;
        });


        return d3Links


    }

    createClusterNodesAndEdges(view3d) {

        //see ForceGraph
        //TODO minimal env options to create a node
        var env = {
            nameAccessor: node => node.name || node.id,
            colorAccessor: node => node.color,
            valAccessor: node => node.val,

            sizeAccessor: node => node.itemCount,

            nodeRelSize: 4,
            // useDebugSphere:true,
            domEvents: view3d.mDomEvents
        };


        var d3Nodes = this.getClonedRawNodes();

        if (!d3Nodes.length) {
            return;
        } //if no data is present return for now


        var d3Links = this.getAlteredRawLinks();


        // Add WebGL objects
        d3Nodes.forEach(node => {

            node = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__refactor_f0_nodemixin__["a" /* default */])(env, node);
            //   node._bubble.name = env.nameAccessor(node) || '';
            //   node.size=env.sizeAccessor(node) || undefined;


        });

        //-----------------------------------------------


        //----------------------


        //nodes are prepared by previous step ? TODO which one was that? for further altering
        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__refactor_f1__["b" /* extendGraphElements */])(d3Nodes, d3Links, env);


        return {nodes: d3Nodes, edges: d3Links}

    }

    //--------------------------------------------


    /**
     * TODO refactor line group into stand alone class to be used per-cluster
     *
     *
     *
     */
    /*
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

  */


}
/* harmony export (immutable) */ __webpack_exports__["a"] = GraphData;


/***/ }),
/* 126 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Cluster3DExtended__ = __webpack_require__(63);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__text_ClusterTextOverlay__ = __webpack_require__(137);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__utils_DefaultColorScheme__ = __webpack_require__(69);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__refactor_SpecificDataUtils__ = __webpack_require__(23);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_jquery__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4_jquery__);
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

    constructor(...args) {
        super(...args)

        this.useClusterText = true;


        //TODO have an actual event triggered for when sub-clusters are distributed to adjust elements
        // setTimeout(()=> this.onAfterClusteredAndDistributed(),5000)
        // "cluster-ready" as alternative event
        this.on("hull-updated", function () {


            this.findClusters("*").forEach(function (cluster) {
                cluster.useLOD = true
            })


        })

        this.addColorHandler()


    }

    addListeners() {

        super.addListeners();


        this.on("u", e => {
            e.stopPropagation();

            this.useClusterText = !this.useClusterText;
            console.log("useClusterText", this.useClusterText)
        });

    }


    addColorScheme(cs) {

        if (!cs instanceof __WEBPACK_IMPORTED_MODULE_2__utils_DefaultColorScheme__["a" /* default */]) {
            console.warn("set proper color scheme")
        }


        this.mColorScheme = cs


    }


    addColorHandler() {

        var nodes = this.mNodes;
        var that = this


        function getCountryNamesFromNodes(nodes) {
            var res = {}
            _.each(nodes, (n) => res[n.group] = true)

            return Object.keys(res)
        }


        function updateParticles(leaf) {


            if (leaf && leaf.mParticles) {

                leaf.mParticles.updateColors();


            }
            else setTimeout(() => updateParticles(leaf), 100)
        }


        var countryNames = null;

        __WEBPACK_IMPORTED_MODULE_4_jquery__(window).on("node-color-change", function (e, val) {


            if (!countryNames) countryNames = getCountryNamesFromNodes(nodes)

            var helper = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3__refactor_SpecificDataUtils__["b" /* computeGroupNodeColorHelper */])(countryNames)


            //   var val=$sel.val()
            if (val == "group")
                nodes.forEach(function (v) {
                    v.color = helper.getColor(v.group)
                });
            else
                nodes.forEach(function (v) {
                    v.color = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3__refactor_SpecificDataUtils__["c" /* computeCompanyNodeColor */])(parseInt(v.sent), val)
                })

            _.each(that.getLeafs(), function (leaf) {


                leaf.mNodeParticles.update()


                updateParticles(leaf)


            })


        })


    }


    /**
     * @override
     * prevent multiple recursive  root clusters from being created by default
     */

    getChildClusterConstructor() {
        return __WEBPACK_IMPORTED_MODULE_0__Cluster3DExtended__["a" /* default */];

    }


    /**
     * attaches to root cluster to a specific View3D element to be able to perform container based operations
     *
     *
     */
    attachToView3D(view3D) {
        this.mParentView = view3D


    }


    resetTextOverlay() {


        if (this.mTextOverlay) this.mTextOverlay.remove()

        this.mTextOverlay = __WEBPACK_IMPORTED_MODULE_4_jquery__("<cluster-text-overlay>");

        __WEBPACK_IMPORTED_MODULE_4_jquery__(this.mParentView).append(this.mTextOverlay)

    }


    isLocked() {

        return this.mLock == true

    }

    setLock(bLocked = true) {

        return this.mLock = bLocked

    }


    applyClustering(mClusteringSpeccsArray, overrideExpand = false) {

        //FIXME transitions betweens graphs
        //this.storeParentPositionInNodes()
        super.applyClustering(mClusteringSpeccsArray, overrideExpand)

        this.resetTextOverlay()


        // this.restoreNodePositionFromExParent()
    }


}
/* harmony export (immutable) */ __webpack_exports__["a"] = RootCluster;


/***/ }),
/* 127 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__SampleClusterApplication_css__ = __webpack_require__(120);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__SampleClusterApplication_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__SampleClusterApplication_css__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__css_style_css__ = __webpack_require__(119);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__css_style_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__css_style_css__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__css_force_graph_css__ = __webpack_require__(118);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__css_force_graph_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2__css_force_graph_css__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__gui_searchbar__ = __webpack_require__(61);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__refactor_SpecificDataUtils__ = __webpack_require__(23);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__refactor_AppDataService__ = __webpack_require__(60);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__view_GraphView3D__ = __webpack_require__(33);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__gui_ModeSelect__ = __webpack_require__(117);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__data_CompanyNewsDS__ = __webpack_require__(115);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__data_data_set_loader__ = __webpack_require__(116);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_10__configs_Default3DGraphConfig__ = __webpack_require__(32);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_11_mousetrap__ = __webpack_require__(62);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_11_mousetrap___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_11_mousetrap__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_12_jquery__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_12_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_12_jquery__);























/**
 *  TODO re-structure graph
 * -into graph + subgraphs or simply multiple graphs
 * -each graph may have distribution class/function which handles the layouting of the node/edges
 * -for example a node-set might divided into different sub-sets depending on current assosiations
 *  they may further contain sub-sets
 * - for rendering, these sets are going to be put into a container class like the "nodeClouds"
 * so a "nodesContainer" and a nodesClusterContainer will be needed which also have the distribution function

 * NOTE: currently used for debugging purposes..
 * TODO should receive a mayor overhaul, if used for production
 */


class SampleClusterApplication extends HTMLElement {


    // noinspection JSUnusedGlobalSymbols
    connectedCallback() {

        let datasets = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_9__data_data_set_loader__["a" /* getGraphDataSets */])()

        this.setDataSets(datasets);
        this.setupViews()

        this.addNewsListeners()


        __WEBPACK_IMPORTED_MODULE_12_jquery__(this).append("<graph-hud></graph-hud>")


    }


    addNewsListeners() {

        console.error("fixme addNewsListeners needs socket server and handler if server is not found")

        return
        var myDS = new __WEBPACK_IMPORTED_MODULE_8__data_CompanyNewsDS__["a" /* default */]('http://localhost:3000')

        myDS.onNewsReceived(function (news) {

        })

    }


    isDebug() {

        return window.location.hash == "#debug"

    }


    setupViews() {

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


            var container = __WEBPACK_IMPORTED_MODULE_12_jquery__("<div>")
                .css(containerCSS)//.hide()
                .appendTo("body");

            let title = __WEBPACK_IMPORTED_MODULE_12_jquery__("<div>press 'space' to toggle menu, 'double-click' elements to maximise </div>")
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


            __WEBPACK_IMPORTED_MODULE_11_mousetrap__["bind"]("space", toggleMenu);

            return container
        }

        var that = this;


        var container = createContainer();


        function createView(name = "View3D", speccs, isMaximised = false) {

            function maximiseView() {

                if (this.isMaximised()) {

                    __WEBPACK_IMPORTED_MODULE_12_jquery__(this)
                        .addClass("view-thumbnail")
                    return;
                }


                __WEBPACK_IMPORTED_MODULE_12_jquery__(this)
                    .removeClass("view-thumbnail")

                container.hide();

                let maximisedContainer = __WEBPACK_IMPORTED_MODULE_12_jquery__(that) //$("#3d-graph");
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
                mGraphView.maxFPS = 55;

            }

            mGraphView.showFPSCounter = that.isDebug();


            __WEBPACK_IMPORTED_MODULE_12_jquery__(mGraphView)
                .addClass("view-thumbnail")

            __WEBPACK_IMPORTED_MODULE_12_jquery__(mGraphView).on("dblclick", maximiseView);


            mGraphView.setSpeccs(speccs);

            //TODO per view ... mGraphView.mRenderer.domElement
            let events = new __WEBPACK_IMPORTED_MODULE_11_mousetrap__();


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
                __WEBPACK_IMPORTED_MODULE_12_jquery__(that).find("info-panel").toggle(infoVisible)


            });

            //FIXME
            if (isMaximised)
                maximiseView.bind(mGraphView)();
            /*$(mGraphView).on("loaded",function (){

             maximiseView.bind(mGraphView)()
             } );
             */

            __WEBPACK_IMPORTED_MODULE_12_jquery__(window).on("resize", _.throttle(function () {
                //TODO use native events

                if (!mGraphView.isMaximised()) return;

                __WEBPACK_IMPORTED_MODULE_12_jquery__(mGraphView).trigger("resize")
                //console.warn("TODO handle window resize + (f11)")
            }, 100));


            return mGraphView

        }


        let views = [];


        if (that.isDebug()) {


            //NOTE: target rendering

            var config = new __WEBPACK_IMPORTED_MODULE_10__configs_Default3DGraphConfig__["a" /* default */]()

            var speccs = config.getSpeccs()// this.getForceSpeccs();
            let view2 = createView("new force-graph", speccs, true)
                .loadDataSet(this.getDSByID(1));

            config.setView(view2)

            views.push(view2);


            //TODO views should only be loaded when visible


            /*

             let view3 = createView("node distribution test case",
             [{
             distribution: new BaseDistribution(2000, 3),
             options: { hull: new BoxVolume()}
             }])
             .loadDataSet(this.getDSByID(1))

             views.push(view3)
             */


            /*  var speccs = this.getPossibleClusterSpeccsArray();
             let view1 = createView("View1", speccs)
             views.push(view1)*/


        } else {


            var config = new __WEBPACK_IMPORTED_MODULE_10__configs_Default3DGraphConfig__["a" /* default */]()

            var speccs = config.getSpeccs()
            let view2 = createView("new force-graph", speccs, true)
                .loadDataSet(this.getDSByID(0));
            config.setView(view2)
            views.push(view2)


        }


        _.each(views, function (view) {
            if (__WEBPACK_IMPORTED_MODULE_12_jquery__(view).parent().length == 0)
                container.append(view)
        })


    }


    getSampleSpeccs() {


        //TODO check where a facade could be used to have more stable option generation
        //also possibly use options as attributes for the graph-view to be able to alter directly
        /*
        new ClusterSpeccFacade()
            .setGenerator(function countrySetGenerator(groupFunction, node) {
                groupFunction(node.group, node)
            })
            .setExpandedFunction(function(){
                return this.name=="United States"
            })

        */

    }


    setDataSets(datasets) {
        this.mDataSets = datasets;

    }


    getDSByID(id) {
        return this.mDataSets[id]
    }


    getCurrentView() {

        return __WEBPACK_IMPORTED_MODULE_12_jquery__(".view-3d.view-3d-maximised").get(0)

    }


}
/* harmony export (immutable) */ __webpack_exports__["SampleClusterApplication"] = SampleClusterApplication;


customElements.define("sample-cluster-application", SampleClusterApplication);



	

/***/ }),
/* 128 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__distributions_ForceGraphDistribution__ = __webpack_require__(24);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__hull_FlatVolume__ = __webpack_require__(68);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__Default2DGraphConfig__ = __webpack_require__(64);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_three__ = __webpack_require__(1);







class Extended2DGraphConfig extends __WEBPACK_IMPORTED_MODULE_2__Default2DGraphConfig__["a" /* default */] {


    constructor(target, backgroundColor = 0xFF0000) {

        super(target, backgroundColor)


    }


    setControls() {

        //TODO instead of setting true and false we should create new controls by cloning the current with default options
        let view = this.getView();


        view.mControls.target.set(new __WEBPACK_IMPORTED_MODULE_3_three__["Vector3"](0, 0, 0));
        view.mControls.noRotate = false;
        view.mControls.reset();


    }


    getSpeccs() {


        function groupNameForCustomers(node, size) {

            return node.children.length > size ? node.name : null

        }


        function findBiggerCompany(node) {


        }


        function bigCompanySetGenerator(groupFunction, node) {

            groupFunction(node.industry, node)
            return


            let grpName = groupNameForCustomers(node, 20);
            if (grpName)
                groupFunction(grpName, node)
            //else
            //   findBiggerCompany()
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


        let countryDistribution = new __WEBPACK_IMPORTED_MODULE_0__distributions_ForceGraphDistribution__["a" /* default */](60000, 2); // countries get placed equally on a plane of size 15k X 15k
        let industryDistribution = new __WEBPACK_IMPORTED_MODULE_0__distributions_ForceGraphDistribution__["a" /* default */](10000, 2);// industries within countries use the Force-Graph approach to position elements
        let nodesWithinIndustryDistribution = new __WEBPACK_IMPORTED_MODULE_0__distributions_ForceGraphDistribution__["a" /* default */](5000, 2);//same goes for the nodes within each industry

        //the final configuration for rendering
        //it contains an additional options attribute per array entry

        // @param options.minClusterSize ... is the lower bound for the nodes within the cluster
        // if the cluster has fewer elements all clusters previously generated are places within this "other" cluster
        // @param options. defaultMergeGroupName the name of the "other" cluster can be changed by this value
        // @param options.hull can be used to add a volume around the cluster
        //by default if no value gets set, the BaseVolume class is used which is invisible by default
        //but is necessary for other components like picking and tet rendering


        //   let rootHull = this.isDebug() ? BoxVolume : BaseVolume;


        return [

            /*  {
                  generator: bigCompanySetGenerator,
                  distribution: countryDistribution,
                  options: {
                      minClusterSize: 40,
                      hull: BaseVolume,// rootHull,
                      edges: ClusterMeshEdges,
                      colors: {
                          edge: [0x000000, 0.8],
                          hull: [0x6A5ACD, 0.8] //TODO maxOpacity for convexHull is a bit bugged.. initially its set correct but due to transfer it is changed again on hover

                      }
                  }
              },
              */

            /* {
                 generator: industrySetGenerator,
                 distribution: industryDistribution,
                 events: {
                     click: function () {
                         this.toggleCollapse()

                         console.log("toggled country?", this.name)
                     }
                 },
                 options: {
                     minClusterSize: 15,
                     hull: FlatVolume,//ConvexVolume,
                     edges: ClusterMeshEdges,
                     expanded: function () {
                         // return true
                         return this.name == "United States"
                     }
                 }// new BoxVolume() ConvexVolume//FIXME  this option is used twice for leaf and parent  and below is ignored
             }
             ,*/ {
                distribution: nodesWithinIndustryDistribution,
                events: {
                    click: function () {
                        //  this.toggleCollapse()
                        // console.log("toggled leaf", this.name)
                    },
                    mouseover: function () {

                        //  this.bClusterEdgesVisible= true

                    },
                    mouseout: function () {

                        //  this.bClusterEdgesVisible= false
                    }
                },
                options: {
                    hull: __WEBPACK_IMPORTED_MODULE_1__hull_FlatVolume__["a" /* default */],

                    expanded: function () {
                        return true
                        let par = this.getParentCluster()
                        if (!par) return false

                        return /*par.getParentCluster().name == "United States" &&*/ this.name == "Healthcare"// false //true// return false//

                    }
                }
            }

        ]

    }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = Extended2DGraphConfig;


/***/ }),
/* 129 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__utils_MaterialFadeMixin__ = __webpack_require__(19);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__ClusterBaseEdges__ = __webpack_require__(66);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_three_meshline__ = __webpack_require__(321);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_three_meshline___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_three_meshline__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__BaseCluster3D__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_three__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_lodash__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_lodash___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_5_lodash__);









/**
 * the default implementation for the cluster-to-neighboring-clusters edges
 *
 *
 * simple/fast/no width support (line width = 1)
 *
 */




class ClusterMeshEdges extends __WEBPACK_IMPORTED_MODULE_1__ClusterBaseEdges__["a" /* default */] {

    constructor(...args) {
        super(...args)

        this.smoothenWidth = true;
        this.minLinkStrength = 0
    }


    getDefaultMaterial(options) {


        let defaults = {
            opacity: 1.0,
            transparent: true,
            //lineIsVisible:true, // if disabled the line won't be shown on the scene
            color: 0x999999
        };

        options = __WEBPACK_IMPORTED_MODULE_5_lodash__["extend"](defaults, options);


        //TODO wireframe meshlines to check if minimal triangle count
        var material = new __WEBPACK_IMPORTED_MODULE_2_three_meshline__["MeshLineMaterial"]({
            lineWidth: 1,
            color: new __WEBPACK_IMPORTED_MODULE_4_three__["Color"](options.color),
            transparent: options.transparent,
            opacity: options.opacity,
            depthTest: true,
            depthWrite: false
        });

        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__utils_MaterialFadeMixin__["a" /* default */])(material);


        return material;

    }


    update() {


        //remove previously generated MeshLines

        for (var i = this.children.length - 1; i >= 0; i--) {
            this.remove(this.children[i]);
        }


        //------------------------------------

        let edges = this.createEdgesForClusters(this.mClusters);


        if (edges.length == 0) return

        var line_geom = new __WEBPACK_IMPORTED_MODULE_4_three__["Geometry"]();


        this.geometry.dispose();
        this.geometry = line_geom;

        var that = this
        var invalidEdges = [];


        //TODO sort and show only certain amount of edges based on relative size

        var orderedEdges = __WEBPACK_IMPORTED_MODULE_5_lodash__["orderBy"](edges, ['link_strength'], ['desc']);
        that.minLinkStrength = 0.4 * orderedEdges[0].link_strength;//set minLinkStrength to pass the test to 40% of biggest edge


        for (let edge of edges) {
            //TODO we should unify the edges to not always have 2 separate ways to access certain elements
            //TODO also we should use the center of the hull feature instead
            //FIXME for cluster: add edges only if mHull exists

            if (edge.link_strength < that.minLinkStrength) continue;

            let src, dst;

            let s, d;
            s = edge.source instanceof __WEBPACK_IMPORTED_MODULE_3__BaseCluster3D__["a" /* default */] ? edge.source : edge.source._el;
            d = edge.target instanceof __WEBPACK_IMPORTED_MODULE_3__BaseCluster3D__["a" /* default */] ? edge.target : edge.target._el;

            if (!s || !d) {
                invalidEdges.push(edge);
                continue
            }

            src = this.getPositionForElement(s);
            dst = this.getPositionForElement(d);

            //Note: currently there is no need to cut off edges because they are only drawn from src to dest
            //cut off dst at 50% because the element should occure twice
            // let l_50=dst.clone().sub(src).multiplyScalar(0.5)
            // dst.sub(l_50)

            // line_geom.vertices.push(src);
            //  line_geom.vertices.push(dst);

            //----------------------------------
            //TODO have an option to change the line implementation
            var geometry = new __WEBPACK_IMPORTED_MODULE_4_three__["Geometry"]();
            geometry.vertices.push(src);


            let widthFN;
            if (this.smoothenWidth == false)
                geometry.vertices.push(dst);
            else {

                // smoothing the line with like in the demo

                for (let i = 0; i <= 1; i += 0.1)
                    geometry.vertices.push(src.clone().lerp(dst, i));

                function parabola(x, k) {
                    return Math.pow(4 * x * ( 1 - x ), k);
                }

                widthFN = function widthFunction(p) {

                    return 1
                    // return 1 * parabola(p, 1)
                }
            }

            var meshLine = new __WEBPACK_IMPORTED_MODULE_2_three_meshline__["MeshLine"]();
            meshLine.setGeometry(geometry, widthFN);


            //TODO
            var material = new __WEBPACK_IMPORTED_MODULE_2_three_meshline__["MeshLineMaterial"]({
                lineWidth: edge.link_strength / 5 || 1, //TODO have a proper width
                color: new __WEBPACK_IMPORTED_MODULE_4_three__["Color"](0x333333),
                transparent: true,
                opacity: 0.5,

                depthTest: false,
                depthWrite: false
            });
            // var material = new MeshLineMaterial();


            //TODO material group for lineWidth feature + only one material
            //  material.copy(this.material);
            // material.lineWidth = edge.link_strength;


            if (edge.link_strength == undefined)
                console.error("edge does not have a link_strength''")


            var mesh = new __WEBPACK_IMPORTED_MODULE_4_three__["Mesh"](meshLine.geometry, material); // this syntax could definitely be improved!
            mesh.layers.set(1)

            this.add(mesh);


        }


        if (invalidEdges.length > 0)
            console.error("invalid edges", invalidEdges)


    }


}
/* harmony export (immutable) */ __webpack_exports__["a"] = ClusterMeshEdges;



/***/ }),
/* 130 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__BoxVolume__ = __webpack_require__(67);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__utils_MaterialFadeMixin__ = __webpack_require__(19);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_three__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__lib_ConvexGeometry__ = __webpack_require__(149);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__lib_QuickHull__ = __webpack_require__(150);
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
    myModifier(geometry, numSegments, margin) {

        let marginGeo = new __WEBPACK_IMPORTED_MODULE_2_three__["Geometry"]();

        for (let v of geometry.vertices) {
            let sphere = new __WEBPACK_IMPORTED_MODULE_2_three__["SphereGeometry"](margin, numSegments, numSegments);
            sphere.translate(v.x, v.y, v.z);

            marginGeo.merge(sphere, sphere.matrix)

        }


        let convexGeoWithMargin = new __WEBPACK_IMPORTED_MODULE_2_three__["ConvexGeometry"](marginGeo.vertices);


        return convexGeoWithMargin

    }


    getMaterial() {
        if (this.mMaterial) return this.mMaterial;


        let mat = this.mMaterial = new __WEBPACK_IMPORTED_MODULE_2_three__["MeshBasicMaterial"]({
            color: 0xffffff,
            opacity: 0.03,
            transparent: true,
            depthWrite: false,
            side: __WEBPACK_IMPORTED_MODULE_2_three__["BackSide"]
            //  ,   wireframe:true
        });

        this.mMaterial.visible = this.canBeVisible();


        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__utils_MaterialFadeMixin__["a" /* default */])(mat);

        //FIXME test if previous material exists and take its fade value to prevent flickering
        /*  if (this.mesh && this.mesh.material && this.mesh.material.fade)
              mat.fade = this.mesh.material.fade;
          else*/
        mat.fade = 0;

        mat.fadeTo(1, 2000);

        return this.mMaterial
    }


    createFromBoundingBox(vertices, boundingBox) {

        //adding a timestamp for the different lods of the mesh
        this.mTime = Date.now();

        let vert = vertices.filter(v => !(v.x == 0 && v.y == 0 && v.z == 0 ));

        if (vert.length < 4 && vertices.length > 4) {
            vertices = [];
            boundingBox.min = new __WEBPACK_IMPORTED_MODULE_2_three__["Vector3"](-1, -1, -1);
            boundingBox.max = new __WEBPACK_IMPORTED_MODULE_2_three__["Vector3"](1, 1, 1);

        }


        //ConvexGeometry does need at least 4 vertices
        //so in case we don't have as much we do use the boundingbox instead to generate some more vertices
        if (vertices.length < 4) {

            //test if the boudningBox is valid, else (f)make it so. this way it does not interrupt the work flow and generates a minimal hull
            //TODO   alternativly an empty Geometry would also be sufficient
            if (boundingBox.getSize().length() == 0)
                boundingBox.max.add(new __WEBPACK_IMPORTED_MODULE_2_three__["Vector3"](0.1, 0.1, 0.1));

            vertices = this.getVerticesFromBoundingBox(boundingBox);


        }

        //we will create a sphere geometry with a radius==margin for each vertice and merge them beforehand
        //reduce the vertice count before adding margin
        let geo0;
        try {

            //FIXME this currently fixes a bug when every point lies on the same plane
            //instead a 2d shape should be used if the mode is 2d
            if (vertices[0].x == 0) vertices[0].x = 0.1;
            if (vertices[0].y == 0) vertices[0].y = 0.1;
            if (vertices[0].z == 0) vertices[0].z = 0.1;

            geo0 = this.mGeometryZero = new __WEBPACK_IMPORTED_MODULE_2_three__["ConvexGeometry"](vertices);
        }
        catch (e) {
            geo0 = this.mGeometryZero = this.createBoxGeometryFromBoundingBox(boundingBox);
            console.warn(e, vertices)

        }


        this.mBoundingBox = boundingBox;


        //   let mesh = new THREE.Mesh(geo, mat);
        let mesh = new __WEBPACK_IMPORTED_MODULE_2_three__["Mesh"](this.geo0, this.getMaterial());

        mesh.geometry.boundingBox = boundingBox;
        mesh.geometry.boundingSphere = boundingBox.getBoundingSphere();

        //this part is to prevent an exception in the raycaster where position is not present but element initialised
        //TODO maybe change the element itself so it stays in a valid state
        var rc = mesh.raycast;
        mesh.raycast = function (raycaster, intersects) {

            if (this.geometry && this.geometry.attributes && !this.geometry.attributes.position)
                return;

            return rc.apply(this, arguments)

        };


        if (this.mesh) this.remove(this.mesh);
        this.mesh = mesh;
        this.add(mesh);

        return this.mesh;

    }

    createBoxGeometryFromBoundingBox(boundingBox) {
        let _center = boundingBox.getCenter();
        let _size = boundingBox.getSize();

        let box = new __WEBPACK_IMPORTED_MODULE_2_three__["BoxGeometry"](_size.x, _size.y, _size.z);

        box.translate(_center.x, _center.y, _center.z);
        return box;
    }

    getVerticesFromBoundingBox(boundingBox) {

        let box = this.createBoxGeometryFromBoundingBox(boundingBox);


        return box.vertices
    }


    //TODO
    transferFunction(x) {
        return x
    }


    createResolutionGeometry(name, resolution) {

        if (!this['geometry' + name] || this['geometry' + name].mTime != this.mTime) {

            let margin = this.mBoundingBox.getSize().length() / 10;

            let geo2 = this.myModifier(this.mGeometryZero, resolution, margin);
            geo2.computeBoundingBox();
            geo2.mTime = this.mTime;
            this['geometry' + name] = geo2;

        }
        return this['geometry' + name]
    }


    //TODO it is probably better to separate the LOD from the visiblility/opacity
    //
    setLOD(l) {

        if (l < 0) l = 0;
        if (l > 1) l = 1;

        var minOpacity = 0.00;

        function mTransfer(x) {
            //transfer function y= 0.5*sin(1.5*pi+x*pi*2)+0.5
            return 0.5 * Math.sin(1.5 * Math.PI + x * Math.PI * 2) + 0.5 + minOpacity


        }

        let y = mTransfer(l);

        super.setLOD(y * this.maxOpacity);


        /*     if (l < 0.8) this.mesh.geometry = this.geometryLowPoly;
         if (l >= 0.8 && l <= 0.95) this.mesh.geometry = this.geometryAveragePoly;
         if (l > 0.95) this.mesh.geometry = this.geometryHighPoly*/


        //FIXME initial C-V is to heavy to compute
        l = 0.1;

        if (l < 0.2)
            this.mesh.geometry = this.createResolutionGeometry("Least", 1);
        else if (l > 0.2 && l < 0.6)
            this.mesh.geometry = this.createResolutionGeometry("Low", 4);
        else if (l >= 0.6)
            this.mesh.geometry = this.createResolutionGeometry("Average", 6);


    }


    setActive() {
        this.maxOpacity = 0.4;
    }


    setInactive() {
        this.maxOpacity = 0.2;
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
/* 131 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = NodesParticleSystem;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__tweenjs_tween_js__ = __webpack_require__(154);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__tweenjs_tween_js___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__tweenjs_tween_js__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_three__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_lodash__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_lodash___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_lodash__);
//{groupKeyName:"group_data",groupValueName:"group_data",nodeKey:'size'}






function NodesParticleSystem(nodes, options) {


    function getParticleShaderMaterial() {
        var vertexShader = `
			
			attribute float size;
			attribute vec3 customColor;
			varying vec3 vColor;

			void main() {

				vColor = customColor;

				vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

				gl_PointSize = size * ( 300.0 / length( mvPosition.xyz ) );

				gl_Position = projectionMatrix * mvPosition;

			}
	`;


        var fragmentShader = `
			uniform vec3 color;
			uniform sampler2D texture;

			varying vec3 vColor;

			void main() {

				gl_FragColor = vec4( color * vColor, 1.0 );

				gl_FragColor = gl_FragColor * texture2D( texture, gl_PointCoord );
			}
	`;


        /*  var attributes = {

                   size:        { type: 'f', value: null },
                   customColor: { type: 'c', value: null },
                   //destination:        { type: 'f', value: null },

               };*/

        var uniforms = {

            color: {type: "c", value: new __WEBPACK_IMPORTED_MODULE_1_three__["Color"](0xffffff)},
            texture: {type: "t", value: new __WEBPACK_IMPORTED_MODULE_1_three__["TextureLoader"]().load("img/block.png")}

        };


        var shaderMaterial = new __WEBPACK_IMPORTED_MODULE_1_three__["ShaderMaterial"]({

            uniforms: uniforms,
            // attributes:     attributes,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,

            //blending:       THREE.AdditiveBlending,
            //depthTest:      false,
            //transparent:    true

        });


        return shaderMaterial

    }


    options = __WEBPACK_IMPORTED_MODULE_2_lodash__["extend"]({
        groupKeyName: "isGroupNode",
        groupValueName: "nodes",
        nodeKey: 'itemCount',
        increment: 5,
        duration: 1000,
        easing: __WEBPACK_IMPORTED_MODULE_0__tweenjs_tween_js___default.a.Easing.Linear.None,
        position: {x: 0, y: 50000, z: 50000}
    }, options)


    function getNodeParticleCount(node) {

        if (node[options.groupKeyName])
            return __WEBPACK_IMPORTED_MODULE_2_lodash__["sumBy"](node[options.groupValueName], options.nodeKey)
        else return node[options.nodeKey] || 0

    }


    //TODO demo purpose
    if (typeof options.npc == "function")
        getNodeParticleCount = options.npc


    var shaderMaterial = getParticleShaderMaterial()
    var particlesPerNode = nodes.map((n) => getNodeParticleCount(n))
    //console.log("particles per node:",particlesPerNode)
    var particles = __WEBPACK_IMPORTED_MODULE_2_lodash__["sum"](particlesPerNode)


    var positions = new Float32Array(particles * 3);
    var destination = new Float32Array(particles * 3);
    var values_color = new Float32Array(particles * 3);
    var values_size = new Float32Array(particles);
    var geometry = new __WEBPACK_IMPORTED_MODULE_1_three__["BufferGeometry"]();

    var v = 0;
    for (var n in nodes) {

        let count = particlesPerNode[n]

        for (var i = 0; i < count; i++) {


            var color = (typeof n.color == "number") ? new __WEBPACK_IMPORTED_MODULE_1_three__["Color"](n.color) : new __WEBPACK_IMPORTED_MODULE_1_three__["Color"](0xffff00);


            values_size[v] = 2.5;
            values_color[v * 3 + 0] = color.r * 1.1 + Math.random() * 0.15;
            values_color[v * 3 + 1] = color.g * 1.1 + Math.random() * 0.15;
            values_color[v * 3 + 2] = color.b * 1.1 + Math.random() * 0.15;
            destination[v * 3 + 0] = 1;
            destination[v * 3 + 1] = 2;
            destination[v * 3 + 2] = 5000;

            positions[v * 3 + 0] = options.position.x;
            positions[v * 3 + 1] = options.position.y;
            positions[v * 3 + 2] = options.position.z;

            v++
        }
    }

    geometry.addAttribute('position', new __WEBPACK_IMPORTED_MODULE_1_three__["BufferAttribute"](positions, 3));
    geometry.addAttribute('customColor', new __WEBPACK_IMPORTED_MODULE_1_three__["BufferAttribute"](values_color, 3));
    geometry.addAttribute('size', new __WEBPACK_IMPORTED_MODULE_1_three__["BufferAttribute"](values_size, 1));

    var particleSystem = new __WEBPACK_IMPORTED_MODULE_1_three__["Points"](geometry, shaderMaterial);

    //override raycaster
    particleSystem.raycast = function () {
    }


    particleSystem.frustrumCulled = true;


    function updateColors() {


        var v = 0
        for (var n in nodes) {
            var node = nodes[n]
            let count = particlesPerNode[n]


            for (var i = 0; i < count; i++) {
                var color = (typeof node.color == "number") ? new __WEBPACK_IMPORTED_MODULE_1_three__["Color"](node.color) : new __WEBPACK_IMPORTED_MODULE_1_three__["Color"](0xffff00);

                var rnd = Math.random() * 0.1
                values_color[v * 3 + 0] = color.r * 1.1 + rnd;
                values_color[v * 3 + 1] = color.g * 1.1 + rnd;
                values_color[v * 3 + 2] = color.b * 1.1 + rnd;


                v++
            }
        }


        var colors = geometry.attributes.customColor;
        colors.needsUpdate = true

    }


    //-----------------
    var increment = options.increment

    function updateDestinations(inc = 1) {
        increment = inc;

        /* for (var v = 0; v < nodes.length; v++) {

        destination[ v * 3 + 0 ] =  nodes[v].x+Math.random()-0.5;
        destination[ v * 3 + 1 ] =  nodes[v].y+Math.random()-0.5;
        destination[ v * 3 + 2 ] =  nodes[v].z+Math.random()-0.5;

         }*/

        var v = 0
        for (var n in nodes) {
            var node = nodes[n]
            let count = particlesPerNode[n]

            var scale = node.size / 2 | 1


            for (var i = 0; i < count; i++) {

                let x = node.x + (Math.random() - 0.5) * scale, y = node.y + (Math.random() - 0.5) * scale,
                    z = node.z + (Math.random() - 0.5) * scale

                destination[v * 3 + 0] = x
                destination[v * 3 + 1] = y
                destination[v * 3 + 2] = z


                v++
            }
        }


    }

//------------------

    var percentage = 1

    var particlesPlaced = 0;


    var tween;

    var start_time;

    function createTween(duration = 1000, easing, onComplete = function () {
    }) {

        start_time = Date.now();

        var positions = geometry.attributes.position.array;

        // console.log("createParticleTween",positions,destination,duration,Date.now())

        if (tween) tween.stop()

        tween = new __WEBPACK_IMPORTED_MODULE_0__tweenjs_tween_js___default.a.Tween(positions)
            .to(destination, duration);

        if (typeof easing == "function")
            tween.easing(easing)

        tween.onUpdate(function () {
            //   console.log("updateParticleTween",positions,destination,Date.now())
            geometry.attributes.position.needsUpdate = true;

        }).onComplete(() => {
            isRunning = false;
            onComplete()
        })


        return tween
    }


    var isRunning = false;


    function animateParticles(mTime) {

        if (!mTime) {

            console.warn("update function needs time from amination loop  see View3D::getView().mTime")
            return
        }


        if (!isRunning) return;

        if (tween && isRunning)
            tween.update(mTime)

    }


    return {
        destination: destination,
        pointCloud: particleSystem,
        particleCount: particles,
        nodes: nodes,
        updateDestinations: updateDestinations,
        updateColors: updateColors,
        start: function () {

            if (!particleSystem) {

                console.error("already disposed")
                return
            }

            isRunning = true;
            updateDestinations();

            let tween = createTween(options.duration, options.easing, function () {
                particleSystem.geometry.computeBoundingSphere()

            });

            tween.start()

            //for now just have a huge bounding volume
            particleSystem.geometry.boundingSphere = new __WEBPACK_IMPORTED_MODULE_1_three__["Sphere"](new __WEBPACK_IMPORTED_MODULE_1_three__["Vector3"], 50000);


        },
        stop: function () {
            isRunning = false;

        },
        update: animateParticles,
        remove: function () {
            this.stop()

            if (particleSystem.geometry)
                particleSystem.geometry.dispose();
            if (particleSystem.material)
                particleSystem.material.dispose();


            if (particleSystem.parent)
                particleSystem.parent.remove(particleSystem)


            particleSystem = null;

        }
    }


}
	

/***/ }),
/* 132 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = ParticleNodeGroup;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_three__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_lodash__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_lodash___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_lodash__);



/**
 **    use for group of nodes that share some similarities (nCountry <= company)
 *    this approach does not allow for adding removing nodes as of yet
 */
function ParticleNodeGroup(nodes, options, domEvents) {

    options = __WEBPACK_IMPORTED_MODULE_1_lodash__["extend"]({

        nodeDefaultSize: 10,
        nodeDefaultScale: 1,
        nodeTexture: "img/dot7.png",
        baseColor: 0xFFFFFF
    }, options)


    function getParticleShaderMaterial2() {
        var vertexShader = `
									
									attribute float size;
									attribute vec3 customColor;
									varying vec3 vColor;

									void main() {

										vColor = customColor;

										vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

										gl_PointSize = size * ( 300.0 / length( mvPosition.xyz ) );

										gl_Position = projectionMatrix * mvPosition;

									}
							`;

        var fragmentShader = `
									uniform float opacity;
									uniform vec3 color;
									uniform sampler2D texture;

									varying vec3 vColor;

									void main() {

										gl_FragColor = vec4( color * vColor, opacity );

										gl_FragColor = gl_FragColor * texture2D( texture, gl_PointCoord );
									}
							`;

        var uniforms = {

            color: {
                type: "c",
                value: new __WEBPACK_IMPORTED_MODULE_0_three__["Color"](options.baseColor)
            },
            opacity: {
                type: "f",
                value: 1.0
            },
            texture: {
                type: "t",
                value: new __WEBPACK_IMPORTED_MODULE_0_three__["TextureLoader"]().load(options.nodeTexture)
            }

        };

        var shaderMaterial = new __WEBPACK_IMPORTED_MODULE_0_three__["ShaderMaterial"]({

            uniforms: uniforms,
            // attributes:     attributes,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,

            //blending: THREE.AdditiveBlending,
            blending: __WEBPACK_IMPORTED_MODULE_0_three__["NormalBlending"],

            depthTest: true,
            depthWrite: false,
            transparent: true
        });

        return shaderMaterial
    }

    var shaderMaterial = getParticleShaderMaterial2()

    var nCount = nodes.length

    var positions = new Float32Array(nCount * 3);

    var values_color = new Float32Array(nCount * 3);
    var values_size = new Float32Array(nCount);
    var geometry = new __WEBPACK_IMPORTED_MODULE_0_three__["BufferGeometry"]();

    geometry.addAttribute('position', new __WEBPACK_IMPORTED_MODULE_0_three__["BufferAttribute"](positions, 3));
    geometry.addAttribute('customColor', new __WEBPACK_IMPORTED_MODULE_0_three__["BufferAttribute"](values_color, 3));
    geometry.addAttribute('size', new __WEBPACK_IMPORTED_MODULE_0_three__["BufferAttribute"](values_size, 1));

    var particleSystem = new __WEBPACK_IMPORTED_MODULE_0_three__["Points"](geometry, shaderMaterial);

    //TODO we might be able to remove the meshes and enable the raycasting in here again

    //prevent raycasting nodes// this actually does not give the intended effect and we added invisible meshes instead
    //particleSystem.raycast=function(){}

    //added to be able to retrieve the original node from the point within the raycaster code
    particleSystem.srcNodes = nodes
    particleSystem.frustrumCulled = true;

    //for now just have a huge bounding volume //TODO recalc sphere every now and then
    particleSystem.geometry.boundingSphere = new __WEBPACK_IMPORTED_MODULE_0_three__["Sphere"](new __WEBPACK_IMPORTED_MODULE_0_three__["Vector3"], 50000);

    for (let i = 0; i < nCount; i++)
        updateNode(i)

    function updateNode(i) {
        updateNodePosition(i)
        updateNodeColor(i)
        updateNodeSize(i)

    }

    function updateNodePosition(i) {
        //updates the current nodes properties

        var positions = geometry.attributes.position.array;

        positions[i * 3] = nodes[i].x
        positions[i * 3 + 1] = nodes[i].y
        positions[i * 3 + 2] = nodes[i].z

        geometry.attributes.position.needsUpdate = true;

    }

    function updateNodeColor(i) {
        var colors = geometry.attributes.customColor.array;

        var color = (typeof nodes[i].color == "number") ? new __WEBPACK_IMPORTED_MODULE_0_three__["Color"](nodes[i].color) : new __WEBPACK_IMPORTED_MODULE_0_three__["Color"](0xffffff);

        colors[i * 3 + 0] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;

        geometry.attributes.customColor.needsUpdate = true;
    }

    function updateNodeSize(i) {
        var sizes = geometry.attributes.size.array;
        if (typeof nodes[i].size == "number")
            sizes[i] = nodes[i].size * options.nodeDefaultScale;
        else
            sizes[i] = options.nodeDefaultSize * options.nodeDefaultScale

        geometry.attributes.size.needsUpdate = true;

    }


    return {
        nodes: nodes,
        pointCloud: particleSystem,
        update: function () {

            //update node attrs
            for (let i = 0; i < nCount; i++)
                updateNode(i)

        },
        updateNode: updateNode,
        updateNodePosition: updateNodePosition,
        updateNodeColor: updateNodeColor,
        updateNodeSize: updateNodeSize,
        on: function (eventName, eventhandler) {

            for (let eName of eventName.split(" ")) {

                domEvents.addEventListener(particleSystem, eName, function (e) {

                    if (!e.intersect) {
                        //TODO find out if it is a bug within DomEventsAlt selection that is set =null
                        console.warn("could not resolve intersection ")
                        return
                    }

                    let index = e.intersect.index;
                    let node = nodes[index];
                    eventhandler.bind(node)(arguments)

                }, false);

            }


        },
        remove: function () {

            if (particleSystem.geometry)
                particleSystem.geometry.dispose();
            if (particleSystem.material)
                particleSystem.material.dispose();


            if (particleSystem.parent)
                particleSystem.parent.remove(particleSystem)

            particleSystem = null

        }
    }

}


/**
 *
 * this is a custom implementation for the raytracer of the point cloud
 * NOTE: currently it is not used because the nodes are handled partially as empty meshes
 * so the default threex.domEvents library can be used instead of the current work around
 *
 * @deprecated
 *
 * @param pointclouds
 * @param camera
 * @returns {{raycast: raycast, on}}
 */


function createParticleNodeGroupIntersectionHelper(pointclouds, camera) {

    if (!pointclouds)
        throw new Error("needs THREE.Points array")
    if (!camera)
        throw new Error("needs THREE.Camera object")

    var mouse = new __WEBPACK_IMPORTED_MODULE_0_three__["Vector2"]();

    function onDocumentMouseMove(event) {
        event.preventDefault();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    document.addEventListener('mousemove', onDocumentMouseMove, false);

    var lastClick = 0;

    function onDocumentMouseClick() {

        lastClick = Date.now()

    }

    document.addEventListener('click', onDocumentMouseClick, false);

    var lastDblClick = 0;

    function onDocumentMouseDblClick() {

        lastDblClick = Date.now()

    }

    document.addEventListener('click', onDocumentMouseDblClick, false);

    //-----------------------------
    var threshold = 20;

    var raycaster = new __WEBPACK_IMPORTED_MODULE_0_three__["Raycaster"]();
    raycaster.params.Points.threshold = threshold;

    var eventList = $({})
    var lastIntersectedNode;

    function raycast() {
        raycaster.setFromCamera(mouse, camera);
        var intersections = raycaster.intersectObjects(pointclouds);
        var intersection = (intersections.length) > 0 ? intersections[0] : null;
        if (intersection !== null) {

            var intersectedNode = intersection.object.srcNodes[intersection.index]

            eventList.trigger("mouseover", [intersection, intersectedNode, intersections])

            if (lastIntersectedNode && lastIntersectedNode != intersectedNode)
                eventList.trigger("mouseout", [intersection, lastIntersectedNode, intersections])

            if (Date.now() - lastClick < 50)
                eventList.trigger("click", [intersection, intersectedNode, intersections])

            if (Date.now() - lastDblClick < 50)
                eventList.trigger("dblclick", [intersection, intersectedNode, intersections])

            lastIntersectedNode = intersectedNode
        } else if (lastIntersectedNode)
            eventList.trigger("mouseout", [intersection, lastIntersectedNode, intersections])

    }

    return {
        raycast,
        on: eventList.on.bind(eventList)
    }
}


/***/ }),
/* 133 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* unused harmony export register3DClass */
/* harmony export (immutable) */ __webpack_exports__["a"] = basicSpriteSize;
/* harmony export (immutable) */ __webpack_exports__["b"] = basicElementExtend;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__f0_TextureAnimator__ = __webpack_require__(134);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__img_dot9_png__ = __webpack_require__(327);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__img_dot9_png___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__img_dot9_png__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__img_dot7_png__ = __webpack_require__(326);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__img_dot7_png___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2__img_dot7_png__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__img_ring2_png__ = __webpack_require__(328);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__img_ring2_png___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3__img_ring2_png__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__img_ring3_png__ = __webpack_require__(329);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__img_ring3_png___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4__img_ring3_png__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_three__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6_lodash__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6_lodash___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_6_lodash__);
/**
 * Created by Frank on 16.07.2017.
 */













//------------------------------------------------
//helper structures for "class"-like work flow with nodes
var _classes = {};


function register3DClass(className, options) {

    var defaults = {
        geometry: function (env, el) {
            return new __WEBPACK_IMPORTED_MODULE_5_three__["CubeGeometry"](Math.cbrt(env.valAccessor(el) || 1) * env.nodeRelSize, Math.cbrt(env.valAccessor(el) || 1) * env.nodeRelSize, Math.cbrt(env.valAccessor(el) || 1) * env.nodeRelSize);
            ;
        },
        material: function (env, el) {
            return new __WEBPACK_IMPORTED_MODULE_5_three__["MeshBasicMaterial"]({color: env.colorAccessor(el) || 0xffffff, transparent: true})
        },
        instance: function (env, el) {
            return new __WEBPACK_IMPORTED_MODULE_5_three__["Mesh"](this.geometry(env, el), this.material(env, el));
        }, onAdd: function (completeCallback) {
            if (completeCallback)
                completeCallback();
            return;


            var mesh = this;

            mesh.material.opacity = 0;
            var tween = new TWEEN.Tween(mesh.material)
                .to({opacity: 1}, 200)
                .onUpdate(function () {

                    //mesh.material.opacity=this.opacity
                })
                .onComplete(completeCallback)
                .start();


        },
        onRemove: function (completeCallback) {
            if (completeCallback)
                completeCallback();
            return;

            var mesh = this;
            mesh.material.opacity = 1;
            var tween = new TWEEN.Tween(mesh.material)
                .to({opacity: 0}, 200)
                .onUpdate(function () {

                    //mesh.material.opacity=this.opacity
                })
                .onComplete(completeCallback)
                .start();


        },
        unique: false
    };

    //options = $.extend(true, {}, defaults, options);

    options = __WEBPACK_IMPORTED_MODULE_6_lodash__["merge"]( {}, defaults, options);

    if (typeof _classes[className] != "undefined") throw new Error("className already registered:", className);

    _classes[className] = options
}

function _newClassViaFactory(className, env, el) {
    var factory = _classes[className];
    if (!factory) {

        //throw new Error("3d class "+className+" not found")
        console.error("3d class " + className + " not found");

        var mMesh = new __WEBPACK_IMPORTED_MODULE_5_three__["Mesh"]();
        mMesh.onAdd = function () {
        };
        mMesh.onRemove = mMesh.onAdd = function (c) {
            if (c) c()
        };
        mMesh.set = function () {
        };
        return mMesh;


    }


    if (factory.unique && factory._unique_instance) return factory._unique_instance;

    var material;
    var geometry;


    var mMesh = factory.instance(env, el);

    if (factory.unique)
        factory._unique_instance = mMesh;

    mMesh.onAdd = factory.onAdd;
    mMesh.onRemove = factory.onRemove;
    mMesh.set = function (attrName, options) {
        //TODO do we needthat in any way?

        if (__WEBPACK_IMPORTED_MODULE_6_lodash__["isObject"](options)) {
            if (__WEBPACK_IMPORTED_MODULE_6_lodash__["isObject"](mMesh[attrName]))
                $.extend(mMesh[attrName], options);
            else
                mMesh[attrName] = options
        }
        else
            mMesh[attrName] = options

    };


    return mMesh

}


//------------------------------------------

function basicSpriteGeometry(env, el) {

    var geometry = new __WEBPACK_IMPORTED_MODULE_5_three__["Geometry"]();
    var vertex = new __WEBPACK_IMPORTED_MODULE_5_three__["Vector3"]();
    geometry.vertices.push(vertex);


    return (function (env, el) {
        return geometry;
    })()

}

function basicSpriteSize(env, el, scale = 1) {
    // Math.cbrt(env.valAccessor(el) || 1) * env.nodeRelSize
    let size = el.size ? el.size : 32;
    size = Math.cbrt(size) * env.nodeRelSize;
    return (32 + size * 3) * scale

}


//define some sample "classes"
register3DClass("basic-cube", {});
//----------------------------------------
register3DClass("hull-hint", {
    geometry: function (env, el) {
        return new __WEBPACK_IMPORTED_MODULE_5_three__["CubeGeometry"](20, 20, 20);
    }
});


//----------------------------------------
register3DClass("basic-cube-highlighted", {
    geometry: function (env, el) {
        return new __WEBPACK_IMPORTED_MODULE_5_three__["CubeGeometry"](11, 11, 11);
    },
    material: function (env, el) {
        return new __WEBPACK_IMPORTED_MODULE_5_three__["MeshBasicMaterial"]({color: 0xff0000, transparent: true});
    },
    unique: false
});
//----------------------------------------
register3DClass("basic-sphere", {
    material: function (env, el) {
        return new __WEBPACK_IMPORTED_MODULE_5_three__["MeshBasicMaterial"]({color: env.colorAccessor(el) || 0xffffff, transparent: true});
    },
    geometry: function (env, el) {
        return new __WEBPACK_IMPORTED_MODULE_5_three__["SphereGeometry"](Math.cbrt(env.valAccessor(el) || 1) * env.nodeRelSize, 12, 10);
    },
    unique: false
});
//----------------------------------------
register3DClass("basic-selection", {
    material: function (env, el) {
        return new __WEBPACK_IMPORTED_MODULE_5_three__["MeshBasicMaterial"]({color: 0xffffff, transparent: true, opacity: 0.3/*,side: THREE.BackSide*/});
    },
    geometry: function (env, el) {
        return new __WEBPACK_IMPORTED_MODULE_5_three__["SphereGeometry"](Math.cbrt(env.valAccessor(el) || 1) * env.nodeRelSize / 3.5, 25, 25);
    },
    unique: true
});

//----------------------------------------

var basicCollapsedSprite = new __WEBPACK_IMPORTED_MODULE_5_three__["TextureLoader"]().load(__WEBPACK_IMPORTED_MODULE_1__img_dot9_png___default.a);

register3DClass("basic-sprite-collapsed", {
    geometry: basicSpriteGeometry
    ,
    material: function (env, el) {

        material = new __WEBPACK_IMPORTED_MODULE_5_three__["PointsMaterial"]({
            color: env.colorAccessor(el) || 0xffffff,
            size: basicSpriteSize(env, el),
            sizeAttenuation: true,
            map: basicCollapsedSprite,
            alphaTest: 0.0,
            transparent: true,
            opacity: 0.6,
            depthTest: false
        });
        return material

    }, instance(env, el) {

        var mPointMesh = new __WEBPACK_IMPORTED_MODULE_5_three__["Points"](this.geometry(env, el), this.material(env, el));


        return mPointMesh;

    },
    unique: false
});


//----------------------------------------
var ring3Sprite = new __WEBPACK_IMPORTED_MODULE_5_three__["TextureLoader"]().load(__WEBPACK_IMPORTED_MODULE_4__img_ring3_png___default.a);

register3DClass("basic-ring", {
    geometry: basicSpriteGeometry,
    material: function (env, el) {


        material = new __WEBPACK_IMPORTED_MODULE_5_three__["PointsMaterial"]({
            color: env.colorAccessor(el) || 0xffffff,
            size: basicSpriteSize(env, el),
            sizeAttenuation: true,
            map: ring3Sprite,
            alphaTest: 0.0,
            transparent: true,
            opacity: 0.6,
            depthTest: false
        });
        return material

    }, instance(env, el) {

        var mPointMesh = new __WEBPACK_IMPORTED_MODULE_5_three__["Points"](this.geometry(env, el), this.material(env, el));


        return mPointMesh;

    },
    unique: false
});


//----------------------------------------
var ring2Sprite = new __WEBPACK_IMPORTED_MODULE_5_three__["TextureLoader"]().load(__WEBPACK_IMPORTED_MODULE_3__img_ring2_png___default.a);

register3DClass("basic-ring-2", {
    geometry: basicSpriteGeometry
    ,
    material: function (env, el) {


        material = new __WEBPACK_IMPORTED_MODULE_5_three__["PointsMaterial"]({
            color: env.colorAccessor(el) || 0xffffff,
            size: basicSpriteSize(env, el),
            sizeAttenuation: true,
            map: ring2Sprite,
            alphaTest: 0.0,
            transparent: true,
            opacity: 0.6,
            depthTest: false
        });
        return material

    }, instance(env, el) {

        var mPointMesh = new __WEBPACK_IMPORTED_MODULE_5_three__["Points"](this.geometry(env, el), this.material(env, el));


        return mPointMesh;

    },
    unique: false
});


register3DClass("basic-animated", {
    geometry: basicSpriteGeometry,
    material: function (env, el) {


        var runnerTexture = new __WEBPACK_IMPORTED_MODULE_5_three__["ImageUtils"].loadTexture('img/run.png');
        var annie = new __WEBPACK_IMPORTED_MODULE_0__f0_TextureAnimator__["a" /* default */](runnerTexture, 10, 1, 10, 75); // texture, #horiz, #vert, #total, duration.
        //var runnerMaterial = new THREE.MeshBasicMaterial( { map: runnerTexture, side:THREE.DoubleSide } );
        //var runnerGeometry = new THREE.PlaneGeometry(50, 50, 1, 1);
        //var runner = new THREE.Mesh(runnerGeometry, runnerMaterial);
        //runner.position.set(-100,25,0);
        //scene.add(runner);

        //FIXME animation increases in speed over time
        //animate material
        function animate(time = 0) {
            requestAnimationFrame(animate);
            annie.update(time / 1000);
        }

        requestAnimationFrame(animate);


        //var sprite = new THREE.TextureLoader().load(dot9Image);
        material = new __WEBPACK_IMPORTED_MODULE_5_three__["PointsMaterial"]({
            color: env.colorAccessor(el) || 0xffffff,
            size: basicSpriteSize(env, el),
            sizeAttenuation: true,
            map: runnerTexture,
            alphaTest: 0.0,
            transparent: true,
            opacity: 0.6,
            depthTest: false
        });
        return material

    }, instance(env, el) {

        var mPointMesh = new __WEBPACK_IMPORTED_MODULE_5_three__["Points"](this.geometry(env, el), this.material(env, el));


        return mPointMesh;

    },
    unique: false
});


//----------------------------------------

var expandedSprite = new __WEBPACK_IMPORTED_MODULE_5_three__["TextureLoader"]().load("img/minus-square-o.png");
register3DClass("basic-sprite-expanded", {
    geometry: basicSpriteGeometry,
    material: function (env, el) {


        material = new __WEBPACK_IMPORTED_MODULE_5_three__["PointsMaterial"]({
            color: env.colorAccessor(el) || 0xffffff,
            size: basicSpriteSize(env, el),
            sizeAttenuation: true,
            map: expandedSprite,
            alphaTest: 0.0,
            transparent: true,
            opacity: 0.6,
            depthTest: false
        });
        return material

    }, instance(env, el) {

        return new __WEBPACK_IMPORTED_MODULE_5_three__["Points"](this.geometry(env, el), this.material(env, el));

    },
    unique: false
});


//----------------------------------------

var basicSprite = new __WEBPACK_IMPORTED_MODULE_5_three__["TextureLoader"]().load(__WEBPACK_IMPORTED_MODULE_2__img_dot7_png___default.a);
register3DClass("basic-sprite", {
    geometry: basicSpriteGeometry,
    material: function (env, el) {

        var material = new __WEBPACK_IMPORTED_MODULE_5_three__["PointsMaterial"]({
            color: env.colorAccessor(el) || 0xffffff,
            size: basicSpriteSize(env, el),
            sizeAttenuation: true,
            map: basicSprite,
            alphaTest: 0.0,
            transparent: true,
            opacity: 0.6,
            depthTest: false
        });

        //depthTest:false, fog:false,blending:THREE.AdditiveBlending,


        return material

    }, instance(env, el) {

        return new __WEBPACK_IMPORTED_MODULE_5_three__["Points"](this.geometry(env, el), this.material(env, el));

    },
    unique: false
});
//----------------------------------------
register3DClass("node-highlighted", {
    geometry: basicSpriteGeometry,
    material: function (env, el) {
        var sprite = new __WEBPACK_IMPORTED_MODULE_5_three__["TextureLoader"]().load(__WEBPACK_IMPORTED_MODULE_2__img_dot7_png___default.a);
        var material = new __WEBPACK_IMPORTED_MODULE_5_three__["PointsMaterial"]({
            color: env.colorAccessor(el) || 0xffffff,
            size: basicSpriteSize(env, el) * 1.8,
            sizeAttenuation: true,
            map: sprite,
            alphaTest: 0.0,
            transparent: true,
            opacity: 1.6,
            depthTest: false
        });

        //depthTest:false, fog:false,blending:THREE.AdditiveBlending,


        return material

    }, instance(env, el) {

        return new __WEBPACK_IMPORTED_MODULE_5_three__["Points"](this.geometry(env, el), this.material(env, el));

    },
    unique: false
});


/**
 basicElementExtend adds:

 on/off
 add/remove/toggle 3d-class

 TODO refactor => BaseXElement

 */
function basicElementExtend(env, obj, _mesh) {
    var mDomEvents = env.domEvents;


    var self = __WEBPACK_IMPORTED_MODULE_6_lodash__["extend"](obj,
        {
            _instances: {},
            getClassInstance: function (className) {
                return this._instances[className];
            },
            on: function (eventName, eventhandler) {
                mDomEvents.addEventListener(_mesh, eventName, eventhandler, false)
            },
            off: function (eventName, eventhandler) {
                mDomEvents.removeEventListener(_mesh, eventName, eventhandler, false)
            },
            show: function () {
                //needs a parent element it is attached to
                let el = this.get3DRoot()
                this._parent.add(el)


                // el.updateMatrix()
                el.updateMatrixWorld()

            },
            hide: function () {
                //needs a parent element it is attached to
                this._parent.remove(this.get3DRoot())
            },
            trigger: function (eventName, intersect, node) {


                mDomEvents._notify(eventName, _mesh, node, intersect);


            }, get3DRoot: function () {

            return this._bubble
        },
            getParentCluster()  //NOTE: more of getParentClusterLeaf
            {
                let el = this.get3DRoot();

                if (!el || !el._parent) return null;

                return el._parent.parent
            },
            addClass: function (className) {

                for (className of className.split(" ")) {

                    if (this.hasClass(className)) continue;

                    var mMesh;

                    if (this._instances[className])
                        mMesh = this._instances[className];
                    else
                        mMesh = this._instances[className] = _newClassViaFactory(className, env, obj);


                    this.get3DRoot().add(mMesh);
                    mMesh.onAdd()


                }
                return this
            }, removeClass(className) {
            for (className of className.split(" ")) {
                var mMesh;
                if (this._instances[className]) {

                    mMesh = this._instances[className];

                    mMesh.onRemove(() => this.get3DRoot().remove(mMesh))

                }

            }
            return this
        },
            hasClass: function (className) {
                var mMesh;
                if (this._instances[className])
                    mMesh = this._instances[className];

                return (this.get3DRoot().children.indexOf(mMesh) >= 0)

            },
            toggleClass: function (className) {

                for (className of className.split(" ")) {

                    var mMesh;

                    if (this._instances[className])
                        mMesh = this._instances[className];

                    if (this.hasClass(className))
                        this.removeClass(className);
                    else
                        this.addClass(className)

                }
                return this
            }
        });

    return self
}


/***/ }),
/* 134 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = TextureAnimator;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_three__ = __webpack_require__(1);
/**
 * Created by Frank on 16.07.2017.
 */




function TextureAnimator(texture, tilesHoriz, tilesVert, numTiles, tileDispDuration) {
    // note: texture passed by reference, will be updated by the update function.

    this.tilesHorizontal = tilesHoriz;
    this.tilesVertical = tilesVert;
    // how many images does this spritesheet contain?
    //  usually equals tilesHoriz * tilesVert, but not necessarily,
    //  if there at blank tiles at the bottom of the spritesheet.
    this.numberOfTiles = numTiles;
    texture.wrapS = texture.wrapT = __WEBPACK_IMPORTED_MODULE_0_three__["RepeatWrapping"];
    texture.repeat.set(1 / this.tilesHorizontal, 1 / this.tilesVertical);

    // how long should each image be displayed?
    this.tileDisplayDuration = tileDispDuration;

    // how long has the current image been displayed?
    this.currentDisplayTime = 0;

    // which image is currently being displayed?
    this.currentTile = 0;

    this.update = function (milliSec) {
        this.currentDisplayTime += milliSec;
        while (this.currentDisplayTime > this.tileDisplayDuration) {
            this.currentDisplayTime -= this.tileDisplayDuration;
            this.currentTile++;
            if (this.currentTile == this.numberOfTiles)
                this.currentTile = 0;
            var currentColumn = this.currentTile % this.tilesHorizontal;
            texture.offset.x = currentColumn / this.tilesHorizontal;
            var currentRow = Math.floor(this.currentTile / this.tilesHorizontal);
            texture.offset.y = currentRow / this.tilesVertical;
        }
    };
}






/***/ }),
/* 135 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = nodeMixin;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__f0_basic_element_3d_classes__ = __webpack_require__(133);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__f1__ = __webpack_require__(26);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_three__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_lodash__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_lodash___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3_lodash__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_jquery__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4_jquery__);
/**
 * Created by Frank on 16.07.2017.
 */









var sphereGeometry = new __WEBPACK_IMPORTED_MODULE_2_three__["SphereGeometry"](1, 3, 2);

var singleNodeMaterial = new __WEBPACK_IMPORTED_MODULE_2_three__["MeshBasicMaterial"]({
    color: 0xffff00, wireframe: true, visible: false, opacity: 1, transparent: true,
    alphaTest: 0.99 //if set to 1.0 it somehow gets converted to int which will result in the shader failing

});


function nodeMixin(env, node) {

    if (!node)
        console.warn("fu")
    if (node._mixin_)
        return node


    node._mixin = true;


    //TODO have a container as root element  instead of the mesh itself


    //the single material is only for the node counting. so it should be irrelevant for rendering itself
    node._bubble = new __WEBPACK_IMPORTED_MODULE_2_three__["Mesh"](sphereGeometry, singleNodeMaterial);

    var mMesh = node._bubble;


    var size = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__f0_basic_element_3d_classes__["a" /* basicSpriteSize */])(env, node) / 5;
    //var size=node.size?node.size*0.66:1

    mMesh.scale.setScalar(size);


    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__f0_basic_element_3d_classes__["b" /* basicElementExtend */])(env, node, mMesh);

    var self = __WEBPACK_IMPORTED_MODULE_3_lodash__["extend"](node, {
        highlight: function () {
            __WEBPACK_IMPORTED_MODULE_1__f1__["c" /* highlightNodeElements */].apply(this)
        },
        unhighlight: function () {
            unhighlightNodeElements.apply(this)
        },

        zoom: function () {
            doOnClickNode(this)
        }

    });


    self.on("mousemove", function (e, f, g) {

        e.stopPropagation();
        //e.type,intersection,node)

        var node;

        if (e.intersect.object.node)
            node = e.intersect.object.node;
        else if (e.origDomEvent) node = e.origDomEvent;


        var info = "";
        if (node.name)
            info += " " + node.name;
        if (node.group)
            info += " " + node.group;
        if (node.info)
            info += " " + node.info;


        if (info.trim() != "") {
            var content = __WEBPACK_IMPORTED_MODULE_4_jquery__("<span class='content'>").html(info);
            __WEBPACK_IMPORTED_MODULE_4_jquery__(env.toolTipElem).html(content)


            if (node.getParentCluster() && node.getParentCluster().getView())
                node.getParentCluster().getView().setTooltip(info)


        }


    });


    node._bubble.name = env.nameAccessor(node) || '';
    node.size = env.sizeAccessor(node) || undefined;


    return self

}


/***/ }),
/* 136 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = addArrow;
/* harmony export (immutable) */ __webpack_exports__["b"] = removeArrow;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_three__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_lodash__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_lodash___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_lodash__);



/**
 * Created by Frank on 16.07.2017.
 */


//------------------------------------------------
//Feature 5 arrows


function _findSceneForMesh(mesh, maxIter = 99) {
    var scene = null;
    while (mesh.parent && maxIter--) {
        if (mesh.parent instanceof __WEBPACK_IMPORTED_MODULE_0_three__["Scene"]) return mesh.parent;
        mesh = mesh.parent
    }

    return scene

}


//NOTE: add arrows only to selection to improve performance
function addArrow(d3LinkObj, color, options) {


    var defaults = {
        highlightArrowType: "line"

    };

    var env = __WEBPACK_IMPORTED_MODULE_1_lodash__["extend"](defaults, options);


    if (d3LinkObj.arrow) return;

    var lineMesh = d3LinkObj._line;

    //TODO set arrow to sphere radius not center


    //	var from0 = d3LinkObj.mStart
    //	var to0 = d3LinkObj.mEnd


    var from0 = new __WEBPACK_IMPORTED_MODULE_0_three__["Vector3"]();
    from0.setFromMatrixPosition(d3LinkObj.source._bubble.matrixWorld);


    var to0 = new __WEBPACK_IMPORTED_MODULE_0_three__["Vector3"]();
    to0.setFromMatrixPosition(d3LinkObj.target._bubble.matrixWorld);


    //TODO
    if (!to0) return;

    var distVec = to0.clone().sub(from0);
    var len = distVec.length();

    /**
     * TODO currently the arrow helper gets used which creates some "ditter" effect when rendered at the same position as a edge
     *
     */


    //distVec.normalize()
    distVec.multiplyScalar(0.9);
    //change start and end of arrow
    var from = from0.clone().add(distVec);
    var to = to0.clone().sub(distVec);


    var direction = to.clone().sub(from);
    var length = direction.length();

    var headLength = 0.2 * len * 0.2; //use original length


    var arrowHelper;


    if (env.highlightArrowType == "line") {
        let dir = to0.clone().sub(from0);
        let len = dir.length();

        arrowHelper = new __WEBPACK_IMPORTED_MODULE_0_three__["ArrowHelper"](dir.normalize(), from0, len, color || 0x0000FF, 0.001, 0.001); //setting headlength and with to zero will trigger lots of warnings


    }
    else if (env.highlightArrowType == "animated") {
        let dir = to0.clone().sub(from0);
        let len = dir.length();

        arrowHelper = new CustomAnimatedLineMesh(direction.normalize(), from, length, color || 0x0000FF, 1, "img/arrow.png")

    }
    else if (env.highlightArrowType == "simple")
        arrowHelper = new __WEBPACK_IMPORTED_MODULE_0_three__["ArrowHelper"](direction.normalize(), from, length, color || 0x0000FF, headLength, 0.4 * headLength);
    else if (env.highlightArrowType == "double")
        arrowHelper = new ArrowExt(direction.normalize(), from, length, color || 0x0000FF, headLength, 0.4 * headLength);


    d3LinkObj.arrow = arrowHelper;
    //lineMesh.parent.add(arrowHelper);


    var scene = _findSceneForMesh(d3LinkObj.source.get3DRoot());

    if (!scene) scene = _findSceneForMesh(d3LinkObj.target.get3DRoot());

    if (!scene) {
        console.warn("no scene found arrows can't be created");
        //  debugger;
    }
    else
        scene.add(arrowHelper);

}

function removeArrow(d3LinkObj) {
    if (!d3LinkObj.arrow) return;
    //TODO
    //var env=globalEnv;
    var lineMesh = d3LinkObj._line;


    if (d3LinkObj.arrow) {
        let parent = d3LinkObj.arrow.parent;

        //lineMesh.parent.remove(d3LinkObj.arrow);
        if (parent)
            parent.remove(d3LinkObj.arrow);


        d3LinkObj.arrow = null;
    }
}


/***/ }),
/* 137 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__TextNodesFactory__ = __webpack_require__(138);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__view_GraphView3D__ = __webpack_require__(33);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__Cluster3DExtended__ = __webpack_require__(63);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__cluster_text_overlay_css__ = __webpack_require__(312);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__cluster_text_overlay_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3__cluster_text_overlay_css__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_three__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_lodash__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_lodash___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_5_lodash__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6_jquery__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_6_jquery__);
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
        this.selectedLeafCluster = null;

        this.enabled = true;

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

        __WEBPACK_IMPORTED_MODULE_6_jquery__(view).on("loaded graph-changed", () => {

            if (!this.parentElement) return;

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


        var $view = __WEBPACK_IMPORTED_MODULE_6_jquery__(rootcluster.getView());

        var that = this;


        $view.on("before-render", function () {

            //reset nodes
            that.possibleClusters = [];
            that.possibleLeafClusters = [];
        });


        $view.on("after-render", () => {

            __WEBPACK_IMPORTED_MODULE_6_jquery__(that).toggle(that.enabled);
            if (!that.enabled) return;

            this.tn.update();
            this.mTextNodes.update();

            //console.log("clusters for text considered",that.possibleClusters .length+  that.possibleLeafClusters.length)

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


        __WEBPACK_IMPORTED_MODULE_6_jquery__(this).addClass("graph-captions-container")

    }

    addBreadcrumbContainer() {
        if (this.mBreadcrumb) {
            __WEBPACK_IMPORTED_MODULE_6_jquery__(this).append(this.mBreadcrumb)
            return
        }
        this.mBreadcrumb = __WEBPACK_IMPORTED_MODULE_6_jquery__("<span class='cluster-text-overlay-breadcrumb'></span>")

        __WEBPACK_IMPORTED_MODULE_6_jquery__(this).append(this.mBreadcrumb)

    }

    setBreadcrumb(parentClusters) {

        //compare arrays if an update is necessary
        if (__WEBPACK_IMPORTED_MODULE_5_lodash__["last"](parentClusters) == this.mBreadcrumb.item) return
        this.mBreadcrumb.item = __WEBPACK_IMPORTED_MODULE_5_lodash__["last"](parentClusters)

        parentClusters.shift()//discard root

        var res = []
        __WEBPACK_IMPORTED_MODULE_5_lodash__["each"](parentClusters, function (cluster) {

            let item = "<span class='cluster-text-overlay-breadcrumb-item'>" + cluster.name + "</span>"
            res.push(item)


        });

        this.mBreadcrumb.empty().append(res.join(" - "))

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


        var mTextNode = __WEBPACK_IMPORTED_MODULE_6_jquery__(this)
            .height(view.clientHeight)
            .width(view.clientWidth)
            .empty();

        this.addBreadcrumbContainer()


        var that = this;
        let env = {
            renderer: view.mRenderer,
            currentNodesVisible: [],//can be left empty if below nodes function is used
            textNode: mTextNode,
            camera: view.mCamera

        };


        function getDistance(cluster) {
            let point1 = view.mCamera.position;
            let point2 = cluster.localToWorld(new __WEBPACK_IMPORTED_MODULE_4_three__["Vector3"]);
            let distance = point1.distanceTo(point2);

            return distance

        }

        function sortClusters(clusters) {

            var res = __WEBPACK_IMPORTED_MODULE_5_lodash__["map"](clusters, function (c) {

                return {item: c, distance: getDistance(c)}
            });
            return __WEBPACK_IMPORTED_MODULE_5_lodash__["sortBy"](res, [function (o) {
                return o.distance;
            }]);

        }


        function getNodesForLeaf() {
            //return only the closest cluster
            that.selectedLeafCluster = null

            if (!that.possibleLeafClusters) return [];

            // get closest leaf only

            var res = sortClusters(that.possibleLeafClusters)

            //TODO nodes aren't in order so we should sort them also

            //FIXME deplace overlay after changing 3d => 2d view or have an event to track changing leafs/clusters
            //check for empty array which can happen if graph data changes and clusters get deleted
            if (!res[0] || !res[0].item) return [];


            //(1)see below if changing the distance
            let leaf1 = res[0].item;
            if (leaf1.getRadius() < res[0].distance)
                return [] // discard clostest leaf if it is too far away

            that.selectedLeafCluster = leaf1;
            return leaf1.mNodes ? leaf1.mNodes : []
        }

        //the handler for the leaf text
        if (!this.tn)
            this.tn = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__TextNodesFactory__["a" /* default */])(env, {
                maxVisibleCount: 10,
                maxDistance: function (node) {
                    //(1)see above if changing the distance
                    if (!that.selectedLeafCluster) return 0;
                    return that.selectedLeafCluster.getRadius()
                },
                onNodeText: (node) => node.name ? node.name : node.id,
                getNodes: function () {
                    let nodes = getNodesForLeaf();

                    __WEBPACK_IMPORTED_MODULE_5_lodash__["each"](nodes, function (n) {

                        let mesh = n.get3DRoot();
                        if (mesh.parent)
                            mesh.updateMatrixWorld();
                        else {
                            mesh.parent = n._parent;
                            mesh.updateMatrixWorld();
                            mesh.parent = null

                        }


                    });

                    return nodes;
                }
            });


        // TODO the bounding volume determines the visibility of the text nodes
        //TODO so currently with no volume generated properly the text nodes are invisible

        function getNodeParentCluster(node) {
            return node.parent.parent

        }


        //the handler for the cluster text
        this.mTextNodes = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__TextNodesFactory__["a" /* default */])(env, {
            maxVisibleCount: 30,
            maxDistance: function (node) {
                return getNodeParentCluster(node).getRadius(getNodeParentCluster(node).mNodes.length) / 3 * 10
            },//30000
            minDistance: function (node) {
                return getNodeParentCluster(node).getRadius(getNodeParentCluster(node).mNodes.length) / 3 * 3
            }, //3000
            getNodes: function () {

                if (that.possibleClusters.length > 0) {
                    var res = sortClusters(that.possibleClusters)

                    that.setBreadcrumb([].concat(res[0].item.getParents(), res[0].item))
                }
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

                var mVec3 = new __WEBPACK_IMPORTED_MODULE_4_three__["Vector3"]();
                mVec3.setFromMatrixPosition(node.matrixWorld);

                //fixing the offset/position as soon as the hull is created
                if (node.mHull)
                    mVec3.add(node.mHull.mBoundingBox.getCenter());

                return mVec3; //node.position.clone()
            },
            interactable: true,
            onAfterCreateTextField: function (node, el) {

                var newSize;
                if (node instanceof __WEBPACK_IMPORTED_MODULE_2__Cluster3DExtended__["a" /* default */]) {
                    newSize = 12 + Math.ceil(Math.log2(node.mNodes.length) - 5);

                    var newText = node.getClusterOptions().text.bind(node)();
                    if (newText)
                        el.html("").append(newText)


                }
                else
                    newSize = 12 + Math.ceil(Math.log2(node.nodes.length) - 5);

                newSize = __WEBPACK_IMPORTED_MODULE_5_lodash__["round"](newSize / 12, 3) + "em";

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
/* 138 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = TextNodesFactory;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_three__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_lodash__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_lodash___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_lodash__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_jquery__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_jquery__);
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

    options = __WEBPACK_IMPORTED_MODULE_1_lodash__["extend"]({
        interactable: false, //node can't be clicked, selected
        minVisibleCount: 0, //the minimum amount of items ignoring distance
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

            var vector = new __WEBPACK_IMPORTED_MODULE_0_three__["Vector3"]();
            vector.setFromMatrixPosition(node._bubble.matrixWorld);
            return vector;

            //return node._bubble.position
        },
        onAfterCreateTextField: function (node, el) {
        }, //gets called after a text label is generated to be able to make adjustments
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

        node.text = __WEBPACK_IMPORTED_MODULE_2_jquery__("<span>").hide().addClass(options.getCSSClasses())
            .addClass("noselect").on("mousewheel", e => e.preventDefault())
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
        vector.y = -(vector.y - 1) / 2 * domEl.offsetHeight + domEl.offsetTop;

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
    function getScreenPos(p, camera, viewOffsetWidthBy2, viewOffsetHeightBy2, viewOffsetX, viewOffsetY) {

        var vector = p.clone();

        vector.project(camera);

        vector.x = (vector.x + 1) * viewOffsetWidthBy2 + viewOffsetX
        vector.y = -(vector.y - 1) * viewOffsetHeightBy2 + viewOffsetY

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
        let dir1 = new __WEBPACK_IMPORTED_MODULE_0_three__["Vector3"]().copy(point2).sub(point1)
        let dir2 = env.camera.getWorldDirection()
        var angle = dir1.angleTo(dir2)


        //TODO is size still relevant somehow?
        var size = 12


        let _minDistance = typeof options.minDistance == "function" ? options.minDistance(node) : options.minDistance
        let _maxDistance = typeof options.maxDistance == "function" ? options.maxDistance(node) : options.maxDistance

        //return the result of the comparision
        //angle  90° == pi/4 => 45° fov for text nodes to each side
        if (size < 10 || size > 80 || angle > Math.PI / 4 || distance > _maxDistance || distance < _minDistance)
            return {
                distance, angle,
                addNodeToSet: false,
                node
            };
        else
            return {
                distance, angle,
                addNodeToSet: true,
                node
            };

    }

    //--------------------------------


    var previousVisibleNodes = []

    var maxVisibleTextNodes = options.maxVisibleCount

    function compareAndHidePreviousBatch(nodeInfosCurrentBatch) {


        if (previousVisibleNodes.length == 0 && nodeInfosCurrentBatch.length == 0) return;


        // vars to safe some ms later on
        var camera = env.camera;

        var dw = domEl.offsetWidth / 2;
        var dh = domEl.offsetHeight / 2;

        var dl = domEl.offsetLeft;
        var dt = domEl.offsetTop;


        //updates the positions of the text labels matching it's 3d node counterparts positions
        function updatePos(node, distance = 0) {

            if (typeof node.text == "undefined")
                return;

            var pos = options.getNodePosition(node);
            //	var coords = getScreenPos(pos, domEl);

            var coords = getScreenPos(pos, camera, dw, dh, dl, dt);

            //TODO this offset stuff might need some parameters in the options section
            var centered = coords.x - node.text.width() / 2;
            var adjustedTop = coords.y - 500 / distance * 10

            /*	node.text.css({
                    top: adjustedTop,
                    left: centered
                })*/

            node.text.get(0).style.transform = 'translate(' + __WEBPACK_IMPORTED_MODULE_1_lodash__["round"](centered - dw, 2) + 'px, ' + __WEBPACK_IMPORTED_MODULE_1_lodash__["round"](adjustedTop, 2) + 'px)';


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

            //if (!nodeInfo.node.text.is( ":animated"))
            //nodeInfo.node.text.stop().fadeIn(100);
                nodeInfo.node.text.show()

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

            /*  let _maxDistance=typeof options.maxDistance=="function"?options.maxDistance(node):options.maxDistance


              if (res.distance > _maxDistance * 1.5)
                  break; //shorten the search for large graphs
  */

        }


        //TODO keep track of potential nodes that where discarded due to distance but should be readded due to minVisibleCount

        //------------------------------------------
        //now that we should have an array containing only relevant nodes, let's create and (compare+ update) nodes
        //ok node is relevant, so first of all check if node text element needs to be created

        nodesCurrentBatch = __WEBPACK_IMPORTED_MODULE_1_lodash__["uniq"](nodesCurrentBatch)

        if (nodesCurrentBatch.length > 0)
            for (var nodeInfo of nodesCurrentBatch)
                if (typeof nodeInfo.node.text == "undefined")
                    createTextNode(nodeInfo.node); //.stop().fadeIn(150)


        //second compare and hide/show nodes
        compareAndHidePreviousBatch(nodesCurrentBatch);


    }

    return {
        update: simpleUpdate// _.throttle(simpleUpdate, 20, {
        //leading: true,
        //trailing: false
        //}),
        ,
        remove: function () {

            compareAndHidePreviousBatch([])

        }
    }
}


/***/ }),
/* 139 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* unused harmony export IndustrialSectorIcon */
/* harmony export (immutable) */ __webpack_exports__["a"] = IndustrialSectorAbbreviation;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_lodash__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_lodash___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_lodash__);


function IndustrialSectorIcon(sectorName) {
    return `<img src="./img/industryIcons/${sectorName}.png" title="${sectorName}" />`


}

function IndustrialSectorAbbreviation(sectorName) {

    sectorName = __WEBPACK_IMPORTED_MODULE_0_lodash__["startCase"](sectorName)

    if (sectorName.indexOf(" ") == -1) return sectorName

    return sectorName.replace(/[a-z\s]/g, '');

}




/***/ }),
/* 140 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * so what this currently does...
 * is it runs added methods at most once oer animation frame
 * and stops if the max computation time has passed
 * and waits for the next animation frame to continue
 * this way every method gets executed every now and then without totally blocking the renderer
 *
 * //TODO make it a singleton maybe .. currently it's only used in ForceGraphDistribution but if multiple instances are used they would have to manage cpu time between themselfs
 *
 */


class RoundRobin {

    /**
     *
     * @param maxMilliSecondsPerFrame determines the maximum amount of milli seconds functions are called within one requestAnimationFrame
     */
    constructor(maxMilliSecondsPerFrame = 100) {

        this.maxMilliSecondsPerFrame = maxMilliSecondsPerFrame;
        this.current = 0
        this.entries = []

        this.start();


    }

    start() {
        var that = this;
        requestAnimationFrame(function loop(time) {

            var startIndex = that.current

            function exec() {
                var fn = that.entries[that.current]
                if (typeof fn == "function")
                    fn()

                that.current++
                if (that.current >= that.entries.length) that.current = 0


                return startIndex != that.current
            }

            //TODO define a maximum time interval like 20ms that the queue runs until it waits for the next frame
            //also have a mechanism to prevent too fast animations for faster devices:-D

            while (exec()) {

                if (performance.now() - time > that.maxMilliSecondsPerFrame)
                    break;

            }

            requestAnimationFrame(loop);
        })
    }

    add(fn) {

        this.entries.push(fn)


    }


    remove(fn) {

        let index = this.entries.indexOf(fn);

        if (index > -1) {
            this.entries.splice(index, 1);
        }

    }


}
/* harmony export (immutable) */ __webpack_exports__["a"] = RoundRobin;


/***/ }),
/* 141 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_socket_io_client__ = __webpack_require__(308);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_socket_io_client___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_socket_io_client__);
/**
 * what we want is a simple baisc abstraction layer to retrieve data .. nothing fancy just some structure for different services and probably topics
 *
 *
 *
 */



class Datasource {

    constructor(serviceURL) {

        //TODO add some listeners to retrieve data about current stock prices and news

        // Connect to our node/websockets server
        var socket = this.mSocket = __WEBPACK_IMPORTED_MODULE_0_socket_io_client___default.a.connect(serviceURL);


    }


}
/* harmony export (immutable) */ __webpack_exports__["a"] = Datasource;


/***/ }),
/* 142 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(module) {/* harmony export (immutable) */ __webpack_exports__["a"] = gpuInfo;



/*! fast-levenshtein 2016-12-27. Copyright Ramesh Nair MIT-License <ram@hiddentao.com> (http://www.hiddentao.com/) */
!function(){"use strict";var a;try{a="undefined"!=typeof Intl&&"undefined"!=typeof Intl.Collator?Intl.Collator("generic",{sensitivity:"base"}):null}catch(b){console.log("Collator could not be initialized and wouldn't be used")}var c=[],d=[],e={get:function(b,e,f){var g=f&&a&&f.useCollator,h=b.length,i=e.length;if(0===h)return i;if(0===i)return h;var j,k,l,m,n;for(l=0;i>l;++l)c[l]=l,d[l]=e.charCodeAt(l);c[i]=i;var o;if(g)for(l=0;h>l;++l){for(k=l+1,m=0;i>m;++m)j=k,o=0===a.compare(b.charAt(l),String.fromCharCode(d[m])),k=c[m]+(o?0:1),n=j+1,k>n&&(k=n),n=c[m+1]+1,k>n&&(k=n),c[m]=j;c[m]=k}else for(l=0;h>l;++l){for(k=l+1,m=0;i>m;++m)j=k,o=b.charCodeAt(l)===d[m],k=c[m]+(o?0:1),n=j+1,k>n&&(k=n),n=c[m+1]+1,k>n&&(k=n),c[m]=j;c[m]=k}return k}};"undefined"!=typeof define&&null!==define&&__webpack_require__(331)?define(function(){return e}):"undefined"!=typeof module&&null!==module&&"undefined"!=typeof exports&&module.exports===exports?module.exports=e:"undefined"!=typeof self&&"function"==typeof self.postMessage&&"function"==typeof self.importScripts?self.Levenshtein=e:"undefined"!=typeof window&&null!==window&&(window.Levenshtein=e)}();


// goal have the option to define some event listeners for specific use cases
// onboard/slow 
// have a list of gpu benchmarks at hand to look up graphics card

// define lt and gt 
// gpuInfo().lt(10000,function(){}).gt(...).unknown(...)




function gpuInfo()
{

var $$=$({})
var packed="128 DDR Radeon 9700 TX w/TV-Out|44;128MB DDR Radeon 9800 Pro|66;128MB RADEON X600 SE|49;256MB RADEON X600|69;7900 MOD - Radeon HD 6520G|610;A6 Micro-6500T Quad-Core APU with RadeonR4|224;ABIT Siluro T400|3;ALL-IN-WONDER 9000|4;ALL-IN-WONDER RADEON 8500DV|5;All-in-Wonder X1900|127;ALL-IN-WONDER X800 GT|84;Barco MXRT 5400|1334;Barco MXRT 5450|782;Chell 1.7b for Intel G33/G31|16;Chell 1.7b for Mobile Intel 945|6;Chell 1.8a for Mobile Intel 965|22;Chell 1.8b for Intel 945G|2;Chell 1.8b for Intel G33/G31|7;Chell 1.8b for Mobile Intel 945|2;Chell 1.8b for Mobile Intel 965|13;Chipset Intel G41 Express|57;Device|2502;EAH5450|134;EAH6450|275;Famille de jeu de puces Express Intel 946GZ|7;FireGL T2-128|30;FireGL V3100|52;FireGL V3200|84;FireGL V3300|70;FireGL V3350|66;FireGL V3400|103;FireGL V3600|194;FireGL V5100|92;FireGL V5200|113;FireGL V5600|343;FireGL V7200|108;FireGL V7350|122;FireGL V7600|615;FireGL V7700|631;FireGL V8650|550;FireGL X1|59;FireMV 2200 PCIe|36;FireMV 2250|45;FireMV 2260|117;FireMV 2400 PCIe|13;FirePro 2260|118;FirePro 2270|228;FirePro 2450|56;FirePro 2460|210;FirePro 3D V3700|187;FirePro 3D V3750|341;FirePro 3D V3800|476;FirePro 3D V4800|1084;FirePro 3D V5700|559;FirePro 3D V5800|1401;FirePro 3D V7750|541;FirePro 3D V7800|1809;FirePro 3D V8700|1208;FirePro 3D V8750|1271;FirePro 3D V8800|2407;FirePro 3D V9800|2811;FirePro M2000|608;FirePro M4000|1521;FirePro M4000 Mobility Pro|1680;FirePro M40003|1411;Firepro M4100|1058;FirePro M4150|1103;FirePro M4170|1113;FirePro M5100|2035;FirePro M5950|1314;FirePro M6000 Mobility Pro|1692;FirePro M6100|2894;FirePro M7740|653;FirePro S7000|4166;FirePro S7150|6276;FirePro V3900|865;FirePro V4900|1289;FirePro V5900|1516;FirePro V7000 Adapter|3161;FirePro V7900|2701;FirePro V9800 Adapter|2716;FirePro W2100|918;FirePro W4100|1623;FirePro W4100 Adapter|1798;FirePro W4170M|1327;Firepro W4190M|1222;FirePro W4300|3021;FirePro W5000|3040;FirePro W5100|2945;FirePro W5130M|1807;Firepro W5170M|2100;FirePro W600|1761;FirePro W7000|4137;FirePro W7000 Adapter|4242;FirePro W7100|5386;FirePro W7170M|4618;FirePro W8000|4264;FirePro W8000 Adapter|4646;FirePro W8100|5856;FirePro W8100 Graphic Adapter|8219;FirePro W9000|5178;FirePro W9100|6834;FireStream 9250|1164;FireStream 9270|1341;GeForce 205|126;GeForce 210|178;GeForce 256|5;GeForce 305M|190;GeForce 310|211;GeForce 310M|216;GeForce 315|260;GeForce 315M|214;GeForce 320M|277;GeForce 405|224;GeForce 410M|343;GeForce 505|191;GeForce 510|302;GeForce 605|315;GeForce 6100|21;GeForce 6100 nForce 400|25;GeForce 6100 nForce 405|22;GeForce 6100 nForce 420|25;GeForce 6100 nForce 430|23;GeForce 610M|398;GeForce 615|537;GeForce 6150|22;GeForce 6150 LE|21;GeForce 6150SE|23;GeForce 6150SE nForce 430|22;GeForce 6200|44;GeForce 6200 A-LE|32;GeForce 6200 LE|26;GeForce 6200 TurboCache|38;GeForce 6200SE TurboCache|29;GeForce 6500|37;GeForce 6600|63;GeForce 6600 GT|102;GeForce 6600 LE|49;GeForce 6610 XL|89;GeForce 6700 XL|102;GeForce 6800|111;GeForce 6800 GS|138;GeForce 6800 GS/XT|99;GeForce 6800 GT|143;GeForce 6800 LE|97;GeForce 6800 Ultra|138;GeForce 6800 XT|104;GeForce 7000M|13;GeForce 7000M / nForce 610M|13;GeForce 7025 / nForce 630a|25;GeForce 7050 / nForce 610i|27;GeForce 7050 / nForce 620i|32;GeForce 7050 / nForce 630i|26;GeForce 7050 PV / nForce 630a|21;GeForce 705M|455;GeForce 7100 / nForce 630i|30;GeForce 7100 GS|42;GeForce 710A|435;GeForce 710M|551;GeForce 7150 / nForce 630i|33;GeForce 7150M / nForce 630M|17;GeForce 7300 GS|65;GeForce 7300 GT|108;GeForce 7300 LE|54;GeForce 7300 SE|39;GeForce 7300 SE/7200 GS|41;GeForce 730A|768;GeForce 7350 LE|74;GeForce 7500 LE|69;GeForce 7600 GS|134;GeForce 7600 GT|181;GeForce 7650 GS|133;GeForce 7800 GS|177;GeForce 7800 GT|194;GeForce 7800 GTX|223;GeForce 7900 GS|217;GeForce 7900 GT|258;GeForce 7900 GT/GTO|245;GeForce 7900 GTX|301;GeForce 7950 GT|261;GeForce 7950 GX2|191;GeForce 800A|440;GeForce 800M|573;GeForce 8100 / nForce 720a|85;GeForce 810A|638;GeForce 810M|449;GeForce 8200|81;GeForce 8200M G|57;GeForce 820A|689;GeForce 820M|597;GeForce 825M|743;GeForce 8300|92;GeForce 8300 GS|67;GeForce 830A|972;GeForce 830M|815;GeForce 8400|101;GeForce 8400 GS|114;GeForce 8400 SE|68;GeForce 8400M G|58;GeForce 8400M GS|83;GeForce 8400M GT|97;GeForce 840A|873;GeForce 840M|875;GeForce 845M|1038;GeForce 8500 GT|139;GeForce 8600 GS|147;GeForce 8600 GT|248;GeForce 8600 GTS|291;GeForce 8600GS|147;GeForce 8600M GS|126;GeForce 8600M GT|172;GeForce 8700M GT|216;GeForce 8800 GS|551;GeForce 8800 GT|755;GeForce 8800 GTS|610;GeForce 8800 GTS 512|843;GeForce 8800 GTX|769;GeForce 8800 Ultra|791;GeForce 8800M GTS|482;GeForce 8800M GTX|548;GeForce 9100|83;GeForce 9100M G|74;GeForce 910M|467;GeForce 9200|82;GeForce 9200M GE|81;GeForce 9200M GS|87;GeForce 920A|931;GeForce 920M|707;GeForce 920MX|990;GeForce 9300|126;GeForce 9300 / nForce 730i|132;GeForce 9300 GE|102;GeForce 9300 GS|93;GeForce 9300GE|97;GeForce 9300M G|85;GeForce 9300M GS|97;GeForce 930A|1188;GeForce 930M|900;GeForce 930MX|1139;GeForce 9400|147;GeForce 9400 GT|192;GeForce 9400M|121;GeForce 9400M G|126;GeForce 940A|810;GeForce 940M|947;GeForce 940MX|1220;GeForce 945M|1500;GeForce 9500 GS|285;GeForce 9500 GT|281;GeForce 9500M|103;GeForce 9500M G|166;GeForce 9500M GS|187;GeForce 9600 GS|451;GeForce 9600 GSO|517;GeForce 9600 GSO 512|498;GeForce 9600 GT|740;GeForce 9600M GS|239;GeForce 9600M GT|268;GeForce 9600M GT / GeForce GT 220M|293;GeForce 9650M GS|285;GeForce 9650M GT|260;GeForce 9700M GT|331;GeForce 9700M GTS|485;GeForce 9800 GT|718;GeForce 9800 GTX|769;GeForce 9800 GTX+|919;GeForce 9800 GTX/9800 GTX+|892;GeForce 9800 GX2|805;GeForce 9800 S|635;GeForce 9800M GS|551;GeForce 9800M GT|469;GeForce 9800M GTS|648;GeForce 9800M GTX|530;GeForce FX 5200|7;GeForce FX 5200 Ultra|12;GeForce FX 5200LE|7;GeForce FX 5200SE|11;GeForce FX 5500|8;GeForce FX 5600|11;GeForce FX 5600 Ultra|17;GeForce FX 5600XT|9;GeForce FX 5700|41;GeForce FX 5700 Ultra|30;GeForce FX 5700LE|25;GeForce FX 5700VE|37;GeForce FX 5900|34;GeForce FX 5900 Ultra|41;GeForce FX 5900XT|42;GeForce FX 5950 Ultra|59;GeForce FX Go 5200|8;GeForce FX Go 5600|18;GeForce FX Go5300|12;GeForce FX Go5650|16;GeForce FX Go5700|47;GeForce G 103M|108;GeForce G 105M|115;GeForce G100|100;GeForce G102M|97;GeForce G105M|185;GeForce G200|133;GeForce G205M|103;GeForce G210|174;GeForce G210M|205;GeForce Go 6100|18;GeForce Go 6150|18;GeForce Go 6200|14;GeForce Go 6400|24;GeForce Go 6600|68;GeForce Go 6600 TE/6200 TE|44;GeForce Go 6800|104;GeForce Go 6800 Ultra|137;GeForce Go 7200|44;GeForce Go 7300|49;GeForce Go 7400|63;GeForce Go 7600|128;GeForce Go 7600 GT|163;GeForce Go 7700|147;GeForce Go 7800|116;GeForce Go 7800 GTX|208;GeForce Go 7900 GS|175;GeForce Go 7950 GTX|263;GeForce GPU|1131;GeForce GT 120|295;GeForce GT 120M|280;GeForce GT 130|462;GeForce GT 130M|304;GeForce GT 140|761;GeForce GT 220|356;GeForce GT 220M|270;GeForce GT 230|474;GeForce GT 230M|338;GeForce GT 240|651;GeForce GT 240M|356;GeForce GT 320|555;GeForce GT 320M|210;GeForce GT 325M|297;GeForce GT 330|555;GeForce GT 330M|367;GeForce GT 335M|500;GeForce GT 340|799;GeForce GT 415M|319;GeForce GT 420|461;GeForce GT 420M|548;GeForce GT 425M|624;GeForce GT 430|659;GeForce GT 435M|663;GeForce GT 440|839;GeForce GT 445M|1058;GeForce GT 520|367;GeForce GT 520M|382;GeForce GT 520MX|402;GeForce GT 525M|599;GeForce GT 530|741;GeForce GT 540M|651;GeForce GT 545|1287;GeForce GT 550M|721;GeForce GT 555M|901;GeForce GT 610|354;GeForce GT 620|432;GeForce GT 620M|558;GeForce GT 625|435;GeForce GT 625M|452;GeForce GT 630|790;GeForce GT 630M|678;GeForce GT 635|924;GeForce GT 635M|682;GeForce GT 640|1284;GeForce GT 640M|929;GeForce GT 640M LE|790;GeForce GT 645|2215;GeForce GT 645M|855;GeForce GT 650M|1205;GeForce GT 705|409;GeForce GT 710|657;GeForce GT 710M|531;GeForce GT 720|711;GeForce GT 720A|661;GeForce GT 720M|539;GeForce GT 730|927;GeForce GT 730A|717;GeForce GT 730M|803;GeForce GT 735M|642;GeForce GT 740|1579;GeForce GT 740M|770;GeForce GT 745A|1146;GeForce GT 745M|948;GeForce GT 750M|1291;GeForce GT 755M|1575;GeForce GT 820M|614;GeForce GT625M|530;GeForce GTS 160M|665;GeForce GTS 240|837;GeForce GTS 250|895;GeForce GTS 250M|561;GeForce GTS 350M|558;GeForce GTS 360M|757;GeForce GTS 450|1556;GeForce GTX 1050|4553;GeForce GTX 1050 Ti|5803;GeForce GTX 1060|8745;GeForce GTX 1060 3GB|8569;GeForce GTX 1060 6GB|8686;GeForce GTX 1070|10922;GeForce GTX 1080|11980;GeForce GTX 1080 Ti|13210;GeForce GTX 260|1127;GeForce GTX 260M|598;GeForce GTX 275|1234;GeForce GTX 280|1198;GeForce GTX 280M|667;GeForce GTX 285|1265;GeForce GTX 285M|750;GeForce GTX 295|1049;GeForce GTX 460|2647;GeForce GTX 460 SE|2250;GeForce GTX 460 v2|2528;GeForce GTX 460M|1385;GeForce GTX 465|2947;GeForce GTX 470|3602;GeForce GTX 470M|1949;GeForce GTX 480|4352;GeForce GTX 480M|2021;GeForce GTX 485M|2341;GeForce GTX 550 Ti|1926;GeForce GTX 555|2179;GeForce GTX 560|3128;GeForce GTX 560 SE|2233;GeForce GTX 560 Ti|3538;GeForce GTX 560M|1557;GeForce GTX 570|4410;GeForce GTX 570M|2025;GeForce GTX 580|5014;GeForce GTX 580M|2286;GeForce GTX 590|4167;GeForce GTX 645|1916;GeForce GTX 650|1831;GeForce GTX 650 Ti|2661;GeForce GTX 650 Ti BOOST|3531;GeForce GTX 660|4120;GeForce GTX 660 Ti|4690;GeForce GTX 660M|1409;GeForce GTX 670|5375;GeForce GTX 670M|1897;GeForce GTX 670MX|2053;GeForce GTX 675M|2125;GeForce GTX 675MX|2364;GeForce GTX 680|5696;GeForce GTX 680M|3377;GeForce GTX 680MX|4371;GeForce GTX 690|5311;GeForce GTX 745|2169;GeForce GTX 750|3272;GeForce GTX 750 Ti|3695;GeForce GTX 760|4952;GeForce GTX 760 Ti|5059;GeForce GTX 760A|1281;GeForce GTX 760M|1392;GeForce GTX 765M|1879;GeForce GTX 770|6107;GeForce GTX 770M|2649;GeForce GTX 775M|4210;GeForce GTX 780|7987;GeForce GTX 780 Ti|8902;GeForce GTX 780M|4062;GeForce GTX 850A|802;GeForce GTX 850M|1487;GeForce GTX 860M|1707;GeForce GTX 870M|2249;GeForce GTX 880M|3598;GeForce GTX 950|5212;GeForce GTX 950A|1367;GeForce GTX 950M|1798;GeForce GTX 960|5827;GeForce GTX 960A|2151;GeForce GTX 960M|2037;GeForce GTX 965M|2980;GeForce GTX 970|8573;GeForce GTX 970M|4019;GeForce GTX 980|9589;GeForce GTX 980 Ti|11347;GeForce GTX 980M|5684;GeForce GTX Titan|7878;GeForce GTX TITAN Black|8585;GeForce GTX TITAN X|10674;GeForce GTX TITAN Z|7766;GeForce PCX 5300|6;GeForce PCX 5750|34;GeForce2 GTS/GeForce2 Pro|3;GeForce2 Integrated GPU|4;GeForce2 MX|2;GeForce2 MX 100/200|3;GeForce2 MX/MX 400|3;GeForce2 Ti|4;GeForce3|4;GeForce3 Ti 200|4;GeForce3 Ti 500|2;GeForce4 420 Go|3;GeForce4 420 Go 32M|5;GeForce4 4200 Go|4;GeForce4 440 Go|3;GeForce4 440 Go 64M|5;GeForce4 448 Go|5;GeForce4 460 Go --MobileForce M4 Stock--|5;GeForce4 MX 4000|4;GeForce4 MX 420|4;GeForce4 MX 440|4;GeForce4 MX 440 with AGP8X|4;GeForce4 MX 440SE|4;GeForce4 MX 460|5;GeForce4 MX Integrated GPU|6;GeForce4 Ti 4200|5;GeForce4 Ti 4400|7;GeForce4 Ti 4600|5;GeForce4 Ti 4800 SE|6;GeForce9400M|105;GF117|554;GIGABYTE RADEON 9600 PRO|43;GRID K1|880;GRID K140Q|727;GRID K160Q|701;GRID K180Q|776;GRID K2|3772;GRID K220Q|912;GRID K240Q|2143;GRID K260Q|2940;GRID K280Q|2194;GRID K520|4370;GRID M60-2Q|7620;GRID M60-8Q|3469;GTX 965M|5139;Intel - Express Chipset G41|62;Intel - Express Chipset Q45/Q43|60;Intel 4th Generation Haswell HD|353;Intel 82845G Controller|2;Intel 82845G/GL Controller|2;Intel 82845G/GL/GE/PE/GV Controller|2;Intel 82865G Controller|4;Intel 82915G Express|5;Intel 82915G/GV/910GL Express|3;Intel 82945G Express|6;Intel 865 Embedded Controller|3;Intel 946GZ Express|6;Intel B43 Express Chipset|65;Intel G33/G31 Express|11;Intel G35 Express|30;Intel G41 Express Chipset|63;Intel G41 Express-Chipsatz|58;Intel G45/G43 Express Chipset|70;Intel G965 Express|17;Intel Haswell HD - GT1|121;Intel Haswell HD - GT2|160;Intel HD 3000|313;Intel HD 4000|453;Intel HD 4400|557;Intel HD 4600|708;Intel HD 5000|595;Intel HD 510|620;Intel HD 515|634;Intel HD 520|850;Intel HD 5200|777;Intel HD 530|1006;Intel HD 5300|400;Intel HD 5500|575;Intel HD 5600|665;Intel HD 6000|827;Intel HD 610|737;Intel HD 615|715;Intel HD 620|943;Intel HD 630|1262;Intel HD Family|422;Intel HD Modded|119;Intel HD P3000|352;Intel HD P4000|421;Intel HD P4600|604;Intel HD P4600/P4700|656;Intel HD P530|1080;Intel HD P630|1447;Intel Iris 5100|730;Intel Iris 540|1362;Intel Iris 550|1678;Intel Iris 6100|962;Intel Iris Plus 640|1440;Intel Iris Plus 650|1898;Intel Iris Pro 5200|1178;Intel Iris Pro 580|1911;Intel Iris Pro 6200|1487;Intel Iris Pro P580|2273;Intel Media Accelerator 3150|3;Intel Media Accelerator 500|3;Intel Media Accelerator 600|6;Intel Media Accelerator HD|115;Intel Q33 Express|11;Intel Q35 Express|11;Intel Q45/Q43 Express Chipset|67;Intel Q45/Q43 Express-Chipsatz|61;Intel Q965/Q963 Express|7;Intel Skylake HD DT GT2|576;Intel US15 Embedded Media and Controller|7;ION|100;ION LE|102;KB 2C|235;M860G with Mobility Radeon 4100|76;M880G with Mobility Radeon HD 4200|93;M880G with Mobility Radeon HD 4225|70;M880G with Mobility Radeon HD 4250|105;Matrox C680 PCIe x16|1951;Matrox G200e WDDM 1.2|59;Matrox G200eh|40;Matrox G200eh WDDM 1.2|52;Matrox G200eR|36;Matrox G200eR WDDM 1.2|67;Matrox G200eW|42;Matrox G200eW WDDM 1.2|50;Matrox M9125 PCIe x16|25;Matrox M9140 LP PCIe x16|19;Matrox Millennium P650 PCIe 128|5;Matrox Millennium P690 PCIe x16|10;Matrox Millennium P690 Plus LP PCIe x16|6;Matrox Parhelia APVe|5;Mobile Intel - famiglia Express Chipset 45|41;Mobile Intel - famiglia Express Chipset serie 4|46;Mobile Intel 4 Express-Chipsatzfamilie|44;Mobile Intel 45 Express|44;Mobile Intel 45 Express-Chipsatzfamilie|41;Mobile Intel 915GM/GMS/910GML Express|4;Mobile Intel 945 Express|4;Mobile Intel 945GM Express|5;Mobile Intel 945GM/GU Express|5;Mobile Intel 965 Express|20;Mobile Intel 965 Express-Chipsatzfamilie|24;Mobile Intel HD|407;Mobile Intel serie 4 Express|44;MOBILITY FIREGL T2|39;MOBILITY FIREGL T2/T2e|33;MOBILITY FireGL V3200|61;MOBILITY FireGL V5000|81;MOBILITY FireGL V5200|44;MOBILITY FireGL V5250|26;Mobility FireGL V5725|228;Mobility Radeon 4100|86;MOBILITY RADEON 7000 IGP|6;MOBILITY RADEON 7500|3;MOBILITY RADEON 9000|3;MOBILITY RADEON 9000 IGP|7;MOBILITY RADEON 9000/9100 IGP|5;MOBILITY RADEON 9100 IGP|2;MOBILITY RADEON 9200|3;MOBILITY RADEON 9600 PRO TURBO|25;MOBILITY RADEON 9600/9700|39;MOBILITY RADEON 9700|27;Mobility Radeon HD 2300|51;Mobility Radeon HD 2400|91;Mobility Radeon HD 2400 XT|107;Mobility Radeon HD 2600|172;Mobility Radeon HD 2600 XT|198;Mobility Radeon HD 3410|62;Mobility Radeon HD 3430|97;Mobility Radeon HD 3450|92;Mobility Radeon HD 3470|93;Mobility Radeon HD 3470 Hybrid X2|93;Mobility Radeon HD 3650|218;Mobility Radeon HD 3670|233;Mobility Radeon HD 3850|365;Mobility Radeon HD 3870|487;Mobility Radeon HD 3870 X2|568;Mobility Radeon HD 4200|92;Mobility Radeon HD 4225|66;Mobility Radeon HD 4250|99;Mobility Radeon HD 4270|95;Mobility Radeon HD 4330|152;Mobility Radeon HD 4350|148;Mobility Radeon HD 4550|192;Mobility Radeon HD 4570|200;Mobility Radeon HD 4650|398;Mobility Radeon HD 4670|466;Mobility Radeon HD 4830|514;Mobility Radeon HD 4850|864;Mobility Radeon HD 4870|719;Mobility Radeon HD 5000|773;Mobility Radeon HD 5000 Serisi|478;Mobility Radeon HD 5165|284;Mobility Radeon HD 530v|175;Mobility Radeon HD 540v|189;Mobility Radeon HD 5430|181;Mobility Radeon HD 5450|214;Mobility Radeon HD 545v|199;Mobility Radeon HD 5470|234;Mobility Radeon HD 550v|268;Mobility Radeon HD 5570|707;Mobility Radeon HD 560v|321;Mobility Radeon HD 5650|539;Mobility Radeon HD 565v|325;Mobility Radeon HD 5730|670;Mobility Radeon HD 5850|761;Mobility Radeon HD 5870|1219;Mobility Radeon HD serie 4200|96;Mobility Radeon X1300|39;Mobility Radeon X1350|40;Mobility Radeon X1400|43;Mobility Radeon X1450|33;Mobility Radeon X1600|91;Mobility Radeon X1700|102;MOBILITY RADEON X1800|129;Mobility Radeon X1900|134;Mobility Radeon X2300|47;Mobility Radeon X2300 HD|48;Mobility Radeon X2500|68;MOBILITY RADEON X300|34;MOBILITY RADEON X600|51;MOBILITY RADEON X600 SE|49;MOBILITY RADEON X700|66;MOBILITY RADEON XPRESS 200|27;Mobility Radeon. HD 5470|215;MOBILITY/RADEON 9000|4;nForce 750a SLI|86;nForce 760i SLI|140;nForce 780a SLI|92;nForce 980a/780a SLI|81;NVIDIA TITAN X|13016;NVIDIA TITAN Xp|14894;NVS 2100M|192;NVS 300|192;NVS 310|284;NVS 3100M|210;NVS 315|341;NVS 4200M|360;NVS 510|766;NVS 5100M|364;NVS 5200M|642;NVS 5400M|745;NVS 810|1153;OpenXT Display Driver|30;PHDGD Ivy 4|343;PHDGD Solo 1.2.0 x86|11;PHDGD Solo 2 x64|20;Quadro 1000M|744;Quadro 1100M|755;Quadro 2000|1309;Quadro 2000 D|1167;Quadro 2000D|1290;Quadro 2000M|1059;Quadro 280 NVS PCIe|5;Quadro 3000M|1427;Quadro 400|248;Quadro 4000|1984;Quadro 4000M|1794;Quadro 410|425;Quadro 5000|2774;Quadro 5000M|2039;Quadro 500M|672;Quadro 5010M|1748;Quadro 600|688;Quadro 6000|3483;Quadro CX|947;Quadro FX 1000|34;Quadro FX 1100|35;Quadro FX 1300|24;Quadro FX 1400|102;Quadro FX 1500|155;Quadro FX 1500M|170;Quadro FX 1600M|222;Quadro FX 1700|198;Quadro FX 1700M|309;Quadro FX 1800|589;Quadro FX 1800M|487;Quadro FX 2500M|212;Quadro FX 2700M|534;Quadro FX 2800M|672;Quadro FX 3000|66;Quadro FX 3400/4400|99;Quadro FX 3450|148;Quadro FX 3450/4000 SDI|134;Quadro FX 350|85;Quadro FX 3500|207;Quadro FX 3500M|306;Quadro FX 350M|61;Quadro FX 3600M|469;Quadro FX 360M|89;Quadro FX 370|87;Quadro FX 370 LP|108;Quadro FX 3700|634;Quadro FX 3700M|651;Quadro FX 370M|93;Quadro FX 380|158;Quadro FX 380 LP|198;Quadro FX 3800|844;Quadro FX 3800M|806;Quadro FX 380M|210;Quadro FX 4500|207;Quadro FX 4600|610;Quadro FX 4700 X2|665;Quadro FX 4800|991;Quadro FX 500/600 PCI|14;Quadro FX 500/FX 600|7;Quadro FX 540|83;Quadro FX 550|64;Quadro FX 5500|243;Quadro FX 560|118;Quadro FX 5600|682;Quadro FX 570|118;Quadro FX 570M|189;Quadro FX 580|281;Quadro FX 5800|1085;Quadro FX 770M|305;Quadro FX 880M|362;Quadro FX Go1400|101;Quadro GP100|11780;Quadro K1000M|784;Quadro K1100M|988;Quadro K1200|3054;Quadro K2000|1687;Quadro K2000D|1651;Quadro K2000M|1081;Quadro K2100M|1262;Quadro K2200|3510;Quadro K2200M|2067;Quadro K3000M|1709;Quadro K3100M|1893;Quadro K4000|2846;Quadro K4000M|2301;Quadro K4100M|2429;Quadro K420|832;Quadro K4200|4455;Quadro K5000|3991;Quadro K5000M|2631;Quadro K5100M|3011;Quadro K510M|624;Quadro K5200|6125;Quadro K600|825;Quadro K6000|7725;Quadro K610M|729;Quadro K620|2308;Quadro K620M|836;Quadro M1000M|2044;Quadro M1200|2758;Quadro M2000|4341;Quadro M2000M|2654;Quadro M2200|1815;Quadro M3000M|4137;Quadro M4000|6687;Quadro M4000M|3678;Quadro M5000|8510;Quadro M5000M|5271;Quadro M500M|1005;Quadro M5500|9322;Quadro M6000|9421;Quadro M6000 24GB|10301;Quadro M600M|1777;Quadro M620|2886;Quadro NVS 110M|47;Quadro NVS 120M|47;Quadro NVS 130M|59;Quadro NVS 135M|56;Quadro NVS 140M|92;Quadro NVS 150M|96;Quadro NVS 160M|95;Quadro NVS 210S|23;Quadro NVS 210S / GeForce 6150LE|19;Quadro NVS 280 SD|1;Quadro NVS 285|34;Quadro NVS 285 128MB|38;Quadro NVS 290|95;Quadro NVS 295|99;Quadro NVS 320M|209;Quadro NVS 420|102;Quadro NVS 440|38;Quadro NVS 450|92;Quadro NVS 55/280 PCI|6;Quadro P1000|4593;Quadro P2000|8936;Quadro P3000|7156;Quadro P4000|10760;Quadro P5000|10815;Quadro P600|3296;Quadro P6000|13473;Quadro2 Pro|1;Quadro4 380 XGL|6;Quadro4 980 XGL|5;Radeon 2100|58;Radeon 3000|101;Radeon 3100|75;Radeon 6600M|737;RADEON 7000 / RADEON VE Family|4;RADEON 7500|3;RADEON 7500 Family|4;RADEON 9000 Family|3;RADEON 9100 Family|5;RADEON 9100 IGP|6;RADEON 9200|3;RADEON 9200 LE Family|2;RADEON 9200 PRO Family|2;RADEON 9200 SE|2;RADEON 9250|2;RADEON 9500|36;RADEON 9500 PRO / 9700|45;RADEON 9550|35;Radeon 9550 / X1050|28;RADEON 9600 Family|26;RADEON 9600 PRO Family|26;RADEON 9600 TX Family|18;RADEON 9600 XT|35;RADEON 9600SE|27;RADEON 9700 PRO|53;RADEON 9800 PRO|54;RADEON 9800 SE|23;RADEON 9800 XT|55;RADEON E4690|405;Radeon E6760|954;Radeon E8860|1657;Radeon HD 2350|77;Radeon HD 2400|122;Radeon HD 2400 PCI|14;Radeon HD 2400 Pro|119;Radeon HD 2400 XT|123;Radeon HD 2600 PRO|216;Radeon HD 2600 Pro AGP|115;Radeon HD 2600 XT|289;Radeon HD 2900 GT|292;Radeon HD 2900 PRO|644;Radeon HD 2900 XT|661;Radeon HD 3200|83;Radeon HD 3300|129;Radeon HD 3450|122;Radeon HD 3470|148;Radeon HD 3650 AGP|147;Radeon HD 3670|250;Radeon HD 3850|533;Radeon HD 3850 AGP|470;Radeon HD 3850 X2|792;Radeon HD 3870|730;Radeon HD 3870 X2|869;Radeon HD 4200|115;Radeon HD 4250|126;Radeon HD 4270|110;Radeon HD 4290|144;Radeon HD 4300/4500 Serisi|155;Radeon HD 4330|163;Radeon HD 4350|173;Radeon HD 4550|245;Radeon HD 4650|344;Radeon HD 4650 AGP|263;Radeon HD 4670|546;Radeon HD 4770|1047;Radeon HD 4810|790;Radeon HD 4830|964;Radeon HD 4850|1028;Radeon HD 4850 X2|1129;Radeon HD 4870|1379;Radeon HD 4870 X2|1272;Radeon HD 4890|1535;Radeon HD 5450|231;Radeon HD 5470|268;Radeon HD 5550|539;Radeon HD 5570|712;Radeon HD 5600/5700|967;Radeon HD 5670|1069;Radeon HD 5750|1419;Radeon HD 5770|1694;Radeon HD 5830|2037;Radeon HD 5850|2259;Radeon HD 5870|2606;Radeon HD 5970|2592;Radeon HD 6230|211;Radeon HD 6250|117;Radeon HD 6290|136;Radeon HD 6290M|137;Radeon HD 6300M|251;Radeon HD 6310|169;Radeon HD 6320|203;Radeon HD 6320 Graphic|216;Radeon HD 6320M|198;RADEON HD 6350|208;Radeon HD 6370D|315;Radeon HD 6370M|271;Radeon HD 6380G|299;Radeon HD 6410D|387;Radeon HD 6430M|193;Radeon HD 6450|282;Radeon HD 6450A|260;Radeon HD 6470M|314;Radeon HD 6480G|404;Radeon HD 6490M|370;Radeon HD 6520G|486;Radeon HD 6530D|514;Radeon HD 6550A|707;Radeon HD 6550D|652;Radeon HD 6570|759;Radeon HD 6610M|561;Radeon HD 6620G|563;Radeon HD 6630M|684;Radeon HD 6650M|699;Radeon HD 6670|1052;Radeon HD 6670 + 6670 Dual|646;Radeon HD 6700M|993;Radeon HD 6750|1294;Radeon HD 6750M|949;Radeon HD 6770|1669;Radeon HD 6770M|992;Radeon HD 6790|2035;Radeon HD 6800M|980;Radeon HD 6850|2258;Radeon HD 6870|2590;Radeon HD 6900M|1923;Radeon HD 6950|3189;Radeon HD 6970|3491;Radeon HD 6990|2624;Radeon HD 7290|140;Radeon HD 7310|171;Radeon HD 7310G|180;Radeon HD 7310M|165;Radeon HD 7340|209;Radeon HD 7340G|194;Radeon HD 7340M|221;Radeon HD 7350|282;Radeon HD 7400G|330;Radeon HD 7420G|450;Radeon HD 7450|317;Radeon HD 7450A|288;Radeon HD 7450M|332;Radeon HD 7470|370;Radeon HD 7470M|413;Radeon HD 7480D|424;Radeon HD 7500G|409;Radeon HD 7500G + 7500M/7600M Dual|623;Radeon HD 7500G + 7550M Dual|497;Radeon HD 7500G + HD 7500M/7600M Dual|355;Radeon HD 7520G|454;Radeon HD 7520G + 7400M Dual|486;Radeon HD 7520G + 7600M Dual|591;Radeon HD 7520G + 7610M Dual|588;Radeon HD 7520G + 7650M Dual|453;Radeon HD 7520G + 7670M Dual|528;Radeon HD 7520G + 7700M Dual|1060;Radeon HD 7520G + 8600/8700M Dual|311;Radeon HD 7520G + HD 7400M Dual|544;Radeon HD 7520G + HD 7600M Dual|596;Radeon HD 7520G + HD 7670M Dual|547;Radeon HD 7520G + HD 8600/8700M Dual|463;Radeon HD 7520G + HD 8750M Dual|651;Radeon HD 7540D|513;Radeon HD 7540D + 6570 Dual|719;Radeon HD 7550M|443;Radeon HD 7550M/7650M|731;Radeon HD 7560D|660;Radeon HD 7560D + 6570 Dual|833;Radeon HD 7560D + 6670 Dual|1130;Radeon HD 7560D + 7560D Dual|982;Radeon HD 7560D + 7670 Dual|1426;Radeon HD 7560D + HD 7000 Dual|534;Radeon HD 7560D + HD 7700 Dual|1346;Radeon HD 7570|980;Radeon HD 7570M|616;Radeon HD 7570M/HD 7670M|699;Radeon HD 7580D|350;Radeon HD 7600G|482;Radeon HD 7600G + 7450M Dual|389;Radeon HD 7600G + 7500M/7600M Dual|405;Radeon HD 7600G + 7550M Dual|423;Radeon HD 7600G + 8500M/8700M Dual|469;Radeon HD 7600G + HD 7500M/7600M Dual|550;Radeon HD 7600G + HD 7550M Dual|509;Radeon HD 7600G + HD 8670M Dual|543;Radeon HD 7600G + HD Dual|412;Radeon HD 7600M + 7600M Dual|823;Radeon HD 7610M|633;Radeon HD 7620G|469;Radeon HD 7620G + 8600M Dual|503;Radeon HD 7620G + 8670M Dual|577;Radeon HD 7620G + HD 8600M Dual|442;Radeon HD 7620G + HD 8670M Dual|513;Radeon HD 7640G|607;Radeon HD 7640G + 6400M Dual|526;Radeon HD 7640G + 7400M Dual|637;Radeon HD 7640G + 7470M Dual|598;Radeon HD 7640G + 7500/7600 Dual|627;Radeon HD 7640G + 7600M Dual|705;Radeon HD 7640G + 7610M Dual|563;Radeon HD 7640G + 7670M Dual|644;Radeon HD 7640G + 7700M Dual|690;Radeon HD 7640G + 8500M Dual|585;Radeon HD 7640G + 8570M Dual|562;Radeon HD 7640G + 8600/8700M Dual|688;Radeon HD 7640G + 8670M Dual|558;Radeon HD 7640G + 8750M Dual|654;Radeon HD 7640G + HD 7400M Dual|630;Radeon HD 7640G + HD 7600M Dual|709;Radeon HD 7640G + HD 7670M Dual|639;Radeon HD 7640G + HD 7700M Dual|589;Radeon HD 7640G + HD 8500M Dual|607;Radeon HD 7640G + HD 8500M N HD 8500M Dual|665;Radeon HD 7640G + HD 8570M Dual|677;Radeon HD 7640G + HD 8600/8700M Dual|529;Radeon HD 7640G + HD 8750M Dual|1091;Radeon HD 7640G + R5 M200 Dual|508;Radeon HD 7640G N HD 7640G + HD 7600M N HD 7600M D|824;Radeon HD 7640G N HD 7640G + HD 7670M Dual|679;Radeon HD 7650A|797;Radeon HD 7650M|726;Radeon HD 7660D|788;Radeon HD 7660D + 6570 Dual|1100;Radeon HD 7660D + 6670 Dual|1238;Radeon HD 7660D + 7470 Dual|465;Radeon HD 7660D + 7670 Dual|1061;Radeon HD 7660D + HD 6670 Dual|1484;Radeon HD 7660D + HD 7700 Dual|1958;Radeon HD 7660G|809;Radeon HD 7660G + 7400M Dual|588;Radeon HD 7660G + 7470M Dual|579;Radeon HD 7660G + 7600M Dual|821;Radeon HD 7660G + 7610M Dual|744;Radeon HD 7660G + 7670M Dual|739;Radeon HD 7660G + 7700M Dual|757;Radeon HD 7660G + 7730M Dual|931;Radeon HD 7660G + 8600M Dual|445;Radeon HD 7660G + 8670M Dual|587;Radeon HD 7660G + HD 7500M/7600M Dual|999;Radeon HD 7660G + HD 7600M Dual|804;Radeon HD 7660G + HD 7670M Dual|719;Radeon HD 7660G + HD 7700M Dual|766;Radeon HD 7660G + HD 7730M Dual|881;Radeon HD 7660G + HD 8670M Dual|725;Radeon HD 7660G N HD 7660G + HD 7600M N HD 7600M D|722;Radeon HD 7660G N HD 7660G + HD 7670M Dual|704;Radeon HD 7660G N HD 7660G + HD 7700M N HD 7700M D|966;Radeon HD 7670|1095;Radeon HD 7670A|1051;Radeon HD 7670M|814;Radeon HD 7670M + 7670M Dual|738;Radeon HD 7690M|996;Radeon HD 7690M XT|1009;Radeon HD 7730|1388;Radeon HD 7730M|1014;Radeon HD 7750|1677;Radeon HD 7750M|1191;Radeon HD 7770|2188;Radeon HD 7790|3032;Radeon HD 7850|3806;Radeon HD 7850M|1372;Radeon HD 7870|4333;Radeon HD 7870 XT|4418;Radeon HD 7870M|1477;Radeon HD 7950 / R9 280|4764;Radeon HD 7970 / R9 280X|5247;Radeon HD 7970M|3768;Radeon HD 7990|5472;Radeon HD 8180|197;Radeon HD 8210|253;Radeon HD 8240|282;Radeon HD 8250|258;Radeon HD 8280|321;Radeon HD 8280E|329;Radeon HD 8280G|269;Radeon HD 8330|343;Radeon HD 8330E|327;Radeon HD 8350|264;Radeon HD 8350G|418;Radeon HD 8370D|433;Radeon HD 8400|365;Radeon HD 8400E|341;Radeon HD 8410G|428;Radeon HD 8450G|408;Radeon HD 8450G + 8600M Dual|545;Radeon HD 8450G + 8670M Dual|474;Radeon HD 8450G + 8750M Dual|637;Radeon HD 8450G + HD 8600M Dual|452;Radeon HD 8450G + HD 8750M Dual|437;Radeon HD 8470|348;Radeon HD 8470D|513;Radeon HD 8470D + 6450 Dual|717;Radeon HD 8490|383;Radeon HD 8500M|557;Radeon HD 8500M/8700M|863;Radeon HD 8510G|509;Radeon HD 8510G + 8500M Dual|596;Radeon HD 8550D|685;Radeon HD 8550G|716;Radeon HD 8550G + 8500M Dual|602;Radeon HD 8550G + 8570M Dual|535;Radeon HD 8550G + 8600/8700M Dual|802;Radeon HD 8550G + 8600M Dual|617;Radeon HD 8550G + 8670M Dual|573;Radeon HD 8550G + 8690M Dual|664;Radeon HD 8550G + 8750M Dual|797;Radeon HD 8550G + HD 7600M Dual|854;Radeon HD 8550G + HD 8570M Dual|529;Radeon HD 8550G + HD 8600/8700M Dual|813;Radeon HD 8550G + HD 8600M Dual|593;Radeon HD 8550G + HD 8670M Dual|365;Radeon HD 8550G + HD 8750M Dual|824;Radeon HD 8550G + R5 M200 Dual|628;Radeon HD 8550G + R5 M230 Dual|667;Radeon HD 8570|963;Radeon HD 8570 + 8670D Dual|620;Radeon HD 8570D|680;Radeon HD 8570D + 6570 Dual|1239;Radeon HD 8570D + HD 6570 Dual|868;Radeon HD 8570D + HD 6670 Dual|1260;Radeon HD 8570D + HD 7700 Dual|1834;Radeon HD 8570D + HD 8570 Dual|1032;Radeon HD 8570D + R7 200 Dual|999;Radeon HD 8570D + R7 240 Dual|963;Radeon HD 8570M|547;Radeon HD 8600/8700M|1023;Radeon HD 8610G|551;Radeon HD 8610G + 8500M Dual|610;Radeon HD 8610G + 8600M Dual|588;Radeon HD 8610G + 8670M Dual|599;Radeon HD 8610G + HD 8500M Dual|645;Radeon HD 8610G + HD 8600M Dual|575;Radeon HD 8610G + HD 8670M Dual|574;Radeon HD 8610G + R5 M200 Dual|675;Radeon HD 8650D|578;Radeon HD 8650G|951;Radeon HD 8650G + 7600M Dual|741;Radeon HD 8650G + 7670M Dual|778;Radeon HD 8650G + 8500M Dual|626;Radeon HD 8650G + 8570M Dual|652;Radeon HD 8650G + 8600/8700M Dual|835;Radeon HD 8650G + 8600M Dual|613;Radeon HD 8650G + 8670M Dual|638;Radeon HD 8650G + 8750M Dual|787;Radeon HD 8650G + HD 7600M Dual|854;Radeon HD 8650G + HD 7670M Dual|634;Radeon HD 8650G + HD 8570M Dual|728;Radeon HD 8650G + HD 8600/8700M Dual|768;Radeon HD 8650G + HD 8600M Dual|604;Radeon HD 8650G + HD 8670M Dual|608;Radeon HD 8650G + HD 8750M Dual|791;Radeon HD 8650G + R5 M200 Dual|756;Radeon HD 8650G + R5 M230 Dual|708;Radeon HD 8650G N HD 8650G + HD 8570M Dual|773;Radeon HD 8650G N HD 8650G + HD 8600M N HD 8600M D|679;Radeon HD 8670D|802;Radeon HD 8670D + 6670 Dual|1361;Radeon HD 8670D + 7700 Dual|1788;Radeon HD 8670D + HD 6670 Dual|1221;Radeon HD 8670D + HD 7000 Dual|655;Radeon HD 8670D + HD 7700 Dual|1892;Radeon HD 8670D + R5 235 Dual|836;Radeon HD 8670D + R7 200 Dual|949;Radeon HD 8670D + R7 240 Dual|1020;Radeon HD 8670M|513;Radeon HD 8690A|919;Radeon HD 8690M|930;Radeon HD 8730M|895;Radeon HD 8750M|1033;Radeon HD 8790M|1266;Radeon HD 8790M / R9 M290X|1236;Radeon HD 8850M|1062;Radeon HD 8850M / R9 M265X|1139;Radeon HD 8870M|1671;Radeon HD 8870M / R9 M270X / M370X|1799;Radeon HD 8950|3104;Radeon HD 8970M|3889;Radeon HD 8990|4750;RADEON HD6370D|331;RADEON HD6410D|422;RADEON HD6530D|531;Radeon HD7570|1028;Radeon HD8490|373;Radeon HD8970M|3193;Radeon IGP 320M|3;Radeon IGP 340M|2;RADEON IGP 345M|2;RADEON IGP 350M|6;Radeon Pro 460|3492;Radeon Pro Duo|9376;Radeon Pro WX 4100|3749;Radeon Pro WX 5100|6040;Radeon Pro WX 7100|7978;Radeon Pro WX4100|3949;Radeon R2|302;Radeon R2E|223;Radeon R3|373;Radeon R3E|271;Radeon R4|399;Radeon R5 220|230;Radeon R5 235|346;Radeon R5 235 + HD 7560D Dual|743;Radeon R5 235X|373;Radeon R5 240|654;Radeon R5 310|340;Radeon R5 330|661;Radeon R5 A10-9600P RADEON R5, 10 COMPUTE CORES 4C|551;Radeon R5 M230|515;Radeon R5 M240|508;Radeon R5 M255|742;Radeon R5 M315|620;Radeon R5 M320|598;Radeon R5 M330|580;Radeon R5 M335|554;Radeon R5 M430|630;Radeon R5 PRO A10-8730B R5, 10 COMPUTE CORES 4C+6G|931;Radeon R5 PRO A6-9500E R5, 6 COMPUTE CORES 2C+4G|966;Radeon R5E|333;Radeon R6|639;Radeon R6 + R7 M265DX Dual|570;Radeon R6 A10-8700P|658;Radeon R6 A8-8600P|468;Radeon R6 PRO A10-8700B R6, 10 Compute Cores 4C+6G|536;Radeon R6 PRO A8-8600B R6, 10 Compute Cores 4C+6G|534;Radeon R7 + HD 7700 Dual|1962;Radeon R7 + R5 330 Dual|1014;Radeon R7 + R7 200 Dual|1277;Radeon R7 + R7 240 Dual|1045;Radeon R7 + R7 350 Dual|1982;Radeon R7 240|963;Radeon R7 240 + HD 8570D Dual|917;Radeon R7 240 + HD 8670D Dual|930;Radeon R7 250|1407;Radeon R7 260|2880;Radeon R7 260X|3114;Radeon R7 340|1031;Radeon R7 360|3244;Radeon R7 370|4627;Radeon R7 450|2144;Radeon R7 A10 Extreme Edition|854;Radeon R7 A10 PRO-7800B|877;Radeon R7 A10 PRO-7850B|1015;Radeon R7 A10-7700K|909;Radeon R7 A10-7800|891;Radeon R7 A10-7850K|1017;Radeon R7 A10-7860K|1008;Radeon R7 A10-7870K|1152;Radeon R7 A10-7890K|1209;Radeon R7 A10-8750|1001;Radeon R7 A12-9700P RADEON|784;Radeon R7 A265|987;Radeon R7 A370|1281;Radeon R7 A8 PRO-7600B|711;Radeon R7 A8-7500 Radeon R7, 10 Compute Cores 4C+6|1003;Radeon R7 A8-7600|930;Radeon R7 A8-7650K|866;Radeon R7 A8-7670K|841;Radeon R7 A8-8650|905;Radeon R7 A8-9600 RADEON|1301;Radeon R7 FX-8800P|782;Radeon R7 FX-9800P RADEON|782;Radeon R7 FX-9830P RADEON|1522;Radeon R7 M260|659;Radeon R7 M260X|1104;Radeon R7 M265|810;Radeon R7 M270|734;Radeon R7 M340|734;Radeon R7 M350|1408;Radeon R7 M360|699;Radeon R7 M370|1395;Radeon R7 M440|900;Radeon R7 M445|942;Radeon R7 M460|837;Radeon R7 PRO A10-8750B|922;Radeon R7 PRO A10-8770|1319;Radeon R7 PRO A10-8770E|1191;Radeon R7 PRO A10-8850B|934;Radeon R7 PRO A10-9700|1370;Radeon R7 PRO A10-9700E|1289;Radeon R7 PRO A12-8800B|784;Radeon R7 PRO A12-8870|1442;Radeon R7 PRO A12-8870E|799;Radeon R7 PRO A12-9800|1346;Radeon R7 PRO A12-9800B|1053;Radeon R7 PRO A12-9800E|1077;Radeon R7 PRO A8-8650B|897;Radeon R7 PRO A8-9600|1062;Radeon R9 255|1757;Radeon R9 260|3018;Radeon R9 270 / R7 370|4259;Radeon R9 270X|4646;Radeon R9 280|5287;Radeon R9 280X|5796;Radeon R9 285 / 380|5546;Radeon R9 290 / 390|7030;Radeon R9 290X / 390X|7313;Radeon R9 295X2|7426;Radeon R9 350|2213;Radeon R9 360|3046;Radeon R9 370|4722;Radeon R9 380|5982;Radeon R9 380X|6017;Radeon R9 390|7892;Radeon R9 390X|8428;Radeon R9 Fury + Fury X|8352;Radeon R9 M265X|1291;Radeon R9 M270X|1486;Radeon R9 M275|1111;Radeon R9 M275X / M375|1508;Radeon R9 M290X|4050;Radeon R9 M295X|5101;Radeon R9 M360|1907;Radeon R9 M370X|1935;Radeon R9 M375|1274;Radeon R9 M375X|2188;Radeon R9 M380|3047;Radeon R9 M390X|4118;Radeon R9 M395|5155;Radeon R9 M395X|5745;Radeon R9 M470X|3507;Radeon RX 460|4297;Radeon RX 470|7335;Radeon RX 480|8046;Radeon RX 570|6686;Radeon RX 580|7500;Radeon TM R9 A360|2148;Radeon X1050|50;Radeon X1200|31;Radeon X1250|36;Radeon X1270|31;Radeon X1300|57;Radeon X1300 PRO|86;Radeon X1550|64;Radeon X1550 64-bit|46;Radeon X1600|44;Radeon X1600 Pro|98;Radeon X1600 Pro / X1300XT|69;Radeon X1600 XT|111;Radeon X1650 GTO|74;Radeon X1650 Pro|82;Radeon X1650 SE|71;Radeon X1700 Targa Edition|116;Radeon X1800 GTO|140;Radeon X1900 CrossFire Edition|137;Radeon X1900 GT|145;Radeon X1950 CrossFire Edition|151;Radeon X1950 GT|110;Radeon X1950 Pro|111;RADEON X300SE|38;RADEON X550|49;RADEON X550XT|54;Radeon X550XTX|70;RADEON X600 256MB HyperMemory|56;RADEON X600XT|91;RADEON X700|71;RADEON X700 PRO|76;RADEON X700 SE|71;RADEON X800 GT|84;RADEON X800 GTO|75;RADEON X800 PRO|64;RADEON X800 PRO/GTO|73;RADEON X800 XL|69;RADEON X800 XT|97;RADEON X800GT|79;RADEON X850 PRO|72;RADEON X850 XT|81;RADEON X850 XT Platinum Edition|79;Radeon Xpress 1100|32;Radeon Xpress 1150|29;Radeon Xpress 1200|35;Radeon Xpress 1250|43;Radeon Xpress 1270|26;RADEON XPRESS 200|29;RADEON XPRESS 200M|21;RadeonT R7 450|2115;Rage Fury Pro/Xpert 2000 Pro|3;RIVA TNT2 Model 64/Model 64 Pro|3;RIVA TNT2/TNT2 Pro|3;RV530 PRO|118;S3 Chrome 430 ULP|39;S3 ProSavageDDR|1;SAPPHIRE RADEON 9600 ATLANTIS|47;SAPPHIRE Radeon X1550|61;Sapphire RADEON X800 GT|112;Sherry 1.3 for GMA 3150|1;Sherry 1.3.2 beta for 945 chipsets|3;SiS 630/730|1;SiS 650_651_M650_M652_740|3;SiS 651|2;SiS 661FX|3;SiS 661FX/GX Mirage|4;SiS 661FX_760_741_M661FX_M760_M741|4;SiS 741|4;SiS 760|5;SiS M661MX|4;SiS M760GX|3;SiS Mirage|4;SiS Mirage 3|2;SUMO 9640|650;SUMO 964A|497;Tesla C2050|3472;Tesla C2050 / C2070|3756;Tesla C2070|3040;Tesla C2075|3191;TRINITY DEVASTATOR MOBILE|575;Vanta/Vanta LT|3;VIA Chrome9 HC IGP|4;VIA Chrome9 HC IGP Family|4;VIA Chrome9 HC IGP Family WDDM|3;VIA Chrome9 HC IGP Prerelease WDDM 1.1|2;VIA Chrome9 HC IGP WDDM|3;VIA Chrome9 HC IGP WDDM 1.1|3;VIA Chrome9 HD IGP|11;VIA/S3G Chrome 645/640 GPU|106;VIA/S3G DeltaChrome IGP|3;VIA/S3G KM400/KN400|4;VIA/S3G UniChrome IGP|4;VIA/S3G UniChrome Pro IGP|4;VIA/S3G UniChromeII|5;VirtualBox Adapter for Windows 8+|441;Wine Display Adapter|280"
//unpack gpu benchmarks 
var availBenchmarks=[];
	packed.split(";").forEach(function(v) { var arr=v.split("|"); availBenchmarks.push({vendor:arr[0],score:arr[1]}) })


	function sortEM(vendorName)
	{
		return availBenchmarks.sort(function(a,b){
			
			return Levenshtein.get(a,vendorName)<Levenshtein.get(b,vendorName)	
		})	
	}
	
	
return {
	lt:function(bmVal,callback){
	 	$$.on("slow-device",callback)
		
		return this;	
	},
	run:function(){	
		var canvas = document.createElement('canvas');
		var gl;
		var debugInfo;
		var vendor;
		var renderer;

		try {
		  gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
		} 
		catch (e) {
		}

		if (gl) {
		  debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
		  vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
		  renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
		}

		console.log(debugInfo, vendor, renderer);



		//renderer contains graphics card vendor info

		//var sorted=sortEM(renderer)
		console.warn("gpu-info only rudimentary")
		
		if (renderer.indexOf("Intel"))
		$$.trigger("slow-device")
	
	}

}

}



/* WEBPACK VAR INJECTION */}.call(__webpack_exports__, __webpack_require__(332)(module)))

/***/ }),
/* 143 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_jquery__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_jquery__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__graph_hud_html__ = __webpack_require__(269);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__graph_hud_html___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__graph_hud_html__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__info_panel_InfoPanel__ = __webpack_require__(146);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__company_info_CompanyInfo__ = __webpack_require__(145);
/**
 * the hud is the text overlay over the 3d scene. it contains all the other visual components
 */

//TODO import css rules
//TODO import other vusual components and templates








class GraphHUD extends HTMLElement {

    constructor(...args) {
        super(...args);

    }

    connectedCallback() {

        __WEBPACK_IMPORTED_MODULE_0_jquery___default()(this).append(__WEBPACK_IMPORTED_MODULE_1__graph_hud_html___default.a)


    }


}


customElements.define("graph-hud", GraphHUD);


/***/ }),
/* 144 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__company_details_body_html__ = __webpack_require__(267);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__company_details_body_html___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__company_details_body_html__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__utils_TemplateString__ = __webpack_require__(152);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_jquery__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_jquery__);




class CompanyDetails extends HTMLElement {

    constructor(...args) {
        super(...args);


    }

    connectedCallback() {


        this.setStuff()

    }


    setStuff(o) {

        o = _.extend({name: "CompanyName", link: ""}, o)


        let str = new __WEBPACK_IMPORTED_MODULE_1__utils_TemplateString__["a" /* default */](__WEBPACK_IMPORTED_MODULE_0__company_details_body_html___default.a).format(o)

        __WEBPACK_IMPORTED_MODULE_2_jquery__(this).html(str)


    }


    //placeholder use polymer highstock component instead if possible
    initBody() {
        dj_recent();
        var seriesOptions = [], seriesCounter = 0, names = ['stockprice', 'sentiment'];

        function createChart() {
            Highcharts.stockChart(
                'max-chart',
                {
                    chart: {
                        style: {
                            fontFamily: 'robotoCondensed-light'
                        }
                        ,
                        backgroundColor: 'rgba(0, 0, 0, 0.31)'
                    },
                    credits: {
                        enabled: false
                    },
                    rangeSelector: {
                        selected: 4,
                        enabled: true,
                        inputEnabled: __WEBPACK_IMPORTED_MODULE_2_jquery__('#max-chart').width() > 300
                    },
                    xAxis: {
                        type: 'datetime',
                        labels: {
                            format: '{value:%m/%e}',
                            align: 'center'
                        }
                    },
                    yAxis: {
                        labels: {
                            formatter: function () {
                                return (this.value > 0 ? ' + ' : '') + this.value + '%';
                            }
                        },
                        plotLines: [{
                            value: 0,
                            width: 2,
                            color: 'silver'
                        }]
                    },
                    navigator: {
                        enabled: true,
                        height: 20
                    },
                    plotOptions: {
                        series: {
                            compare: 'percent',
                            showInNavigator: true
                        }
                    },
                    tooltip: {
                        pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b> ({point.change}%)<br/>',
                        valueDecimals: 2,
                        split: true
                    },
                    scrollbar: {
                        enabled: false
                    },
                    series: seriesOptions,
                    exporting: {
                        enabled: false
                    }
                });
        }


    }


}


customElements.define("company-details", CompanyDetails);

/***/ }),
/* 145 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__company_info_html__ = __webpack_require__(268);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__company_info_html___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__company_info_html__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__searchable_option_list_SearchableOptionList__ = __webpack_require__(147);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__data_ApolloDS__ = __webpack_require__(71);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_lodash__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_lodash___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3_lodash__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_jquery__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4_jquery__);








class CompanyInfo extends HTMLElement {

    constructor(...args) {
        super(...args);

        this.myds = new __WEBPACK_IMPORTED_MODULE_2__data_ApolloDS__["a" /* default */]()
        var that = this


        function generateNews() {

            that.myds.query(that.getNewsQuery(), function (response) {


                //TODO add new news incrementally currently db replaces news again
                // response.data.news.forEach(n => that.addNews(n))
                that.addNews(response.data.news[0])


            })

        }

        generateNews()
        setInterval(generateNews, 11000)


    }

    connectedCallback() {

        __WEBPACK_IMPORTED_MODULE_4_jquery__(this).append(__WEBPACK_IMPORTED_MODULE_0__company_info_html___default.a).addClass("rightCompanyInfo")

    }

    getNewsQuery() {

        //  var time= Date.now()
        var time = __WEBPACK_IMPORTED_MODULE_3_lodash___default.a.random(0, 990000)


        return `
        query News{
          news(latest:${time}){
            title
            content
            author
            
          }
        }
        `


    }

    addNews(obj) {

        let container = __WEBPACK_IMPORTED_MODULE_4_jquery__(this).find("#djnews")


        let newsEntry = __WEBPACK_IMPORTED_MODULE_4_jquery__("<div>")
        newsEntry.append("<b>" + obj.title + "</b>", "<br>", obj.content, "<hr>")
        newsEntry.hide()
        container.prepend(newsEntry)
        newsEntry.slideDown(500)

    }

}


customElements.define("company-info", CompanyInfo);


/***/ }),
/* 146 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__info_panel_html__ = __webpack_require__(270);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__info_panel_html___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__info_panel_html__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_jquery__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_jquery__);



class InfoPanel extends HTMLElement {

    constructor(...args) {
        super(...args);


    }

    connectedCallback() {

        __WEBPACK_IMPORTED_MODULE_1_jquery__(this).append(__WEBPACK_IMPORTED_MODULE_0__info_panel_html___default.a)

        __WEBPACK_IMPORTED_MODULE_1_jquery__(this).find("#clusterTextVisible").change(function () {
            let val = __WEBPACK_IMPORTED_MODULE_1_jquery__(this).val()
            let view = document.querySelector("sample-cluster-application").getView();
            view.setAttribute("text-visible", val)
        })

        __WEBPACK_IMPORTED_MODULE_1_jquery__(this).find("#nodes").change(function () {
            let val = __WEBPACK_IMPORTED_MODULE_1_jquery__(this).val()
            let view = document.querySelector("sample-cluster-application").getView();

            view.mRootCluster.setNodesVisible(val == "true")
        })

        __WEBPACK_IMPORTED_MODULE_1_jquery__(this).find("#edges").change(function () {
            let val = __WEBPACK_IMPORTED_MODULE_1_jquery__(this).val()
            let view = document.querySelector("sample-cluster-application").getView();

            view.mRootCluster.setEdgesVisible(val == "true")
        })

        __WEBPACK_IMPORTED_MODULE_1_jquery__(this).find("#leafs").change(function () {
            let val = __WEBPACK_IMPORTED_MODULE_1_jquery__(this).val()
            let view = document.querySelector("sample-cluster-application").getView();

            view.mRootCluster.setLeafsVisible(val == "true")
        })

        __WEBPACK_IMPORTED_MODULE_1_jquery__(this).find("#particles").change(function () {
            let val = __WEBPACK_IMPORTED_MODULE_1_jquery__(this).val()
            let view = document.querySelector("sample-cluster-application").getView();

            view.mRootCluster.setParticlesVisible(val == "true")
        })


    }


}


customElements.define("info-panel", InfoPanel);


/***/ }),
/* 147 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__sol__ = __webpack_require__(148);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__sol_css__ = __webpack_require__(314);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__sol_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__sol_css__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__searchOptions_json__ = __webpack_require__(330);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__searchOptions_json___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2__searchOptions_json__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__searchable_option_list_html__ = __webpack_require__(271);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__searchable_option_list_html___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3__searchable_option_list_html__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_jquery__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4_jquery__);








class SearchableOptionList extends HTMLElement {


    connectedCallback() {

        __WEBPACK_IMPORTED_MODULE_4_jquery__(this).append(__WEBPACK_IMPORTED_MODULE_3__searchable_option_list_html___default.a)
            .searchableOptionList({
                maxHeight: '250px', showSelectAll: false,
                data: __WEBPACK_IMPORTED_MODULE_2__searchOptions_json___default.a,
                converter: function (sol, rawDataFromUrl) {
                    var solData = rawDataFromUrl;

                    // do whatever you have to do
                    // to convert rawDataFromUrl to
                    // valid SOL data format

                    return solData;
                }
            });
    }


}


customElements.define("searchable-option-list", SearchableOptionList, {extends: "select"});


/***/ }),
/* 148 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_jquery__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_jquery__);
/*
 * SOL - Searchable Option List jQuery plugin
 * Version 2.0.2
 * https://pbauerochse.github.io/searchable-option-list/
 *
 * Copyright 2015, Patrick Bauerochse
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 *
 */



(function ($, window, document) {
    'use strict';

    // constructor
    var SearchableOptionList = function ($element, options) {
        this.$originalElement = $element;
        this.options = options;

        // allow setting options as data attribute
        // e.g. <select data-sol-options="{'allowNullSelection':true}">
        this.metadata = this.$originalElement.data('sol-options');
    };

    // plugin prototype
    SearchableOptionList.prototype = {

        SOL_OPTION_FORMAT: {
            type: 'option',        // fixed
            value: undefined,       // value that will be submitted
            selected: false,           // boolean selected state
            disabled: false,           // boolean disabled state
            label: undefined,       // label string
            tooltip: undefined,       // tooltip string
            cssClass: ''               // custom css class for container
        },
        SOL_OPTIONGROUP_FORMAT: {
            type: 'optiongroup',    // fixed
            label: undefined,        // label string
            tooltip: undefined,        // tooltip string
            disabled: false,            // all children disabled boolean property
            children: undefined         // array of SOL_OPTION_FORMAT objects
        },

        DATA_KEY: 'sol-element',
        WINDOW_EVENTS_KEY: 'sol-window-events',

        // default option values
        defaults: {
            data: undefined,
            name: undefined,           // name attribute, can also be set as name="" attribute on original element or data-sol-name=""

            texts: {
                noItemsAvailable: '',
                selectAll: 'Select all',
                selectNone: 'Select none',
                quickDelete: '&times;',
                searchplaceholder: 'Search +2,000 news categories',
                loadingData: 'loading data...',
                itemsSelected: '{$a} items selected'
            },

            events: {
                onInitialized: undefined,
                onRendered: undefined,
                onOpen: undefined,
                onClose: undefined,
                onChange: undefined,
                onScroll: function () {

                    var selectionContainerYPos = this.$input.offset().top - this.config.scrollTarget.scrollTop() + this.$input.outerHeight(false),
                        selectionContainerHeight = this.$selectionContainer.outerHeight(false),
                        selectionContainerBottom = selectionContainerYPos + selectionContainerHeight,
                        displayContainerAboveInput = this.config.displayContainerAboveInput || document.documentElement.clientHeight - this.config.scrollTarget.scrollTop() < selectionContainerBottom,
                        selectionContainerWidth = this.$innerContainer.outerWidth(false) - parseInt(this.$selectionContainer.css('border-left-width'), 10) - parseInt(this.$selectionContainer.css('border-right-width'), 10);

                    if (displayContainerAboveInput) {
                        // position the popup above the input
                        selectionContainerYPos = this.$input.offset().top - selectionContainerHeight - this.config.scrollTarget.scrollTop() + parseInt(this.$selectionContainer.css('border-bottom-width'), 10);
                        this.$container
                            .removeClass('sol-selection-bottom')
                            .addClass('sol-selection-top');
                    } else {
                        this.$container
                            .removeClass('sol-selection-top')
                            .addClass('sol-selection-bottom');
                    }

                    if (this.$innerContainer.css('display') !== 'block') {
                        // container has a certain width
                        // make selection container a bit wider
                        selectionContainerWidth = selectionContainerWidth * 1.2;
                    } else {

                        var borderRadiusSelector = displayContainerAboveInput ? 'border-bottom-right-radius' : 'border-top-right-radius';

                        // no border radius on top
                        this.$selectionContainer
                            .css(borderRadiusSelector, 'initial');

                        if (this.$actionButtons) {
                            this.$actionButtons
                                .css(borderRadiusSelector, 'initial');
                        }
                    }

                    this.$selectionContainer
                        .css('top', Math.floor(selectionContainerYPos))
                        .css('left', Math.floor(this.$container.offset().left))
                        .css('width', selectionContainerWidth);

                    // remember the position
                    this.config.displayContainerAboveInput = displayContainerAboveInput;
                }
            },

            selectAllMaxItemsThreshold: 30,
            showSelectAll: function () {
                return this.config.multiple && this.config.selectAllMaxItemsThreshold && this.items && this.items.length <= this.config.selectAllMaxItemsThreshold;
            },

            useBracketParameters: false,
            multiple: undefined,
            resultsContainer: undefined, // jquery element where the results should be appended
            closeOnClick: true, // close when user clicked 'select all' or 'deselect all'
            showSelectionBelowList: false,
            allowNullSelection: false,
            scrollTarget: undefined,
            maxHeight: undefined,
            converter: undefined,
            asyncBatchSize: 300,
            maxShow: 0
        },

        // initialize the plugin
        init: function () {
            this.config = $.extend(true, {}, this.defaults, this.options, this.metadata);

            var originalName = this._getNameAttribute(),
                sol = this;

            if (!originalName) {
                this._showErrorLabel('name attribute is required');
                return;
            }

            // old IE does not support trim
            if (typeof String.prototype.trim !== 'function') {
                String.prototype.trim = function () {
                    return this.replace(/^\s+|\s+$/g, '');
                }
            }

            this.config.multiple = this.config.multiple || this.$originalElement.attr('multiple');

            if (!this.config.scrollTarget) {
                this.config.scrollTarget = $(window);
            }

            this._registerWindowEventsIfNeccessary();
            this._initializeUiElements();
            this._initializeInputEvents();

            setTimeout(function () {
                sol._initializeData();

                // take original form element out of form submission
                // by removing the name attribute
                sol.$originalElement
                    .data(sol.DATA_KEY, sol)
                    .removeAttr('name')
                    .data('sol-name', originalName);
            }, 0);

            this.$originalElement.hide();
            this.$container
                .css('visibility', 'initial')
                .show();

            return this;
        },

        _getNameAttribute: function () {
            return this.config.name || this.$originalElement.data('sol-name') || this.$originalElement.attr('name');
        },

        // shows an error label
        _showErrorLabel: function (message) {
            var $errorMessage = $('<div style="color: red; font-weight: bold;" />').html(message);
            if (!this.$container) {
                $errorMessage.insertAfter(this.$originalElement);
            } else {
                this.$container.append($errorMessage);
            }
        },

        // register click handler to determine when to trigger the close event
        _registerWindowEventsIfNeccessary: function () {
            if (!window[this.WINDOW_EVENTS_KEY]) {
                $(document).click(function (event) {
                    // if clicked inside a sol element close all others
                    // else close all sol containers
                    var $clickedElement = $(event.target),
                        $closestSelectionContainer = $clickedElement.closest('.sol-selection-container'),
                        $closestInnerContainer = $clickedElement.closest('.sol-inner-container'),
                        $clickedWithinThisSolContainer;

                    if ($closestInnerContainer.length) {
                        $clickedWithinThisSolContainer = $closestInnerContainer.first().parent('.sol-container');
                    } else if ($closestSelectionContainer.length) {
                        $clickedWithinThisSolContainer = $closestSelectionContainer.first().parent('.sol-container');
                    }

                    $('.sol-active')
                        .not($clickedWithinThisSolContainer)
                        .each(function (index, item) {
                            $(item)
                                .data(SearchableOptionList.prototype.DATA_KEY)
                                .close();
                        });
                });

                // remember we already registered the global events
                window[this.WINDOW_EVENTS_KEY] = true;
            }
        },

        // add sol ui elements
        _initializeUiElements: function () {
            var self = this;

            this.internalScrollWrapper = function () {
                if ($.isFunction(self.config.events.onScroll)) {
                    self.config.events.onScroll.call(self);
                }
            };

            this.$input = $('<input type="text"/>')
                .attr('placeholder', this.config.texts.searchplaceholder);

            this.$noResultsItem = $('<div class="sol-no-results"/>').html(this.config.texts.noItemsAvailable).hide();
            this.$loadingData = $('<div class="sol-loading-data"/>').html(this.config.texts.loadingData);
            this.$xItemsSelected = $('<div class="sol-results-count"/>');

            this.$caret = $('<div class="sol-caret-container"><i class=\"fa fa-search\" aria-hidden=\"true\" style=\"color:black;\"></i></div>').click(function (e) {
                self.toggle();
                e.preventDefault();
                return false;
            });

            var $inputContainer = $('<div class="sol-input-container"/>').append(this.$input);
            this.$innerContainer = $('<div class="sol-inner-container"/>').append($inputContainer).append(this.$caret);
            this.$selection = $('<div class="sol-selection"/>');
            this.$selectionContainer = $('<div class="sol-selection-container"/>')
                .append(this.$noResultsItem)
                .append(this.$loadingData)
                .append(this.$selection);

            this.$container = $('<div class="sol-container"/>')
                .hide()
                .data(this.DATA_KEY, this)
                .append(this.$selectionContainer)
                .append(this.$innerContainer)
                .insertBefore(this.$originalElement);

            // add selected items display container
            this.$showSelectionContainer = $('<div class="sol-current-selection"/>');

            var $el = this.config.resultsContainer || this.$innerContainer
            if (this.config.resultsContainer) {
                this.$showSelectionContainer.appendTo($el)
            } else {
                if (this.config.showSelectionBelowList) {
                    this.$showSelectionContainer.insertAfter($el);
                } else {
                    this.$showSelectionContainer.insertBefore($el);
                }
            }


            // dimensions
            if (this.config.maxHeight) {
                this.$selection.css('max-height', this.config.maxHeight);
            }

            // detect inline css classes and styles
            var cssClassesAsString = this.$originalElement.attr('class'),
                cssStylesAsString = this.$originalElement.attr('style'),
                cssClassList = [],
                stylesList = [];

            if (cssClassesAsString && cssClassesAsString.length > 0) {
                cssClassList = cssClassesAsString.split(/\s+/);

                // apply css classes to $container
                for (var i = 0; i < cssClassList.length; i++) {
                    this.$container.addClass(cssClassList[i]);
                }
            }

            if (cssStylesAsString && cssStylesAsString.length > 0) {
                stylesList = cssStylesAsString.split(/\;/);

                // apply css inline styles to $container
                for (var i = 0; i < stylesList.length; i++) {
                    var splitted = stylesList[i].split(/\s*\:\s*/g);

                    if (splitted.length === 2) {

                        if (splitted[0].toLowerCase().indexOf('height') >= 0) {
                            // height property, apply to innerContainer instead of outer
                            this.$innerContainer.css(splitted[0].trim(), splitted[1].trim());
                        } else {
                            this.$container.css(splitted[0].trim(), splitted[1].trim());
                        }
                    }
                }
            }

            if (this.$originalElement.css('display') !== 'block') {
                this.$container.css('width', this._getActualCssPropertyValue(this.$originalElement, 'width'));
            }

            if ($.isFunction(this.config.events.onRendered)) {
                this.config.events.onRendered.call(this, this);
            }
        },

        _getActualCssPropertyValue: function ($element, property) {

            var domElement = $element.get(0),
                originalDisplayProperty = $element.css('display');

            // set invisible to get original width setting instead of translated to px
            // see https://bugzilla.mozilla.org/show_bug.cgi?id=707691#c7
            $element.css('display', 'none');

            if (domElement.currentStyle) {
                return domElement.currentStyle[property];
            } else if (window.getComputedStyle) {
                return document.defaultView.getComputedStyle(domElement, null).getPropertyValue(property);
            }

            $element.css('display', originalDisplayProperty);

            return $element.css(property);
        },

        _initializeInputEvents: function () {
            // form event
            var self = this,
                $form = this.$input.parents('form').first();

            if ($form && $form.length === 1 && !$form.data(this.WINDOW_EVENTS_KEY)) {
                var resetFunction = function () {
                    var $changedItems = [];

                    $form.find('.sol-option input').each(function (index, item) {
                        var $item = $(item),
                            initialState = $item.data('sol-item').selected;

                        if ($item.prop('checked') !== initialState) {
                            $item
                                .prop('checked', initialState)
                                .trigger('sol-change', true);
                            $changedItems.push($item);
                        }
                    });

                    if ($changedItems.length > 0 && $.isFunction(self.config.events.onChange)) {
                        self.config.events.onChange.call(self, self, $changedItems);
                    }
                };

                $form.on('reset', function (event) {
                    // unfortunately the reset event gets fired _before_
                    // the inputs are actually reset. The only possibility
                    // to overcome this is to set an interval to execute
                    // own scripts some time after the actual reset event

                    // before fields are actually reset by the browser
                    // needed to reset newly checked fields
                    resetFunction.call(self);

                    // timeout for selection after form reset
                    // needed to reset previously checked fields
                    setTimeout(function () {
                        resetFunction.call(self);
                    }, 100);
                });

                $form.data(this.WINDOW_EVENTS_KEY, true);
            }

            // text input events
            this.$input
                .focus(function () {
                    self.open();
                })
                .on('propertychange input', function (e) {
                    var valueChanged = true;
                    if (e.type == 'propertychange') {
                        valueChanged = e.originalEvent.propertyName.toLowerCase() == 'value';
                    }
                    if (valueChanged) {
                        self._applySearchTermFilter();
                    }
                });

            // keyboard navigation
            this.$container
                .on('keydown', function (e) {
                    var keyCode = e.keyCode;

                    // event handling for keyboard navigation
                    // only when there are results to be shown
                    if (!self.$noResultsItem.is(':visible')) {

                        var $currentHighlightedOption,
                            $nextHighlightedOption,
                            directionValue,
                            preventDefault = false,
                            $allVisibleOptions = self.$selection.find('.sol-option:visible');

                        if (keyCode === 40 || keyCode === 38) {
                            // arrow up or down to select an item
                            self._setKeyBoardNavigationMode(true);

                            $currentHighlightedOption = self.$selection.find('.sol-option.keyboard-selection');
                            directionValue = (keyCode === 38) ? -1 : 1;   // negative for up, positive for down

                            var indexOfNextHighlightedOption = $allVisibleOptions.index($currentHighlightedOption) + directionValue;
                            if (indexOfNextHighlightedOption < 0) {
                                indexOfNextHighlightedOption = $allVisibleOptions.length - 1;
                            } else if (indexOfNextHighlightedOption >= $allVisibleOptions.length) {
                                indexOfNextHighlightedOption = 0;
                            }

                            $currentHighlightedOption.removeClass('keyboard-selection');
                            $nextHighlightedOption = $($allVisibleOptions[indexOfNextHighlightedOption])
                                .addClass('keyboard-selection');

                            self.$selection.scrollTop(self.$selection.scrollTop() + $nextHighlightedOption.position().top);

                            preventDefault = true;
                        } else if (self.keyboardNavigationMode === true && keyCode === 32) {
                            // toggle current selected item with space bar
                            $currentHighlightedOption = self.$selection.find('.sol-option.keyboard-selection input');
                            $currentHighlightedOption
                                .prop('checked', !$currentHighlightedOption.prop('checked'))
                                .trigger('change');

                            preventDefault = true;
                        }

                        if (preventDefault) {
                            // dont trigger any events in the input
                            e.preventDefault();
                            return false;
                        }
                    }
                })
                .on('keyup', function (e) {
                    var keyCode = e.keyCode;

                    if (keyCode === 27) {
                        // escape key
                        if (self.keyboardNavigationMode === true) {
                            self._setKeyBoardNavigationMode(false);
                        } else if (self.$input.val() === '') {
                            // trigger closing of container
                            self.$caret.trigger('click');
                            self.$input.trigger('blur');
                        } else {
                            // reset input and result filter
                            self.$input.val('').trigger('input');
                        }
                    } else if (keyCode === 16 || keyCode === 17 || keyCode === 18 || keyCode === 20) {
                        // special events like shift and control
                        return;
                    }
                });
        },

        _setKeyBoardNavigationMode: function (keyboardNavigationOn) {

            if (keyboardNavigationOn) {
                // on
                this.keyboardNavigationMode = true;
                this.$selection.addClass('sol-keyboard-navigation');
            } else {
                // off
                this.keyboardNavigationMode = false;
                this.$selection.find('.sol-option.keyboard-selection')
                this.$selection.removeClass('sol-keyboard-navigation');
                this.$selectionContainer.find('.sol-option.keyboard-selection').removeClass('keyboard-selection');
                this.$selection.scrollTop(0);
            }
        },

        _applySearchTermFilter: function () {
            if (!this.items || this.items.length === 0) {
                return;
            }

            var searchTerm = this.$input.val(),
                lowerCased = (searchTerm || '').toLowerCase();

            // show previously filtered elements again
            this.$selectionContainer.find('.sol-filtered-search').removeClass('sol-filtered-search');
            this._setNoResultsItemVisible(false);

            if (lowerCased.trim().length > 0) {
                this._findTerms(this.items, lowerCased);
            }

            // call onScroll to position the popup again
            // important if showing popup above list
            if ($.isFunction(this.config.events.onScroll)) {
                this.config.events.onScroll.call(this);
            }
        },

        _findTerms: function (dataArray, searchTerm) {
            if (!dataArray || !$.isArray(dataArray) || dataArray.length === 0) {
                return;
            }

            var self = this;

            // reset keyboard navigation mode when applying new filter
            this._setKeyBoardNavigationMode(false);

            $.each(dataArray, function (index, item) {
                if (item.type === 'option') {
                    var $element = item.displayElement,
                        elementSearchableTerms = (item.label + ' ' + item.tooltip).trim().toLowerCase();

                    if (elementSearchableTerms.indexOf(searchTerm) === -1) {
                        $element.addClass('sol-filtered-search');
                    }
                } else {
                    self._findTerms(item.children, searchTerm);
                    var amountOfUnfilteredChildren = item.displayElement.find('.sol-option:not(.sol-filtered-search)');

                    if (amountOfUnfilteredChildren.length === 0) {
                        item.displayElement.addClass('sol-filtered-search');
                    }
                }
            });

            this._setNoResultsItemVisible(this.$selectionContainer.find('.sol-option:not(.sol-filtered-search)').length === 0);
        },

        _initializeData: function () {
            if (!this.config.data) {
                this.items = this._detectDataFromOriginalElement();
            } else if ($.isFunction(this.config.data)) {
                this.items = this._fetchDataFromFunction(this.config.data);
            } else if ($.isArray(this.config.data)) {
                this.items = this._fetchDataFromArray(this.config.data);
            } else if (typeof this.config.data === (typeof 'a string')) {
                this._loadItemsFromUrl(this.config.data);
            } else {
                this._showErrorLabel('Unknown data type');
            }

            if (this.items) {
                // done right away -> invoke postprocessing
                this._processDataItems(this.items);
            }
        },

        _detectDataFromOriginalElement: function () {
            if (this.$originalElement.prop('tagName').toLowerCase() === 'select') {
                var self = this,
                    solData = [];

                $.each(this.$originalElement.children(), function (index, item) {
                    var $item = $(item),
                        itemTagName = $item.prop('tagName').toLowerCase(),
                        solDataItem;

                    if (itemTagName === 'option') {
                        solDataItem = self._processSelectOption($item);
                        if (solDataItem) {
                            solData.push(solDataItem);
                        }
                    } else if (itemTagName === 'optgroup') {
                        solDataItem = self._processSelectOptgroup($item);
                        if (solDataItem) {
                            solData.push(solDataItem);
                        }
                    } else {
                        self._showErrorLabel('Invalid element found in select: ' + itemTagName + '. Only option and optgroup are allowed');
                    }
                });
                return this._invokeConverterIfNeccessary(solData);
            } else if (this.$originalElement.data('sol-data')) {
                var solDataAttributeValue = this.$originalElement.data('sol-data');
                return this._invokeConverterIfNeccessary(solDataAttributeValue);
            } else {
                this._showErrorLabel('Could not determine data from original element. Must be a select or data must be provided as data-sol-data="" attribute');
            }
        },

        _processSelectOption: function ($option) {
            return $.extend({}, this.SOL_OPTION_FORMAT, {
                value: $option.val(),
                selected: $option.prop('selected'),
                disabled: $option.prop('disabled'),
                cssClass: $option.attr('class'),
                label: $option.html(),
                tooltip: $option.attr('title'),
                element: $option
            });
        },

        _processSelectOptgroup: function ($optgroup) {
            var self = this,
                solOptiongroup = $.extend({}, this.SOL_OPTIONGROUP_FORMAT, {
                    label: $optgroup.attr('label'),
                    tooltip: $optgroup.attr('title'),
                    disabled: $optgroup.prop('disabled'),
                    children: []
                }),
                optgroupChildren = $optgroup.children('option');

            $.each(optgroupChildren, function (index, item) {
                var $child = $(item),
                    solOption = self._processSelectOption($child);

                // explicitly disable children when optgroup is disabled
                if (solOptiongroup.disabled) {
                    solOption.disabled = true;
                }

                solOptiongroup.children.push(solOption);
            });

            return solOptiongroup;
        },

        _fetchDataFromFunction: function (dataFunction) {
            return this._invokeConverterIfNeccessary(dataFunction(this));
        },

        _fetchDataFromArray: function (dataArray) {
            return this._invokeConverterIfNeccessary(dataArray);
        },

        _loadItemsFromUrl: function (url) {
            var self = this;
            $.ajax(url, {
                success: function (actualData) {
                    self.items = self._invokeConverterIfNeccessary(actualData);
                    if (self.items) {
                        self._processDataItems(self.items);
                    }
                },
                error: function (xhr, status, message) {
                    self._showErrorLabel('Error loading from url ' + url + ': ' + message);
                },
                dataType: 'json'
            });
        },

        _invokeConverterIfNeccessary: function (dataItems) {
            if ($.isFunction(this.config.converter)) {
                return this.config.converter.call(this, this, dataItems);
            }
            return dataItems;
        },

        _processDataItems: function (solItems) {
            if (!solItems) {
                this._showErrorLabel('Data items not present. Maybe the converter did not return any values');
                return;
            }

            if (solItems.length === 0) {
                this._setNoResultsItemVisible(true);
                this.$loadingData.remove();
                return;
            }

            var self = this,
                nextIndex = 0,
                dataProcessedFunction = function () {
                    // hide "loading data"
                    this.$loadingData.remove();
                    this._initializeSelectAll();

                    if ($.isFunction(this.config.events.onInitialized)) {
                        this.config.events.onInitialized.call(this, this, solItems);
                    }
                },
                loopFunction = function () {

                    var currentBatch = 0,
                        item;

                    while (currentBatch++ < self.config.asyncBatchSize && nextIndex < solItems.length) {
                        item = solItems[nextIndex++];
                        if (item.type === self.SOL_OPTION_FORMAT.type) {
                            self._renderOption(item);
                        } else if (item.type === self.SOL_OPTIONGROUP_FORMAT.type) {
                            self._renderOptiongroup(item);
                        } else {
                            self._showErrorLabel('Invalid item type found ' + item.type);
                            return;
                        }
                    }

                    if (nextIndex >= solItems.length) {
                        dataProcessedFunction.call(self);
                    } else {
                        setTimeout(loopFunction, 0);
                    }
                };

            // start async rendering of html elements
            loopFunction.call(this);
        },

        _renderOption: function (solOption, $optionalTargetContainer) {
            var self = this,
                $actualTargetContainer = $optionalTargetContainer || this.$selection,
                $inputElement,
                $labelText = $('<div class="sol-label-text"/>')
                    .html(solOption.label.trim().length === 0 ? '&nbsp;' : solOption.label)
                    .addClass(solOption.cssClass),
                $label,
                $displayElement,
                inputName = this._getNameAttribute();

            if (this.config.multiple) {
                // use checkboxes
                $inputElement = $('<input type="checkbox" class="sol-checkbox"/>');

                if (this.config.useBracketParameters) {
                    inputName += '[]';
                }
            } else {
                // use radio buttons
                $inputElement = $('<input type="radio" class="sol-radio"/>')
                    .on('change', function () {
                        // when selected notify all others of being deselected
                        self.$selectionContainer.find('input[type="radio"][name="' + inputName + '"]').not($(this)).trigger('sol-deselect');
                    })
                    .on('sol-deselect', function () {
                        // remove display selection item
                        // TODO also better show it inline instead of above or below to save space
                        self._removeSelectionDisplayItem($(this));
                    });
            }

            $inputElement
                .on('change', function (event, skipCallback) {
                    $(this).trigger('sol-change', skipCallback);
                })
                .on('sol-change', function (event, skipCallback) {
                    self._selectionChange($(this), skipCallback);
                })
                .data('sol-item', solOption)
                .prop('checked', solOption.selected)
                .prop('disabled', solOption.disabled)
                .attr('name', inputName)
                .val(solOption.value);

            $label = $('<label class="sol-label"/>')
                .attr('title', solOption.tooltip)
                .append($inputElement)
                .append($labelText);

            $displayElement = $('<div class="sol-option"/>').append($label);
            solOption.displayElement = $displayElement;

            $actualTargetContainer.append($displayElement);

            if (solOption.selected) {
                this._addSelectionDisplayItem($inputElement);
            }
        },

        _renderOptiongroup: function (solOptiongroup) {
            var self = this,
                $groupCaption = $('<div class="sol-optiongroup-label"/>')
                    .attr('title', solOptiongroup.tooltip)
                    .html(solOptiongroup.label),
                $groupItem = $('<div class="sol-optiongroup"/>').append($groupCaption);

            if (solOptiongroup.disabled) {
                $groupItem.addClass('disabled');
            }

            if ($.isArray(solOptiongroup.children)) {
                $.each(solOptiongroup.children, function (index, item) {
                    self._renderOption(item, $groupItem);
                });
            }

            solOptiongroup.displayElement = $groupItem;
            this.$selection.append($groupItem);
        },

        _initializeSelectAll: function () {
            // multiple values selectable
            if (this.config.showSelectAll === true || ($.isFunction(this.config.showSelectAll) && this.config.showSelectAll.call(this))) {
                // buttons for (de-)select all
                var self = this,
                    $deselectAllButton = $('<a href="#" class="sol-deselect-all"/>').html(this.config.texts.selectNone).click(function (e) {
                        self.deselectAll();
                        e.preventDefault();
                        return false;
                    }),
                    $selectAllButton = $('<a href="#" class="sol-select-all"/>').html(this.config.texts.selectAll).click(function (e) {
                        self.selectAll();
                        e.preventDefault();
                        return false;
                    });

                this.$actionButtons = $('<div class="sol-action-buttons"/>').append($selectAllButton).append($deselectAllButton).append('<div class="sol-clearfix"/>');
                this.$selectionContainer.prepend(this.$actionButtons);
            }
        },

        _selectionChange: function ($changeItem, skipCallback) {

            // apply state to original select if neccessary
            // helps to keep old legacy code running which depends
            // on retrieving the value via jQuery option selectors
            // e.g. $('#myPreviousSelectWhichNowIsSol').val()
            if (this.$originalElement && this.$originalElement.prop('tagName').toLowerCase() === 'select') {
                var self = this;
                this.$originalElement.find('option').each(function (index, item) {
                    var $currentOriginalOption = $(item);
                    if ($currentOriginalOption.val() === $changeItem.val()) {
                        $currentOriginalOption.prop('selected', $changeItem.prop('checked'));
                        self.$originalElement.trigger('change');
                        return;
                    }
                });
            }

            if ($changeItem.prop('checked')) {
                document.getElementById('DJSearch').value += "|" + $changeItem[0]['value'];
                ajax_searchTo();
                this._addSelectionDisplayItem($changeItem);
            } else {

                var replace = "|" + $changeItem[0]['value'];
                var str = document.getElementById('DJSearch').value;
                document.getElementById('DJSearch').value = str.replace(replace, '');
                ajax_searchTo();
                this._removeSelectionDisplayItem($changeItem);
            }

            if (this.config.multiple) {
                // update position of selection container
                // to allow selecting more entries
                this.config.scrollTarget.trigger('scroll');
            } else {
                // only one option selectable
                // close selection container
                this.close();
            }

            var selected = this.$showSelectionContainer.children('.sol-selected-display-item');
            if (this.config.maxShow != 0 && selected.length > this.config.maxShow) {
                selected.hide();
                var xitemstext = this.config.texts.itemsSelected.replace('{$a}', selected.length);
                this.$xItemsSelected.html('<div class="sol-selected-display-item-text">' + xitemstext + '<div>');
                this.$showSelectionContainer.append(this.$xItemsSelected);
                this.$xItemsSelected.show();
            } else {
                selected.show();
                this.$xItemsSelected.hide();
            }

            if (!skipCallback && $.isFunction(this.config.events.onChange)) {
                this.config.events.onChange.call(this, this, $changeItem);
            }
        },

        _addSelectionDisplayItem: function ($changedItem) {
            var solOptionItem = $changedItem.data('sol-item'),
                $existingDisplayItem = solOptionItem.displaySelectionItem,
                $displayItemText;

            if (!$existingDisplayItem) {
                $displayItemText = $('<span class="sol-selected-display-item-text" />').html(solOptionItem.label);
                $existingDisplayItem = $('<div class="sol-selected-display-item"/>')
                    .append($displayItemText)
                    .attr('title', solOptionItem.tooltip)
                    .appendTo(this.$showSelectionContainer);

                // show remove button on display items if not disabled and null selection allowed
                if ((this.config.multiple || this.config.allowNullSelection) && !$changedItem.prop('disabled')) {
                    $('<span class="sol-quick-delete"/>')
                        .html(this.config.texts.quickDelete)
                        .click(function () {
                            $changedItem
                                .prop('checked', false)
                                .trigger('change');
                        })
                        .prependTo($existingDisplayItem);
                }

                solOptionItem.displaySelectionItem = $existingDisplayItem;
            }
        },

        _removeSelectionDisplayItem: function ($changedItem) {
            var solOptionItem = $changedItem.data('sol-item'),
                $myDisplayItem = solOptionItem.displaySelectionItem;

            if ($myDisplayItem) {
                $myDisplayItem.remove();
                solOptionItem.displaySelectionItem = undefined;
            }
        },

        _setNoResultsItemVisible: function (visible) {
            if (visible) {
                this.$noResultsItem.show();
                this.$selection.hide();

                if (this.$actionButtons) {
                    this.$actionButtons.hide();
                }
            } else {
                this.$noResultsItem.hide();
                this.$selection.show();

                if (this.$actionButtons) {
                    this.$actionButtons.show();
                }
            }
        },

        isOpen: function () {
            return this.$container.hasClass('sol-active');
        },

        isClosed: function () {
            return !this.isOpen();
        },

        toggle: function () {
            if (this.isOpen()) {
                this.close();
            } else {
                this.open();
            }
        },

        open: function () {
            if (this.isClosed()) {
                this.$container.addClass('sol-active');
                this.config.scrollTarget.bind('scroll', this.internalScrollWrapper).trigger('scroll');
                $(window).on('resize', this.internalScrollWrapper);

                if ($.isFunction(this.config.events.onOpen)) {
                    this.config.events.onOpen.call(this, this);
                }
            }
        },

        close: function () {
            if (this.isOpen()) {
                this._setKeyBoardNavigationMode(false);


                this.$container.removeClass('sol-active');
                this.config.scrollTarget.unbind('scroll', this.internalScrollWrapper);
                $(window).off('resize');

                // reset search on close
                this.$input.val('');
                this._applySearchTermFilter();

                // clear to recalculate position again the next time sol is opened
                this.config.displayContainerAboveInput = undefined;

                if ($.isFunction(this.config.events.onClose)) {
                    this.config.events.onClose.call(this, this);
                }
            }
        },

        selectAll: function () {
            if (this.config.multiple) {
                var $changedInputs = this.$selectionContainer
                    .find('input[type="checkbox"]:not([disabled], :checked)')
                    .prop('checked', true)
                    .trigger('change', true);

                this.config.closeOnClick && this.close();

                if ($.isFunction(this.config.events.onChange)) {
                    this.config.events.onChange.call(this, this, $changedInputs);
                }
            }
        },
        invert: function () {
            if (this.config.multiple) {
                var $closedInputs = this.$selectionContainer
                    .find('input[type="checkbox"]:not([disabled], :checked)')
                var $openedInputs = this.$selectionContainer
                    .find('input[type="checkbox"]').filter('[disabled], :checked')

                $openedInputs.prop('checked', false)
                    .trigger('change', true);
                $closedInputs.prop('checked', true)
                    .trigger('change', true)

                this.options.closeOnClick && this.close();

                if ($.isFunction(this.config.events.onChange)) {
                    this.config.events.onChange.call(this, this, $openedInputs.add($closedInputs));
                }
            }
        },
        deselectAll: function () {
            if (this.config.multiple) {
                var $changedInputs = this.$selectionContainer
                    .find('input[type="checkbox"]:not([disabled]):checked')
                    .prop('checked', false)
                    .trigger('change', true);

                this.config.closeOnClick && this.close();

                if ($.isFunction(this.config.events.onChange)) {
                    this.config.events.onChange.call(this, this, $changedInputs);
                }
            }
        },

        getSelection: function () {
            return this.$selection.find('input:checked');
        }
    };

    // jquery plugin boiler plate code
    SearchableOptionList.defaults = SearchableOptionList.prototype.defaults;
    window.SearchableOptionList = SearchableOptionList;

    $.fn.searchableOptionList = function (options) {
        var result = [];
        this.each(function () {
            var $this = $(this),
                $alreadyInitializedSol = $this.data(SearchableOptionList.prototype.DATA_KEY);

            if ($alreadyInitializedSol) {
                result.push($alreadyInitializedSol);
            } else {
                var newSol = new SearchableOptionList($this, options);
                result.push(newSol);

                setTimeout(function () {
                    newSol.init();
                }, 0);
            }
        });

        if (result.length === 1) {
            return result[0];
        }

        return result;
    };

}(__WEBPACK_IMPORTED_MODULE_0_jquery___default.a, window, document));


/***/ }),
/* 149 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_three__ = __webpack_require__(1);
/**
 * @author Mugen87 / https://github.com/Mugen87
 */




( function() {

	// ConvexGeometry

	function ConvexGeometry( points ) {

		__WEBPACK_IMPORTED_MODULE_0_three__["Geometry"].call( this );

		this.type = 'ConvexGeometry';

		this.fromBufferGeometry( new ConvexBufferGeometry( points ) );
		this.mergeVertices();

	}

	ConvexGeometry.prototype = Object.create( __WEBPACK_IMPORTED_MODULE_0_three__["Geometry"].prototype );
	ConvexGeometry.prototype.constructor = ConvexGeometry;

	// ConvexBufferGeometry

	function ConvexBufferGeometry( points ) {

	  __WEBPACK_IMPORTED_MODULE_0_three__["BufferGeometry"].call( this );

		this.type = 'ConvexBufferGeometry';

	  // buffers

	  var vertices = [];
	  var normals = [];

	  // execute QuickHull

		if ( __WEBPACK_IMPORTED_MODULE_0_three__["QuickHull"] === undefined ) {

			console.error( 'THREE.ConvexBufferGeometry: ConvexBufferGeometry relies on THREE.QuickHull' );

		}

	  var quickHull = new __WEBPACK_IMPORTED_MODULE_0_three__["QuickHull"]().setFromPoints( points );

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

	  this.addAttribute( 'position', new __WEBPACK_IMPORTED_MODULE_0_three__["Float32BufferAttribute"]( vertices, 3 ) );
	  this.addAttribute( 'normal', new __WEBPACK_IMPORTED_MODULE_0_three__["Float32BufferAttribute"]( normals, 3 ) );

	}

	ConvexBufferGeometry.prototype = Object.create( __WEBPACK_IMPORTED_MODULE_0_three__["BufferGeometry"].prototype );
	ConvexBufferGeometry.prototype.constructor = ConvexBufferGeometry;

	// export

	__WEBPACK_IMPORTED_MODULE_0_three__["ConvexGeometry"] = ConvexGeometry;
	__WEBPACK_IMPORTED_MODULE_0_three__["ConvexBufferGeometry"] = ConvexBufferGeometry;

} ) ();


/***/ }),
/* 150 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_three__ = __webpack_require__(1);
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

								point = new __WEBPACK_IMPORTED_MODULE_0_three__["Vector3"]();

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

			var min = new __WEBPACK_IMPORTED_MODULE_0_three__["Vector3"]();
			var max = new __WEBPACK_IMPORTED_MODULE_0_three__["Vector3"]();

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

					line3 = new __WEBPACK_IMPORTED_MODULE_0_three__["Line3"]();
					plane = new __WEBPACK_IMPORTED_MODULE_0_three__["Plane"]();
					closestPoint = new __WEBPACK_IMPORTED_MODULE_0_three__["Vector3"]();

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

		this.normal = new __WEBPACK_IMPORTED_MODULE_0_three__["Vector3"]();
		this.midpoint = new __WEBPACK_IMPORTED_MODULE_0_three__["Vector3"]();
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

				if ( triangle === undefined ) triangle = new __WEBPACK_IMPORTED_MODULE_0_three__["Triangle"]();

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

	__WEBPACK_IMPORTED_MODULE_0_three__["QuickHull"] = QuickHull;


} ) ();


/***/ }),
/* 151 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_three__ = __webpack_require__(1);
/**
 * @author Eberhard Graether / http://egraether.com/
 * @author Mark Lundin 	/ http://mark-lundin.com
 * @author Simone Manini / http://daron1337.github.io
 * @author Luca Antiga 	/ http://lantiga.github.io
 */



__WEBPACK_IMPORTED_MODULE_0_three__["TrackballControls"] = function ( object, domElement ) {

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

    this.target = new __WEBPACK_IMPORTED_MODULE_0_three__["Vector3"]();

    var EPS = 0.000001;

    var lastPosition = new __WEBPACK_IMPORTED_MODULE_0_three__["Vector3"]();

    var _state = STATE.NONE,
        _prevState = STATE.NONE,

        _eye = new __WEBPACK_IMPORTED_MODULE_0_three__["Vector3"](),

        _movePrev = new __WEBPACK_IMPORTED_MODULE_0_three__["Vector2"](),
        _moveCurr = new __WEBPACK_IMPORTED_MODULE_0_three__["Vector2"](),

        _lastAxis = new __WEBPACK_IMPORTED_MODULE_0_three__["Vector3"](),
        _lastAngle = 0,

        _zoomStart = new __WEBPACK_IMPORTED_MODULE_0_three__["Vector2"](),
        _zoomEnd = new __WEBPACK_IMPORTED_MODULE_0_three__["Vector2"](),

        _touchZoomDistanceStart = 0,
        _touchZoomDistanceEnd = 0,

        _panStart = new __WEBPACK_IMPORTED_MODULE_0_three__["Vector2"](),
        _panEnd = new __WEBPACK_IMPORTED_MODULE_0_three__["Vector2"]();

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

        var vector = new __WEBPACK_IMPORTED_MODULE_0_three__["Vector2"]();

        return function getMouseOnScreen( pageX, pageY ) {

            vector.set(
                ( pageX - _this.screen.left ) / _this.screen.width,
                ( pageY - _this.screen.top ) / _this.screen.height
            );

            return vector;

        };

    }() );

    var getMouseOnCircle = ( function () {

        var vector = new __WEBPACK_IMPORTED_MODULE_0_three__["Vector2"]();

        return function getMouseOnCircle( pageX, pageY ) {

            vector.set(
                ( ( pageX - _this.screen.width * 0.5 - _this.screen.left ) / ( _this.screen.width * 0.5 ) ),
                ( ( _this.screen.height + 2 * ( _this.screen.top - pageY ) ) / _this.screen.width ) // screen.width intentional
            );

            return vector;

        };

    }() );

    this.rotateCamera = ( function() {

        var axis = new __WEBPACK_IMPORTED_MODULE_0_three__["Vector3"](),
            quaternion = new __WEBPACK_IMPORTED_MODULE_0_three__["Quaternion"](),
            eyeDirection = new __WEBPACK_IMPORTED_MODULE_0_three__["Vector3"](),
            objectUpDirection = new __WEBPACK_IMPORTED_MODULE_0_three__["Vector3"](),
            objectSidewaysDirection = new __WEBPACK_IMPORTED_MODULE_0_three__["Vector3"](),
            moveDirection = new __WEBPACK_IMPORTED_MODULE_0_three__["Vector3"](),
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

        var mouseChange = new __WEBPACK_IMPORTED_MODULE_0_three__["Vector2"](),
            objectUp = new __WEBPACK_IMPORTED_MODULE_0_three__["Vector3"](),
            pan = new __WEBPACK_IMPORTED_MODULE_0_three__["Vector3"]();

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

__WEBPACK_IMPORTED_MODULE_0_three__["TrackballControls"].prototype = Object.create( __WEBPACK_IMPORTED_MODULE_0_three__["EventDispatcher"].prototype );
__WEBPACK_IMPORTED_MODULE_0_three__["TrackballControls"].prototype.constructor = __WEBPACK_IMPORTED_MODULE_0_three__["TrackballControls"];

/***/ }),
/* 152 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_lodash__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_lodash___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_lodash__);



class TemplateString {
    constructor(str) {

        this.mStr = str;

    }


    format(obj) {
        return __WEBPACK_IMPORTED_MODULE_0_lodash___default.a.template(__WEBPACK_IMPORTED_MODULE_0_lodash___default.a.isString(this.mStr) ? this.mStr : '', {interpolate: /\$\{([^\}]+)\}/gm})(obj);
    }


}
/* harmony export (immutable) */ __webpack_exports__["a"] = TemplateString;


/***/ }),
/* 153 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__cluster_utils_DomEventsAlt__ = __webpack_require__(70);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__View3D_css__ = __webpack_require__(315);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__View3D_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__View3D_css__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_three__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__lib_CombinedCamera__ = __webpack_require__(72);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__lib_TrackballControls__ = __webpack_require__(151);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_jquery__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_jquery___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_5_jquery__);
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


        // this.createCSSRule();
        this.mTime = -1;
        this.mActualFPS = 0;
        this.showFPSCounter = false;
        this.mouseSpeed = 2;


        //   this.initStatic()

        // Setup renderer
        this.mRenderer = new __WEBPACK_IMPORTED_MODULE_2_three__["WebGLRenderer"]({
            antialias: true
        });


        __WEBPACK_IMPORTED_MODULE_5_jquery__(this).on("resize", () => this.resizeCanvas())


    }


    //FIXME have accesss methods for camera controls and domEvents to be able to change controls and camera mode

    initCamera() {

        var initialCameraPosition = new __WEBPACK_IMPORTED_MODULE_2_three__["Vector3"](-5500, -4000, 50000);


        // Setup camera
        this.mCameraP = new __WEBPACK_IMPORTED_MODULE_2_three__["PerspectiveCamera"]();


        this.mCameraO = new __WEBPACK_IMPORTED_MODULE_2_three__["OrthographicCamera"]();
        this.mCameraO.far = 5000000;
        this.mCameraO.lookAt(this.mScene.position);
        this.mCameraO.position.copy(initialCameraPosition)


        this.mCamera = new __WEBPACK_IMPORTED_MODULE_2_three__["CombinedCamera"]();

        // this.mCamera =   this.mCameraO// new THREE.CombinedCamera();


        if (this.mCamera instanceof __WEBPACK_IMPORTED_MODULE_2_three__["CombinedCamera"]) {
            this.mCamera.setFar(5000000);

            this.mCamera.setFov(50);
        }
        else
            this.mCamera.far = 5000000;


        this.mCamera.lookAt(this.mScene.position);
        this.mCamera.position.copy(initialCameraPosition)


    }

    setControls() {
        // Add camera interaction
        this.mControls = new __WEBPACK_IMPORTED_MODULE_2_three__["TrackballControls"](this.mCamera, this.mRenderer.domElement);

        this.mControls.maxDistance = Math.min(this.mCamera.far, 200000);


        this.mControls.addEventListener("change", (...args) => __WEBPACK_IMPORTED_MODULE_5_jquery__(this).trigger("change", ...args));


    }

    setDomEvents() {


        //init domEnvents
        //this.mDomEvents = new THREEx.DomEvents(this.mCamera,this.mRenderer.domElement);
        this.mDomEvents = new __WEBPACK_IMPORTED_MODULE_0__cluster_utils_DomEventsAlt__["a" /* default */](this.mCamera, this.mRenderer.domElement, this.mScene);

        //Note: have a factory in case we need this kind of injection multiple times
        // THREEx.DomEvents.prototype._onMouseMove=origMouseMove;//restore non throttled work flow to not interfere with other implementations


    }


    updateCamera() {
        this.mCamera.updateProjectionMatrix();


        //update controls
        this.mControls.object = this.mCamera

        //update domEvents camera with current camera
        this.mDomEvents._camera = this.mCamera


    }

    set2D() {

        //   this.mCameraO.copy( this.mCamera);

        this.mCamera = this.mCameraO


        this.updateCamera()

    }

    set3D() {
        //  this.mCameraP.copy( this.mCamera);

        this.mCamera = this.mCameraP

        this.updateCamera()

    }


    resizeCanvas() {
        if (this.mRenderer && this.mCamera) {
            this.mRenderer.setSize(this.clientWidth, this.clientHeight);
            this.mCamera.aspect = this.clientWidth / this.clientHeight;


            if (this.mCamera instanceof __WEBPACK_IMPORTED_MODULE_2_three__["CombinedCamera"])
                this.mCamera.setSize(this.clientWidth, this.clientHeight);
            this.mCamera.updateProjectionMatrix();

            //adjust orthographic camera
            let camFactor = 2
            this.mCameraO.left = -this.clientWidth / camFactor;
            this.mCameraO.right = this.clientWidth / camFactor;
            this.mCameraO.top = this.clientHeight / camFactor;
            this.mCameraO.bottom = -this.clientHeight / camFactor;
            this.mCameraO.updateProjectionMatrix();


        }

        if (this.mRenderer && this.mControls) {
            this.mControls.panSpeed = 1600 / this.clientWidth * this.mouseSpeed * 0.3
            this.mControls.rotateSpeed = 1600 / this.clientWidth * this.mouseSpeed
        }

    }


    /* get scene() {
     return ""+ this.mScene
     }
     set scene(scene) {
     this.mScene=scene
     }
     */
    setCaption(text) {


        if (!this.mCaption)
            this.mCaption = __WEBPACK_IMPORTED_MODULE_5_jquery__("<span></span>").html(this.name).addClass(".view-3d-caption");

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


        this.setCaption(this.name)

        __WEBPACK_IMPORTED_MODULE_5_jquery__(this).addClass("view-3d");


        // Setup scene

        this.mScene = new __WEBPACK_IMPORTED_MODULE_2_three__["Scene"]();

        //added to be able to use threejs inspector
        window.scene = this.mScene;
        window.THREE = __WEBPACK_IMPORTED_MODULE_2_three__;
        // Add nav info section
        //createTooltip()

        this.initCamera();

        this.mRenderer.setClearColor(0x000000);
        this.mRenderer.setPixelRatio(window.devicePixelRatio);

        this.appendChild(this.mRenderer.domElement);


        __WEBPACK_IMPORTED_MODULE_5_jquery__(this.mRenderer.domElement).css({position: "absolute", top: 0, left: 0, width: "100%", height: "100%"});


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

        this.mFpsCounter = __WEBPACK_IMPORTED_MODULE_5_jquery__("<span     style='color: white;position: absolute;' >");
        __WEBPACK_IMPORTED_MODULE_5_jquery__(this).append(this.mFpsCounter);


        //------------------------------------------------
        this.setDomEvents();

        //------------------------------------------------


        //FIXME binding events will interfere with controls
        __WEBPACK_IMPORTED_MODULE_5_jquery__(this.mRenderer.domElement).on("mouseover", function (e) {

            if (that.isMaximised()) return;

            e.stopPropagation();
            that.setActive();

            __WEBPACK_IMPORTED_MODULE_5_jquery__(that).attr("hasFocus", true);


            that.mCaption.stop(true, false).fadeOut(200)


        });


        __WEBPACK_IMPORTED_MODULE_5_jquery__(this.mRenderer.domElement).on("mouseout", function (e) {

            if (that.isMaximised()) return;

            e.stopPropagation();


            __WEBPACK_IMPORTED_MODULE_5_jquery__(that).removeAttr("hasFocus");
            if (!__WEBPACK_IMPORTED_MODULE_5_jquery__(that).hasClass("view-3d-maximised")) {

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


    setStencil(bTrue) {

        //TODO have a switch to be able to debug options
        var gl = this.mRenderer.context;

        // enable stencil test
        if (bTrue)
            gl.enable(gl.STENCIL_TEST);
        else
            gl.disable(gl.STENCIL_TEST);
    }


    render() {


        this.mRenderer.render(that.mScene, that.mCamera);

    }

    // Kick-off renderer
    animate() {


        if (this._a) return
        this._a = true;

        console.log("animate")
        var initialFrames = 0;
        var that = this;
        var accTime = 0, accFrames = 0;

        function doAnimate(time) {
            that.mTime = time;
            // console.log("doAnimate",time)
            //that.mControls.update();
            initialFrames--;
            if (that.mFPS == 0) {

                if (initialFrames < 0) {
                    that.mFrameId = requestAnimationFrame(doAnimate);
                    return;
                }
            }
            else {

                let nextTime = that.mLastFrameTime + (1000 / that.mFPS);
                if (nextTime > time) {

                    that.mFrameId = requestAnimationFrame(doAnimate);
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


            __WEBPACK_IMPORTED_MODULE_5_jquery__(that).trigger("before-render", time);


            that.render()


            __WEBPACK_IMPORTED_MODULE_5_jquery__(that).trigger("after-render", time);

            that.mFrameId = requestAnimationFrame(doAnimate);
        }

        doAnimate(-1)

    }


    add(object3D) {
        this.mScene.add(object3D)

    }


    maximise() {
        __WEBPACK_IMPORTED_MODULE_5_jquery__(this).addClass("view-3d-maximised");

        this.mCaption.fadeOut();

        this.setActive()


    }

    isMaximised() {

        return __WEBPACK_IMPORTED_MODULE_5_jquery__(this).hasClass("view-3d-maximised")

    }


    undoMaximise() {
        __WEBPACK_IMPORTED_MODULE_5_jquery__(this).removeClass("view-3d-maximised");

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
        //  window.cancelAnimationFrame(this.mFrameId)
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

        __WEBPACK_IMPORTED_MODULE_5_jquery__(this).trigger("connected")


    }


    createTooltip() {

        // Setup tooltip
        if (this.toolTipElem) return;

        this.toolTipElem = document.createElement('div');
        this.toolTipElem.classList.add('graph-tooltip');

        __WEBPACK_IMPORTED_MODULE_5_jquery__(this.toolTipElem).css({
            "z-index": 1,
            position: "absolute",
            "user-select": "none"
        });

        this.appendChild(this.toolTipElem);

        // Capture mouse coords on move

        this.mouse = new __WEBPACK_IMPORTED_MODULE_2_three__["Vector2"]();
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

        __WEBPACK_IMPORTED_MODULE_5_jquery__(this.toolTipElem).html("").append(text).show()

    }


}
/* harmony export (immutable) */ __webpack_exports__["a"] = View3D;



customElements.define("view-3d", View3D);


/***/ }),
/* 154 */,
/* 155 */,
/* 156 */,
/* 157 */,
/* 158 */,
/* 159 */,
/* 160 */,
/* 161 */,
/* 162 */,
/* 163 */,
/* 164 */,
/* 165 */,
/* 166 */,
/* 167 */,
/* 168 */,
/* 169 */,
/* 170 */,
/* 171 */,
/* 172 */,
/* 173 */,
/* 174 */,
/* 175 */,
/* 176 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(5)(undefined);
// imports


// module
exports.push([module.i, ".graph-nav-info {\r\n    position: absolute;\r\n    bottom: 5px;\r\n    width: 100%;\r\n    text-align: center;\r\n    color: slategrey;\r\n    opacity: 0.7;\r\n    font-size: 10px;\r\n}\r\n\r\n.graph-tooltip {\r\n    position: absolute;\r\n    color: lavender;\r\n    font-size: 18px;\r\n\tpointer-events: none;\r\n}\r\n\r\n\r\n\r\n\r\n\r\n\r\n\t.industry-info-row * {\r\n    vertical-align: middle;\r\n\tpadding:0.2em\r\n\t}\r\n\r\n\r\n\t.searchbar-container\r\n\t{\r\n\t\tz-index:999;\r\n\r\n\t}\r\n\r\n\r\n\t.graph-node-info\r\n\t{\r\n\t\t    overflow-y: visible;\r\n\t\tposition:absolute;\r\n\t\ttop:10px;\r\n\t\tleft:400px;\r\n\t\tz-index:999;\r\n\t\t\r\n\t\tcolor:white;\r\n\t\t\tbackground-color: rgba(0, 0, 0, 0.6) ;\r\n\t\t  border :1px solid rgba(128, 128, 128, 0.25);\r\n\t\t  \r\n\t\t  max-height:760px;\r\n\t\t  max-width:810px;\r\n\t\t  \r\n\t\t   text-align: left;\r\n\t\t       overflow: hidden;\r\n\t\t  \r\n\t}\r\n\t\r\n\t.graph-node-info-header{\r\n\t\tbackground-color: rgba(47, 45, 45, 0.81) !important;\t\r\n\t\tdisplay:flex;\r\n\t\ttext-align:right;\r\n\t}\r\n\r\n\t  \r\n\t\r\n\t.graph-node-info-search{\r\n\t\t\r\n\t\t\tbackground:#1f4e79;\r\n\t\t padding: 0.5em;\r\n\t}\r\n\t\r\n\t\r\n\t\r\n\t.graph-node-info-search a{\r\n\t\t\r\n\t\tcolor:white;\r\n\t\ttext-decoration:none;\r\n\t}\r\n\t\r\n\t.graph-node-info-price{\r\n\t\t\r\n\t\t\tbackground-color: rgba(0, 0, 0, 0.3) !important;\t\r\n\t\t\tpadding: 0.5em;\r\n\t}\r\n\t.graph-node-info-close{\r\n\t\t\t\r\n\t\t\tbackground-color: transparent !important;\t\r\n\t\t\tpadding: 0.5em;\r\n\t\t\r\n\t}\r\n\t\r\n\t\r\n\t.graph-node-info-news-header{\r\n\t\tpadding:0.5em;\r\n\t\tbackground-color: rgba(0, 0, 0, 0.3) !important;\t\r\n\t\t\r\n\t}\r\n\t.graph-node-info-news-body{\r\n\t\tpadding:0.5em;\r\n\t\t\r\n\t\t\r\n\t}\r\n\t\r\n\t\r\n\t.graph-tooltip\r\n\t{\r\n\t\t\r\n\t}\r\n\t.graph-tooltip > .content\r\n\t{\r\n\t\tbackground-color: rgba(0, 0, 0, 0.6) !important;\t\r\n\t\tpadding:0.5em;\t\r\n\t}\r\n\t\r\n\t.ui-autocomplete\r\n\t{\r\n\tbackground-color: rgba(255, 255, 255, 0.2) !important;\r\n    color: white !important;\r\n\tborder:0px !important;\r\n\t\r\n\t max-height:30em; overflow-y: scroll; \r\n\t max-width:20em;\r\n\t}\t\r\n\t\r\n\t/**\r\n\tTODO used in left-info-panel and should be used by web component and put itno shadow dom preferrably\r\n\t*/\r\n\t.my-accordion{\r\n\t\t\r\n\t\t  border :1px solid rgba(128, 128, 128, 0.25) !important;\r\n\t\t  padding: 0px 2px 0px 2px!important;\r\n\t\t  \r\n\t}\r\n\t\r\n\t.my-accordion > *{\r\n\t\tmargin:0px !important;\r\n\t\t\r\n\t}\r\n\r\n.my-accordion > .ui-accordion-header{\r\n\t\t\tmargin: 2px 0 0 0;\r\n\t\t\tpadding: .5em .5em .5em .7em;\r\n\t\t\tfont-weight:bold !important;\r\n\t\t\tcolor:white !important;\r\n\t\t\t text-align: left !important;\r\n\t}\r\n\r\n.my-accordion > .ui-accordion-header:focus{\r\n\t\t outline: 0 !important;\r\n\t\t background: rgba(0, 0, 0, 0.25) !important;\r\n\t\t \r\n\t}\r\n\r\n.my-accordion >\t.ui-accordion-content\r\n\t{\r\n\t\toverflow:visible !important;\r\n\t\t text-align: left !important;\r\n\t\t padding:.5em .5em .5em .7em !important;\r\n\t\t color:white !important;\r\n\t\t\r\n\t}\r\n\t\r\n\t\r\n\t.ui-widget-content\r\n\t{\r\n\t\t background: rgba(24, 23, 23, 0.21);\r\n\t\tborder:0px;\r\n\t}\r\n\t\r\n\t.ui-state-default\r\n\t{\r\n\t\t    background: rgba(32, 32, 32, 0.25);\r\n\t\t\tborder:0px;\r\n\t}\r\n\t\r\n\t\r\n\t.zoom-slider\r\n\t{\r\n\t\tposition:absolute;\r\n\t\ttop:1em;\r\n\t\tleft:60%;\r\n\t\tbackground:transparent;\r\n\t\t min-width: 300px;\r\n\t\tdisplay:inline-block;\r\n\t\twidth:200px !important;\r\n\tz-index:999;\r\n\t\t\r\n\t}\r\n\t.ui-slider\r\n\t{\r\n\t\t\r\n\t\tdisplay:none;\r\n\t\t\r\n\t\t\r\n\t  background: lightgrey; /* For browsers that do not support gradients */\r\n  \r\n\t  background: -webkit-linear-gradient(left,orange,grey);\r\n\t \r\n\t  background: -o-linear-gradient(left,orange,grey);\r\n\t  \r\n\t  background: -moz-linear-gradient(left,orange,grey);\r\n\t \r\n\t  background: linear-gradient(to right,orange,grey); \r\n\t  \r\n\t      height: 0.2em;\r\n    border: 0 !important;\r\n\t\t\t\r\n\t}\r\n\t\r\n\t.ui-slider .ui-slider-handle {\r\n    width:2em;\r\n    height:1.6em;\r\n\tborder: 0 !important;\r\n    text-decoration:none;\r\n    text-align:center;\r\n\t    top: -1em;\r\n\t\r\n\tbackground: url(" + __webpack_require__(325) + ");\r\n    background-size: 2em;\r\n\t\r\n\t}\r\n\t.ui-slider-handle:focus{\r\n\t\toutline:0;\r\n\t\t\r\n\t\t\r\n\t}\r\n\t\r\n\t\r\n\t\r\n\t.searchbar-container{\r\n\t\r\n\tleft:240px;\r\n\tdisplay:flex;\r\n    position: absolute;\r\n\ttop:15px;\r\n\t\r\n\tborder: 0;\r\n\t\r\n\t}\r\n\t\r\n\t\r\n\t.searchbar-container input{\r\n\t\t\r\n\t\tborder-radius: 5px;\r\n\t\tborder: 0;\r\n\t\t min-width: 400px;\r\n\t\toutline: none;\r\n\t\tpadding: 0.5em;\r\n\t}\r\n\t\r\n\t\r\n\t\r\n\t\r\n\t.searchbar-search\r\n\t{\r\n   /* position: absolute;\r\n\tdisplay: inline-block;\r\n    content: \"\";\r\n    width: 26px;\r\n    height: 26px;\r\n    background: url('data:image/svg+xml;utf8,<svg width=\"1792\" height=\"1792\" viewBox=\"0 0 1792 1792\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M1216 832q0-185-131.5-316.5t-316.5-131.5-316.5 131.5-131.5 316.5 131.5 316.5 316.5 131.5 316.5-131.5 131.5-316.5zm512 832q0 52-38 90t-90 38q-54 0-90-38l-343-342q-179 124-399 124-143 0-273.5-55.5t-225-150-150-225-55.5-273.5 55.5-273.5 150-225 225-150 273.5-55.5 273.5 55.5 225 150 150 225 55.5 273.5q0 220-124 399l343 343q37 37 37 90z\" fill=\"#fff\"/></svg>');\t\r\n\tbackground-size: 100%;*/\r\n\t}\r\n\r\n\t.searchbar-search-row\r\n\t{\r\n\t\ttext-align:left;\r\n\t\tborder-bottom:1px solid darkslateblue;\r\n\r\n\t\t\r\n\t}\r\n\t\r\n\t.searchbar-search-row b\r\n\t{\r\n\t\tcolor:darkslateblue;\r\n\t\t text-shadow: 0 0 0.1em white, 0 0 0.1em white, 0 0 0.1em white;\r\n\r\n\t}\r\n\r\n\t\r\n\t\r\n\t\r\n\t\r\n\t\r\n\t\r\n\t\r\n  .ui-progressbar {\r\n    position: absolute;\r\n\ttop:10px;\r\n\tleft:10px;\r\n\twidth:30%;\r\n\theight:20px;\r\n  }\r\n  .progress-label {\r\n    position: absolute;\r\n    left: 10%;\r\n    top: 4px;\r\n    font-weight: bold;\r\n    text-shadow: 1px 1px 0 #fff;\r\n  }\r\n\r\n\r\n  .noselect {\r\n  -webkit-touch-callout: none; /* iOS Safari */\r\n    -webkit-user-select: none; /* Safari */\r\n     -khtml-user-select: none; /* Konqueror HTML */\r\n       -moz-user-select: none; /* Firefox */\r\n        -ms-user-select: none; /* Internet Explorer/Edge */\r\n            user-select: none; /* Non-prefixed version, currently\r\n                                  supported by Chrome and Opera */\r\n}\r\n  \r\n  \r\n\t.graph-country-caption\r\n\t{\r\n\tcolor:ffffff;\r\n\t    padding: 2 5 2 5;\r\n\t\tbackground: rgba(0, 0, 0, 0.5);\r\n\t\t\r\n\t\tfont-size: 0.8em;\r\n\t\tfont-weight: 900;\r\n\t\topacity: 0.5;\r\n\t}\r\n\t\r\n\t.graph-country-caption:hover\r\n\t{\r\n\t\t\r\n\t    opacity: 0.6 !important;\r\n\t\tcolor:darkslateblue;\r\n\t\t\r\n\t\t\r\n    text-shadow: 0 0 0.5em white, 0 0 0.5em white, 0 0 0.5em white;\r\n\t\t\r\n\t}\r\n  \r\n  \r\n \r\n\t.node-caption\r\n\t{\r\n\t\tcolor:white;\r\n\t    padding: 2 5 2 5;\r\n\t\tbackground: rgba(0, 0, 0, 0.5);\r\n\t}\r\n\t\r\n\t.node-caption-highlighted\r\n\t{\r\n\t\tcolor: white !important;\r\n\t\t//font-weight: bold;\r\n\t\ttext-shadow: 0 0 0.3em white, 0 0 0.3em white, 0 0 0.3em white;\r\n\t}\r\n\t\r\n\r\n\t.cloudNodeColorSelect\r\n\t{\r\n\t\tposition:absolute;\r\n\t\tbottom:40px;\r\n\t\tleft:48%;\r\n\t\tz-index:999;\r\n\t\twidth:130px;\r\n\t\t\r\n\t\t\r\n\t\tbackground: rgba(0, 0, 0, 0.51);\r\n\t\tcolor: white;\r\n\t\tborder: transparent;\r\n\t\t\r\n\t}\r\n\t.cloudNodeColorSelect:focus{\r\n\t\toutline:0\r\n\t\t\r\n\t}\r\n\t\r\n\t\r\n\t.bottomCompanyGradient\r\n\t{\r\n\t\tposition:absolute;\r\n\t\tbottom:20px;\r\n\t\tleft:0px;\r\n\t\tright:0px;\r\n\t\tz-index:999;\r\n\t\tcolor:white;\r\n\t\tdisplay:flex;\r\n\t\t\t\r\n\t}\r\n\t\r\n\t\r\n\t\r\n\t\t.companyGradient {\r\n  background: lightgrey; /* For browsers that do not support gradients */\r\n  \r\n  background: -webkit-linear-gradient(right,#218D20,#439229,#8CCB84,#14B0BF,#9DC9CA,#CAB81A,#BBC42D,#C8A6BF,#CF73B4,#816365,#7D5C53,#AE5E29,#B62729);\r\n \r\n  background: -o-linear-gradient(right,#218D20,#439229,#8CCB84,#14B0BF,#9DC9CA,#CAB81A,#BBC42D,#C8A6BF,#CF73B4,#816365,#7D5C53,#AE5E29,#B62729);\r\n  \r\n  background: -moz-linear-gradient(right,#218D20,#439229,#8CCB84,#14B0BF,#9DC9CA,#CAB81A,#BBC42D,#C8A6BF,#CF73B4,#816365,#7D5C53,#AE5E29,#B62729);\r\n \r\n  background: linear-gradient(to left,#218D20,#439229,#8CCB84,#14B0BF,#9DC9CA,#CAB81A,#BBC42D,#C8A6BF,#CF73B4,#816365,#7D5C53,#AE5E29,#B62729); \r\n}\r\n\t\r\n\t.rightCompanyInfo\r\n\t{\r\n\t\tposition:absolute;\r\n\t\tright:0.5em;\r\n\t\ttop:50px;\r\n\t\tz-index:999;\r\n\t\tbackground: rgba(0, 0, 0, 0.51);\r\n\t\tcolor:white;\r\n\t\tborder:1px solid rgba(128, 128, 128, 0.51);\r\n\t\tpadding:0.5em;\r\n\t}\r\n\t.rightCompanyInfo .event\r\n\t{\r\n\t\ttext-align:left;\r\n\t\tborder-top:1px solid rgba(128, 128, 128, 0.51);\r\n\t\tpadding:0.5em;\r\n\t}\r\n\t\r\n\t\r\n\t#companyIndustry img {\r\n    height: 1.5em;\r\n\t}", ""]);

// exports


/***/ }),
/* 177 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(5)(undefined);
// imports


// module
exports.push([module.i, "body {\n    text-align: center;\n    font-family: Sans-serif;\n    margin: 0;\n\tbackground-color: #000000;\n}\n\n.dimensions-selector, .graph-data {\n    position: absolute;\n    top: 0;\n    padding: 5px;\n    color: slategrey;\n}\n\n.dimensions-selector {\n    left: 0;\n}\n\n.graph-data {\n    right: 0;\n}\n\n.toggle-data-btn {\n    cursor: pointer;\n    opacity: 0.85;\n}\n\n.toggle-data-btn:hover {\n    opacity: 1;\n}\n\n#graph-data-description {\n    font-size: 12px;\n    color: slategrey;\n}", ""]);

// exports


/***/ }),
/* 178 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(5)(undefined);
// imports
exports.push([module.i, "@import url(https://fonts.googleapis.com/css?family=Exo+2);", ""]);

// module
exports.push([module.i, "sample-cluster-application * {\r\n    font-family: 'robotoCondensed' !important;\r\n}\r\n\r\nsample-cluster-application * {\r\n    font-family: 'robotoCondensed' !important;\r\n}\r\n\r\nsample-cluster-application .view-thumbnail{\r\npointer-events: all;\r\nheight: 300px;\r\nwidth: 400px;\r\ndisplay: flex;\r\nborder: 1px solid rgba(128, 128, 128, 0.5);\r\nmargin: 0.2em;\r\n}\r\n\r\n\r\nsample-cluster-application graph-hud{\r\n\r\n    position: absolute;\r\n    left: 0;\r\n    top: 0;\r\n    width: 100%;\r\n    height: 100%;\r\n    pointer-events: none;\r\n\r\n}\r\n\r\nsample-cluster-application graph-hud *{\r\n\r\n    pointer-events: all;\r\n\r\n}\r\n\r\n\r\n.darker\r\n{\r\n\r\n    background:rgba(0, 0, 0, 0.9) !important;\r\n    color:white !important;\r\n}\r\n\r\n\r\n\r\n\r\n::-webkit-scrollbar {\r\n    width: 5px;\r\n    height: 5px;\r\n}\r\n\r\n::-webkit-scrollbar-thumb {\r\n    background: red;\r\n\r\n}\r\n\r\n::-webkit-scrollbar-button {\r\n    background: transparent;\r\n    width: 0px;\r\n    height: 0px;\r\n}\r\n\r\n::-webkit-scrollbar-track {\r\n    background: #888;\r\n}\r\n\r\n", ""]);

// exports


/***/ }),
/* 179 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(5)(undefined);
// imports


// module
exports.push([module.i, "\r\ncluster-text-overlay {\r\n    width: 100%;\r\n    height: 100%;\r\n    overflow: hidden;\r\n    position: absolute;\r\n    top:0;\r\n    left:0;\r\n\r\n    pointer-events: none\r\n}\r\n\r\ncluster-text-overlay > .cluster-text-overlay-breadcrumb {\r\n    color:rgba(255,255,255,0.1);\r\n    font-size:3em;\r\n\r\n    position: absolute;\r\n    top:20%;\r\n    left: 0;\r\n    width:100%;\r\n\r\n}\r\n\r\n\r\n\r\ncluster-text-overlay  .cluster-text-overlay-breadcrumb-item {\r\n\r\n\r\n\r\n\r\n}\r\n\r\n\r\n\r\ncluster-text-overlay  .cluster-text-overlay-breadcrumb-item:hover {\r\n\r\n    opacity: 0.6 !important;\r\n    color:darkslateblue;\r\n\r\n\r\n    text-shadow: 0 0 0.5em white, 0 0 0.5em white, 0 0 0.5em white;\r\n\r\n\r\n}\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n", ""]);

// exports


/***/ }),
/* 180 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(5)(undefined);
// imports


// module
exports.push([module.i, "mode-select {\r\n    position: absolute;\r\n    top: 10px;\r\n    right: 100px;\r\n    cursor: pointer;\r\n}\r\n\r\n\r\nmode-select * {\r\n\r\n    padding: 0.2em 1.8em;\r\n    color: white;\r\n    margin: 0.2em;\r\n    border-radius: 1px;\r\n    border: 1px solid rgba(128, 128, 128, 0.51);\r\n\r\n}\r\n\r\n\r\nmode-select span:hover {\r\n    outline: none;\r\n    border-color: #9ecaed;\r\n    box-shadow: 0 0 10px #9ecaed;\r\n}\r\n\r\n\r\nmode-select .selected{\r\n    outline: none;\r\n    border-color: #9ecaed;\r\n    box-shadow: 0 0 10px #9ecaed;\r\n}\r\n\r\n\r\n\r\n.inverted {\r\n    filter: invert(100%);\r\n}\r\n\r\n\r\n\r\nmode-select  .spinner {\r\n    margin: 100px auto 0;\r\n    width: 70px;\r\n    text-align: center;\r\n\r\n    position:absolute;\r\n    left:0px;\r\n    top:0px;\r\n    height:100%;\r\n    width:100%;\r\n}\r\n\r\nmode-select .spinner > div {\r\n    width: 18px;\r\n    height: 18px;\r\n    background-color: #333;\r\n\r\n    border-radius: 100%;\r\n    display: inline-block;\r\n    -webkit-animation: sk-bouncedelay 1.4s infinite ease-in-out both;\r\n    animation: sk-bouncedelay 1.4s infinite ease-in-out both;\r\n}\r\n\r\nmode-select .spinner .bounce1 {\r\n    -webkit-animation-delay: -0.32s;\r\n    animation-delay: -0.32s;\r\n}\r\n\r\nmode-select .spinner .bounce2 {\r\n    -webkit-animation-delay: -0.16s;\r\n    animation-delay: -0.16s;\r\n}\r\n\r\n@-webkit-keyframes sk-bouncedelay {\r\n    0%, 80%, 100% { -webkit-transform: scale(0) }\r\n    40% { -webkit-transform: scale(1.0) }\r\n}\r\n\r\n@keyframes sk-bouncedelay {\r\n    0%, 80%, 100% {\r\n        -webkit-transform: scale(0);\r\n        transform: scale(0);\r\n    } 40% {\r\n          -webkit-transform: scale(1.0);\r\n          transform: scale(1.0);\r\n      }\r\n}", ""]);

// exports


/***/ }),
/* 181 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(5)(undefined);
// imports


// module
exports.push([module.i, "@-moz-keyframes blinker {\n    0% {opacity: 1.0;}\n    50% {opacity: 0.2;}\n    100% {opacity: 1.0;}\n}\n@-webkit-keyframes blinker {\n    0% {opacity: 1.0;}\n    50% {opacity: 0.2;}\n    100% {opacity: 1.0;}\n}\n\n@keyframes blinker {\n    0% {opacity: 1.0;}\n    50% {opacity: 0.2;}\n    100% {opacity: 1.0;}\n}\n\n.sol-container * { margin: 0; padding: 0;}\n.sol-inner-container {\n    position: relative;\n    height: 30px;\n    line-height: 30px;\n   background:transparent;\n    /*border: 1px solid #ccc;\n    border-radius: 4px;\n\n    -webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075);\n    -moz-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075);\n    box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075);\n\n    -webkit-transition: border linear .2s, box-shadow linear .2s;\n    -moz-transition: border linear .2s, box-shadow linear .2s;\n    -o-transition: border linear .2s, box-shadow linear .2s;\n    transition: border linear .2s, box-shadow linear .2s;*/\n}\n\n.sol-container.sol-active .sol-inner-container {\n    z-index: 9999;\n    background:transparent;\n\n    border-color: rgba(82, 168, 236, 0.8);\n\n    -webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, .075), 0 0 8px rgba(82, 168, 236, .6);\n    -moz-box-shadow: inset 0 1px 1px rgba(0, 0, 0, .075), 0 0 8px rgba(82, 168, 236, .6);\n    box-shadow: inset 0 1px 1px rgba(0, 0, 0, .075), 0 0 8px rgba(82, 168, 236, .6);\n}\n\n.sol-input-container {\n    position: absolute;\n    left: 0;\n    top: 0;\n    bottom: 0;\n    right: 25px;\n\tborder-top: 1px solid rgba(65,113,156, 0.8);\n\tborder-left: 1px solid rgba(65,113,156, 0.8);\n\tborder-bottom: 1px solid rgba(65,113,156, 0.8);\n\tcolor:transparentfff;\n}\n\n.sol-caret-container {\n    position: absolute;\n    display: inline-block;\n    width: 25px;\n    right: 0;\n    top: 0;\n    bottom: 0;\n\tborder-top: 1px solid rgba(65,113,156, 0.8);\n\tborder-right: 1px solid rgba(65,113,156, 0.8);\n\tborder-bottom: 1px solid rgba(65,113,156, 0.8);\n\tcolor:transparentfff;\n\tbackground-color: black;\t\n}\n\n.sol-caret-container .sol-caret {\n    position: relative;\n    display: inline-block;\n    left: 10px;\n    width: 0;\n    height: 0;\n    vertical-align: middle;\n    border-top: 4px solid #000;\n    border-right: 4px solid transparent;\n    border-left: 4px solid transparent;\n\tbackground-color: black;\t\n}\n\n.sol-input-container input[type=\"text\"] {\n    border: 0;\n    background-color: black;\t\n    box-shadow: none;\n\tcolor:transparent;\n    padding: 0 7px;\n    outline: none;\n    width: 100%;\n    height: 100%;\n}\n\n.sol-input-container input[type=\"text\"]:-ms-input-placeholder {\n    color:transparent;\n\n}\n\n.sol-input-container input[type=\"text\"]::-ms-clear {\n    display: none;\n}\n\n.sol-selection-container {\n    display: none;\n}\n\n.sol-container.sol-active .sol-selection-container {\n    display: block;\n    position: fixed;\n    left: inherit;\n    top: inherit;\n    z-index: 10000;\n    border: 1px solid #ccc;\n     background:rgba(0, 0, 0, 0.8);\n    border-radius: 4px;\n}\n\n.sol-active.sol-selection-top .sol-selection-container {\n    -webkit-border-bottom-left-radius: 0;\n    -moz-border-bottom-left-radius: 0;\n    border-bottom-left-radius: 0;\n\n    -webkit-box-shadow: 0 0 12px rgba(0, 0, 0, .175);\n    -moz-box-shadow: 0 0 12px rgba(0, 0, 0, .175);\n    box-shadow: 0 0 12px rgba(0, 0, 0, .175);\n}\n\n.sol-active.sol-selection-top .sol-inner-container {\n    -webkit-border-top-left-radius: 0;\n    -moz-border-top-left-radius: 0;\n    border-top-left-radius: 0;\n\n    -webkit-border-top-right-radius: 0;\n    -moz-border-top-right-radius: 0;\n    border-top-right-radius: 0;\n}\n\n.sol-active.sol-selection-bottom .sol-selection-container {\n    -webkit-border-top-left-radius: 0;\n    -moz-border-top-left-radius: 0;\n    border-top-left-radius: 0;\n}\n\n.sol-active.sol-selection-bottom .sol-inner-container {\n    -webkit-border-bottom-left-radius: 0;\n    -moz-border-bottom-left-radius: 0;\n    border-bottom-left-radius: 0;\n\n    -webkit-border-bottom-right-radius: 0;\n    -moz-border-bottom-right-radius: 0;\n    border-bottom-right-radius: 0;\n}\n\n.sol-action-buttons {\n    color: #555;\n    border-bottom: 1px solid #ccc;\n    background: #eee;\n    padding: 7px 10px;\n\n    -webkit-border-top-right-radius: 4px;\n    -moz-border-top-right-radius: 4px;\n    border-top-right-radius: 4px;\n}\n\n.sol-action-buttons a {\n    line-height: 1em;\n    text-decoration: none;\n    color: #0088cc;\n    border-bottom: 1px solid transparent;\n}\n\n.sol-action-buttons a:hover {\n    border-bottom: 1px solid #0088CC;\n}\n\n.sol-action-buttons .sol-select-all {\n    float: left;\n}\n\n.sol-action-buttons .sol-deselect-all {\n    float: right;\n}\n\n.sol-action-buttons .sol-clearfix {\n    clear: both;\n}\n\n.sol-selection {\n    overflow: auto;\n    position: relative;\n    min-height: 0px;\n}\n\n.sol-selection:empty {\n    display: none;\n}\n\n.sol-option {\n    display: block;\n\tcolor: #000000;\n\t font-family: 'robotoCondensed';\n}\n\n.sol-label {\n    padding: 5px 10px;\n    display: block;\n    position: relative;\n\tcolor: #ffffff;\n\t font-family: 'robotoCondensed';\n}\n\n.sol-label-text {\n    padding-left: 20px;\n    line-height: 1.2em;\n\t font-family: 'robotoCondensed';\n}\n\n.sol-selection:not(.sol-keyboard-navigation) .sol-option:hover, .sol-option.keyboard-selection {\n    background:transparentfff;\n    color: #e6e9ed;\n}\n\n.sol-optiongroup {\n    background:transparentfff;\n    padding-bottom: 1px;\n}\n\n.sol-optiongroup-label {\n    color:transparentfff;\n    background: #1f4e79;\n    margin-bottom: 5px;\n    padding: 3px 5px;\n    border-top: 1px solid #ccc;\n    border-bottom: 1px solid #ccc;\n}\n\n.sol-optiongroup.disabled {\n    color: #000000;\n}\n\n.sol-selection div:first-child.sol-optiongroup > .sol-optiongroup-label {\n    border-top: none;\n}\n\n.sol-checkbox, .sol-radio {\n    position: absolute;\n    width: 13px;\n    height: 13px;\n    padding: 0;\n    margin: 0;\n    top: 4px;\n}\n\n.sol-selected-display-item,\n.sol-results-count {\n    display: inline-table;\n    border: 1px solid #5381ab;\n    background: #5b9bd5;\n    font-size: 0.9em;\n    margin-right: 5px;\n    margin-bottom: 5px;\n    border-collapse: separate;\n\n    -webkit-border-radius: 4px;\n    -moz-border-radius: 4px;\n    border-radius: 4px;\n}\n\n.sol-selected-display-item-text {\n    padding: 3px 5px;\n    display: table-cell;\n    vertical-align: top;\n\t font-size: 14px;\n\t font-family: 'robotoCondensed';\n}\n\n.sol-quick-delete {\n    color:transparentfff;\n    display: table-cell;\n    font-weight: bold;\n    text-align: center;\n    padding: 3px 5px;\n    vertical-align: top;\n}\n\n.sol-quick-delete:hover {\n    color: #f1f1f1;\n    cursor: pointer;\n}\n\n.sol-quick-delete + .sol-selected-display-item-text {\n    padding-left: 0;\n}\n\n.sol-filtered-search {\n    display: none;\n}\n\n.sol-no-results, .sol-loading-data {\n    padding: 5px 0 5px 0;\n    color: #999;\n    font-style: italic;\n    text-align: center;\n}\n\n.sol-loading-data {\n    -webkit-animation-name: blinker;\n    -webkit-animation-duration: 1s;\n    -webkit-animation-timing-function: linear;\n    -webkit-animation-iteration-count: infinite;\n\n    -moz-animation-name: blinker;\n    -moz-animation-duration: 1s;\n    -moz-animation-timing-function: linear;\n    -moz-animation-iteration-count: infinite;\n\n    animation-name: blinker;\n    animation-duration: 1s;\n    animation-timing-function: linear;\n    animation-iteration-count: infinite;\n}\n", ""]);

// exports


/***/ }),
/* 182 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(5)(undefined);
// imports


// module
exports.push([module.i, ".view-3d-maximised {\r\n    border: 0px solid rgba(128, 128, 128, 0.5) !important;\r\n    margin: 0 !important;\r\n    position: absolute !important;\r\n    top: 0 !important;\r\n    left: 0 !important;\r\n    height: 100% !important;\r\n    width: 100% !important;\r\n}\r\n\r\n\r\n.view-3d-caption {\r\npointer-events: none;\r\nposition: relative;\r\npadding: 1em;\r\nfont-size: 2em;\r\ntop: 30%;\r\nheight: 3em;\r\nwidth: 100%;\r\nbackground: rgba(255,255,255,0.3);\r\nleft: 0px;\r\nz-index: 1;\r\n\r\n}", ""]);

// exports


/***/ }),
/* 183 */,
/* 184 */,
/* 185 */,
/* 186 */,
/* 187 */,
/* 188 */,
/* 189 */,
/* 190 */,
/* 191 */,
/* 192 */,
/* 193 */,
/* 194 */,
/* 195 */,
/* 196 */,
/* 197 */,
/* 198 */,
/* 199 */,
/* 200 */,
/* 201 */,
/* 202 */,
/* 203 */,
/* 204 */,
/* 205 */,
/* 206 */,
/* 207 */,
/* 208 */,
/* 209 */,
/* 210 */,
/* 211 */,
/* 212 */,
/* 213 */,
/* 214 */,
/* 215 */,
/* 216 */,
/* 217 */,
/* 218 */,
/* 219 */,
/* 220 */,
/* 221 */,
/* 222 */,
/* 223 */,
/* 224 */,
/* 225 */,
/* 226 */,
/* 227 */,
/* 228 */,
/* 229 */,
/* 230 */,
/* 231 */,
/* 232 */,
/* 233 */,
/* 234 */,
/* 235 */,
/* 236 */,
/* 237 */,
/* 238 */,
/* 239 */,
/* 240 */,
/* 241 */,
/* 242 */,
/* 243 */,
/* 244 */,
/* 245 */,
/* 246 */,
/* 247 */,
/* 248 */,
/* 249 */,
/* 250 */,
/* 251 */,
/* 252 */,
/* 253 */,
/* 254 */,
/* 255 */,
/* 256 */,
/* 257 */,
/* 258 */,
/* 259 */,
/* 260 */,
/* 261 */,
/* 262 */,
/* 263 */,
/* 264 */,
/* 265 */,
/* 266 */,
/* 267 */
/***/ (function(module, exports) {

module.exports = "<div style=\"float:left;padding-left:10px;padding-right:10px;color:#bfbfbf;font-family:'robotoCondensed-light'  !important;font-size:30px;width:550px;\">${name}<br/>${link}<br>\r\n    <div id=\"max-chart\" style=\"width:530px; height:280px;\"></div>\r\n\r\n\r\n\r\n</div>\r\n<div style=\"float:right;padding-left:10px;padding-top:4px;padding-right:10px;color:#bfbfbf;font-family:'benchnine'  !important;font-size:20px;width:220px;heigth:370px;\">\r\n    Sector : Information Technology<br/>Country : United States<br/><br/>\r\n    <div style=\"padding:10px;background-color: rgba(38,64,88, 0.6) !important; width:100%;color:#ffffff;font-family:'benchnine'  !important;font-size:20px;\">\r\n        News Sentiment : <span class=\"positive\" style=\"font-family:'benchnine' !important;\">Good &nbsp;<i\r\n            class=\"fa fa-chevron-up\"\r\n            style=\"font-size:8px;vertical-align:top;margin-top:8px;font-family:'FontAwesome' !important;\"\r\n            aria-hidden=\"true\"></i></span><br/>News Velocity : <span class=\"normal\"\r\n                                                                     style=\"font-family:'benchnine' !important;color:#bfbfbf;\">Steady &nbsp;<i\r\n            class=\"fa fa-minus\" style=\"font-size:8px;vertical-align:middle;font-family:'FontAwesome' !important;\"\r\n            aria-hidden=\"true\"></i></span></div>\r\n    <br/><span style=\"color:#ffffff;font-family:'benchnine'  !important;font-size:20px;\">Intel Corporation designs, manufactures, and sells integrated digital technology platforms worldwide.</span>\r\n</div>\r\n<div style=\"clear:both;padding-left:10px;padding-right:10px;width:100%;\">\r\n    <div style=\"width:100%;font-size:18px;font-family:'benchnine' !important;background-color: rgba(166, 166, 166, 0.3) !important;\tcolor:rgba(255, 255, 255,1);padding-left:10px;padding-right:10px;\">\r\n        Most Recent Significant News\r\n    </div>\r\n    <div style=\"width:100%;font-size:16px;font-family:'roboto';background-color: rgba(38,64,88, 0.6) !important;color:#ffffff;padding:10px;\"\r\n         id=\"dj_recent\"></div>\r\n</div>\r\n<div style=\"padding-top:10px;\">\r\n    <table style=\"width:100%; border-collapse: separate; border-spacing: 10px  0px;\">\r\n        <tr>\r\n            <td style=\"width:33%;font-size:16px;font-family:'roboto';background-color: rgba(38,64,88, 0.6) !important;color:#ffffff;\">\r\n                <table style=\"width:100%\">\r\n                    <tr>\r\n                        <td style=\"width:65%;padding:5px;\" class=\"info11\">Top Customers</td>\r\n                        <td style=\"width:35%\" class=\"info2\">% of INTC's Revenue</td>\r\n                    </tr>\r\n                </table>\r\n            </td>\r\n            <td style=\"width:33%;font-size:16px;font-family:'roboto';background-color: rgba(38,64,88, 0.6) !important;color:#ffffff;padding:5px;\">\r\n                <table style=\"width:100%\">\r\n                    <tr>\r\n                        <td style=\"width:65%\" class=\"info11\">Top Suppliers</td>\r\n                        <td style=\"width:35%\" class=\"info2\">% of Suppliers's Revenue</td>\r\n                    </tr>\r\n                </table>\r\n            </td>\r\n            <td style=\"width:33%;font-size:16px;font-family:'roboto';background-color: rgba(38,64,88, 0.6) !important;color:#ffffff;padding:5px;\">\r\n                <table style=\"width:100%\">\r\n                    <tr>\r\n                        <td style=\"width:65%\" class=\"info11\">Executive<br/>Relationships</td>\r\n                        <td style=\"width:35%\" class=\"info2\"># of strong relationship</td>\r\n                    </tr>\r\n                </table>\r\n            </td>\r\n        </tr>\r\n        <tr>\r\n            <td style=\"width:33%;font-size:16px;font-family:'roboto';background-color: rgba(38,64,88, 0.6) !important;color:#ffffff;padding:5px;\">\r\n                <table style=\"width:100%\">\r\n                    <tr>\r\n                        <td style=\"width:33%\" class=\"detail1\">DVMT</td>\r\n                        <td style=\"width:33%\" class=\"detail2\">+2.6%</td>\r\n                        <td style=\"width:33%\" class=\"detail3\">15%</td>\r\n                    </tr>\r\n                </table>\r\n            </td>\r\n            <td style=\"width:33%;font-size:16px;font-family:'roboto';background-color: rgba(38,64,88, 0.6) !important;color:#ffffff;padding:5px;\">\r\n                <table style=\"width:100%\">\r\n                    <tr>\r\n                        <td style=\"width:33%\" class=\"detail1\">FORM</td>\r\n                        <td style=\"width:33%;\" class=\"detail2\">+3.5%</td>\r\n                        <td style=\"width:33%\" class=\"detail3\">44.1%</td>\r\n                    </tr>\r\n                </table>\r\n            </td>\r\n            <td style=\"width:33%;font-size:16px;font-family:'roboto';background-color: rgba(38,64,88, 0.6) !important;color:#ffffff;padding:5px;\">\r\n                <table style=\"width:100%\">\r\n                    <tr>\r\n                        <td style=\"width:33%\" class=\"detail1\">DVMT</td>\r\n                        <td style=\"width:33%\" class=\"detail2\">+2.6%</td>\r\n                        <td style=\"width:33%\" class=\"detail3\">15%</td>\r\n                    </tr>\r\n                </table>\r\n            </td>\r\n        </tr>\r\n        <tr>\r\n            <td style=\"width:33%;font-size:16px;font-family:'roboto';background-color: rgba(38,64,88, 0.6) !important;color:#ffffff;padding:5px;\">\r\n                <table style=\"width:100%\">\r\n                    <tr>\r\n                        <td style=\"width:33%\" class=\"detail1\">LNVGY</td>\r\n                        <td style=\"width:33%\" class=\"detail2-1\">-1.6%</td>\r\n                        <td style=\"width:33%\" class=\"detail3\">13%</td>\r\n                    </tr>\r\n                </table>\r\n            </td>\r\n            <td style=\"width:33%;font-size:16px;font-family:'roboto';background-color: rgba(38,64,88, 0.6) !important;color:#ffffff;padding:5px;\">\r\n                <table style=\"width:100%\">\r\n                    <tr>\r\n                        <td style=\"width:33%\" class=\"detail1\">6967</td>\r\n                        <td style=\"width:33%\" class=\"detail2\">+2.1%</td>\r\n                        <td style=\"width:33%\" class=\"detail3\">35.4%</td>\r\n                    </tr>\r\n                </table>\r\n            </td>\r\n            <td style=\"width:33%;font-size:16px;font-family:'roboto';background-color: rgba(38,64,88, 0.6) !important;color:#ffffff;padding:5px;\">\r\n                <table style=\"width:100%\">\r\n                    <tr>\r\n                        <td style=\"width:33%\" class=\"detail1\">LNVGY</td>\r\n                        <td style=\"width:33%\" class=\"detail2-1\">-1.6%</td>\r\n                        <td style=\"width:33%\" class=\"detail3\">13%</td>\r\n                    </tr>\r\n                </table>\r\n            </td>\r\n        </tr>\r\n        <tr>\r\n            <td style=\"width:33%;font-size:16px;font-family:'roboto';background-color: rgba(38,64,88, 0.6) !important;color:#ffffff;padding:5px;\">\r\n                <table style=\"width:100%\">\r\n                    <tr>\r\n                        <td style=\"width:33%\" class=\"detail1\">HPQ</td>\r\n                        <td style=\"width:33%\" class=\"detail2\">+2.2%</td>\r\n                        <td style=\"width:33%\" class=\"detail3\">13%</td>\r\n                    </tr>\r\n                </table>\r\n            </td>\r\n            <td style=\"width:33%;font-size:16px;font-family:'roboto';background-color: rgba(38,64,88, 0.6) !important;color:#ffffff;padding:5px;\">\r\n                <table style=\"width:100%\">\r\n                    <tr>\r\n                        <td style=\"width:33%\" class=\"detail1\">EGL</td>\r\n                        <td style=\"width:33%\" class=\"detail2-1\">-1.1%</td>\r\n                        <td style=\"width:33%\" class=\"detail3\">27.1%</td>\r\n                    </tr>\r\n                </table>\r\n            </td>\r\n            <td style=\"width:33%;font-size:16px;font-family:'roboto';background-color: rgba(38,64,88, 0.6) !important;color:#ffffff;padding:5px;\">\r\n                <table style=\"width:100%\">\r\n                    <tr>\r\n                        <td style=\"width:33%\" class=\"detail1\">HPQ</td>\r\n                        <td style=\"width:33%\" class=\"detail2\">+2.2%</td>\r\n                        <td style=\"width:33%\" class=\"detail3\">13%</td>\r\n                    </tr>\r\n                </table>\r\n            </td>\r\n        </tr>\r\n        <tr>\r\n            <td style=\"width:33%;font-size:16px;font-family:'roboto';background-color: rgba(38,64,88, 0.6) !important;color:#ffffff;padding:5px;\">\r\n                <table style=\"width:100%\">\r\n                    <tr>\r\n                        <td style=\"width:33%\" class=\"detail1\">2317</td>\r\n                        <td style=\"width:33%\" class=\"detail2-1\">-3.6%</td>\r\n                        <td style=\"width:33%\" class=\"detail3\">3.9%</td>\r\n                    </tr>\r\n                </table>\r\n            </td>\r\n            <td style=\"width:33%;font-size:16px;font-family:'roboto';background-color: rgba(38,64,88, 0.6) !important;color:#ffffff;padding:5px;\">\r\n                <table style=\"width:100%\">\r\n                    <tr>\r\n                        <td style=\"width:33%\" class=\"detail1\">KMG</td>\r\n                        <td style=\"width:33%\" class=\"detail2\">+3.6%</td>\r\n                        <td style=\"width:33%\" class=\"detail3\">26.0%</td>\r\n                    </tr>\r\n                </table>\r\n            </td>\r\n            <td style=\"width:33%;font-size:16px;font-family:'roboto';background-color: rgba(38,64,88, 0.6) !important;color:#ffffff;padding:5px;\">\r\n                <table style=\"width:100%\">\r\n                    <tr>\r\n                        <td style=\"width:33%\" class=\"detail1\">2317</td>\r\n                        <td style=\"width:33%\" class=\"detail2-1\">-3.6%</td>\r\n                        <td style=\"width:33%\" class=\"detail3\">3.9%</td>\r\n                    </tr>\r\n                </table>\r\n            </td>\r\n        </tr>\r\n        <tr>\r\n            <td style=\"width:33%;font-size:16px;font-family:'roboto';background-color: rgba(38,64,88, 0.6) !important;color:#ffffff;padding:5px;\">\r\n                <table style=\"width:100%\">\r\n                    <tr>\r\n                        <td style=\"width:33%\" class=\"detail1\">000977</td>\r\n                        <td style=\"width:33%\" class=\"detail2-1\">-1.1%</td>\r\n                        <td style=\"width:33%\" class=\"detail3\">0.6%</td>\r\n                    </tr>\r\n                </table>\r\n            </td>\r\n            <td style=\"width:33%;font-size:16px;font-family:'roboto';background-color: rgba(38,64,88, 0.6) !important;color:#ffffff;padding:5px;\">\r\n                <table style=\"width:100%\">\r\n                    <tr>\r\n                        <td style=\"width:33%\" class=\"detail1\">4062</td>\r\n                        <td style=\"width:33%\" class=\"detail2\">+0.5%</td>\r\n                        <td style=\"width:33%\" class=\"detail3\">29.9%</td>\r\n                    </tr>\r\n                </table>\r\n            </td>\r\n            <td style=\"width:33%;font-size:16px;font-family:'roboto';background-color: rgba(38,64,88, 0.6) !important;color:#ffffff;padding:5px;\">\r\n                <table style=\"width:100%\">\r\n                    <tr>\r\n                        <td style=\"width:33%\" class=\"detail1\">000977</td>\r\n                        <td style=\"width:33%\" class=\"detail2-1\">-1.1%</td>\r\n                        <td style=\"width:33%\" class=\"detail3\">0.6%</td>\r\n                    </tr>\r\n                </table>\r\n            </td>\r\n        </tr>\r\n        <tr>\r\n            <td style=\"width:33%;font-size:16px;font-family:'roboto';background-color: rgba(38,64,88, 0.6) !important;color:#ffffff;padding:5px;\">\r\n                <table style=\"width:100%\">\r\n                    <tr>\r\n                        <td style=\"width:33%\" class=\"detail1\">MRCY</td>\r\n                        <td style=\"width:33%\" class=\"detail2\">+5.4%</td>\r\n                        <td style=\"width:33%\" class=\"detail3\"><10%</td>\r\n                    </tr>\r\n                </table>\r\n            </td>\r\n            <td style=\"width:33%;font-size:16px;font-family:'roboto';background-color: rgba(38,64,88, 0.6) !important;color:#ffffff;padding:5px;\">\r\n                <table style=\"width:100%\">\r\n                    <tr>\r\n                        <td style=\"width:33%\" class=\"detail1\">KLAC</td>\r\n                        <td style=\"width:33%\" class=\"detail2\">+0.8%</td>\r\n                        <td style=\"width:33%\" class=\"detail3\">18.0%</td>\r\n                    </tr>\r\n                </table>\r\n            </td>\r\n            <td style=\"width:33%;font-size:16px;font-family:'roboto';background-color: rgba(38,64,88, 0.6) !important;color:#ffffff;padding:5px;\">\r\n                <table style=\"width:100%\">\r\n                    <tr>\r\n                        <td style=\"width:33%\" class=\"detail1\">MRCY</td>\r\n                        <td style=\"width:33%\" class=\"detail2\">+5.4%</td>\r\n                        <td style=\"width:33%\" class=\"detail3\"><10%</td>\r\n                    </tr>\r\n                </table>\r\n            </td>\r\n        </tr>\r\n    </table>\r\n</div>\r\n";

/***/ }),
/* 268 */
/***/ (function(module, exports) {

module.exports = "\r\n    <div style=\"float:left;width:50%;\">\r\n        <div style=\"margin-top:-18px;\"><img src=\"./include/images/dow_jones.png\" style=\"width:150px;\"></div>\r\n    </div>\r\n    <div style=\"float:right;width:50%;text-align:center;\">\r\n        <span style=\"font-size:12px;font-family:'robotoCondensed' !important;\">CURRENT VIEW</span>\r\n        <br>\r\n        <div style=\"width:80%;background:rgba(24,23,23,0.21);padding:0.5em;margin-left:10px;\">\r\n            <span class=\"graph-info-companys-visible\" style=\"color:#ffc000;font-family:'roboto-bold' !important;\">1750</span>\r\n            <br>\r\n            <span style=\"font-size:12px;color:#ffffff;\">Companies</span>\r\n        </div>\r\n    </div>\r\n    <div class=\"control-search\" style=\"margin-top:100px;text-align:left;font-size:11px;\">\r\n        <searchable-option-list id=\"my-select\" name=\"character\" multiple=\"multiple\"></searchable-option-list>\r\n    </div>\r\n    <div style=\"width:100%;text-align;center;\">\r\n        <table style=\"width:90%;padding:10px;\" align=\"center\">\r\n            <tr>\r\n                <td style=\"width:60%;\"><img src=\"include/images/Significant.png\" style=\"height:30px;cursor:pointer;\" /></td>\r\n                <td style=\"width:40%;\"><img src=\"include/images/TopStories.png\" style=\"height:30px;cursor:pointer;\" /></td>\r\n            </tr>\r\n            <tr>\r\n                <td><img src=\"include/images/Marketmacro.png\" style=\"height:30px;cursor:pointer;\" /></td>\r\n                <td><img src=\"include/images/Earning.png\" style=\"height:30px;cursor:pointer;margin-left:-4px;\" /></td>\r\n            </tr>\r\n            <tr>\r\n                <td><img src=\"include/images/Management.png\" style=\"height:30px;cursor:pointer;margin-left:5px;\" /></td>\r\n                <td></td>\r\n            </tr>\r\n        </table>\r\n    </div>\r\n    <input type=\"hidden\" id=\"DJSearch\" value=\"\" style=\"background:#000000;\"   />\r\n    <div class=\"control-news\">\r\n        <div class=\"list-news\" id=\"ls_djnews\" >\r\n            <div class=\"main\" >\r\n                <div style=\"height: 380px; padding:0;overflow:hidden;text-align: left;\">\r\n                    <div id=\"djnews\"></div>\r\n                </div>\r\n            </div>\r\n        </div>\r\n        <div class=\"load-more\">\r\n            <div class=\"btn-loadmore\" style=\"padding-top:3px;font-size:14px;font-family:'benchnine' !important;\">< Previous <span class=\"page-control-active\" id=\"s_1\" onclick=\"djnew_DJLast('DJTab','DJLast', 'DJSelect', 'DJSymbol', '1');\">1</span> <span class=\"page-control\"  id=\"s_2\" onclick=\"djnew_DJLast('DJTab','DJLast', 'DJSelect', 'DJSymbol', '2');\">2</span> <span class=\"page-control\" id=\"s_3\" onclick=\"djnew_DJLast('DJTab','DJLast', 'DJSelect', 'DJSymbol', '3');\">3</span> <span class=\"page-control\" id=\"s_4\" onclick=\"djnew_DJLast('DJTab','DJLast', 'DJSelect', 'DJSymbol', '4');\">4</span> <span class=\"page-control\" id=\"s_5\" onclick=\"djnew_DJLast('DJTab','DJLast', 'DJSelect', 'DJSymbol', '5');\">5</span> <span class=\"page-control\" id=\"s_6\" onclick=\"djnew_DJLast('DJTab','DJLast', 'DJSelect', 'DJSymbol', '6');\">6</span>  ... <span class=\"page-control\" id=\"s_20\" onclick=\"djnew_DJLast('DJTab','DJLast', 'DJSelect', 'DJSymbol', '20');\">20</span> Next >></div>\r\n        </div>\r\n        <div class=\"desc-news\">\r\n            <div class=\"col positive\" style=\"font-size:14px;font-family:'benchnine' !important;\">Positive</div>\r\n            <div class=\"col negative\" style=\"font-size:14px;font-family:'benchnine' !important;\">Negative</div>\r\n            <div class=\"col strong\" style=\"font-size:14px;font-family:'benchnine' !important;\">Strong</div>\r\n            <div class=\"last active\" style=\"font-size:14px;font-family:'benchnine' !important;\">Active</div>\r\n        </div>\r\n    </div>\r\n</div>\r\n\r\n\r\n\r\n    <input type=\"hidden\" id=\"DJTab\" value=\"lsn_industry\" style=\"background:#000000;\" />\r\n    <input type=\"hidden\" id=\"DJLast\" value=\"0\" style=\"background:#000000;\"  />\r\n    <input type=\"hidden\" id=\"DJSelect\" value=\"\" style=\"background:#000000;\"  />\r\n    <input type=\"hidden\" id=\"DJSymbol\" value=\"\" style=\"background:#000000;\"  />\r\n    <input type=\"hidden\" id=\"DJBubble\" value=\"\" style=\"background:#000000;\"  />\r\n    <input type=\"hidden\" id=\"DJSearch\" value=\"\" style=\"background:#000000;\"   />\r\n    <script>\r\n        djnew_DJLast('DJTab','DJLast', 'DJSelect', 'DJSymbol', '1');\r\n    </script>\r\n\r\n";

/***/ }),
/* 269 */
/***/ (function(module, exports) {

module.exports = "\r\n<style>\r\n\r\n    #logo {\r\n        position: absolute;\r\n        top: 0px;\r\n        left: 30;\r\n        color: #ffffff;\r\n        z-index: 1;padding: 10px;\r\n    }\r\n    #starview {\r\n        position: absolute;\r\n        top: 0px;\r\n        right: 0;\r\n        color: #ffffff;\r\n        z-index: 1;padding: 5px 10px 10px 10px;\r\n    }\r\n    #sig_menu {\r\n        font-family:'roboto';\r\n        position: absolute;\r\n        top: 13px;\r\n        left: 650;\r\n        color: #0490cd;\r\n        z-index: 1;\r\n        padding:7px 10px;\r\n        font-size:15px;\r\n        background: rgba(0, 0, 0, 0.51);\r\n        cursor:pointer;\r\n    }\r\n\r\n\r\n</style>\r\n\r\n\r\n<div id=\"sig_menu\" onclick=\"js_menu_sig();\">\r\n    <input type=\"hidden\" id=\"hid_sig_menu\" value=\"0\" />\r\n    SIGNIFICANT COMPANIES\r\n    <div id=\"sig_menu_sub\" style=\"display:none;text-align:left;color:#bfbfbf;\" >Customers<br />Suppliers<br />Influencers<br />Active Players<br />Chokepoints</div>\r\n</div>\r\n<div id=\"logo\"><img src=\"img/logo.png\" style=\"height:50px;\"></div>\r\n<div id=\"starview\"><img src=\"include/images/Starview.png\" style=\"height:35px;\"></div>\r\n\r\n<!-- the info panel containing rudimentary help for the user -->\r\n<info-panel></info-panel>\r\n\r\n\r\n\r\n<!-- TODO refactor parts -->\r\n\r\n<div style=\"position: absolute;top:50;right:320;\">\r\n    <div style=\"padding-bottom:5px;\"><img src=\"img/zoomin.png\" style=\"width:40px;cursor:pointer;\" /></div>\r\n    <div><img src=\"img/zoomout.png\" style=\"width:40px;cursor:pointer;\" /></div>\r\n</div>\r\n\r\n<div class=\"bottomCompanyGradient\">\r\n    <span style=\"width:10%;text-align:right;padding-right:20px;font-size:14px;font-family:'benchnine' !important;\">Negative</span>\r\n    <span style=\"width:80%\" class=\"companyGradient\"></span>\r\n    <span  style=\"width:10%;text-align:left;padding-left:20px;font-size:14px;font-family:'benchnine' !important;\">Positive</span>\r\n\r\n</div>\r\n\r\n\r\n\r\n<company-info style=\"max-width:300px; width:300px\"></company-info>\r\n\r\n\r\n<mode-select></mode-select>";

/***/ }),
/* 270 */
/***/ (function(module, exports) {

module.exports = "<style>\r\n\r\n    info-panel {\r\n        display: none;\r\n        width: 40%;\r\n\r\n        position: absolute;\r\n        top: 30%;\r\n        left: 30%;\r\n    }\r\n\r\n\r\n    info-panel > div {\r\n        background: mediumslateblue;\r\n        padding:1em;\r\n    }\r\n\r\n\r\n\r\n\r\n</style>\r\n\r\n<pre>\r\n    keymap\r\n    ------------------------------------\r\n    h ... toggle this help menu\r\n\r\n    s ... recluster hovered cluster/leaf\r\n    t ... toogle select current cluster\r\n    z/click ... zoom to cluster\r\n    u TODO toggle cluster text nodes ?\r\n    e ... toggle edges\r\n    ------------------------------------\r\n</pre>\r\n\r\n<div>\r\n\r\n    leafs\r\n    <select id=\"leafs\">\r\n        <option>true</option>\r\n        <option>false</option>\r\n    </select><br><hr>\r\n\r\n    text\r\n    <select id=\"clusterTextVisible\">\r\n        <option>true</option>\r\n        <option>false</option>\r\n    </select><br>\r\n    nodes\r\n    <select id=\"nodes\">\r\n        <option>true</option>\r\n        <option>false</option>\r\n    </select><br>\r\n    edges\r\n    <select id=\"edges\">\r\n        <option>true</option>\r\n        <option>false</option>\r\n    </select><br>\r\n\r\n    particles\r\n    <select id=\"particles\">\r\n        <option>true</option>\r\n        <option>false</option>\r\n    </select><br>\r\n</div>\r\n";

/***/ }),
/* 271 */
/***/ (function(module, exports) {

module.exports = "\r\n<option value=\"allSinficant\">Significant</option>";

/***/ }),
/* 272 */,
/* 273 */,
/* 274 */,
/* 275 */,
/* 276 */,
/* 277 */,
/* 278 */,
/* 279 */,
/* 280 */,
/* 281 */,
/* 282 */,
/* 283 */,
/* 284 */,
/* 285 */,
/* 286 */,
/* 287 */,
/* 288 */,
/* 289 */,
/* 290 */,
/* 291 */,
/* 292 */,
/* 293 */,
/* 294 */,
/* 295 */,
/* 296 */,
/* 297 */,
/* 298 */,
/* 299 */,
/* 300 */,
/* 301 */,
/* 302 */,
/* 303 */,
/* 304 */,
/* 305 */,
/* 306 */,
/* 307 */,
/* 308 */,
/* 309 */,
/* 310 */,
/* 311 */,
/* 312 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(179);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {}
options.transform = transform
// add the styles to the DOM
var update = __webpack_require__(6)(content, options);
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../../../node_modules/css-loader/index.js!./cluster-text-overlay.css", function() {
			var newContent = require("!!../../../node_modules/css-loader/index.js!./cluster-text-overlay.css");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),
/* 313 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(180);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {}
options.transform = transform
// add the styles to the DOM
var update = __webpack_require__(6)(content, options);
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../../node_modules/css-loader/index.js!./ModeSelect.css", function() {
			var newContent = require("!!../../node_modules/css-loader/index.js!./ModeSelect.css");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),
/* 314 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(181);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {}
options.transform = transform
// add the styles to the DOM
var update = __webpack_require__(6)(content, options);
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../../../node_modules/css-loader/index.js!./sol.css", function() {
			var newContent = require("!!../../../node_modules/css-loader/index.js!./sol.css");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),
/* 315 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(182);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {}
options.transform = transform
// add the styles to the DOM
var update = __webpack_require__(6)(content, options);
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../../node_modules/css-loader/index.js!./View3D.css", function() {
			var newContent = require("!!../../node_modules/css-loader/index.js!./View3D.css");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),
/* 316 */,
/* 317 */,
/* 318 */,
/* 319 */,
/* 320 */,
/* 321 */,
/* 322 */,
/* 323 */,
/* 324 */,
/* 325 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "12336f52147a1e2431ff9eed33bdd646.png";

/***/ }),
/* 326 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "0c9a5af6e30d58ba54d4cb310a44a02b.png";

/***/ }),
/* 327 */
/***/ (function(module, exports) {

module.exports = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAGPElEQVR42u2baWzkcxjHd1x1X+u+JdYVIo5IliXiZi0iRNxBQuLY4IXEEeUV8QovECIIFWl0vVhe7NlYRVBxlZCys5tpozvVdjpnZ6adv++Hp5vOse1c///8Z8YvedJjjv/v+T7P77l/ixb9v7xZnZ2dO/X29u4yMDCwWzAY3H14eHjPkZGRvcLh8N785O/BwcEO3tPd3b2zPhJodp4D/f39u46Oju4Tj8cPnZqaOiGTyZydzWYvEq2Ynp6+SXSb6HbRLaIb9P8r9J7z0un0aclk8pjJyckDQ6HQHgZIczCNBMfGxvZNpVLHwgxMzszMdIreEa0X/SwKif4WTYqiuVwuItom+lN/fy1aJXpZn10pUK4RIKfHYrFD0Bw0ybfSjkajB4nps7TxO2FA9LloVIxNOxWu3H8rpc//YYA8oe+9Gk3i2PhGK5C4pHOwGF+qDT6qja5Gmk6dl4Hxi+g1jo+AOBHb0UhbEUASUs8ztKGHtbE1orjj8hIQWdFWPet1HY9rE4nEkQjBc6nrwYezAW3kfVHY8XgJhCk99yfRM9K+MzG2nmgDhkhSP1lSf0yb+MZp4DI7MSEQPkAYskGLXTWS+GpcmR74Ipbc8cnCPoj6JJS7ORKugGDMLxXjb+G2HJ8t7SmDkcQQK4Y4qq4gzGH+bc6e49OFuyWWEAiP1A0EzryYP8ck71vm54JA7IBnIniqyTAS3GDwOPN+VPsFjsMPAuHW8fHx/apOXmRQjjBrP+Q02bLAaYO8wyUkWRUDgF/FtTTa1dUIAi7yTUWNSyqyBwQ6RHgEOTjaJgaANYRRnJiY2L9sAEhq9KGHGhHhuRQxbpI2LysrZKZgYS5vrdMii4xU9DyCXRAAMjvL6lxPbEo938UEql9acMG8WsCL5vNXeyEZrwAwELaJr2fntQX4TEn/LjfyeR8AgFtcT7ltR8FRIJVKHUclx6uz6SUAZguClOhKxgVEfToj51PGalUApAVj4u8l0uaSgQ8VWi9dXwMAwCVu0DE4pejB8Xj8MKq31RQwmwgA1m/S9CvziqqEiRQZKV176Z+9BsDsQEia/kCeHQAN3J/QWdcGAPwbFNG7KDSAF9O0aAMAoqJ3Cfi2P5T2k2V+Q60OgHhMEuglk8mjtz+UBoPOxc24iTYAIC0ANtJhKnSBd9CrawMAyAv6qHQVAkA/L1pPZrxYsuYVAyA+v8iLBWhxEQRRQWkDAKgXbsLt55W9BcCNtSRBTQQA0eBa5T3Hz/2SDnmBq/Ti5lYHgDqHqIeCb14dwBKhb9vACFIofZXpk7xQmCkMvfhxGwAwIgCetNmColrAK15WgRuRDM3WBIh+CyvBiykfUzlpYQBom33PcS/qE8yGw/TVWrgihAH8iAm0ogeTEdIM8dIONACAvzj/xD0lXQrzfHrD0151gT0uis6Q7UrLL9vhhJkdg+V686+tBoClwV0l1b+gMrSECSxi5lYBAOkT5MnI34uQ542sLC8gNd7aQgAkJNRPJNyTFhyY4HzwRn3gDXLnZgfApM/YzH3kPGXF11YguV4gDLgZGLkNgAU+zCN3WQGk7HGZAENG9NJqSZF9AEDamqIrKp4SIVRk8FkgfOhldFjPqA/Dp/0/HolEDqgq1TSDeB0VFAoJTcQ8Pj+MHcOe1TIuF7BpkXuIDfjiJmB+9tz3SIPPrXmQGvSwBzYtttnPIBjzMSo+RHzMONal6oJrpI7O5IiBkPGp2iP5NTBftsurAoSVesiPfjKMluZy5ntcYX4uCCRM1kbfaHd9co1UeavyBjF4nPm6qf18hpE5GyF9qc0PD7sdMS6g8t/h6rD2RVUel6uxHdTWzTj2cQvMiwTKQtuk3TDroohDgbMht8k4EqYNy7SZF0waYTfqCSbxmAU3nwr4+wlvq5oDdgMI2s0C4kJt7jnsg2iLNjtu4WiuyvNNNJewEbcBrsaQ0tLXM0Pnr9ulAEHYSYndDCV3B3tFv2Mr7LJkzK64ZKxRmbXf08ZsxBjewsi73Rl8SuBeTjHD8nnfX6sNoJpUmgXGqXSdxMSDdkzeQ4VFn4m+FLNfmQ3hVmkP9wJhGACp3nIDleZtM12fLakZAMJYCkcFSVJ5okMLYcHp1dGuwqCRjmPR/XpNtqXWP/U+O0dS+SElAAAAAElFTkSuQmCC"

/***/ }),
/* 328 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "bd6506a08374857822ebdf3cde4dfd8b.png";

/***/ }),
/* 329 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "15dc79379495a49c9d56f2e26085a935.png";

/***/ }),
/* 330 */
/***/ (function(module, exports) {

module.exports = "data:application/json;base64,W3sNCiAgICAidHlwZSI6ICJvcHRpb25ncm91cCIsDQogICAgImxhYmVsIjogIlRoZSBHcmlmZmlucyIsDQogICAgImNoaWxkcmVuIjogWw0KICAgICAgeyAidHlwZSI6ICJvcHRpb24iLCAidmFsdWUiOiAiUGV0ZXIiLCAgImxhYmVsIjogIlBldGVyIEdyaWZmaW4ifSwNCiAgICAgIHsgInR5cGUiOiAib3B0aW9uIiwgInZhbHVlIjogIkxvaXMiLCAgICJsYWJlbCI6ICJMb2lzIEdyaWZmaW4ifSwNCiAgICAgIHsgInR5cGUiOiAib3B0aW9uIiwgInZhbHVlIjogIkNocmlzIiwgICJsYWJlbCI6ICJDaHJpcyBHcmlmZmluIn0sDQogICAgICB7ICJ0eXBlIjogIm9wdGlvbiIsICJ2YWx1ZSI6ICJNZWciLCAgICAibGFiZWwiOiAiTWVnIEdyaWZmaW4ifSwNCiAgICAgIHsgInR5cGUiOiAib3B0aW9uIiwgInZhbHVlIjogIlN0ZXdpZSIsICJsYWJlbCI6ICJTdGV3aWUgR3JpZmZpbiJ9DQogICAgXQ0KICB9LA0KICB7DQogICAgInR5cGUiOiAib3B0aW9uZ3JvdXAiLA0KICAgICJsYWJlbCI6ICJQZXRlcidzIEZyaWVuZHMiLA0KICAgICJjaGlsZHJlbiI6IFsNCiAgICAgIHsgInR5cGUiOiAib3B0aW9uIiwgInZhbHVlIjogIkNsZXZlbGFuZCIsICJsYWJlbCI6ICJDbGV2ZWxhbmQgQnJvd24ifSwNCiAgICAgIHsgInR5cGUiOiAib3B0aW9uIiwgInZhbHVlIjogIkpvZSIsICAgICAgICJsYWJlbCI6ICJKb2UgU3dhbnNvbiJ9LA0KICAgICAgeyAidHlwZSI6ICJvcHRpb24iLCAidmFsdWUiOiAiUXVhZ21pcmUiLCAgImxhYmVsIjogIkdsZW5uIFF1YWdtaXJlIn0NCiAgICBdDQogIH0sDQogIHsgInR5cGUiOiAib3B0aW9uIiwgInZhbHVlIjogIkV2aWwgTW9ua2V5IiwgImxhYmVsIjogIkV2aWwgTW9ua2V5In0sDQogIHsgInR5cGUiOiAib3B0aW9uIiwgInZhbHVlIjogIkhlcmJlcnQiLCAgICAgImxhYmVsIjogIkpvaG4gSGVyYmVydCJ9DQpd"

/***/ }),
/* 331 */,
/* 332 */,
/* 333 */
/***/ (function(module, exports) {

/* (ignored) */

/***/ })
],[127]);
//# sourceMappingURL=bundle.js.map