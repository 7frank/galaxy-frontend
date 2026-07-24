/**
 * Created by Frank on 30.05.2017.
 */


import EdgesContainer from "./EdgesContainer"
import NodesParticleSystem from "./particles/NodesParticleSystem"
import ParticleNodeGroup, { GraphNode, ParticleNodeGroupInstance, ParticleNodeGroupOptions } from "./particles/ParticleNodeGroup"


import {TWEEN} from "../lib/Tween"
import { Object3D } from "three/src/core/Object3D.js";
import { Matrix4 } from "three/src/math/Matrix4.js";
import { Ray } from "three/src/math/Ray.js";
import { Sphere } from "three/src/math/Sphere.js";
import { Vector3 } from "three/src/math/Vector3.js";
import { Mesh } from "three/src/objects/Mesh.js";
import * as _ from "lodash";


export default class ClusterLeafElement extends Mesh {

    mDomEvents: any
    mOptions: ParticleNodeGroupOptions
    mNodes: GraphNode[]
    bNodesVisible: boolean
    bEdgesVisible: boolean
    mNodeParticles: ParticleNodeGroupInstance
    mEdgesContainer: any
    mNodeMeshes: Object3D | undefined
    mParticles: any

    constructor(nodes: GraphNode[], domEvents: any, options: ParticleNodeGroupOptions = {}) {
        super();

        this.mDomEvents = domEvents
        this.mOptions = options

        this.mNodes = nodes;

        this.bNodesVisible = true;
        this.bEdgesVisible = true;
        this.mNodeParticles = this.createParticleNodeCloud();

        this.addNodeCloudInteractions(this.mNodeParticles)

        this.add(this.mNodeParticles.pointCloud);

        this.createEdgesFromNodes(nodes);

        this.appendNodes(nodes);
    }

    addNodeCloudInteractions(pcWrapper: ParticleNodeGroupInstance): void {
        pcWrapper.pointCloud.raycast = ( function () {

            var inverseMatrix = new Matrix4();
            var ray = new Ray();
            var sphere = new Sphere();

            return function raycast(this: any, raycaster: any, intersects: any[]) {

                if (this.visible == false)
                    return

                var geometry = this.geometry;
                var matrixWorld = this.matrixWorld;
                var threshold = raycaster.params.Points.threshold;

                if (geometry.boundingSphere === null) geometry.computeBoundingSphere();

                sphere.copy(geometry.boundingSphere);
                sphere.applyMatrix4(matrixWorld);
                sphere.radius += threshold;

                if (raycaster.ray.intersectsSphere(sphere) === false) return;

                inverseMatrix.copy(matrixWorld).invert();
                ray.copy(raycaster.ray).applyMatrix4(inverseMatrix);

                var that = this;

                function thresholdFromSize(size: number) {
                    var mLocalThreshold = size / ( ( that.scale.x + that.scale.y + that.scale.z ) / 3 );
                    var mThresholdSq = mLocalThreshold * mLocalThreshold;
                    return mThresholdSq
                }

                var position = new Vector3();

                function testPoint(point: Vector3, index: number, size: number = 1) {

                    var rayPointDistanceSq = ray.distanceSqToPoint(point);

                    if (rayPointDistanceSq < thresholdFromSize(size)) {

                        var intersectPoint = ray.closestPointToPoint(point, new Vector3());
                        intersectPoint.applyMatrix4(matrixWorld);

                        var distance = raycaster.ray.origin.distanceTo(intersectPoint);

                        if (distance < raycaster.near || distance > raycaster.far) return;

                        let n = (pcWrapper.nodes as any)[index]
                        if (!n || !n.get3DRoot) {
                            console.warn("ClusterLeaf Node Element not initialised properly")
                            return
                        }

                        function getDepthForDomEventsAlt(el: any) {
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
                        const indices = index.array;
                        for (let i = 0, il = indices.length; i < il; i++) {
                            const a = indices[i];
                            position.fromArray(positions as Float32Array, a * 3);
                            testPoint(position, a, (sizes as Float32Array)[a]);
                        }
                    } else {
                        for (let i = 0, l = positions.length / 3; i < l; i++) {
                            position.fromArray(positions as Float32Array, i * 3);
                            testPoint(position, i, (sizes as Float32Array)[i]);
                        }
                    }

                } else {

                    const vertices = (geometry as any).vertices;
                    for (let i = 0, l = vertices.length; i < l; i++) {
                        testPoint(vertices[i], i, threshold);
                    }
                }
            };

        }() )
    }


    setParticlesVisible(bVisible: boolean): void {
        this.mParticles.pointCloud.visible = bVisible
    }

    setNodesVisible(bVisible: boolean): void {
        this.bNodesVisible = bVisible;
        this.mNodeParticles.pointCloud.visible = bVisible
    }

    setEdgesVisible(bVisible: boolean): void {
        this.bEdgesVisible = bVisible;
        this.mEdgesContainer.visible = bVisible;
    }

    getView(): any {
        return this.getParentCluster().getView()
    }

    getRoot(): any {
        return this.getParentCluster().getRoot()
    }

    getParentCluster(): any {
        let expContainer = this.parent;
        if (expContainer) return expContainer.parent
    }

    setLOD(levelOfDetail: number): void {
        if (this.getParentCluster() && this.getParentCluster().mAnimating) return;

        if (this.mNodeParticles)
            if (this.getParentCluster().useLOD)
                this.mNodeParticles.pointCloud.visible = this.bNodesVisible ? levelOfDetail > 0.3 : false;
            else
                this.mNodeParticles.pointCloud.visible = levelOfDetail > 0.75;

        if (this.mEdgesContainer) {
            this.mEdgesContainer.visible = this.bEdgesVisible ? levelOfDetail > 0.75 : false;
            this.mEdgesContainer.mEdges.material.opacity = 0.04
        }

        if (this.mNodeMeshes)
            this.mNodeMeshes.visible = levelOfDetail > 0.2;

        if (this.mParticles) {
            let scale = Math.cbrt(levelOfDetail)
            if (scale < 0.1) scale = 0.1
            if (scale > 0.8) scale = 1
            let max = Math.floor(scale * this.mParticles.particleCount)
            this.mParticles.pointCloud.geometry.setDrawRange(0, max)
        }
    }


    cleanUp(): void {

        if (this.mNodeParticles) {
            this.mNodeParticles.remove();
            this.mNodeParticles.pointCloud.geometry.dispose();
            this.mNodeParticles = null!;
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

        if (this.mNodeMeshes && (this.mNodeMeshes as any).geometry) {
            (this.mNodeMeshes as any).geometry.dispose();
            this.mNodeMeshes = undefined;
        }

        if (this.geometry)
            this.geometry.dispose();
        if (this.parent)
            this.parent.remove(this)
    }


    appendNodes(nodes: GraphNode[]): void {

        if (!this.mNodeMeshes) {
            this.mNodeMeshes = new Object3D;
            this.add(this.mNodeMeshes)
        }

        var that = this.mNodeMeshes;
        _.each(nodes, function (node: any) {
            node._parent = that
        })
    }


    createEdgesFromNodes(nodes: GraphNode[]): void {
        this.mEdgesContainer = new EdgesContainer();
        this.mEdgesContainer.setRenderMode(true, false, false).setSkipParams(30, 40).setFromNodes(nodes);
        this.add(this.mEdgesContainer)
    }


    setDistributionHandler(distribution: any, onComplete: () => void = () => {}, onStep: () => void = () => {}): void {

        var that = this;
        distribution.setNodes(this.mNodes, function (vec: any, i: number) {

            let n = that.mNodes[i];
            if ((n as any)._bubble) (n as any)._bubble.position.set(n.x, n.y, n.z);

            if (that.mNodeParticles)
                that.mNodeParticles.updateNodePosition(i);

        }, function _onStep() {
            onStep()
        }, function () {
            that.updateEdges();
            setTimeout(() => that._initDotParticles(), 50);
            onComplete()
        });
    }

    updateEdges(): void {
        if (this.mEdgesContainer)
            this.mEdgesContainer.updateEdges();
    }

    updateDots(time: number): void {
        if (this.mParticles)
            this.mParticles.update(time);
    }

    getDOMEvents(): any {
        return this.mDomEvents
    }

    /**
     * creates a structure that contains a point cloud for the nodes for more efficient rendering
     */
    createParticleNodeCloud(): ParticleNodeGroupInstance {

        let domEvents = this.getDOMEvents()

        var elem = ParticleNodeGroup(this.mNodes, Object.assign({
            nodeDefaultSize: 10,
            nodeDefaultScale: 10,
            nodeTexture: "img/dot7.png"
        }, this.mOptions), domEvents);

        return elem
    }


    _initDotParticles(): void {

        if (this.mParticles)
            this.mParticles.start();

        if (!this.mParticles) {

            var nodes = this.mNodes;
            var demoOptions: any = {
                duration: 1000,
                easing: TWEEN.Easing.Exponential.Out,
                position: {
                    x: (_.random(0, 2) - 1) * _.random(50000, 150000),
                    y: (_.random(0, 2) - 1) * _.random(50000, 150000),
                    z: 0
                }
            };

            if (!nodes)
                demoOptions.npc = function (n: any) {
                    return n.itemCount || 5
                };

            var particles = NodesParticleSystem(nodes, demoOptions);
            this.add(particles.pointCloud);

            setTimeout(function () {
                particles.start();
            }, 500);

            this.mParticles = particles;
        }
    }


    updateDotParticlesColor(): void {
        if (this.mParticles) {
            this.mParticles.updateColors();
        }
    }
}
