/**
 * Created by Frank on 30.05.2017.
 */


import ClusterLeafElement from "./ClusterLeafElement"
import BaseNode from "./BaseNode"
import EdgeUtil from "./EdgeUtil"
import BaseVolume from "./hull/BaseVolume"

import MaterialFadeMixin from "../utils/MaterialFadeMixin"

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


        //add collapse/expand stuff
        this.mExpanded = true;
        this.mClusterClusteringApplied = false;
        this.mCollapsedGroup = new THREE.Group();
        this.mExpandedGroup = new THREE.Group();
        this.add(this.mCollapsedGroup);
        this.add(this.mExpandedGroup);


        this.registerCustomEvent("hull-updated"); // gets called if the hull got adjusted

        this.registerCustomEvent("cluster-ready"); //if the cluster animation is finished

        this.mClusters = {};
        //Cluster if present, use to cluster nodes into sub-clusters
        if (_.isArray(clusteringHandlers) && clusteringHandlers.length > 0) {
            this.applyClustering(clusteringHandlers);
        }
        // else this.updateCluster()


        //add collapse behaviour to left click
        //TODO this interferes with zoom.. we can't bind everything from the gerhobelt demo to the same mouse button

        this.on("click", function (e) {

            e.stopPropagation();
            this.toggleCollapse()
        });


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


    //TODO update position and radius
    getSphereHull(boundingBox) {
        let boundingSphere;

        if (this.mCollapsedClusterHull != null) {

            //FIXME hull offset
            if (this.mHull) {
                let boundingBox = this.mHull.mBoundingBox;
                boundingSphere = boundingBox.getBoundingSphere();
                this.mCollapsedClusterHull.position.copy(boundingSphere.center);
            }


            return this.mCollapsedClusterHull
        }


        let material = new THREE.MeshPhongMaterial({
            color: 0xfaebd7, //antique-white
            wireframe: false,
            transparent: true,
            opacity: 0.8,
            visible: true,
            polygonOffset: true,
            polygonOffsetFactor: -4
        });


        let materialOtherBlue = new THREE.MeshBasicMaterial({
            color: 0x6a5acd, //slate-blue
            wireframe: false,
            transparent: true,
            opacity: 0.8,
            visible: true,
            polygonOffset: true,
            polygonOffsetFactor: -4
        });


        if (boundingBox)
            boundingSphere = boundingBox.getBoundingSphere();
        else
            boundingSphere = new THREE.Sphere(new THREE.Vector3, this.mNodes.length * 10);


        let ringGeometryOuter = new THREE.RingGeometry(boundingSphere.radius * 0.85, boundingSphere.radius, 64);
        //  ringGeometryOuter.boundingSphere = boundingSphere;


        let ringGeometryInner = new THREE.CircleGeometry(boundingSphere.radius * 0.85, 64);
        //  ringGeometryInner.boundingSphere = boundingSphere;


        let inner = new THREE.Mesh(ringGeometryInner, material);
        let outer = new THREE.Mesh(ringGeometryOuter, materialOtherBlue);

        let hull = new THREE.Group();

        hull.add(outer);
        hull.add(inner);


        inner.onBeforeRender = outer.onBeforeRender = function (renderer, scene, camera, geometry, material, group) {
            //billboard effect
            this.setRotationFromQuaternion(camera.quaternion)


        };


        hull.position.copy(boundingSphere.center);

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
        this.mCollapsedClusterHull = hull;
        this.mCollapsedGroup.add(this.mCollapsedClusterHull);
        //------

        return hull

    }


    toggleCollapse() {
        this.mExpanded = !this.mExpanded;


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
        this.mExpandedGroup.visible = false;


        this.getSphereHull(this.mHull ? this.mHull.mBoundingBox : null)

        if (this.mCollapsedGroup)
            this.mCollapsedGroup.visible = true
      //  this.fadeMesh(this.mCollapsedClusterHull.children[0],1,200)
      //  this.fadeMesh(this.mCollapsedClusterHull.children[1],1,200)

    }


    expand() {

        if (this.mCollapsedGroup)
          this.mCollapsedGroup.visible = false

        //this.fadeMesh(this.mCollapsedClusterHull.children[0],0,200)
        //this.fadeMesh(this.mCollapsedClusterHull.children[1],0,200)
        if (!this.mClusterClusteringApplied) {


            this.applyClustering(this.getEntries(), true); //initialise sub-clusters if necessary
        }

        this.mExpandedGroup.visible = true;


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

            let vis = (1 - mLOD) /2 ;


            //TODO the cluster edges should partially be dependant on the size of the hull..

            let opa=vis
    if (opa>0.2) opa = 0.2;

            this.mChildClustersEdgesMesh.material.opacity =opa//*this.mEdgeFadeInVal ;
            this.mChildClustersEdgesMesh.material.visible = vis > 0.02 && vis < 0.9;

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
            //isCollapsable:false, //TODO the behaviour to toggle collapse state should be handled by the specific handler of the visualisation not by the cluster itself
            expanded: true  //determines if a cluster is initially expanded or not

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

    applyClustering(mClusteringSpeccsArray, overrideExpand = false) {

        if (mClusteringSpeccsArray.length >= 0) {
            this.setEntries(mClusteringSpeccsArray);
        }
        else throw new Error("must be array of length > 0");


        //delay clustering if options expanded == false
        if (!overrideExpand)
            if (this.getClusterOptions().expanded == false) {
                this.getSphereHull(); //create the placeholder for the cluster instead

                return;
            }

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
        BaseCluster3D.cleanUpClusters(prevClusters, this);


        this.mClusterClusteringApplied = true;

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
            }, 50, {trailing: true, leading: false}))  //if leading is true it won't build up the hulls in a progressive manner
        });


        this.setDistributionHandler(entry.distribution, function () {
            that.mClusterRule = entry;

            that.trigger("cluster-ready")
        })

    }


    removeEdges() {

        if (this.mChildClustersEdges) this.mChildClustersEdges = null; //delete edge references
        if (this.mChildClustersEdgesMesh) {
            this.mChildClustersEdgesMesh.geometry.dispose();

            this.remove(this.mChildClustersEdgesMesh);
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
        if (!this.mChildClustersEdgesMesh) throw new Error("BaseCluster::addChildClusterEdgeMesh must be called first");

        let edges = this.createEdgesForChildClusters();


        var line_geom = new THREE.Geometry();


        this.mChildClustersEdgesMesh.geometry.dispose();
        this.mChildClustersEdgesMesh.geometry = line_geom;


        for (let edge of edges) {
            //TODO we should unify the edges to not always have 2 separate ways to access certain elements
            //TODO also we should use the center of the hull feature instead
            //FIXME for cluster: add edges only if mHull exists

            let src, dst;


            if (edge.source._el && edge.target._el) {
                src = edge.source._el.mHull.mBoundingBox.getCenter();
                dst = edge.target._el.mHull.mBoundingBox.getCenter();
            }
            else if (edge.source.mHull && edge.target.mHull) {
                src = edge.source.mHull.mBoundingBox.getCenter();
                dst = edge.target.mHull.mBoundingBox.getCenter();
            }
            else {

                continue;
                //  throw new Error("hull should exist before calling this function...")

            }


            let src0 = edge.source.position || edge.source._el.position;
            let dst0 = edge.target.position || edge.target._el.position;
            src.add(src0);
            dst.add(dst0);

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


        MaterialFadeMixin(lineMaterial);


        this.mChildClustersEdgesMesh = new THREE.Line(line_geom, lineMaterial, THREE.LineSegments);
        this.mChildClustersEdgesMesh.geometry.boundingBox = new THREE.Box3;
        this.mChildClustersEdgesMesh.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3, 1);


        this.mExpandedGroup.add(this.mChildClustersEdgesMesh);

        for (let edge of edges) {
            //TODO we should unify the edges to not always have 2 separate ways to access certain elements
            //TODO also we should use the center of the hull feature instead
            //FIXME for cluster: add edges only if mHull exists

            let src, dst;

            src = edge.source.position || edge.source._el.position;
            dst = edge.target.position || edge.target._el.position;

            line_geom.vertices.push(src);
            line_geom.vertices.push(dst);

        }


        lineMaterial.fade=0;
        lineMaterial.fadeTo(1,4000)


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
            if (BaseVolume == mOptions.hull || BaseVolume.isPrototypeOf(mOptions.hull)) {

                this.mHull = new mOptions.hull();
                this.mExpandedGroup.add(this.mHull);
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
        let leaf = new ClusterLeafElement(this.mNodes);
        this.mLeaf = leaf;
        this.mExpandedGroup.add(leaf);
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
            if (!(r instanceof BaseCluster3D)) return parents;
            _root = r;

            parents.unshift(_root)

        }

        return parents;

    }


}