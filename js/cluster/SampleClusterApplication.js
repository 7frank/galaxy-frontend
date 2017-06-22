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
import SimpleForceGraphView3D from "../view/SimpleForceGraphView3D"


import BoxVolume from "./hull/BoxVolume"

//-----------------------------------------
//-----------DEBUG-------------------------
//-----------------------------------------


export {Cluster3DExtended}

/**
 * currently used for debugging purposes
 */
export class MyMain {

    constructor(datasets) {
        this.setDataSets(datasets)
        this.setupViews()


        //  this.clusters = this.init();


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
        let _size = boundingBox.getSize()

        var sphereGeometry = new THREE.EllipsoidGeometry(_size.x, _size.y, _size.z)

        let hull = new THREE.Mesh(sphereGeometry, this.getDefaultHullMaterial())
        // hull.position.copy(_center)

        return hull

    }

    getBoxHull(boundingBox) {
    return new BoxVolume().createFromBoundingBox(boundingBox)
      /*  let _center = boundingBox.getCenter();
        let _size = boundingBox.getSize()

        var box = new THREE.BoxGeometry(_size.x, _size.y, _size.z)

        var geo = new THREE.EdgesGeometry(box); // or WireframeGeometry( geometry )

        var mat = new THREE.LineBasicMaterial({color: 0xffffff, linewidth: 5, opacity: 0.1, transparent: true});

        var wireframe = new THREE.LineSegments(geo, mat);
        wireframe.position.add(_center)
        wireframe.geometry.boundingBox=boundingBox

        return wireframe
*/

    }


    getRingHull(boundingBox) {

        let boundingSphere = new THREE.Sphere;
        //get center, radius
        let _center = boundingBox.getCenter();
        let _size = boundingBox.getSize()
        let radius = _size.length() / 2;
        //TODO
        if (radius < 40) radius = 40

        boundingSphere.radius = radius;

        let ringGeometry = new THREE.RingGeometry(boundingSphere.radius * 0.95, boundingSphere.radius, 32);


        ringGeometry.boundingSphere = boundingSphere


        let hull = new THREE.Mesh(ringGeometry, this.getDefaultHullMaterial())


        hull.onBeforeRender = function (renderer, scene, camera, geometry, material, group) {
            //billboard effect
            this.setRotationFromQuaternion(camera.quaternion)
            //     console.warn(camera.quaternion.x,camera.quaternion.y)

        }

        return hull
    }


    setupViews() {
        const thumbCSS = {
            "pointer-events": "all",
            height: 300,
            width: 400,
            display: "flex",
            "border": "1px solid rgba(128, 128, 128, 0.5)",
            margin: "0.2em"
        }


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
            }


            var container = $("<div>")
                .css(containerCSS)
                .appendTo("body")

            let title = $("<div>press 'space' to toggle menu, 'double-click' elements to maximise </div>")
                .css({
                    position: "absolute",
                    "pointer-events": "none",
                    width: "100%",
                    "font-size": "1em",
                    color: "rgba(255, 255, 255, 0.5)"
                })


            function toggleMenu() {
                container.toggle()
            }

            title.on("click", toggleMenu)

            container.append(title)


            Mousetrap.bind("space", toggleMenu)

            return container
        }

        var that = this


        var container = createContainer()


        function createDefaultView(name = "View3D") {

            let mGraphView = document.createElement("simple-force-graph-view-3d")//("view-3d")


            customElements.whenDefined("simple-force-graph-view-3d").then(function () {


                if (mGraphView.setCaption)
                    mGraphView.setCaption(name)

                $(mGraphView)
                    .css(thumbCSS)

                $(mGraphView).on("dblclick", function () {

                    if (mGraphView.isMaximised()) return

                    container.toggle()

                    let maximisedContainer = $("#3d-graph")

                    var prevMaximisedElement = maximisedContainer.children(".view-3d");//("graph-view-3d")

                    _.each(prevMaximisedElement, function (view) {

                        view.undoMaximise() //

                    })

                    container.append(prevMaximisedElement)

                    //--------
                    maximisedContainer.append(this)
                    this.maximise()


                })


            })
            var setData = mGraphView.setData
            mGraphView.setData = function (data) {

                customElements.whenDefined("simple-force-graph-view-3d").then(function () {

                    setData.call(mGraphView, data)

                })

            }

            return mGraphView

        }


        function createView(name = "View3D", speccs) {

            let mGraphView = document.createElement("graph-view-3d")
            mGraphView.setCaption(name)

            $(mGraphView)
                .css(thumbCSS)

            $(mGraphView).on("dblclick", function () {

                if (mGraphView.isMaximised()) return
                container.toggle()

                let maximisedContainer = $("#3d-graph")
                //globalEnv.scene=mGraphView.mScene
                var prevMaximisedElement = maximisedContainer.children(".view-3d")//("graph-view-3d")

                _.each(prevMaximisedElement, function (view) {

                    view.undoMaximise()

                })

                container.append(prevMaximisedElement)
                maximisedContainer.append(this)


                this.maximise()

            })


            mGraphView.setSpeccs(speccs)

            //TODO per view ... mGraphView.mRenderer.domElement
            let events= new Mousetrap();


           var edgesVisible=true;
            events.bind("e",function(){
                edgesVisible=!edgesVisible;
                _.each(mGraphView.mRootCluster.getLeafs(),function(leaf){

                    leaf.mEdgesContainer.visible=edgesVisible

                })


            })

            var infoVisible=true;
            events.bind("h",function(){
                infoVisible=!infoVisible;
                $(".info-panel").toggle(infoVisible)


            })





            return mGraphView

        }


        let views = []



        if(window.location.hash=="#debug") {


            //NOTE: target rendering
            var speccs = this.getForceSpeccs()
            let view2 = createView("new force-graph", speccs)
                .loadDataSet(this.getDSByID(1))
            views.push(view2)



            let view3 = createView("node distribution test case",
                [{
                    distribution: new BaseDistribution(2000, 3),
                    options: { hull: this.getBoxHull}
                }])
                .loadDataSet(this.getDSByID(1))

            views.push(view3)


            var speccs = this.get2DChartSortedSpeccsArray()

            let view4 = createView("2d-Barchart", speccs)
                .loadDataSet(this.getDSByID(1))
            views.push(view4)

            /*  var speccs = this.getPossibleClusterSpeccsArray();//FIXME speccs does have 4 elements 0,1,3?
             let view1 = createView("View1", speccs)
             views.push(view1)*/

            /*
             var speccs = this.get2DPlaneCountryOnlySpeccs()
             let view5 = createView("2d-Plane country-only", speccs)
             views.push(view5)
             */

        } else {





            //NOTE: target rendering
             var speccs = this.getForceSpeccs()
             let view2 = createView("new force-graph", speccs)
             .loadDataSet(this.getDSByID(0))
             views.push(view2)



        }


        let view0 = createDefaultView("previous force-graph")
            .loadDataSet(this.getDSByID(1))
        views.push(view0)





        _.each(views, function (view) {
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
                options: {minClusterSize: 15, hull: this.getBoxHull}
            },
            {
                generator: industrySetGenerator,
                distribution: new BaseDistribution(2000, 1).onSort(mySort),
                options: {minClusterSize: 15, hull: this.getBoxHull}
            },
            {distribution: new BaseDistribution(200, 3), options: {minClusterSize: 15, hull: this.getBoxHull}}


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
                options: {minClusterSize: 15, hull: this.getBoxHull}
            },
            {distribution: new BaseDistribution(400, 2),  options: { hull: this.getBoxHull}}


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
        let sample1 = new BaseDistribution(40000, 2) //1000
        let sample2 = new BaseDistribution(5000, 2)//200
        let sample3 = new BaseDistribution(100, 3)//50

        //  let rand2 = new RandomDistribution(200, 2)

        return [
            {generator: countrySetGenerator, distribution: sample1, options: {minClusterSize: 15}},
            {generator: industrySetGenerator, distribution: sample2, options: {minClusterSize: 15}},
            {distribution: sample3}


        ]

    }

    getForceSpeccs() {

        function countrySetGenerator(groupFunction, node) {

            groupFunction(node.group, node)
        }

        function industrySetGenerator(groupFunction, node) {
            groupFunction(node.industry, node)
        }

        //using these 2 we should have a 2d plane with 3d cubes on it
        let sample1 = new BaseDistribution(15000, 2) //1000
        let sample2 = new ForceGraphDistribution(3000, 3)//200
        let sample3 = new ForceGraphDistribution(500, 3)//50

        //  let rand2 = new RandomDistribution(200, 2)

        return [
            {
                generator: countrySetGenerator,
                distribution: sample1,
                options: {minClusterSize: 40}
            },
            {
                generator: industrySetGenerator,
                distribution: sample2,
                options: {minClusterSize: 15, hull: this.getBoxHull} //FIXME  this option is used twice for leaf and parent  and below is ignored
            }
            , {distribution: sample3, hull: this.getEllipsoidHull.bind(this)}
            //FIXME getEllipsoidHullis not used

        ]

    }


    setDataSets(datasets) {
        this.mDataSets = datasets;

    }


    getDSByID(id) {
        return this.mDataSets[id]
    }


}




	