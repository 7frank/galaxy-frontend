/**
 * Created by Frank on 30.05.2017.
 */


import ClusterLeafElement from "./ClusterLeafElement"
import BaseNode from "./BaseNode"
import EdgeUtil, { type ClusterEdge } from "./EdgeUtil"
import BaseVolume from "./hull/BaseVolume"
import BaseHullEffect from "./hull/effects/BaseHullEffect"

import MaterialFadeMixin from "../utils/MaterialFadeMixin"

import Color from 'easy-color';

import ClusterBaseEdges from "./edges/ClusterBaseEdges";
import type BaseDistribution from "./distributions/BaseDistribution";
import type DomEventsAlt from "./utils/DomEventsAlt";
import type { FadeMaterial } from "../utils/FadeMaterial";
import type { StencilRenderer } from "../utils/StencilRenderer";
import type { BubbleNode } from "./particles/ParticleNodeGroup";
import { Quaternion } from "three/src/math/Quaternion.js";

import { NoBlending } from "three/src/constants.js";
import { BoxGeometry } from "three/src/geometries/BoxGeometry.js";
import { CircleGeometry } from "three/src/geometries/CircleGeometry.js";
import { RingGeometry } from "three/src/geometries/RingGeometry.js";
import { SphereGeometry } from "three/src/geometries/SphereGeometry.js";
import { Camera } from "three/src/cameras/Camera.js";
import { Material } from "three/src/materials/Material.js";
import { MeshBasicMaterial } from "three/src/materials/MeshBasicMaterial.js";
import { Box3 } from "three/src/math/Box3.js";
import { Color as ThreeColor } from "three/src/math/Color.js";
import { Sphere } from "three/src/math/Sphere.js";
import { Vector3 } from "three/src/math/Vector3.js";
import { Group } from "three/src/objects/Group.js";
import { BufferGeometry } from "three/src/core/BufferGeometry.js";
import { Mesh } from "three/src/objects/Mesh.js";
import { WebGLRenderer } from "three/src/renderers/WebGLRenderer.js";
import { Scene } from "three/src/scenes/Scene.js";
import * as _ from "lodash";
import type View3D from "../view/View3D";
import type { GraphNode } from "./particles/ParticleNodeGroup";

export interface ClusterSpec {
    generator?: (groupFn: (key: string, node: GraphNode) => void, node: GraphNode) => void
    distribution?: BaseDistribution
    events?: Record<string, Function>
    options?: ClusterOptions
}

export interface ClusterOptions {
    hull?: typeof BaseVolume
    makeHullEffect?: () => BaseHullEffect
    hullEffect?: BaseHullEffect
    onHullCreated?: (hull: InstanceType<typeof BaseVolume>) => void
    minClusterSize?: number
    defaultMergeGroupName?: string
    expanded?: boolean | (() => boolean)
    text?: () => string
    colors?: Record<string, [number, number]>
    edges?: typeof ClusterBaseEdges
    zoomDirection?: [number, number, number]
    [key: string]: unknown
}

export default class BaseCluster3D extends BaseNode {

    declare animate: (props: Record<string, unknown>, duration?: number, onComplete?: Function, onStep?: Function) => void

    mNodes: GraphNode[]
    mClusters: Record<string, BaseCluster3D>
    mLeaf: ClusterLeafElement | undefined
    mHull: InstanceType<typeof BaseVolume> | null
    mCollapsedGroup: Group
    mExpandedGroup: Group
    mCollapsedClusterHull: Group & { animate?: Function } | null
    mChildClustersEdgesMesh: InstanceType<typeof ClusterBaseEdges> | null
    mChildClustersEdges: ClusterEdge[] | null
    mExpanded: boolean
    mClusterClusteringApplied: boolean
    mEntry: ClusterSpec
    mEntrys: ClusterSpec[]
    mEventsBound: boolean
    mClusterRule: ClusterSpec | undefined
    mLastCamDistance: number | undefined
    _hullEffect: BaseHullEffect | null
    _hullMode: string | undefined
    _LeafsCached: ClusterLeafElement[] | undefined
    useLOD: boolean
    bClusterEdgesVisible: boolean
    useClusterText: boolean

    constructor(nodes: GraphNode[] | undefined, clusteringHandlers: ClusterSpec[] | undefined, view: View3D) {
        super(view);

        this.addNodes(nodes);

        this.useLOD = false;
        this.bClusterEdgesVisible = true;
        this.mClusterClusteringApplied = false;
        this.mCollapsedGroup = new Group();
        this.mExpandedGroup = new Group();

        this.mCollapsedGroup.name = "CollapsedGroup"
        this.mExpandedGroup.name = "ExpandedGroup"

        this.add(this.mCollapsedGroup);
        this.add(this.mExpandedGroup);

        this.registerCustomEvent("hull-updated");
        this.registerCustomEvent("initial-expand");
        this.registerCustomEvent("cluster-ready");

        this.mClusters = {};

        if (_.isArray(clusteringHandlers) && clusteringHandlers.length > 0) {
            this.applyClustering(clusteringHandlers);
        }

        this.on("before-render", function (this: BaseCluster3D) {

            let view = this.getView();
            let src = view.mCamera.position;

            let dst: Vector3;
            if (this.mHull && this.mHull.mesh && this.mHull.mesh.geometry && this.mHull.mesh.geometry.boundingBox)
                dst = this.mHull.mesh.geometry.boundingBox.getCenter(new Vector3());
            else
                dst = this.position;

            dst = this.localToWorld(dst.clone());

            let distance = dst.sub(src).length();

            if (this.mLastCamDistance == distance) return
            this.mLastCamDistance = distance

            let maxDistance = this.getRadius(this.mNodes.length) * 25;
            let minDistance = 0;

            var lod = Math.max(0, Math.min(1, 1 - (distance - minDistance) / (maxDistance - minDistance)));

            this.setLOD(lod)
        })
    }

    static cleanUpClusters(clusters: BaseCluster3D[], self: BaseCluster3D): void {
        clusters.push(self);

        _.each(clusters, function (cluster) {

            if (!cluster) return

            cluster.mClusterClusteringApplied = false;

            cluster.mCollapsedGroup.remove(cluster.mCollapsedClusterHull);
            cluster.mCollapsedClusterHull = null

            const clusterExt = cluster as BaseCluster3D & { tn?: { remove: () => void } };
            if (clusterExt.tn) {
                clusterExt.tn.remove();
                delete clusterExt.tn
            }

            if (cluster.mHull) {
                if (cluster._hullEffect && cluster.mHull.mesh)
                    cluster._hullEffect.onDetach(cluster.mHull.mesh as Mesh);
                cluster.mHull.dispose();
                delete (cluster as { mHull?: InstanceType<typeof BaseVolume> | null }).mHull;
                cluster.mHull = null;
            }

            cluster.removeEdges();

            if (cluster == self) return;

            if (cluster.parent) {
                if ((cluster.parent as BaseCluster3D).mClusters && cluster.name)
                    delete((cluster.parent as BaseCluster3D).mClusters[cluster.name]);
                cluster.parent.remove(cluster)
            }

            delete cluster._LeafsCached;
        })
    }

    setLeafsVisible(bVisible: boolean): void {
        this.getLeafs().forEach(l => l.visible = bVisible)
    }

    setParticlesVisible(bVisible: boolean): void {
        this.getLeafs().forEach(l => l.setParticlesVisible(bVisible))
    }

    setNodesVisible(bVisible: boolean): void {
        this.getLeafs().forEach(l => l.setNodesVisible(bVisible))
    }

    showCrossClusterEdges(): void {
        if (this.mLeaf) { this.mLeaf.showCrossClusterEdges(); return; }
        this.getLeafs().forEach(l => l.showCrossClusterEdges())
    }

    hideCrossClusterEdges(): void {
        if (this.mLeaf) { this.mLeaf.hideCrossClusterEdges(); return; }
        this.getLeafs().forEach(l => l.hideCrossClusterEdges())
    }

    setEdgesVisible(bVisible: boolean): void {
        this.findClusters("*").forEach(function (c) {
            c.bClusterEdgesVisible = bVisible;
            if (c.mChildClustersEdgesMesh) {
                (c.mChildClustersEdgesMesh.material as Material).visible = bVisible;
                (c.mChildClustersEdgesMesh.material as Material).needsUpdate = true;
            }
        })

        this.getLeafs().forEach(l => l.setEdgesVisible(bVisible))
    }

    getSphereHull(boundingBox?: Box3 | null): Group {
        let boundingSphere: Sphere | undefined;

        if (this.mCollapsedClusterHull != null) {

            if (this.mHull) {
                let boundingBox = this.mHull.mBoundingBox;
                boundingSphere = boundingBox.getBoundingSphere(new Sphere());
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

        let materialInnerRing = new MeshBasicMaterial({
            color: 0x00FFFF,
            wireframe: false,
            transparent: true,
            opacity: 1.0,
            visible: true,
            polygonOffset: true,
            polygonOffsetFactor: -4,
            depthTest: false,
            blending: NoBlending
        });

        materialInnerRing.color = new ThreeColor(color.rgb.r / 255, color.rgb.g / 255, color.rgb.b / 255)

        let materialOtherBlue = new MeshBasicMaterial({
            color: 0x555555,
            wireframe: false,
            transparent: true,
            visible: true,
            polygonOffset: true,
            polygonOffsetFactor: -4,
            depthTest: false
        });

        if (boundingBox)
            boundingSphere = boundingBox.getBoundingSphere(new Sphere());
        else
            boundingSphere = new Sphere(new Vector3(), this.mNodes.length * 7);

        let ringGeometryOuter = new RingGeometry(boundingSphere.radius * 0.85, boundingSphere.radius, 64);
        let ringGeometryInner = new CircleGeometry(boundingSphere.radius * 0.85, 64);

        let inner = new Mesh(ringGeometryInner, materialInnerRing);
        let outer = new Mesh(ringGeometryOuter, materialOtherBlue);

        MaterialFadeMixin(materialInnerRing)
        MaterialFadeMixin(materialOtherBlue)

        const _hull = new Group() as Group & { animate?: Function };

        _hull.name = "CollapsedHull"

        _hull.add(outer);
        _hull.add(inner);

        _hull.animate = function (_fade: number, _duration: number, _onComplete: () => void) {
            (materialOtherBlue as FadeMaterial<MeshBasicMaterial> & { animate?: Function }).animate?.(...arguments)
        }

        function beforeRender(this: Mesh, _renderer: WebGLRenderer, _scene: Scene, camera: { quaternion: Quaternion }) {
            this.setRotationFromQuaternion(camera.quaternion)
        }

        this.addHullStencilBeforeRender(outer, beforeRender)
        this.addHullStencilBeforeRender(inner, beforeRender)

        _hull.position.copy(boundingSphere.center);

        if (!this.geometry) {
            this.geometry = new SphereGeometry(boundingSphere.radius, 10, 5);
            this.geometry.translate(boundingSphere.center.x, boundingSphere.center.y, boundingSphere.center.z);
        }
        if (!this.geometry.boundingSphere)
            this.geometry.boundingSphere = boundingSphere;
        if (!this.geometry.boundingBox)
            this.geometry.boundingBox = boundingSphere.getBoundingBox(new Box3());

        this.mCollapsedClusterHull = _hull;
        this.mCollapsedGroup.add(this.mCollapsedClusterHull);

        var origScale: Vector3 | undefined;
        this.on("mouseover", function (this: BaseCluster3D) {
            if (this.mExpanded == false)
                if (this.mCollapsedClusterHull) {
                    origScale = this.mCollapsedClusterHull.scale.clone()
                    this.mCollapsedClusterHull.scale.multiplyScalar(1.05)
                }

            if (this._hullEffect && this.mHull && this.mHull.mesh)
                this._hullEffect.onActive(this.mHull.mesh as Mesh);
        })
        this.on("mouseout", function (this: BaseCluster3D) {
            if (this.mExpanded == false)
                if (this.mCollapsedClusterHull && origScale)
                    this.mCollapsedClusterHull.scale.copy(origScale)

            if (this._hullEffect && this.mHull && this.mHull.mesh)
                this._hullEffect.onInactive(this.mHull.mesh as Mesh);
        })

        this.trigger("hull-updated")

        return _hull
    }

    toggleCollapse(): void {
        this.mExpanded = !this.mExpanded;

        console.log(this.name, "expanded:", this.mExpanded)

        if (this.mExpanded)
            this.expand();
        else
            this.collapse();
    }

    collapse(): void {
        var pos_offset = new Vector3()
        if (this.mHull!.mBoundingBox)
            pos_offset = this.mHull!.mBoundingBox.getCenter(new Vector3())

        this.animate({mCollapsedGroup: {scale: {x: 0.7, y: 0.7, z: 0.7}, position: {x: 0, y: 0, z: 0}}}, 200)
        this.animate({mExpandedGroup: {scale: {x: 0.001, y: 0.001, z: 0.001}, position: pos_offset}}, 200, function (this: BaseCluster3D) {
            this.mExpandedGroup.visible = false
        }, function onAnimate(this: BaseCluster3D) {
            this.trigger("hull-updated")
        })

        this.getSphereHull(this.mHull ? this.mHull.mBoundingBox : null)

        this.mCollapsedClusterHull.animate({fade: 1}, 200)

        if (!this.mHull!.mBoundingBox) console.warn("hull should have a bounding box", this.mHull)
        else {
            var offset = this.mHull!.mBoundingBox.getCenter(new Vector3())
            this.mCollapsedClusterHull.position.copy(offset)
        }
    }

    expand(): void {
        if (this.mCollapsedClusterHull)
            this.mCollapsedClusterHull.animate({fade: 0.1}, 200)

        if (!this.mClusterClusteringApplied) {
            this.applyClustering(this.getEntries(), true);
            this.getRoot().getView().dispatchEvent(new CustomEvent("graph-changed"));
            this.trigger("initial-expand");
        }

        var pos_offset = new Vector3()
        if (this.mHull && this.mHull.mBoundingBox)
            pos_offset = this.mHull.mBoundingBox.getCenter(new Vector3())

        this.animate({mCollapsedGroup: {scale: {x: 0.001, y: 0.001, z: 0.001}, position: pos_offset}}, 200)

        this.mExpandedGroup.visible = true
        this.animate({mExpandedGroup: {scale: {x: 1, y: 1, z: 1}, position: {x: 0, y: 0, z: 0}}}, 200, function () {
        }, function onAnimate(this: BaseCluster3D) {
            this.trigger("hull-updated")
        })
    }

    setLOD(mLOD: number): void {
        if (this.mHull)
            this.mHull.setLOD(mLOD);

        if (this.isLeaf()) {
            this.mLeaf!.setLOD(mLOD)
        }

        if (this.mChildClustersEdgesMesh) {
            let vis = (1 - mLOD) / 2;
            let opa = vis
            if (opa > 0.02) opa = 0.02;

            (this.mChildClustersEdgesMesh.material as Material).opacity = opa;
            (this.mChildClustersEdgesMesh.material as Material).visible = this.bClusterEdgesVisible ? vis > 0.02 && vis < 0.9 : false;
        }
    }

    addNodes(nodes: GraphNode[] | undefined): void {
        if (!this.mNodes) this.mNodes = [];

        if (typeof nodes == "undefined") return;

        if (_.isArray(nodes))
            this.mNodes = this.mNodes.concat(nodes);
        else
            this.mNodes.push(nodes as GraphNode)
    }

    getNodes(): GraphNode[] {
        return this.mNodes;
    }

    addAllSubClustersToContainer(): void {
        _.each(this.mClusters, (cluster) => this.mExpandedGroup.add(cluster))
    }

    getChildClusterConstructor(): typeof BaseCluster3D {
        return this.constructor as typeof BaseCluster3D
    }

    cleanUpLeafs(): void {
        _.each(this.getLeafs(), function (leaf) {
            (leaf.parent as unknown as BaseCluster3D).mLeaf = undefined;
            leaf.cleanUp()
        })
    }

    storeParentPositionInNodes(): void {
        var leafElements = this.getLeafs();
        _.each(leafElements, function (leaf) {
            let mNodes = leaf.mNodes;
            _.each(mNodes, function (node: BubbleNode & { _parentPosAbs?: Vector3 }) {
                var c1 = new Vector3();
                c1.setFromMatrixPosition(leaf.matrixWorld);
                node._parentPosAbs = c1;
            })
        })
    }

    restoreNodePositionFromExParent(): void {
        var leafElements = this.getLeafs();
        _.each(leafElements, function (leaf) {
            let mNodes = leaf.mNodes;
            _.each(mNodes, function (node: BubbleNode & { _parentPosAbs?: Vector3 }) {
                let c1 = node._parentPosAbs;
                if (!c1) return;
                var c2 = new Vector3();
                c2.setFromMatrixPosition(leaf.matrixWorld);
                (node._bubble!.position as unknown as Vector3).add(c1).sub(c2);
                _.extend(node, node._bubble!.position)
            })
        })
    }

    setEntry(entry: ClusterSpec): void {
        this.mEntry = entry
    }

    getEntry(): ClusterSpec {
        return this.mEntry
    }

    setEntries(entries: ClusterSpec[]): void {
        this.mEntrys = entries;
        this.setEntry(entries[0])
    }

    getEntries(): ClusterSpec[] {
        return this.mEntrys || []
    }

    getClusterOptions(): ClusterOptions & Required<Omit<ClusterOptions, 'hullEffect'>> {
        let options = _.extend({
            minClusterSize: 10,
            defaultMergeGroupName: "other",
            hull: BaseVolume,
            makeHullEffect: () => new BaseHullEffect(),
            onHullCreated: function () {},
            edges: ClusterBaseEdges,
            expanded: true,
            text: function noop() {},
            colors: {}
        }, this.mEntry.options);

        let parent = this.getParentCluster()
        if (!parent) {
            options.colors = _.extend({
                edge: [0x999999, 1],
                hull: [0xffffff, 0.03]
            }, options.colors);
        } else {
            options.colors = _.extend(parent.getClusterOptions().colors, options.colors);
        }

        return options
    }

    getEvents(): Record<string, Function> {
        let events = _.extend({
            click: function () {}
        }, this.mEntry.events);

        return events
    }

    addOptionEvents(): void {
        var that = this;

        if (this.mEventsBound == true) return

        _.each(this.getEvents(), function (handler: Function, eventName: string) {
            that.on(eventName, function (e: Event & { stopPropagation: () => void }) {
                e.stopPropagation();
                handler.bind(this)()
            });
        })

        this.mEventsBound = true
    }

    applyClustering(mClusteringSpeccsArray: ClusterSpec[], overrideExpand: boolean = false): boolean | undefined {

        if (mClusteringSpeccsArray.length >= 0) {
            this.setEntries(mClusteringSpeccsArray);
        } else throw new Error("must be array of length > 0");

        this.addOptionEvents();

        if (!overrideExpand) {
            let isClusterExpanded = this.getClusterOptions().expanded
            if (typeof isClusterExpanded == "function")
                isClusterExpanded = isClusterExpanded.bind(this)()

            this.mExpanded = isClusterExpanded as boolean

            if (isClusterExpanded == false) {
                this.getSphereHull();
                return;
            }
        }

        if (mClusteringSpeccsArray.length == 1) {
            let prevClusters = this.findClusters("*");
            this.cleanUpLeafs();
            this.createParticlePointCloud(mClusteringSpeccsArray[0]);
            BaseCluster3D.cleanUpClusters(prevClusters, this);
            this.mClusterClusteringApplied = true;
            return false;
        }

        var entry = mClusteringSpeccsArray[0];
        let prevClusters = this.findClusters("*");

        this.doClusteringForOnlyThis(entry);

        _.each(this.mClusters, function (mCluster) {
            var nextDepthSpeccsArray = ([] as ClusterSpec[]).concat(mClusteringSpeccsArray);
            nextDepthSpeccsArray.shift();

            if (nextDepthSpeccsArray.length >= 1)
                mCluster.applyClustering(nextDepthSpeccsArray);
        });

        BaseCluster3D.cleanUpClusters(prevClusters, this);
        this.mClusterClusteringApplied = true;
    }

    doClusteringForOnlyThis(entry: ClusterSpec): void {
        var clazz = this.getChildClusterConstructor();
        var options = this.getClusterOptions();
        var that = this;

        var _clustersObj: Record<string, BaseCluster3D> = {};

        let elements = this.groupBy(entry.generator);
        _.each(elements, function (_cluster: BaseCluster3D, key: string) {

            if (_cluster.getNodes().length < options.minClusterSize) {
                var dMGN = options.defaultMergeGroupName;
                if (typeof _clustersObj[dMGN] == "undefined") _clustersObj[dMGN] = new clazz(undefined, undefined, that.getView());
                _clustersObj[dMGN].name = dMGN;
                _clustersObj[dMGN].addNodes(_cluster.getNodes())
            } else {
                _cluster.name = key;
                _clustersObj[key] = _cluster
            }
        });

        _.extend(this.mClusters, _clustersObj);

        this.addAllSubClustersToContainer()

        _.each(this.mClusters, function (childCluster: BaseCluster3D) {
            childCluster.on("hull-updated", _.throttle(function () {
                that.adjustHullSize();
                let o = that.getClusterOptions()
                that.addChildClusterEdges({color: o.colors.edge[0], opacity: o.colors.edge[1]});
                that.updateChildClusterEdges();
                that.trigger("hull-updated");
            }, 50))
        });

        this.setDistributionHandler(entry.distribution, function () {
            that.mClusterRule = entry;
            that.trigger("cluster-ready")
            that.adjustHullSize();
        }, _.throttle(function () {
            that.adjustHullSize();
        }, 50))
    }

    removeEdges(): void {
        if (this.mChildClustersEdges) this.mChildClustersEdges = null;
        if (this.mChildClustersEdgesMesh) {
            this.mChildClustersEdgesMesh.geometry.dispose();
            this.mChildClustersEdgesMesh.parent.remove(this.mChildClustersEdgesMesh);
            this.mChildClustersEdgesMesh = null;
        }
    }

    updateChildClusterEdges(options?: Record<string, unknown>): void {
        this.mChildClustersEdgesMesh.setClusters(this.mClusters)
        this.mChildClustersEdgesMesh.update()

        if (this.mChildClustersEdgesMesh.children.length > 0)
            this.addEdgeStencilBeforeRender(this.mChildClustersEdgesMesh.children[0] as Mesh)
        else
            this.addEdgeStencilBeforeRender(this.mChildClustersEdgesMesh as unknown as Mesh)
    }

    addChildClusterEdges(options?: Record<string, unknown>): void {
        if (this.mChildClustersEdgesMesh) {
            (this.mChildClustersEdgesMesh.geometry as BufferGeometry & { verticesNeedUpdate?: boolean }).verticesNeedUpdate = true;
            return;
        }

        let edgeClass = this.getClusterOptions().edges

        if (!(ClusterBaseEdges == edgeClass || ClusterBaseEdges.isPrototypeOf(edgeClass))) {
            edgeClass = ClusterBaseEdges;
            console.error("cluster option edges must be instanceof ClusterBaseEdges, using default")
        }

        this.mChildClustersEdgesMesh = new edgeClass(null, options)
        this.mExpandedGroup.add(this.mChildClustersEdgesMesh);
    }

    groupBy(filterFunction: Function): Record<string, BaseCluster3D> {
        var clazz = this.getChildClusterConstructor();
        var that = this;
        let container: Record<string, BaseCluster3D> = {};

        function groupFunction(key: string, val: GraphNode) {
            if (typeof container[key] == "undefined") container[key] = new clazz(undefined, undefined, that.getView());
            container[key].addNodes([val])
        }

        for (let el of this.mNodes)
            filterFunction(groupFunction, el)

        return container
    }

    getVerticesFromBoundingBox(boundingBox: Box3): Vector3[] {
        let _center = boundingBox.getCenter(new Vector3());
        let _size = boundingBox.getSize(new Vector3());

        const box = new BoxGeometry(_size.x, _size.y, _size.z);
        box.translate(_center.x, _center.y, _center.z);

        const pos = box.getAttribute('position');
        const verts: Vector3[] = [];
        for (let i = 0; i < pos.count; i++) {
            verts.push(new Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)));
        }
        return verts;
    }

    getCompoundBoundingBoxInfo(): { box: Box3, vertices: Vector3[] } {
        var that = this;
        var box = new Box3();
        var vertices: Vector3[] = [];
        _.each(this.mClusters, function (subCluster: BaseCluster3D) {
            let boundingBox = new Box3();

            const _sourceBB = (subCluster.mHull && subCluster.mHull.mBoundingBox)
                || (subCluster.geometry && subCluster.geometry.boundingBox);
            if (!_sourceBB) return;
            boundingBox.copy(_sourceBB);

            boundingBox.translate(subCluster.position);

            let vert = that.getVerticesFromBoundingBox(boundingBox);
            vertices = vertices.concat(vert);
            box.union(boundingBox);
        });

        return {box: box, vertices: vertices}
    }

    getVerticesForLeaf(): Vector3[] {
        var leaf = this.mLeaf!;

        let el = leaf.mNodeParticles.pointCloud;
        const leafOffset = leaf.position.clone();

        let geometry = el.geometry;
        var attributes = geometry.attributes;
        var positions = attributes.position.array as Float32Array;
        let vert: Vector3[] = [];
        for (var i = 0; i < positions.length; i += 3) {
            let v = new Vector3(positions[i], positions[i + 1], positions[i + 2]);
            vert.push(v.add(leafOffset));
        }

        return vert
    }

    setDistributionHandler(distribution: BaseDistribution, onComplete: () => void = () => {}, onStep: () => void = () => {}): void {
        var that = this;
        var values = Object.values(this.mClusters);

        var updateLeafsEdges = _.throttle(function (cluster: BaseCluster3D) {
            let leafs = cluster.getLeafs();
            _.each(leafs, function (leaf) {
                leaf.updateEdges();
            });
        }, 100);

        distribution.setNodes(this,
            function onNodePositionChanged(_vecPosition: unknown, _i: number) {},
            function _onStep(_p: unknown) {
                updateLeafsEdges(that);
                onStep()
            }, function () {
                onComplete();
            });
    }

    setHullColorFromOptions(hull: InstanceType<typeof BaseVolume>): void {
        let o = this.getClusterOptions()

        if (hull.canBeVisible()) {
            (hull.mesh.material as MeshBasicMaterial).color = new ThreeColor(o.colors.hull[0])
            hull.maxOpacity = o.colors.hull[1]
        }
    }

    addHullStencilBeforeRender(mesh: Mesh, callback?: Function): void {
        var that = this

        mesh.onBeforeRender = function (this: Mesh, renderer: WebGLRenderer, _scene: Scene, _camera: Camera, _geometry: BufferGeometry, _material: Material, _group: Group) {
            var depth = that.getDepth()
            let opt = (renderer as unknown as StencilRenderer).debug.stencil
            opt.state(true)
            var gl = renderer.getContext();
            let func = opt.func[0]
            gl.stencilFunc(func[0], depth + func[1], func[2]);
            gl.stencilOp(...opt.op[0]);

            if (callback)
                callback.bind(this)(...arguments)
        }

        mesh.onAfterRender = function (_renderer: WebGLRenderer, _scene: Scene, _camera: Camera, _geometry: BufferGeometry, _material: Material, _group: Group) {}
    }

    addEdgeStencilBeforeRender(mesh: Mesh, callback?: Function): void {
        var that = this

        mesh.onBeforeRender = function (this: Mesh, renderer: WebGLRenderer, _scene: Scene, _camera: Camera, _geometry: BufferGeometry, _material: Material, _group: Group) {
            var depth = that.getDepth()
            let opt = (renderer as unknown as StencilRenderer).debug.stencil
            opt.state(true)
            var gl = renderer.getContext();
            let func = opt.func[1]
            gl.stencilFunc(func[0], depth + func[1], func[2]);
            gl.stencilOp(...opt.op[1]);

            if (callback)
                callback.bind(this)(...arguments)
        }

        mesh.onAfterRender = function (_renderer: WebGLRenderer, _scene: Scene, _camera: Camera, _geometry: BufferGeometry, _material: Material, _group: Group) {}
    }

    adjustHullSize(): void {
        if (this.mExpanded == false) {
            this.getSphereHull();
            return;
        }

        let info: { box: Box3, vertices: Vector3[] } = {box: new Box3(), vertices: []};

        if (this.isLeaf()) {
            if (!this.mLeaf!.mNodeParticles) return

            let pc = this.mLeaf!.mNodeParticles.pointCloud;

            if (!pc) {
                throw new Error("nodescontainer not created yet for leaf")
            } else {
                info.box.setFromArray(pc.geometry.attributes.position.array as Float32Array);
                const _leafOffset = this.mLeaf!.position.clone();
                info.box.translate(_leafOffset);
                info.vertices = this.getVerticesForLeaf();
                pc.geometry.boundingBox = info.box
            }
        } else {
            info = this.getCompoundBoundingBoxInfo();
            if (info.box.min.x == Infinity) info.box = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1))
        }

        let boundingBox = info.box;
        var mOptions = this.getClusterOptions();

        if (!this.mHull)
            if (BaseVolume == mOptions.hull || BaseVolume.isPrototypeOf(mOptions.hull)) {
                this.mHull = new mOptions.hull();
                this.mHull!.name = "HullElement"
                this.mExpandedGroup.add(this.mHull);
            } else throw new Error("option hull must have superclass BaseVolume");

        let vertices = info.vertices;
        const prevMesh = this.mHull!.mesh;
        this.mHull!.createVolumeFromVertices(vertices, boundingBox);

        mOptions.onHullCreated(this.mHull)

        if (this.mHull!.mesh) {
            if (this._hullEffect && prevMesh)
                this._hullEffect.onDetach(prevMesh as Mesh);
            if (!this._hullEffect) {
                const makeEffect = mOptions.makeHullEffect || (() => mOptions.hullEffect);
                this._hullEffect = makeEffect();
            }
            this._hullEffect.onAttach(this.mHull!.mesh as Mesh);
        }

        if (!this.mHull && (this.mHull as unknown as { geometry?: BufferGeometry })?.geometry) {
            this.geometry = (this.mHull as unknown as { geometry: BufferGeometry }).geometry as BufferGeometry;
        } else {
            let boundingSphere = boundingBox.getBoundingSphere(new Sphere());
            var sphereGeometry = new SphereGeometry(boundingSphere.radius, 10, 5);
            sphereGeometry.translate(boundingSphere.center.x, boundingSphere.center.y, boundingSphere.center.z);
            sphereGeometry.boundingBox = boundingBox;
            this.geometry = sphereGeometry;
        }

        this.setHullColorFromOptions(this.mHull!)

        this.addHullStencilBeforeRender(this.mHull!.mesh as Mesh)

        this.trigger("hull-updated")
    }

    isLeaf(): boolean {
        return typeof this.mLeaf != "undefined"
    }

    getParentCluster(): BaseCluster3D | undefined {
        let expContainer = this.parent;
        if (expContainer) return expContainer.parent as BaseCluster3D | undefined
    }

    createParticlePointCloud(entry: ClusterSpec): void {
        var that = this;

        let domEvents = this.getDOMEvents()

        let viewOptions = (this.getView() && (this.getView() as View3D & { mOptions?: Record<string, unknown> }).mOptions) || {}
        let leaf = new ClusterLeafElement(this.mNodes, domEvents, viewOptions);
        this.mLeaf = leaf;
        this.mExpandedGroup.add(leaf);

        var updateLeafsEdges = _.throttle(function (cluster: BaseCluster3D) {
            let leafs = cluster.getLeafs();
            _.each(leafs, function (leaf) {
                leaf.updateEdges();
                that.adjustHullSize();
            });
        }, 50);

        leaf.setDistributionHandler(entry.distribution, function () {
            that.adjustHullSize();
            if (that.isLeaf())
                that.updateIfIsLeaf()
        }, function () {
            updateLeafsEdges(that)
        })
    }

    updateIfIsLeaf(): void {
        if (!this.mLeaf) return;
        this.mLeaf.updateDotParticlesColor()
    }

    updateCluster(): void {
        this.addAllSubClustersToContainer();
    }

    getRelationInfo(): unknown {
        return EdgeUtil.getClusterInfo(this.mClusters);
    }

    createEdgesForChildClusters(): ClusterEdge[] {
        if (this.mChildClustersEdges) return this.mChildClustersEdges as ClusterEdge[];
        return this.mChildClustersEdges = EdgeUtil.createEdgesBetweenClustersFromMap(this.mClusters);
    }

    getRadius(defaultRadius: number = 100): number {
        return this.geometry.boundingSphere ? this.geometry.boundingSphere.radius : defaultRadius;
    }

    getLeafs(): ClusterLeafElement[] {
        if (this._LeafsCached) return this._LeafsCached;

        var leafElements: ClusterLeafElement[] = this._LeafsCached = [];

        this.traverse(function (item) {
            if (item instanceof ClusterLeafElement)
                leafElements.push(item)
        });

        return leafElements;
    }

    findClusters(selector: string = "*"): BaseCluster3D[] {
        var clusters: BaseCluster3D[] = [];

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
            clusters.shift();

        return clusters
    }

    getDOMElement(): HTMLElement | null {
        var view3d = this.getView();
        const domElement = view3d && (view3d as View3D & { domElement?: HTMLElement }).domElement;
        if (!view3d || !domElement) {
            console.warn("attach graph to a view before using dom specific functions");
            return null;
        }
        return domElement
    }

    getDOMEvents(): InstanceType<typeof DomEventsAlt> | null {
        var view3d = this.getView();
        if (!view3d || !view3d.mDomEvents) {
            console.warn("attach graph to a view before using dom specific functions");
            return null;
        }
        return view3d.mDomEvents
    }

    getRoot(maxDepth: number = 20): BaseCluster3D {
        var _root: BaseCluster3D = this;
        while (maxDepth--) {
            let r = _root.parent;
            if (r == null) return _root;
            if (!(r instanceof BaseCluster3D)) return _root;
            _root = r;
        }
        return _root
    }

    getParents(maxDepth: number = 20): BaseCluster3D[] {
        var _root: BaseCluster3D | Group = this;
        var parents: BaseCluster3D[] = [];
        while (maxDepth--) {
            let r = _root.parent;
            if (r == null) return parents;

            if (r instanceof Group && r.parent instanceof BaseCluster3D) r = r.parent;

            if (!(r instanceof BaseCluster3D)) return parents;
            _root = r;

            parents.unshift(_root)
        }
        return parents;
    }

    getDepth(): number {
        return this.getParents().length
    }
}
