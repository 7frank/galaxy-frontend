/**
 * Created by Frank on 30.05.2017.
 */


import ClusterLeafElement from "./ClusterLeafElement"
import BaseNode from "./BaseNode"
import EdgeUtil from "./EdgeUtil"
import BaseVolume from "./hull/BaseVolume"

import MaterialFadeMixin from "../utils/MaterialFadeMixin"

import Color from 'easy-color';

import ClusterBaseEdges from "./edges/ClusterBaseEdges";

/**
 * NOTE: possible future work flow/use case
 *  cluster=new BaseCluster3D(allNodes)
 *  cluster.applyClustering(...) // copy existing stuff
 *  _dist= new ForceGraphDistribution() // set nodes internally
 *
 *  cluster.find("#other").setDistribution(_dist)
 *  cluster.find("United States").applyClustering(...)
 */


export default class BaseCluster3D extends BaseNode {

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
        this.mCollapsedGroup = new THREE.Group();
        this.mExpandedGroup = new THREE.Group();

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
        if (_.isArray(clusteringHandlers) && clusteringHandlers.length > 0) {
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


        var parser = new Color("#00AAFF");
        var table = parser.CSSColorTable


        let id = _.random(0, Object.keys(table).length - 1)
        var color = new Color(Object.values(table)[id]);


//FIXME MeshPhongMaterial does not get light
        let materialInnerRing = new THREE.MeshBasicMaterial({
            color: 0x00FFFF, // 0xfaebd7, //antique-white
            wireframe: false,
            transparent: true,
            opacity: 1.0,
            visible: true,
            polygonOffset: true,
            polygonOffsetFactor: -4,
            depthTest: true, //enabled, it will half way hide BaseVolume lines //TODO this is because the ring is only a flat surface in 3d space ...
            blending: THREE.NoBlending
        });


        materialInnerRing.color = new THREE.Color(color.rgb.r / 255, color.rgb.g / 255, color.rgb.b / 255)

        let materialOtherBlue = new THREE.MeshBasicMaterial({
            color: 0x555555, //0x6a5acd, //slate-blue
            wireframe: false,
            transparent: false,
            // opacity: 0.8,
            visible: true,
            polygonOffset: true,
            polygonOffsetFactor: -4,
            depthTest: true
        });


        if (boundingBox)
            boundingSphere = boundingBox.getBoundingSphere();
        else
            boundingSphere = new THREE.Sphere(new THREE.Vector3, this.mNodes.length * 7);
        //FIXME estimated hull size differs from forcegraph collision box

        let ringGeometryOuter = new THREE.RingGeometry(boundingSphere.radius * 0.85, boundingSphere.radius, 64);
        //  ringGeometryOuter.boundingSphere = boundingSphere;


        let ringGeometryInner = new THREE.CircleGeometry(boundingSphere.radius * 0.85, 64);
        //  ringGeometryInner.boundingSphere = boundingSphere;


        let inner = new THREE.Mesh(ringGeometryInner, materialInnerRing);
        let outer = new THREE.Mesh(ringGeometryOuter, materialOtherBlue);

        MaterialFadeMixin(materialInnerRing)
        MaterialFadeMixin(materialOtherBlue)


        let _hull = new THREE.Group();

        _hull.name = "CollapsedHull"

        _hull.add(outer);
        _hull.add(inner);

        _hull.animate = function (fade, duration, onComplete) {
            //  materialInnerRing.animate(...arguments)
            materialOtherBlue.animate(...arguments)
        }


        inner.onBeforeRender = outer.onBeforeRender = function (renderer, scene, camera, geometry, material, group) {
            //billboard effect
            this.position.set(0, 0, 0)

            this.setRotationFromQuaternion(camera.quaternion)


            var vec3 = new THREE.Vector3(0, 0, 1)// camera.position.clone().sub(this.position).normalize()

            // translate the object 10% of it's size into the foreground
            //TODO smaller collapsed hulls should be in front of bigger ones
            this.translateOnAxis(vec3, boundingSphere.radius / 10)

        };


        _hull.position.copy(boundingSphere.center);

        //inner.geometry.boundingSphere=boundingSphere;
        //inner.geometry.boundingBox=boundingSphere.getBoundingBox();

        //FIXME creates problems with interactions
        //the geometry that is necessary to be able to click stuff is generated in ajdustHullSize which isn't called when cluster is collapsed
        //TODO make it more robust

        if (!this.geometry) this.geometry = new THREE.SphereGeometry(boundingSphere.radius, 10, 5);
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

        var pos_offset = new THREE.Vector3
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

        var pos_offset = new THREE.Vector3
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

        _.each(this.mClusters, (cluster) => this.mExpandedGroup.add(cluster))

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
     * TODO check if changes to collapsed/expanded groups are relevant to cleaning up clusters
     */

    static cleanUpClusters(clusters, self) {
        clusters.push(self);

        _.each(clusters, function (cluster) {

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

    /**
     * free leaf elements
     *
     *
     */


    cleanUpLeafs() {
        _.each(this.getLeafs(), function (leaf) {

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


        let options = _.extend({
            minClusterSize: 10,
            defaultMergeGroupName: "other",
            hull: BaseVolume,
            onHullCreated: function () {
            },
            edges: ClusterBaseEdges,
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
                _.extend({
                    edge: [0x999999, 1],

                    hull: [0xffffff, 0.03]//     color: 0xffffff,    opacity: 0.03,
                }, options.colors);

        }
        else
            options.colors =
                _.extend(parent.getClusterOptions().colors, options.colors);


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

        let events = _.extend({
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
        _.each(this.getEvents(), function (handler, eventName) {
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


        _.each(this.mClusters, function (mCluster, key) {

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

        //TODO add clusters to parent so getParentCluster Works within options
        this.addAllSubClustersToContainer()

        /**
         * add listeners to child elements if the hull was update
         * in which case we bubble up the tree to notify for changes and readjust parent elements
         *
         */
        _.each(this.mClusters, function (childCluster) {
            childCluster.on("hull-updated", _.throttle(function () {


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

        }, _.throttle(function () {




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

        if (!(  ClusterBaseEdges == edgeClass || ClusterBaseEdges.isPrototypeOf(edgeClass))) {
            edgeClass = ClusterBaseEdges;
            console.error("cluster option edges must be instanceof ClusterBaseEdges, using default")
        }


        this.mChildClustersEdgesMesh = new edgeClass(null, options)



        var that=this
        function mCallback(depth){

            console.log("edges for", that.name,"depth",depth)

        }

        //TODO this should enable stencil testing for the current two implementations of edges
        if (this.mChildClustersEdgesMesh.children.length > 0)
            this.addEdgeStencilBeforeRender(this.mChildClustersEdgesMesh.children[0],mCallback)
        else
            this.addEdgeStencilBeforeRender(this.mChildClustersEdgesMesh,mCallback)


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
    }, onStep = function () {
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
                function _onStep(p) {

                    updateLeafsEdges(that);


                    onStep()
                    //that.addChildClusterEdges();

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


    setHullColorFromOptions(hull) {
        let o = this.getClusterOptions()

        if (hull.canBeVisible()) {

            hull.mesh.material.color = new THREE.Color(o.colors.hull[0])

            //TODO test this
            //hull.mesh.material.transparent =o.colors.hull[0]!=1

            hull.maxOpacity = o.colors.hull[1]
        }

    }


    addHullStencilBeforeRender(mesh,callback) {
        var that=this

        mesh.onBeforeRender = function (renderer) {

            var depth=that.getDepth()+1

            let opt = renderer.debug.stencil
            opt.state(true)
            var gl = renderer.context;
            // config the stencil buffer to collect data for testing
            let func=opt.func[0]
            gl.stencilFunc(func[0],depth,func[2]);
            gl.stencilOp(... opt.op[0]);

            if (opt.debug)
            callback(depth)

        }

        mesh.onAfterRender = function (renderer) {

            let opt = renderer.debug.stencil
            opt.state(false)
        }

    }

    addEdgeStencilBeforeRender(mesh,callback) {
        var that=this

        mesh.onBeforeRender = function (renderer) {

            var depth=that.getDepth()+1
            let opt = renderer.debug.stencil
            opt.state(true)
            var gl = renderer.context;
            // config the stencil buffer to collect data for testing
            let func=opt.func[1]
            gl.stencilFunc(func[0],depth,func[2]);
            gl.stencilOp(... opt.op[1]);

            if (opt.debug)
            callback(depth)
        }

        mesh.onAfterRender = function (renderer) {

            let opt = renderer.debug.stencil
            opt.state(false)
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


        let info = {box: new THREE.Box3(), vertices: []};

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
            if (info.box.min.x == Infinity) info.box = new THREE.Box3(new THREE.Vector3(-1, -1, -1), new THREE.Vector3(1, 1, 1))

        }

        let boundingBox = info.box;

        // we must have at least one hull impl
        // it might be invisible or idle but it should be set via defaults
        // also text nodes depend on valid sized bbox
        //compute hull object from bounding box
        var mOptions = this.getClusterOptions();

        // create the hull container
        if (!this.mHull)
            if (BaseVolume == mOptions.hull || BaseVolume.isPrototypeOf(mOptions.hull)) {

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
            var sphereGeometry = new THREE.SphereGeometry(boundingSphere.radius, 10, 5);
            sphereGeometry.boundingBox = boundingBox;
            this.geometry = sphereGeometry;
        }


        this.setHullColorFromOptions(this.mHull)

var that=this
        this.addHullStencilBeforeRender(this.mHull.mesh,function(depth){

           console.log("hull for", that.name,"depth",depth)

        })

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

        let leaf = new ClusterLeafElement(this.mNodes, domEvents);
        this.mLeaf = leaf;
        this.mExpandedGroup.add(leaf);
        leaf.setDistributionHandler(entry.distribution, function () {

            //create/update the hull element after the animation has finished
            that.adjustHullSize();


            if (that.isLeaf())
                that.updateIfIsLeaf()


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
        return EdgeUtil.getClusterInfo(this.mClusters);

    }


    /**
     * creates edges from nodes
     * the edges can be inner edges only from nodes within cluster to other nodes within
     * or external edges leading into nodes from other clusters
     */

    createEdgesForChildClusters() {

        if (this.mChildClustersEdges) return this.mChildClustersEdges;

        return this.mChildClustersEdges = EdgeUtil.createEdgesBetweenClustersFromMap(this.mClusters);

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
            if (item instanceof ClusterLeafElement)
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

            //the actual parent cluster has one group element where the sub-cluster resides
            if (r instanceof THREE.Group && r.parent instanceof BaseCluster3D) r = r.parent;

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