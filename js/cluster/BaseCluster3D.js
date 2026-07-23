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


import * as THREE from "three";
import * as _ from "lodash";

/**
 *
 * this part contains the mayor parts for the graph clusters
 * it handles rendering of child-clusters, cluster-hull elements, leaf elements, edges and other
 *
 *
 * child clusters:
 * -the implementation allows to build a graph of clusters with a hierarchical structure
 * -for example a  graph may contain clusters of nodes of elements like companies, which can be clustered by country, which can further by clustered by industrial sector
 *
 * cluster-hull:
 * - the cluster hull is a specific implementation of {@link  BaseVolume}, its purpose is to generate a visible hull around a cluster of nodes
 * - for example for 3D a {@link  ConvexVolume}  can be used
 *
 *
 * leaf-elements:
 * - handle the specific rendering of BaseCluster3D::mNodes set by BaseCluster3D::addNodes
 * - the default implementation for example uses a THREE.Point structure to render a stack of nodes via point clouds
 * - a leaf {@link  ClusterLeafElement} for the default implemetatin, consists of the mNodes rendered, its particles (the small rectangles within the node-sprite) and the edges between the mNode elements
 *
 * edge-containers:
 * - {@link ClusterBaseEdges} {@link ClusterMeshEdges}
 * - renders edges between a set of sibling clusters
 * - an edge by default unidirectional from sender to target and the interpretation is up to the specific use case
 *
 *
 * NOTE: possible use cases when navigating the graph
 *  cluster=new BaseCluster3D(allNodes)
 *  cluster.applyClustering(...) // copy existing stuff
 *  _dist= new ForceGraphDistribution() // set nodes internally
 *
 *  cluster.find("other").setDistribution(_dist)
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


        //bind 'before-render' - listener updates level-of-detail for cluster
        //TODO the function should forward onBeforeRender args in a way
        this.on("before-render", function () {

            //   if (!this.mHull) return;

            let view = this.getView();
            //based on distance to the camera the LOD is set for the hull object
            let src = view.mCamera.position;

            let dst;
            if (this.mHull && this.mHull.mesh && this.mHull.mesh.geometry && this.mHull.mesh.geometry.boundingBox)
                dst = this.mHull.mesh.geometry.boundingBox.getCenter(new THREE.Vector3());
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
     * static method to free the given clusters again
     * TODO check if changes to collapsed/expanded groups are relevant to cleaning up clusters
     * @param clusters ... the clusters whose memory shall be freed by GC
     * @param self ... convenience parameter, usually the parent cluster of clusters, this way no sorting is necessary as the root gets cleaned up last
     *
     * NOTE:the original goal was to be able to clean up parts of the graph individually to apply different distribution functions
     * and to speed up the creation of different views by reusing structures
     */


    static cleanUpClusters(clusters, self) {
        clusters.push(self);

        _.each(clusters, function (cluster) {

            if (!cluster) return

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
     * set visibility of leaf elements within cluster
     */

    setLeafsVisible(bVisible) {

        this.getLeafs().forEach(l => l.visible = bVisible)

    }


    /**
     * set visibility of particle elements within cluster
     */

    setParticlesVisible(bVisible) {

        this.getLeafs().forEach(l => l.setParticlesVisible(bVisible))

    }

    /**
     * set visibility of particle elements within cluster
     */

    setNodesVisible(bVisible) {

        this.getLeafs().forEach(l => l.setNodesVisible(bVisible))

    }

    /**
     * FIXME does not work, the visibility is reset by LOD and on-before-render functions elsewhere
     *
     **/
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

    /**
     * generates a spherical hull which is used to render instead of its child clusters/leafs if a cluster is in a collapsed state
     * TODO refactor into own class
     */
    getSphereHull(boundingBox) {
        let boundingSphere;

        if (this.mCollapsedClusterHull != null) {

            if (this.mHull) {
                let boundingBox = this.mHull.mBoundingBox;
                boundingSphere = boundingBox.getBoundingSphere(new THREE.Sphere());


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


        //TODO currently not proper lighting set to be albe to use MeshPhongMaterial
        let materialInnerRing = new THREE.MeshBasicMaterial({
            color: 0x00FFFF, // 0xfaebd7, //antique-white
            wireframe: false,
            transparent: true,
            opacity: 1.0,
            visible: true,
            polygonOffset: true,
            polygonOffsetFactor: -4,
            depthTest: false, //enabled, it will half way hide BaseVolume lines //TODO this is because the ring is only a flat surface in 3d space ...
            blending: THREE.NoBlending
        });


        materialInnerRing.color = new THREE.Color(color.rgb.r / 255, color.rgb.g / 255, color.rgb.b / 255)

        let materialOtherBlue = new THREE.MeshBasicMaterial({
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
            boundingSphere = boundingBox.getBoundingSphere(new THREE.Sphere());
        else
            boundingSphere = new THREE.Sphere(new THREE.Vector3(), this.mNodes.length * 7);
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


    /**
     * call to toggle between expand and collapse state of the cluster
     * Note: this method can be used by specific implementations to hide/show clusters of the graph via user interaction
     * to do so, generate a configuration of clusters and have some events (eg. keyboard- or  mouse events) bound that call this method
     */

    toggleCollapse() {


        this.mExpanded = !this.mExpanded;

        console.log(this.name, "expanded:", this.mExpanded)


        if (this.mExpanded)
            this.expand();
        else
            this.collapse();


    }



    /**
     * call to collapse a cluster
     * which will render a spherical hull instead of the cluster and its child elements
     */

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
            pos_offset = this.mHull.mBoundingBox.getCenter(new THREE.Vector3())//.multiplyScalar(-1);


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
            var offset = this.mHull.mBoundingBox.getCenter(new THREE.Vector3())//.multiplyScalar(3);

            //this.mCollapsedGroup.position.copy(offset)

            this.mCollapsedClusterHull.position.copy(offset)

        }


    }


    /**
     * call to expand a cluster
     */


    expand() {

        var that = this;

        if (this.mCollapsedClusterHull)
            this.mCollapsedClusterHull.animate({fade: 0.1}, 200)


        if (!this.mClusterClusteringApplied) {


            this.applyClustering(this.getEntries(), true); //initialise sub-clusters if necessary


            // primarily notify text overlay here
            this.getRoot().getView().dispatchEvent(new CustomEvent("graph-changed"));

            this.trigger("initial-expand");


        }


        //TODO handle if not created.. via callback/event
        //also currently if not already created the placeholder sphere gets removed again (restructure)

        var pos_offset = new THREE.Vector3
        //change position of mCollapsedGroup based on center of mHull
        if (this.mHull && this.mHull.mBoundingBox)
            pos_offset = this.mHull.mBoundingBox.getCenter(new THREE.Vector3())//.multiplyScalar(-1);


        this.animate({mCollapsedGroup: {scale: {x: 0.001, y: 0.001, z: 0.001}, position: pos_offset}}, 200)


        this.mExpandedGroup.visible = true
        this.animate({mExpandedGroup: {scale: {x: 1, y: 1, z: 1}, position: {x: 0, y: 0, z: 0}}}, 200, function () {
        }, function onAnimate() {

            this.trigger("hull-updated")

        })


    }

    /**
     * handles level of detail (LOD) related optimisations for child elements
     * for example: the greater the distance between THREE.Camera (the position of the viewer) and the cluster,
     * the fewer details need to be rendered. most of the optimisations are forwarded to the element itself and handled there
     *

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
     * Add one or many nodes to the cluster. These nodes differ from the {@link BaseNode} although there is a naming similarity
     * Instead, these nodes are those rendered within a {@link ClusterLeafElement} and represent the nodes of the visible graph
     * TODO could this be used to dynamically add nodes an re-run the clustering?
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
     * pushes the clusters to the mesh stack (mExpandedGroup) for them to be rendered
     *
     */

    addAllSubClustersToContainer() {

        _.each(this.mClusters, (cluster) => this.mExpandedGroup.add(cluster))

    }

    /**
     *  used for recursive cluster generation if class is used for inheritance
     *
     */

    getChildClusterConstructor() {
        return this.constructor

    }

    /**
     * GC - free leaf elements
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
     * after reclustering we can use these to update the new positions to match the old ones in world coords
     * TODO we want to get the node positions relative to the current root? cluster
     * TODO this is not 100% wokrin as intended, it should be possible to morph from one configuration of clusters and distributions into another
     * with smooth transitions.
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

    /**
     * {@link setEntries}
     */
    setEntry(entry) {
        this.mEntry = entry
    }


    /**
     * {@link getEntries}
     */
    getEntry() {
        return this.mEntry
    }


    /**
     * "entry" is a specific configuration
     * TODO documentation
     *
     * @param entries
     */

    setEntries(entries) {
        this.mEntrys = entries;
        this.setEntry(entries[0])

    }

    /**
     * {@link setEntries}
     */
    getEntries() {
        return this.mEntrys || []
    }


    /**
     *
     * @returns {Object}
     *
     * @param Object.minClusterSize ... is the lower bound for the nodes within the cluster
     * if the cluster has fewer elements all clusters previously generated are places within this "other" cluster
     *
     * @param Object.defaultMergeGroupName the name of the "other" cluster can be changed by this value
     *
     * @param Object.hull can be used to add a volume around the cluster
     * by default if no value gets set, the BaseVolume class is used which is invisible by default
     * but is necessary for other components like picking and tet rendering
     *
     * @param Object.onHullCreated gets called after creating an instance of 'Object.hull'
     *
     * @param Object.edges the class that is used to generate visible edges between sibling clusters. must be instanceof {@link ClusterBaseEdges}
     *
     * @param Object.edges if set to true the whole sub-cluster is rendered. if set to false only the placeholder (spherical object) is rendered
     *
     */


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


    /**
     * GC the edge meshes
     */

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

    /**
     * generated and updates edges between clusters
     *
     */
    addChildClusterEdges(options) {


        //TODO this should be done by the mesh itself probably
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
     * the resulting groups are used by @link doClusteringForOnlyThis to create the actual visible child clusters
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


    /**
     * retrieves the vertices from a given bounding box
     *
     * @param boundingBox instanceof THREE.Box3
     * @returns {Array} of THREE.Vector3
     */

    getVerticesFromBoundingBox(boundingBox) {


        let _center = boundingBox.getCenter(new THREE.Vector3());
        let _size = boundingBox.getSize(new THREE.Vector3());

        const box = new THREE.BoxGeometry(_size.x, _size.y, _size.z);
        box.translate(_center.x, _center.y, _center.z);

        const pos = box.getAttribute('position');
        const verts = [];
        for (let i = 0; i < pos.count; i++) {
            verts.push(new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)));
        }
        return verts;
    }


    /**
     *
     * generates a compound box of all contained sub clusters of this cluster
     *
     * TODO it  seems, the vertices aren't calculated properly
     */
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


        //FIXME redundant updating multiple edges and potentially leafs
        var updateLeafsEdges = _.throttle(function (cluster) {

            //TODO the timeout fixes the problem that the edges aren't on spot but this should be reviewed and fixed without it


            let leafs = cluster.getLeafs();
            _.each(leafs, function (leaf) {
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


    /**
     * sets the color of the hull to the omitted value
     *
     * @param hull
     */

    setHullColorFromOptions(hull) {
        let o = this.getClusterOptions()

        if (hull.canBeVisible()) {

            hull.mesh.material.color = new THREE.Color(o.colors.hull[0])

            //TODO test this
            //hull.mesh.material.transparent =o.colors.hull[0]!=1

            hull.maxOpacity = o.colors.hull[1]
        }

    }


    /**
     * below method is used to hide edges of a parent cluster behind the hull element of the current cluster
     * this way a cleaner look with less edges should be possible (especially in 2D)
     * TODO refactor.. currently this part does not render without flaws and it uses some global reference values for debuging
     * FIXME work flow
     **/

    addHullStencilBeforeRender(mesh, callback) {
        var that = this

        mesh.onBeforeRender = function (renderer) {

            var depth = that.getDepth()

            let opt = renderer.debug.stencil
            opt.state(true)
            var gl = renderer.getContext();
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

    /**
     *  {@link addHullStencilBeforeRender}
     **/

    addEdgeStencilBeforeRender(mesh, callback) {
        var that = this

        mesh.onBeforeRender = function (renderer) {

            var depth = that.getDepth()
            let opt = renderer.debug.stencil
            opt.state(true)
            var gl = renderer.getContext();
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
     *  @link BaseVolume
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
        this.mHull.createVolumeFromVertices(vertices, boundingBox);

        mOptions.onHullCreated(this.mHull)

        //--------------
        //copy the geometry for the domEvents to work
        if (!this.mHull && this.mHull.geometry) {

            this.geometry = this.mHull.geometry;

        }
        else {

            //have some default geometry for the domEvents //TODO find out why it fails without this part
            let boundingSphere = boundingBox.getBoundingSphere(new THREE.Sphere());
            //TODO this is currently used for the mouse interactions but should be refactored and removed
            var sphereGeometry = new THREE.SphereGeometry(boundingSphere.radius, 10, 5);
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

        let leaf = new ClusterLeafElement(this.mNodes, domEvents);
        this.mLeaf = leaf;
        this.mExpandedGroup.add(leaf);

        var updateLeafsEdges = _.throttle(function (cluster) {

            //TODO the timeout fixes the problem that the edges aren't on spot but this should be reviewed and fixed without it


            let leafs = cluster.getLeafs();
            _.each(leafs, function (leaf) {
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


    /**
     * {@link BaseNode.getDOMElement}
     **/

    getDOMElement() {


        var view3d = this.getView();
        if (!view3d || !view3d.domElement) {
            console.warn("attach graph to a view before using dom specific functions");
            return null;
        }

        return view3d.domElement

    }



    /**
     * {@link BaseNode.getDOMEvents}
     **/
    getDOMEvents() {


        var view3d = this.getView();
        if (!view3d || !view3d.mDomEvents) {
            console.warn("attach graph to a view before using dom specific functions");
            return null;
        }

        return view3d.mDomEvents

    }


    /**
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


    /**
     * returns an array of parent clusters sorted from top to bottom
     */

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

    /**
     * returns the depth of the cluster within the graph
     * eg. for a graph that is clustered by country and then by industrial sector, each country cluster like "United States" or Taiwan have the depth 1
     * each industrial sector would have a depth of 2
     * main purpose of this function is to order the elements for the stencil test to hide edges in a correct manner
     *
     * TODO performance wise this is too redundant
     */
    getDepth() {
        return this.getParents().length
    }


}