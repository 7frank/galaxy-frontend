/**
 * Created by Frank on 30.05.2017.
 */


import EdgesContainer from "./EdgesContainer"
import EdgeUtil from "./EdgeUtil"
import NodesParticleSystem from "./particles/NodesParticleSystem"
import DomEventsAlt from "./utils/DomEventsAlt"
import type BaseDistribution from "./distributions/BaseDistribution"
import type BaseCluster3D from "./BaseCluster3D"
import type { CrossClusterEdgeOptions } from "./BaseCluster3D"
import type View3D from "../view/View3D"
import ParticleNodeGroup, { GraphNode, BubbleNode, ParticleNodeGroupInstance, ParticleNodeGroupOptions } from "./particles/ParticleNodeGroup"


import { computeCompanyNodeColor } from "./utils/ColorUtils"
import {TWEEN} from "../lib/Tween"
import type { Raycaster, Intersection } from "three/src/core/Raycaster.js";
import { Object3D } from "three/src/core/Object3D.js";
import { Matrix4 } from "three/src/math/Matrix4.js";
import { Material } from "three/src/materials/Material.js";
import { Ray } from "three/src/math/Ray.js";
import { Sphere } from "three/src/math/Sphere.js";
import { Vector3 } from "three/src/math/Vector3.js";
import { Mesh } from "three/src/objects/Mesh.js";
import * as _ from "lodash";


export default class ClusterLeafElement extends Mesh {

    mDomEvents: InstanceType<typeof DomEventsAlt> | null
    mOptions: ParticleNodeGroupOptions & { crossClusterEdges?: CrossClusterEdgeOptions }
    mNodes: GraphNode[]
    bNodesVisible: boolean
    bEdgesVisible: boolean
    mNodeParticles: ParticleNodeGroupInstance
    mEdgesContainer: EdgesContainer | null
    mCrossClusterEdgesContainer: EdgesContainer | null
    mCrossClusterEdgesTargetOpacity: number
    _crossEdgeFadeGen: number
    mNodeMeshes: Object3D | undefined
    mParticles: ReturnType<typeof NodesParticleSystem> | null

    constructor(nodes: GraphNode[], domEvents: InstanceType<typeof DomEventsAlt> | null, options: ParticleNodeGroupOptions & { crossClusterEdges?: CrossClusterEdgeOptions } = {}) {
        super();

        this.mDomEvents = domEvents
        this.mOptions = options

        this.mNodes = nodes;

        this.bNodesVisible = true;
        this.bEdgesVisible = true;
        this.mCrossClusterEdgesContainer = null;
        this.mCrossClusterEdgesTargetOpacity = 0;
        this._crossEdgeFadeGen = 0;
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

            return function raycast(this: { visible: boolean; geometry: { isBufferGeometry: boolean; boundingSphere: Sphere | null; computeBoundingSphere: () => void; index: { array: ArrayLike<number> } | null; attributes: { position: { array: ArrayLike<number> }; size?: { array: ArrayLike<number> } } }; matrixWorld: Matrix4; scale: Vector3 }, raycaster: Raycaster, intersects: Intersection[]) {

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

                        let n = (pcWrapper.nodes as (GraphNode & { get3DRoot?: () => unknown })[]) [index]
                        if (!n || !n.get3DRoot) {
                            console.warn("ClusterLeaf Node Element not initialised properly")
                            return
                        }

                        function getDepthForDomEventsAlt(el: { parent?: unknown }) {
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
                        } as unknown as Intersection);
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

                    const vertices = (geometry as unknown as { vertices: Vector3[] }).vertices;
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

    showCrossClusterEdges(): void {
        const c = this.mCrossClusterEdgesContainer;
        if (!c) return;
        const gen = ++this._crossEdgeFadeGen;
        c.updateEdges();
        c.visible = true;
        const mat = c.mEdges.material as import("three/src/materials/LineBasicMaterial.js").LineBasicMaterial;
        const target = this.mCrossClusterEdgesTargetOpacity;
        const startOpacity = mat.opacity;
        const start = performance.now();
        const tick = () => {
            if (this._crossEdgeFadeGen !== gen) return;
            const fadeDuration = this.mOptions.crossClusterEdges?.fadeDuration ?? 200;
            const t = Math.min(1, (performance.now() - start) / fadeDuration);
            mat.opacity = startOpacity + (target - startOpacity) * t;
            if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }

    hideCrossClusterEdges(): void {
        const c = this.mCrossClusterEdgesContainer;
        if (!c || !c.visible) return;
        const gen = ++this._crossEdgeFadeGen;
        const mat = c.mEdges.material as import("three/src/materials/LineBasicMaterial.js").LineBasicMaterial;
        const from = mat.opacity;
        const start = performance.now();
        const fadeDuration = this.mOptions.crossClusterEdges?.fadeDuration ?? 200;
        const tick = () => {
            if (this._crossEdgeFadeGen !== gen) return;
            const t = Math.min(1, (performance.now() - start) / fadeDuration);
            mat.opacity = from * (1 - t);
            if (t < 1) requestAnimationFrame(tick);
            else c.visible = false;
        };
        requestAnimationFrame(tick);
    }

    getView(): View3D | null {
        return this.getParentCluster()?.getView() ?? null
    }

    getRoot(): BaseCluster3D | null {
        return this.getParentCluster()?.getRoot() ?? null
    }

    getParentCluster(): BaseCluster3D | null {
        let expContainer = this.parent;
        if (expContainer) return expContainer.parent as unknown as BaseCluster3D
    }

    setLOD(levelOfDetail: number): void {
        if (this.getParentCluster() && (this.getParentCluster() as BaseCluster3D & { mAnimating?: boolean }).mAnimating) return;

        if (this.mNodeParticles)
            if (this.getParentCluster().useLOD)
                this.mNodeParticles.pointCloud.visible = this.bNodesVisible ? levelOfDetail > 0.3 : false;
            else
                this.mNodeParticles.pointCloud.visible = levelOfDetail > 0.75;

        if (this.mEdgesContainer) {
            this.mEdgesContainer.visible = this.bEdgesVisible ? levelOfDetail > 0.75 : false;
            ;(this.mEdgesContainer.mEdges.material as Material & { opacity: number }).opacity = 0.04
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

        if (this.mEdgesContainer && (this.mEdgesContainer as unknown as { geometry?: { dispose: () => void } }).geometry) {
            this.remove(this.mEdgesContainer);
            (this.mEdgesContainer as unknown as { geometry: { dispose: () => void } }).geometry.dispose();
            this.mEdgesContainer = null;
        }

        if (this.mCrossClusterEdgesContainer) {
            if (this.mCrossClusterEdgesContainer.parent)
                this.mCrossClusterEdgesContainer.parent.remove(this.mCrossClusterEdgesContainer);
            this.mCrossClusterEdgesContainer.mEdges.geometry.dispose();
            this.mCrossClusterEdgesContainer = null;
        }

        if (this.mNodeMeshes && (this.mNodeMeshes as Mesh).geometry) {
            (this.mNodeMeshes as Mesh).geometry.dispose();
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
        _.each(nodes, function (node: GraphNode & { _parent?: Object3D }) {
            node._parent = that
        })
    }


    createEdgesFromNodes(nodes: GraphNode[]): void {
        this.mEdgesContainer = new EdgesContainer();
        this.mEdgesContainer.setRenderMode(true, false, false).setSkipParams(30, 40).setFromNodes(nodes);
        this.add(this.mEdgesContainer)
    }

    createCrossClusterEdgesFromNodes(nodes: GraphNode[]): void {
        if (this.mCrossClusterEdgesContainer) {
            if (this.mCrossClusterEdgesContainer.parent)
                this.mCrossClusterEdgesContainer.parent.remove(this.mCrossClusterEdgesContainer);
            this.mCrossClusterEdgesContainer.mEdges.geometry.dispose();
            this.mCrossClusterEdgesContainer = null;
        }
        const opts = this.mOptions.crossClusterEdges ?? {};
        const targetMax = opts.maxEdges ?? 30;
        const totalEdges = EdgeUtil.getEdgesForNodes(nodes as Parameters<typeof EdgeUtil.getEdgesForNodes>[0], false, true, true).length;
        const skipEdges = Math.max(1, Math.ceil(totalEdges / targetMax));
        const drawnCount = Math.max(1, Math.ceil(totalEdges / skipEdges));
        const defaultOpacity = Math.max(0.3, Math.min(0.9, 0.9 * (targetMax / drawnCount)));
        const opacity = opts.opacity ?? defaultOpacity;
        const container = new EdgesContainer();
        container.setOwner(this).setRenderMode(false, true, true).setSkipParams(skipEdges, targetMax).setFromNodes(nodes);
        container.visible = false;
        const mat = container.mEdges.material as import("three/src/materials/LineBasicMaterial.js").LineBasicMaterial;
        if (typeof opts.color === 'number') {
            mat.color.set(opts.color);
        } else {
            mat.color.set(0x88BBDD);
        }
        if (typeof opts.color === 'function') {
            container.setColorCallback(opts.color);
        }
        mat.opacity = opacity;
        mat.depthTest = false;
        this.mCrossClusterEdgesTargetOpacity = opacity;
        this.mCrossClusterEdgesContainer = container;
        this.add(container);
        if ((opts.mode ?? 'hover') === 'always') {
            container.visible = true;
        }
    }


    setDistributionHandler(distribution: BaseDistribution, onComplete: () => void = () => {}, onStep: () => void = () => {}): void {

        var that = this;
        distribution.setNodes(this.mNodes, function (_vec: unknown, i: number) {

            let n = that.mNodes[i];
            if ((n as BubbleNode)._bubble)
                (n as BubbleNode)._bubble!.position.set(n.x, n.y, n.z);

            if (that.mNodeParticles)
                that.mNodeParticles.updateNodePosition(i);

        }, function _onStep() {
            onStep()
        }, function () {
            that.createCrossClusterEdgesFromNodes(that.mNodes);
            that.updateEdges();
            setTimeout(() => that._initDotParticles(), 50);
            onComplete()
        });
    }

    updateEdges(): void {
        if (this.mEdgesContainer)
            this.mEdgesContainer.updateEdges();
        if (this.mCrossClusterEdgesContainer)
            this.mCrossClusterEdgesContainer.updateEdges();
    }

    updateDots(time: number): void {
        if (this.mParticles)
            this.mParticles.update(time);
    }

    getDOMEvents(): InstanceType<typeof DomEventsAlt> | null {
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
            var demoOptions: Record<string, unknown> = {
                duration: 1000,
                easing: TWEEN.Easing.Exponential.Out,
                position: {
                    x: (_.random(0, 2) - 1) * _.random(50000, 150000),
                    y: (_.random(0, 2) - 1) * _.random(50000, 150000),
                    z: 0
                }
            };

            if (!nodes)
                demoOptions.npc = function (n: GraphNode & { itemCount?: number }) {
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
        this.mNodes.forEach((node: any, i: number) => {
            if (typeof node.sent === 'number') {
                node.color = computeCompanyNodeColor(node.sent, 'sent');
            }
            this.mNodeParticles?.updateNodeColor?.(i);
        });
        this.mParticles?.updateColors?.();
    }
}
