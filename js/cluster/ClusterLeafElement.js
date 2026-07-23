/**
 * Created by Frank on 30.05.2017.
 */


import EdgesContainer from "./EdgesContainer"
import NodesParticleSystem from "./particles/NodesParticleSystem"
import ParticleNodeGroup from "./particles/ParticleNodeGroup"


import {TWEEN} from "../lib/Tween"
import { Object3D } from "three/src/core/Object3D.js";
import { Matrix4 } from "three/src/math/Matrix4.js";
import { Ray } from "three/src/math/Ray.js";
import { Sphere } from "three/src/math/Sphere.js";
import { Vector3 } from "three/src/math/Vector3.js";
import { Mesh } from "three/src/objects/Mesh.js";
import * as _ from "lodash";


export default class ClusterLeafElement extends Mesh {
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


            var inverseMatrix = new Matrix4();
            var ray = new Ray();
            var sphere = new Sphere();

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

                inverseMatrix.copy(matrixWorld).invert();
                ray.copy(raycaster.ray).applyMatrix4(inverseMatrix);


                //param size is threshold in original implementation
                var that = this;

                function thresholdFromSize(size) {
                    var mLocalThreshold = size / ( ( that.scale.x + that.scale.y + that.scale.z ) / 3 );
                    var mThresholdSq = mLocalThreshold * mLocalThreshold;
                    return mThresholdSq
                }


                var position = new Vector3();

                function testPoint(point, index, size = 1) {

                    var rayPointDistanceSq = ray.distanceSqToPoint(point);

                    if (rayPointDistanceSq < thresholdFromSize(size)) {

                        var intersectPoint = ray.closestPointToPoint(point, new Vector3());
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
        if (this.getParentCluster() && this.getParentCluster().mAnimating) return;

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
            this.mNodeMeshes = new Object3D;
            this.add(this.mNodeMeshes)

        }

//adding invisible node meshes for domEvents
// TODO use the point cloud itself for events to prevent potential unnecessary bindings?

        var that = this.mNodeMeshes;//this;
        _.each(nodes, function (node) {

            //TODO change the way parent gets set
            node._parent = that  //set a parent element to the placeholder mesh
            // if (node && node._bubble)
            //     that.add(node._bubble)


        })


    }


    createEdgesFromNodes(nodes) {

        this.mEdgesContainer = new EdgesContainer();
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

        var elem = ParticleNodeGroup(this.mNodes, {
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
                //increment: 1, //deprecated
                duration: 1000,
                easing: TWEEN.Easing.Exponential.Out,
                position: {
                    x: (_.random(0, 2) - 1) * _.random(50000, 150000),
                    y: (_.random(0, 2) - 1) * _.random(50000, 150000),
                    z: 0
                }
            };

            if (!nodes) //FIXME this only works that way because to realData is not generated properly
                demoOptions.npc = function (n) {

                    return n.itemCount || 5
                    //return 5
                };


            //TODO refactor force-graph-utils

            var particles = NodesParticleSystem(nodes, demoOptions);
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

