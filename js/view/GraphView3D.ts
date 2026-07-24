/**
 * Created by Frank on 13.06.2017.
 */


import View3D from "./View3D"


import RootCluster from "../cluster/RootCluster"
import GraphData from "../cluster/GraphData"

import DefaultColorScheme from "../cluster/utils/DefaultColorScheme"
import "../gui/GraphHUD"


import {GUI} from "../cluster/refactor/SpecificDataUtils"
import _ from "lodash";
import ConvexVolume from "../cluster/hull/ConvexVolume";
import NoneHullEffect from "../cluster/hull/effects/NoneHullEffect";
import OutlineHullEffect, { OutlineComposer } from "../cluster/hull/effects/OutlineHullEffect";
import BasicHullEffect from "../cluster/hull/effects/BasicHullEffect";
import BoxHullEffect from "../cluster/hull/effects/BoxHullEffect";
import { BackSide } from "three/src/constants.js";
import { BufferAttribute } from "three/src/core/BufferAttribute.js";
import { BufferGeometry } from "three/src/core/BufferGeometry.js";
import { Box3Helper } from "three/src/helpers/Box3Helper.js";
import { AmbientLight } from "three/src/lights/AmbientLight.js";
import { MeshBasicMaterial } from "three/src/materials/MeshBasicMaterial.js";
import { MeshPhongMaterial } from "three/src/materials/MeshPhongMaterial.js";
import { Vector3 } from "three/src/math/Vector3.js";
import { Group } from "three/src/objects/Group.js";
import { Mesh } from "three/src/objects/Mesh.js";
import { initEdgeIndicatorOverlay } from "../gui/EdgeIndicatorOverlay.js";
import type { ParticleNodeGroupOptions } from "../cluster/particles/ParticleNodeGroup";

export interface GraphView3DOptions extends ParticleNodeGroupOptions {
    [key: string]: any
}

export default class GraphView3D extends View3D {

    mRootCluster: RootCluster | null
    mOptions: GraphView3DOptions
    mSpeccs: any
    mColorScheme: any
    declare mBorderEffect: any
    mSkyDome: any
    _clusterDepth: number | undefined
    _hullOptions: any
    _currentDatasource: any

    constructor(el: HTMLElement, options: GraphView3DOptions = {}) {
        super(el);

        this.mRootCluster = null;
        this.mOptions = options;

        var gl = this.mRenderer.getContext();

        ;(window as any).test = {gl: gl, renderer: this.mRenderer}

        ;(this.mRenderer as any).debug = Object.assign((this.mRenderer as any).debug || {}, {
            stencil: {
                func: [[gl.ALWAYS, 1, 0xFF], [gl.GEQUAL, 1, 0xff]],
                op: [[gl.REPLACE, gl.REPLACE, gl.REPLACE], [gl.KEEP, gl.KEEP, gl.KEEP]],
                state: (b: any) => this.setStencil(b)
            }
        });
    }

    setTextVisible(newValue: string | boolean): void {
        let visible: boolean;
        if (newValue == "true") visible = true;
        else if (newValue == "false") visible = false;
        else visible = Boolean(newValue)

        if (this.mRootCluster && this.mRootCluster.mTextOverlay)
            this.mRootCluster.mTextOverlay.enabled = visible;
    }

    setSpeccs(speccs: any): this {
        this.mSpeccs = speccs;
        return this
    }

    getSpeccs(): any {
        return this.mSpeccs
    }

    setClusterDepth(depth: number): this {
        this._clusterDepth = depth;
        return this;
    }

    setHullOptions(options: any): this {
        this._hullOptions = options;
        return this;
    }

    edgeIndicator(enabled: boolean): this {
        if (enabled) initEdgeIndicatorOverlay(this);
        return this;
    }

    setBorderStyle(style: string): this {
        const BORDERS: Record<string, any> = {
            "None":    { makeEffect: () => new NoneHullEffect(),                  makeComposer: () => null },
            "Outline": { makeEffect: (mode: any, c: any) => new OutlineHullEffect(mode, c), makeComposer: (v: any) => { const c = new OutlineComposer(); c.init(v.mRenderer, v.mScene, v.mCamera); return c; } },
            "Basic":   { makeEffect: () => new BasicHullEffect(),                 makeComposer: () => null },
            "Box":     { makeEffect: () => new BoxHullEffect(),                   makeComposer: () => null },
        };
        const entry = BORDERS[style];
        if (!entry) { console.warn(`setBorderStyle: unknown style "${style}", use one of: ${Object.keys(BORDERS).join(", ")}`); return this; }
        if (this.mBorderEffect) { this.mBorderEffect.dispose(); this.mBorderEffect = null; }
        const composer = entry.makeComposer(this);
        if (this.mRootCluster) {
            this.mRootCluster.findClusters("*").forEach((cluster: any) => {
                if (!cluster.mHull || !(cluster.mHull instanceof ConvexVolume) || !cluster.mHull.mesh) return;
                if (cluster._hullEffect) cluster._hullEffect.onDetach(cluster.mHull.mesh);
                const mode = cluster._hullMode || (cluster._hullEffect && cluster._hullEffect.mMode) || "hover";
                if (!cluster._hullMode) cluster._hullMode = mode;
                const effect = entry.makeEffect(mode, composer);
                cluster._hullEffect = effect;
                effect.onAttach(cluster.mHull.mesh);
            });
        }
        if (composer) this.setBorderEffect(composer);
        return this;
    }


    createSkyDome(): void {

        var material: any = new MeshBasicMaterial();

        let scene = this.mScene;

        var ambientLight = new AmbientLight(0xFFFFFF, 1.5);
        scene.add(ambientLight);

        var meshMaterials: MeshPhongMaterial[] = [];
        meshMaterials.push(new MeshPhongMaterial({color: 0x7cfc00, transparent: true}));
        meshMaterials.push(new MeshPhongMaterial({color: 0x397d02, transparent: true}));
        meshMaterials.push(new MeshPhongMaterial({color: 0x77ee00, transparent: true}));
        meshMaterials.push(new MeshPhongMaterial({color: 0x61b329, transparent: true}));
        meshMaterials.push(new MeshPhongMaterial({color: 0x83f52c, transparent: true}));
        meshMaterials.push(new MeshPhongMaterial({color: 0x83f52c, transparent: true}));
        meshMaterials.push(new MeshPhongMaterial({color: 0x4cbb17, transparent: true}));
        meshMaterials.push(new MeshPhongMaterial({color: 0x00ee00, transparent: true}));
        meshMaterials.push(new MeshPhongMaterial({color: 0x00aa11, transparent: true}));

        var oceanMaterial: MeshPhongMaterial[] = []
        oceanMaterial.push(new MeshPhongMaterial({color: 0x0f2342, transparent: true}));
        oceanMaterial.push(new MeshPhongMaterial({color: 0x0f1e38, transparent: true}));

        var radius = 300000;
        var subDivisions = 3;
        var tileSize = 0.9;

        function isLand() {
            return _.random(0, 1)
        }

        var hexaGroup = new Group();

        var hexasphere = new (window as any).Hexasphere(radius, subDivisions, tileSize);
        for (var i = 0; i < hexasphere.tiles.length; i++) {
            var t = hexasphere.tiles[i];
            void t.getLatLon(hexasphere.radius);

            const bps = t.boundary;
            const verts = bps.map((bp: any) => new Vector3(bp.x, bp.y, bp.z));
            const faceIndices: number[][] = [[0,1,2],[0,2,3],[0,3,4]];
            if (verts.length > 5) faceIndices.push([0,4,5]);
            const positions: number[] = [];
            for (const [a,b,c] of faceIndices) {
                positions.push(verts[a].x, verts[a].y, verts[a].z);
                positions.push(verts[b].x, verts[b].y, verts[b].z);
                positions.push(verts[c].x, verts[c].y, verts[c].z);
            }
            var geometry = new BufferGeometry();
            geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
            geometry.computeVertexNormals();

            if (isLand()) {
                material = meshMaterials[Math.floor(Math.random() * meshMaterials.length)]
            } else {
                material = oceanMaterial[Math.floor(Math.random() * oceanMaterial.length)]
            }

            material.opacity = 0.3;
            material.side = BackSide;

            var mesh = new Mesh(geometry, material.clone());
            hexaGroup.add(mesh);
            hexasphere.tiles[i].mesh = mesh;
        }
        scene.add(hexaGroup);
        this.mSkyDome = hexaGroup
    }


    addCompanyCountListenersToCluster(rootCluster: any): void {

        var visibleNodes: any[] = [];
        var _____skipFrames = 0;

        function attachListeners(cluster: any) {
            _.each(cluster.findClusters("*"), function (cluster: any) {
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

        that.addEventListener("before-render", onBeforeRender);

        function onBeforeRender() {
            if (that.isMaximised()) {
                if (_____skipFrames++ % 20 == 0) {
                    let vl = _.flatten(visibleNodes.map((leaf: any) => leaf.mNodes))

                    if (vl.length != 0)
                        GUI.updateFromVisibleNodes(vl);
                    visibleNodes = []
                }
            }
        }
    }


    initClusterForView(rawGraphData: any, parentEl3D: any): any {

        if (!rawGraphData) return;

        let speccs = this.getSpeccs();

        let graphData = new GraphData(rawGraphData);

        let preparedData = graphData.createClusterNodesAndEdges(this);

        var res = new RootCluster(preparedData.nodes, undefined, this);

        parentEl3D.add(res);
        res.position.set(0, 0, 0);

        res.attachToView3D(this);
        const depth = this._clusterDepth || speccs.length;
        const hullOptions = this._hullOptions;
        const finalSpeccs = hullOptions
            ? speccs.slice(0, depth).map((s: any) => ({ ...s, options: { ...s.options, ...hullOptions } }))
            : speccs.slice(0, depth);
        res.applyClustering(finalSpeccs);

        this.start();

        return res
    }


    setData(mGraphData: any): void {
        this.initStatic();

        if (!this.mRootCluster) {
            this.mRootCluster = this.initClusterForView(mGraphData, this.mScene);

            ;(window as any).test.root = this.mRootCluster

            this.addCompanyCountListenersToCluster(this.mRootCluster);

            this.mColorScheme = new DefaultColorScheme()

            function doZoom() {
                console.log("todo implement key zoom")
            }

            let mt = (window as any).Mousetrap(this.el)
            mt.bind("up", doZoom)
            mt.bind("down", doZoom)
            const _debugState = { mode: 0 };
            window.addEventListener('keydown', (e) => {
                if (e.key === 'F2') {
                    e.preventDefault();
                    const root = this.mRootCluster;
                    if (!root) return;
                    const DEBUG_GROUP_NAME = '__hullDebug__';
                    let grp = this.mScene.getObjectByName(DEBUG_GROUP_NAME);
                    if (grp) this.mScene.remove(grp);

                    _debugState.mode = (_debugState.mode + 1) % 3;
                    if (_debugState.mode === 0) {
                        console.log('[F2] mode: none');
                        return;
                    }

                    grp = new Group();
                    grp.name = DEBUG_GROUP_NAME;
                    root.updateMatrixWorld(true);

                    function addBoxes(cluster: any) {
                        if (_debugState.mode === 1 && cluster.mHull && cluster.mHull.mBoundingBox) {
                            const bbWorld = cluster.mHull.mBoundingBox.clone().applyMatrix4(cluster.matrixWorld);
                            grp.add(new Box3Helper(bbWorld, 0xffff00));
                        }
                        if (_debugState.mode === 2 && cluster.geometry && cluster.geometry.boundingBox) {
                            const bbWorld = cluster.geometry.boundingBox.clone().applyMatrix4(cluster.matrixWorld);
                            grp.add(new Box3Helper(bbWorld, 0xff0000));
                        }
                        if (cluster.mClusters)
                            Object.values(cluster.mClusters).forEach(addBoxes);
                    }
                    addBoxes(root);
                    this.mScene.add(grp);
                    console.log('[F2] mode:', _debugState.mode === 1 ? 'yellow (hull.mBoundingBox)' : 'red (geometry.boundingBox)', '— boxes:', grp.children.length);
                    return;
                }
                if (e.key !== 'F1') return;
                e.preventDefault();
                function v3(v: any) { return v ? `(${v.x.toFixed(0)},${v.y.toFixed(0)},${v.z.toFixed(0)})` : 'null'; }
                function bbStr(bb: any) {
                    if (!bb) return 'no-bb';
                    const c = bb.getCenter(new Vector3());
                    const s = bb.getSize(new Vector3());
                    return `center=${v3(c)} size=${v3(s)}`;
                }
                function dumpCluster(cluster: any, indent: string): string[] {
                    const isLeaf = cluster.isLeaf ? cluster.isLeaf() : false;
                    const wp = new Vector3();
                    cluster.getWorldPosition(wp);
                    const hullBB = cluster.mHull && cluster.mHull.mBoundingBox;
                    const geoBB = cluster.geometry && cluster.geometry.boundingBox;
                    const lines = [
                        `${indent}[${isLeaf ? 'LEAF' : 'CLUSTER'}] ${cluster.name || cluster.id || '?'}`,
                        `${indent}  pos=${v3(cluster.position)} worldPos=${v3(wp)}`,
                        `${indent}  hull.mBoundingBox: ${bbStr(hullBB)}`,
                        `${indent}  geometry.boundingBox: ${bbStr(geoBB)}`,
                    ];
                    if (cluster.mClusters) {
                        Object.values(cluster.mClusters).forEach((c: any) => {
                            lines.push(...dumpCluster(c, indent + '  '));
                        });
                    }
                    return lines;
                }
                const root = this.mRootCluster;
                if (!root) { console.log('[F1] no root cluster'); return; }
                console.log('[F1] cluster tree:\n' + dumpCluster(root, '').join('\n'));
            })
        }

        this.dispatchEvent(new CustomEvent("loaded"))
    }

    loadDataSet(ds: Function): this {

        var that = this;

        ds(null, function onSuccess(mGraphData: any) {
            console.log("data loaded");
            that.setData(mGraphData);

            function triggerColorChange() {
                let selectEl = document.querySelector(".cloudNodeColorSelect") as HTMLSelectElement | null

                if (!selectEl) setTimeout(triggerColorChange, 100)
                else {
                    selectEl.value = "group";
                    selectEl.dispatchEvent(new Event("change"));
                }
            }

            triggerColorChange();
        });

        return this
    }

    loadDatasource(datasource: any): this {
        var that = this;
        this._currentDatasource = datasource;
        if (that.mRootCluster) {
            that.mScene.remove(that.mRootCluster);
            if (that.mRootCluster.mTextOverlay && that.mRootCluster.mTextOverlay.el)
                that.mRootCluster.mTextOverlay.el.remove();
            that.mRootCluster = null;
        }
        datasource.load(function onSuccess(mGraphData: any) {
            console.log("data loaded");
            that.setData(mGraphData);
            function triggerColorChange() {
                let selectEl = document.querySelector(".cloudNodeColorSelect") as HTMLSelectElement | null
                if (!selectEl) setTimeout(triggerColorChange, 100)
                else {
                    selectEl.value = "group";
                    selectEl.dispatchEvent(new Event("change"));
                }
            }
            triggerColorChange();
        });
        return this
    }

    resizeCanvas(): void {
        super.resizeCanvas()

        var root = this.mRootCluster;

        if (root && root.mParentView && root.mTextOverlay) {
            root.mTextOverlay.el.style.height = root.mParentView.clientHeight + "px";
            root.mTextOverlay.el.style.width = root.mParentView.clientWidth + "px";
        }
    }

    /**
     * override default renderer call
     * this provides stencil based per cluster edge masking
     * by rendering all objects but cluster edges first
     */
    render(): void {

        if (this.mBorderEffect) {
            this.mBorderEffect.render();
            return;
        }

        var that = this
        that.mRenderer.autoClear = false
        that.mRenderer.autoClearStencil = false
        that.mRenderer.clear(true, true, true);
        that.mCamera.layers.set(0)

        that.mRenderer.render(that.mScene, that.mCamera);

        that.mCamera.layers.set(1)
        that.mRenderer.render(that.mScene, that.mCamera);

        that.mCamera.layers.enableAll();
    }
}
