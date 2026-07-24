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
import { BackSide } from "three/src/constants.js";
import { BufferAttribute } from "three/src/core/BufferAttribute.js";
import { BufferGeometry } from "three/src/core/BufferGeometry.js";
import { ImageUtils } from "three/src/extras/ImageUtils.js";
import { SphereGeometry } from "three/src/geometries/SphereGeometry.js";
import { Box3Helper } from "three/src/helpers/Box3Helper.js";
import { AmbientLight } from "three/src/lights/AmbientLight.js";
import { DirectionalLight } from "three/src/lights/DirectionalLight.js";
import { PointLight } from "three/src/lights/PointLight.js";
import { MeshBasicMaterial } from "three/src/materials/MeshBasicMaterial.js";
import { MeshPhongMaterial } from "three/src/materials/MeshPhongMaterial.js";
import { Vector3 } from "three/src/math/Vector3.js";
import { Group } from "three/src/objects/Group.js";
import { Mesh } from "three/src/objects/Mesh.js";

//import skyDomeImage from "./coordinates.png"

//import Hexasphere from "hexasphere.js"


export default class GraphView3D extends View3D {

    constructor(el) {
        super(el);

        this.mRootCluster = null;


        //debug code
        //options to be used in onBeforeRender for hull and edges

        var gl = this.mRenderer.getContext();

        window.test = {gl: gl, renderer: this.mRenderer}

        //gl=test.gl;st=test.renderer.debug.stencil;st.state(true);st.func=[[gl.ALWAYS, 1, 0xFF], [gl.GEQUAL, 1, 0xFF]];st.op=[[gl.REPLACE, gl.REPLACE, gl.REPLACE], [gl.KEEP, gl.KEEP, gl.KEEP]];

        this.mRenderer.debug = Object.assign(this.mRenderer.debug || {}, {
            stencil: {
                func: [[gl.ALWAYS, 1, 0xFF], [gl.GEQUAL, 1, 0xff]],
                op: [[gl.REPLACE, gl.REPLACE, gl.REPLACE], [gl.KEEP, gl.KEEP, gl.KEEP]],
                state: (b) => this.setStencil(b)
            }
        });


    }

    setTextVisible(newValue) {
        let visible;
        if (newValue == "true") visible = true;
        else if (newValue == "false") visible = false;
        else visible = Boolean(newValue)

        if (this.mRootCluster && this.mRootCluster.mTextOverlay)
            this.mRootCluster.mTextOverlay.enabled = visible;
    }


    setSpeccs(speccs) {
        this.mSpeccs = speccs;
        return this
    }

    getSpeccs() {

        return this.mSpeccs
    }


    createSkyDome() {


        var material = new MeshBasicMaterial();


        let scene = this.mScene;

        var ambientLight = new AmbientLight(0xFFFFFF, 1.5);
        scene.add(ambientLight);
        /* var dirLight = new DirectionalLight(0xffffff, 1);
         dirLight.position.set(0, 10000, 0);
         dirLight.intensity = 1;
         scene.add(dirLight);
     */
        /* var pointLight = new PointLight( 0xffffff, 100, 1000000000 );
         pointLight.position.set( 0, 0, 20000 );
         scene.add(pointLight);
     */
        /*  var geometry = new SphereGeometry(300000, 60, 40);
          var material = new MeshBasicMaterial();

         material.map = ImageUtils.loadTexture(skyDomeImage);
          material.side = BackSide;
          material.opacity=0.05;
          material.transparent=true;
          var skydome = new Mesh(geometry, material);

          this.mSkyDome=skydome


      */
        //   scene.add(skydome);


        //--------------------------------
        var meshMaterials = [];
        meshMaterials.push(new MeshPhongMaterial({color: 0x7cfc00, transparent: true}));
        meshMaterials.push(new MeshPhongMaterial({color: 0x397d02, transparent: true}));
        meshMaterials.push(new MeshPhongMaterial({color: 0x77ee00, transparent: true}));
        meshMaterials.push(new MeshPhongMaterial({color: 0x61b329, transparent: true}));
        meshMaterials.push(new MeshPhongMaterial({color: 0x83f52c, transparent: true}));
        meshMaterials.push(new MeshPhongMaterial({color: 0x83f52c, transparent: true}));
        meshMaterials.push(new MeshPhongMaterial({color: 0x4cbb17, transparent: true}));
        meshMaterials.push(new MeshPhongMaterial({color: 0x00ee00, transparent: true}));
        meshMaterials.push(new MeshPhongMaterial({color: 0x00aa11, transparent: true}));

        var oceanMaterial = []
        oceanMaterial.push(new MeshPhongMaterial({color: 0x0f2342, transparent: true}));
        oceanMaterial.push(new MeshPhongMaterial({color: 0x0f1e38, transparent: true}));


        var radius = 300000;        // Radius used to calculate position of tiles
        var subDivisions = 3;   // Divide each edge of the icosohedron into this many segments
        var tileSize = 0.9;    // Add padding (1.0 = no padding; 0.1 = mostly padding)


        function isLand() {

            return _.random(0, 1)

        }

        var hexaGroup = new Group();

        var hexasphere = new Hexasphere(radius, subDivisions, tileSize);
        for (var i = 0; i < hexasphere.tiles.length; i++) {
            var t = hexasphere.tiles[i];
            var latLon = t.getLatLon(hexasphere.radius);

            const bps = t.boundary;
            const verts = bps.map(bp => new Vector3(bp.x, bp.y, bp.z));
            const faceIndices = [[0,1,2],[0,2,3],[0,3,4]];
            if (verts.length > 5) faceIndices.push([0,4,5]);
            const positions = [];
            for (const [a,b,c] of faceIndices) {
                positions.push(verts[a].x, verts[a].y, verts[a].z);
                positions.push(verts[b].x, verts[b].y, verts[b].z);
                positions.push(verts[c].x, verts[c].y, verts[c].z);
            }
            var geometry = new BufferGeometry();
            geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
            geometry.computeVertexNormals();

            if (isLand(latLon.lat, latLon.lon)) {
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


        that.addEventListener("before-render", onBeforeRender);


        function onBeforeRender() {


            if (that.isMaximised()) {

                //update company info only every 20 frames to increse overall performance
                if (_____skipFrames++ % 20 == 0) {
                    let vl = _.flatten(visibleNodes.map(leaf => leaf.mNodes))

                    if (vl.length != 0) //FIXME this should prevent the flickering but it does not solve the underlying problem that the handlers are bound incorrect
                        GUI.updateFromVisibleNodes(vl);
                    visibleNodes = []
                }
            }


        }


    }


    initClusterForView(rawGraphData, parentEl3D) {


        if (!rawGraphData) return;

        let speccs = this.getSpeccs();

        let graphData = new GraphData(rawGraphData);


        let preparedData = graphData.createClusterNodesAndEdges(this);


        var res = new RootCluster(preparedData.nodes, undefined, this);


        parentEl3D.add(res);
        res.position.set(0, 0, 0);

        //FIXME workflow below ..
        //IMPORTANT: must attach after clustering is applied because "tn" aka. globalTextNodes gets removed at the start of the clustering
        res.attachToView3D(this);
        const depth = this._clusterDepth || speccs.length;
        res.applyClustering(speccs.slice(0, depth));


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


            this.mColorScheme = new DefaultColorScheme()



            //------
            //add zoom key support

            function doZoom()
            {

                console.log("todo implement key zoom")

            }

            let mt=Mousetrap(this.el)
            mt.bind("up",doZoom)
            mt.bind("down",doZoom)
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

                    function addBoxes(cluster) {
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
                function v3(v) { return v ? `(${v.x.toFixed(0)},${v.y.toFixed(0)},${v.z.toFixed(0)})` : 'null'; }
                function bbStr(bb) {
                    if (!bb) return 'no-bb';
                    const c = bb.getCenter(new Vector3());
                    const s = bb.getSize(new Vector3());
                    return `center=${v3(c)} size=${v3(s)}`;
                }
                function dumpCluster(cluster, indent) {
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
                        Object.values(cluster.mClusters).forEach(c => {
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

    loadDataSet(ds) {

        var that = this;

        ds(null, function onSuccess(mGraphData) {
            console.log("data loaded");
            that.setData(mGraphData);


            //TODO element does not jet exist.. create webcomponent for that
            function triggerColorChange() {
                let selectEl = document.querySelector(".cloudNodeColorSelect")

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

    loadDatasource(datasource) {
        var that = this;
        this._currentDatasource = datasource;
        if (that.mRootCluster) {
            that.mScene.remove(that.mRootCluster);
            if (that.mRootCluster.mTextOverlay && that.mRootCluster.mTextOverlay.el)
                that.mRootCluster.mTextOverlay.el.remove();
            that.mRootCluster = null;
        }
        datasource.load(function onSuccess(mGraphData) {
            console.log("data loaded");
            that.setData(mGraphData);
            function triggerColorChange() {
                let selectEl = document.querySelector(".cloudNodeColorSelect")
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

    resizeCanvas() {
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

    render() {

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
