/**
 *  TODO re-structure graph
 * -into graph + subgraphs or simply multiple graphs
 * -each graph may have distribution class/function which handles the layouting of the node/edges
 * -for example a node-set might divided into different sub-sets depending on current assosiations
 *  they may further contain sub-sets
 * - for rendering, these sets are going to be put into a container class like the "nodeClouds"
 * so a "nodesContainer" and a nodesClusterContainer will be needed which also have the distribution function
 */



THREE.EllipsoidGeometry = function (width, height, depth, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength) {

    THREE.SphereGeometry.call(this, width * 0.5, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength);

    var matrix = new THREE.Matrix4().makeScale(1.0, height / width, depth / width);

    this.applyMatrix(matrix);

    //this.boundingSphere.applyMatrix4( matrix );

};

THREE.EllipsoidGeometry.prototype = Object.create(THREE.Geometry.prototype);


//--------------------------------

//TODO find a better way to import libraries as simple scripts
//NOTE:don't remove imports


//import THREE0 from "../lib/three.min"

//used by View3D
import CombinedCamera from "../lib/CombinedCamera"
import TrackballControls from "../lib/TrackballControls"

//used by ConvexVolume
import ConvexGeometry from "../lib/ConvexGeometry"
import QuickHull from "../lib/QuickHull"


// --------------------------------


import BaseDistribution from "./distributions/BaseDistribution"
import DefaultDistribution from "./distributions/DefaultDistribution"
import RandomDistribution from "./distributions/RandomDistribution"
import ForceGraphDistribution from "./distributions/ForceGraphDistribution"
import SphericalDistribution from "./distributions/SphericalDistribution"

import ClusterNodeArray from "./ClusterNodeArray"

import ClusterLeafElement from "./ClusterLeafElement"

import BaseCluster3D from "./BaseCluster3D"
import Cluster3DExtended from "./Cluster3DExtended"
import RootCluster from "./RootCluster"
import GraphData from "./GraphData"


import GraphView3D from "../view/GraphView3D"


import BoxVolume from "./hull/BoxVolume"
import BaseVolume from "./hull/BaseVolume"
import ConvexVolume from "./hull/ConvexVolume"

import ZoomUtil from "../utils/ZoomUtil"


import CompanyNewsDS from "../data/CompanyNewsDS"

//-----------------------------------------
//-----------DEBUG-------------------------
//-----------------------------------------


export {Cluster3DExtended}

/**
 * currently used for debugging purposes
 */
export class MyMain {

    constructor(datasets) {
        this.setDataSets(datasets);
        this.setupViews()


        //  this.clusters = this.init();

        this.addNewsListeners()
    }


    addNewsListeners() {
        var myDS = new CompanyNewsDS('http://localhost:3000')

        myDS.onNewsReceived(function (news) {


        })


    }


    getDefaultHullMaterial() {

        return new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            wireframe: false,
            transparent: true,
            opacity: 0.1,
            visible: false
        });

    }


    getEllipsoidHull(boundingBox) {

        let _center = boundingBox.getCenter();
        let _size = boundingBox.getSize();

        var sphereGeometry = new THREE.EllipsoidGeometry(_size.x, _size.y, _size.z);

        let hull = new THREE.Mesh(sphereGeometry, this.getDefaultHullMaterial());
        // hull.position.copy(_center)

        return hull

    }


    getRingHull(boundingBox) {

        let boundingSphere = new THREE.Sphere;
        //get center, radius
        let _center = boundingBox.getCenter();
        let _size = boundingBox.getSize();
        let radius = _size.length() / 2;
        //TODO
        if (radius < 40) radius = 40;

        boundingSphere.radius = radius;

        let ringGeometry = new THREE.RingGeometry(boundingSphere.radius * 0.95, boundingSphere.radius, 32);


        ringGeometry.boundingSphere = boundingSphere;


        let hull = new THREE.Mesh(ringGeometry, this.getDefaultHullMaterial());


        hull.onBeforeRender = function (renderer, scene, camera, geometry, material, group) {
            //billboard effect
            this.setRotationFromQuaternion(camera.quaternion)
            //     console.warn(camera.quaternion.x,camera.quaternion.y)

        };

        return hull
    }

    isDebug() {

        return window.location.hash == "#debug"

    }


    setupViews() {
        const thumbCSS = {
            "pointer-events": "all",
            height: 300,
            width: 400,
            display: "flex",
            "border": "1px solid rgba(128, 128, 128, 0.5)",
            margin: "0.2em"
        };


        function createContainer() {

            let containerCSS = {
                //"pointer-events": "none",
                // display: "flex",
                // "flex-flow": "row wrap",

                display: "grid",
                // "grid-template-rows": "repeat(10, 287px)",
                "grid-auto-rows": "300px",
                "grid-template-columns": "50% 50%",

                padding: "1em",

                position: "absolute",
                top: "10em",
                left: "20em",
                width: 840,//"60em",
                height: "40em"
                , "overflow-y": "scroll"
                , "overflow-x": "hidden",
                background: "rgba(255, 255, 255, 0.2)",
                border: "1px solid rgba(128, 128, 128, 0.5)",
            };


            var container = $("<div>")
                .css(containerCSS)//.hide()
                .appendTo("body");

            let title = $("<div>press 'space' to toggle menu, 'double-click' elements to maximise </div>")
                .css({
                    position: "absolute",
                    "pointer-events": "none",
                    width: "100%",
                    "font-size": "1em",
                    color: "rgba(255, 255, 255, 0.5)"
                });


            function toggleMenu() {
                container.toggle()
            }

            title.on("click", toggleMenu);

            container.append(title);


            Mousetrap.bind("space", toggleMenu);

            return container
        }

        var that = this;


        var container = createContainer();


        function createView(name = "View3D", speccs, isMaximised = false) {

            function maximiseView() {

                if (this.isMaximised()) return;
                container.hide();

                let maximisedContainer = $("#3d-graph");
                //globalEnv.scene=mGraphView.mScene
                var prevMaximisedElement = maximisedContainer.children(".view-3d");//("graph-view-3d")

                _.each(prevMaximisedElement, function (view) {

                    view.undoMaximise()

                });

                container.append(prevMaximisedElement);


                //TODO remove small bug with connectCallback in view3D recursion
                maximisedContainer.append(this);

                this.maximise()

            }


            let mGraphView = document.createElement("graph-view-3d");
            mGraphView.setCaption(name);


            if (that.isDebug()) {
                mGraphView.maxFPS = 10;

            }

            mGraphView.showFPSCounter = that.isDebug();


            $(mGraphView)
                .css(thumbCSS);

            $(mGraphView).on("dblclick", maximiseView);


            mGraphView.setSpeccs(speccs);

            //TODO per view ... mGraphView.mRenderer.domElement
            let events = new Mousetrap();


            var edgesVisible = true;
            events.bind("e", function () {
                edgesVisible = !edgesVisible;
                _.each(mGraphView.mRootCluster.getLeafs(), function (leaf) {
                    console.log("TODO toggling edges won't work because of LOD impl");
                    leaf.mEdgesContainer.visible = edgesVisible;
                    leaf.mEdgesContainer2.visible = edgesVisible

                })


            });

            var infoVisible = true;
            events.bind("h", function () {
                infoVisible = !infoVisible;
                $(".info-panel").toggle(infoVisible)


            });

            //FIXME
            if (isMaximised)
                maximiseView.bind(mGraphView)();
            /*$(mGraphView).on("loaded",function (){

             maximiseView.bind(mGraphView)()
             } );
             */

            $(window).on("resize", _.throttle(function () {
                //TODO use native events

                if (!mGraphView.isMaximised()) return;

                $(mGraphView).trigger("resize")
                //console.warn("TODO handle window resize + (f11)")
            }, 100));


            return mGraphView

        }


        let views = [];


        if (that.isDebug()) {


            //NOTE: target rendering
            var speccs = this.getForceSpeccs();
            let view2 = createView("new force-graph", speccs, true)
                .loadDataSet(this.getDSByID(1));
            views.push(view2);


            //TODO views should only be loaded when visible
            /*
             var speccs = this.getPossibleClusterSpeccsArray();
             let view1 = createView("dist test", speccs)
             .loadDataSet(this.getDSByID(1));
             views.push(view1)
             */


            /*

             let view3 = createView("node distribution test case",
             [{
             distribution: new BaseDistribution(2000, 3),
             options: { hull: new BoxVolume()}
             }])
             .loadDataSet(this.getDSByID(1))

             views.push(view3)
             */


            /*

             var speccs = this.get2DChartSortedSpeccsArray()

             let view4 = createView("2d-Barchart", speccs)
             .loadDataSet(this.getDSByID(1))
             views.push(view4)
             */


            /*  var speccs = this.getPossibleClusterSpeccsArray();
             let view1 = createView("View1", speccs)
             views.push(view1)*/

            /*
             var speccs = this.get2DPlaneCountryOnlySpeccs()
             let view5 = createView("2d-Plane country-only", speccs)
             views.push(view5)
             */

        } else {





            //NOTE: target rendering
            var speccs = this.getForceSpeccs();
            let view2 = createView("new force-graph", speccs, true)
                .loadDataSet(this.getDSByID(0));
            views.push(view2)


        }


        _.each(views, function (view) {
            if ($(view).parent().length == 0)
                container.append(view)
        })


    }


    get2DChartSortedSpeccsArray() {


        function countrySetGenerator(groupFunction, node) {

            groupFunction(node.group, node)
        }

        function industrySetGenerator(groupFunction, node) {
            groupFunction(node.industry, node)
        }

        function mySort(a, b) {
            return (a.mNodes.length < b.mNodes.length) ? 1 : -1;
            //return (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1;
        }

        return [
            {
                generator: countrySetGenerator,
                distribution: new BaseDistribution(4000, 2).onSort(mySort),
                options: {minClusterSize: 15, hull: BoxVolume}
            },
            {
                generator: industrySetGenerator,
                distribution: new BaseDistribution(2000, 1).onSort(mySort),
                options: {minClusterSize: 15, hull: BoxVolume}
            },
            {distribution: new BaseDistribution(200, 3), options: {minClusterSize: 15, hull: BoxVolume}}


        ]


    }


    get2DPlaneCountryOnlySpeccs() {


        function countrySetGenerator(groupFunction, node) {

            groupFunction(node.group, node)
        }

        function industrySetGenerator(groupFunction, node) {
            groupFunction(node.industry, node)
        }

        function mySort(a, b) {
            return (a.mNodes.length < b.mNodes.length) ? 1 : -1;
            //return (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1;
        }

        return [
            {
                generator: countrySetGenerator,
                distribution: new BaseDistribution(2000, 2).onSort(mySort),
                options: {minClusterSize: 15, hull: BoxVolume}
            },
            {distribution: new BaseDistribution(400, 2), options: {hull: new BoxVolume()}}


        ]


    }

    getPossibleClusterSpeccsArray() {

        function countrySetGenerator(groupFunction, node) {

            groupFunction(node.group, node)
        }

        function industrySetGenerator(groupFunction, node) {
            groupFunction(node.industry, node)
        }

        //using these 2 we should have a 2d plane with 3d cubes on it
        let sample1 = new BaseDistribution(40000, 2); //1000
        let sample2 = new ForceGraphDistribution(5000, 2);//200
        let sample3 = new BaseDistribution(100, 3);//50

        //  let rand2 = new RandomDistribution(200, 2)

        return [
            {generator: countrySetGenerator, distribution: sample1, options: {minClusterSize: 5, hull: BoxVolume}},
            {generator: industrySetGenerator, distribution: sample2, options: {minClusterSize: 5, hull: BoxVolume}},
            {distribution: sample3, options: {hull: BoxVolume}}


        ]

    }


    getForceSpeccs2DChangesOnly() {

        let speccs = this.getForceSpeccs();


        speccs[0].distribution = new BaseDistribution(45000, 2); // countries get placed equally on a plane of size 15k X 15k
        speccs[1].distribution = new BaseDistribution(10000, 2);// industries within countries use the Force-Graph approach to position elements
        speccs[2].distribution = new BaseDistribution(500, 3);//same g

        return speccs

    }


    /**
     * this is a sample configuration for  the cluster.
     * it contains 2 subdivisions:  -first into countries
     *                              -followed by industry
     *
     */
    getForceSpeccs() {


        //the function that is called to create the  country groups
        function countrySetGenerator(groupFunction, node) {
            // the group function takes 2 arguments
            // the first is the value that will determine the key of the group
            //in this case node.group contains country names
            //the second argument is the node itself that is passed into the group created
            groupFunction(node.group, node)
        }

        //same goes for the industy clusters that are sub-clusters of the country clusters in this example
        function industrySetGenerator(groupFunction, node) {
            groupFunction(node.industry, node)
        }


        //there are several distribution classes defined
        //these handle how the current cluster positions it's sub-clusters when rendering
        //basically a distribution function does have 2 parameters
        // the first is the maximum size in x/y/z direction the elements within can be placed
        // the second defined the dimensions 1/2/3 that get used for the element placement


        let countryDistribution = new BaseDistribution(45000, 2); // countries get placed equally on a plane of size 15k X 15k
        let industryDistribution = new ForceGraphDistribution(15000, 3);// industries within countries use the Force-Graph approach to position elements
        let nodesWithinIndustryDistribution = new ForceGraphDistribution(500, 3);//same goes for the nodes within each industry

        //the final configuration for rendering
        //it contains an additional options attribute per array entry

        // @param options.minClusterSize ... is the lower bound for the nodes within the cluster
        // if the cluster has fewer elements all clusters previously generated are places within this "other" cluster
        // @param options. defaultMergeGroupName the name of the "other" cluster can be changed by this value
        // @param options.hull can be used to add a volume around the cluster
        //by default if no value gets set, the BaseVolume class is used which is invisible by default
        //but is necessary for other components like picking and tet rendering


        let rootHull = this.isDebug() ? BoxVolume : BaseVolume;

        return [

            {
                generator: countrySetGenerator,
                distribution: countryDistribution,
                options: {minClusterSize: 40, hull: rootHull}
            },
            {
                generator: industrySetGenerator,
                distribution: industryDistribution,
                events: {
                    click: function () {
                        this.toggleCollapse()
                    }
                },
                options: {
                    minClusterSize: 15,
                    hull: ConvexVolume

                }// new BoxVolume() ConvexVolume//FIXME  this option is used twice for leaf and parent  and below is ignored
            }
            , {
                distribution: nodesWithinIndustryDistribution,
                options: {
                 hull: ConvexVolume
                },
                events: {
                    click: function () {
                      console.log("idle")
                    }
                },
            }  // this.getEllipsoidHull.bind(this)
            //FIXME getEllipsoidHullis not used

        ]

    }


    get2DPlaneForceSpeccs() {


        //the function that is called to create the  country groups
        function countrySetGenerator(groupFunction, node) {
            // the group function takes 2 arguments
            // the first is the value that will determine the key of the group
            //in this case node.group contains country names
            //the second argument is the node itself that is passed into the group created
            groupFunction(node.group, node)
        }

        //same goes for the industy clusters that are sub-clusters of the country clusters in this example
        function industrySetGenerator(groupFunction, node) {
            groupFunction(node.industry, node)
        }


        //there are several distribution classes defined
        //these handle how the current cluster positions it's sub-clusters when rendering
        //basically a distribution function does have 2 parameters
        // the first is the maximum size in x/y/z direction the elements within can be placed
        // the second defined the dimensions 1/2/3 that get used for the element placement


        //  let countryDistribution = new BaseDistribution(45000, 2); // countries get placed equally on a plane of size 15k X 15k
        let industryDistribution = new BaseDistribution(80000, 2);// industries within countries use the Force-Graph approach to position elements
        let nodesWithinIndustryDistribution = new ForceGraphDistribution(1000, 2);//same goes for the nodes within each industry

        //the final configuration for rendering
        //it contains an additional options attribute per array entry

        // @param options.minClusterSize ... is the lower bound for the nodes within the cluster
        // if the cluster has fewer elements all clusters previously generated are places within this "other" cluster
        // @param options. defaultMergeGroupName the name of the "other" cluster can be changed by this value
        // @param options.hull can be used to add a volume around the cluster
        //by default if no value gets set, the BaseVolume class is used which is invisible by default
        //but is necessary for other components like picking and tet rendering


        let rootHull = this.isDebug() ? BoxVolume : BaseVolume;

        return [

            /* {
             generator: countrySetGenerator,
             distribution: countryDistribution,
             options: {minClusterSize: 40, hull: rootHull }
             },*/
            {
                generator: industrySetGenerator,
                distribution: industryDistribution,
                options: {minClusterSize: 15, hull: ConvexVolume}// new BoxVolume() ConvexVolume//FIXME  this option is used twice for leaf and parent  and below is ignored
            }
            , {distribution: nodesWithinIndustryDistribution, hull: BoxVolume}  // this.getEllipsoidHull.bind(this)
            //FIXME getEllipsoidHullis not used

        ]

    }


    setDataSets(datasets) {
        this.mDataSets = datasets;

    }


    getDSByID(id) {
        return this.mDataSets[id]
    }

//-------------------------------


    zoomToPosition(position, onComplete) {


        let view = this.getCurrentView();

        ZoomUtil.moveToPosition(position, view.mCamera, view.mControls, 0, onComplete)
    }


    getCurrentView() {
        return $(".view-3d.view-3d-maximised").get(0)

    }

    setGraph2D() {


        /**
         * FIXME if a cluster has subclusters and no clustering is given use the existsing
         * likewise with distributions
         * currently the cluster gets cleaned first before the new visualisation is generated
         *
         *
         *
         */

            //   let speccs=this.getPossibleClusterSpeccsArray();

            //  let speccs=this.getForceSpeccs2DChangesOnly();
        let speccs = this.get2DPlaneForceSpeccs();

        let view = this.getCurrentView();
        let rootCluster = view.mRootCluster;

        rootCluster.cleanUpLeafs();
        //clean up previous clusters
        BaseCluster3D.cleanUpClusters(rootCluster.findClusters("*"), rootCluster);


        rootCluster.applyClustering(speccs);

        //TODO
        $(view).trigger("graph-changed");


        this.zoomToPosition(new THREE.Vector3(0, 0, 150000), () => {
            //TODO moake it work without line below...  currently needs another zoom call to be able to use controls again
            this.getCurrentView().mRootCluster.zoomToCluster(150000)

        });

        view.mControls.target.set(new THREE.Vector3(0, 0, 0));
        view.mControls.noRotate = true;
        view.mControls.reset();


        // view.mSkyDome.visible=false;

    }


    setGraph3D() {

        let speccs = this.getForceSpeccs();
        let view = this.getCurrentView();
        let rootCluster = view.mRootCluster;

        rootCluster.cleanUpLeafs();
        //clean up previous clusters
        BaseCluster3D.cleanUpClusters(rootCluster.findClusters("*"), rootCluster);


        rootCluster.applyClustering(speccs);

        //TODO text is shown to early on update
        $(view).trigger("graph-changed");


        view.mControls.noRotate = false;

        //view.mSkyDome.visible=true;


        this.getCurrentView().mRootCluster.zoomToCluster()
    }


}




	