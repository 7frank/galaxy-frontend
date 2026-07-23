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

//import skyDomeImage from "./coordinates.png"

//import Hexasphere from "hexasphere.js"


export default class GraphView3D extends View3D {

    constructor(el) {
        super(el);

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
