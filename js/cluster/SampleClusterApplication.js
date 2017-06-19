/**
 *  TODO re-structure graph
 * -into graph + subgraphs or simply multiple graphs
 * -each graph may have distribution class/function which handles the layouting of the node/edges
 * -for example a node-set might divided into different sub-sets depending on current assosiations
 *  they may further contain sub-sets
 * - for rendering, these sets are going to be put into a container class like the "nodeClouds"
 * so a "nodesContainer" and a nodesClusterContainer will be needed which also have the distribution function
 */


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


//-----------------------------------------
//-----------DEBUG-------------------------
//-----------------------------------------


export {Cluster3DExtended}

/**
 * currently used for debugging purposes
 */
export class MyMain {

    constructor() {

        this.setupViews()


        //  this.clusters = this.init();


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

                padding:"1em",

                position: "absolute",
                top: "10em",
                left: "20em",
                width: 840,//"60em",
                height:"40em"
                ,"overflow-y":"scroll"
                ,"overflow-x":"hidden",
                background:"rgba(255, 255, 255, 0.2)",
                border: "1px solid rgba(128, 128, 128, 0.5)",
            }


            var container = $("<div>")
                .css(containerCSS)
                .appendTo("body")

            let title = $("<div>press 'space' to toggle menu, 'double-click' elements to maximise </div>")
                .css({position: "absolute","pointer-events": "none",width: "100%", "font-size": "1em",color: "rgba(255, 255, 255, 0.5)"})


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

                    container.toggle()

                    let maximisedContainer = $("#3d-graph")
                    //globalEnv.scene=mGraphView.mScene
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

            return mGraphView

        }


        let views = []

/*
        let view0 = createDefaultView("previous force-graph")
        views.push(view0)
*/
      /*  var speccs = this.getPossibleClusterSpeccsArray();//FIXME speccs does have 4 elements 0,1,3?
        let view1 = createView("View1", speccs)
        views.push(view1)*/


        var speccs = this.getForceSpeccs()
        let view2 = createView("new force-graph", speccs)
        views.push(view2)


        let view3 = createView("node distribution test case", [{distribution: new BaseDistribution(2000, 3)}])
        views.push(view3)
        /*
        var speccs = this.get2DChartSortedSpeccsArray()

        let view4 = createView("2d-Barchart", speccs)
        views.push(view4)

        var speccs = this.get2DPlaneCountryOnlySpeccs()
        let view5 = createView("2d-Plane country-only", speccs)
        views.push(view5)
*/


        //------------------------------------
        $(this).on("data-changed", loadAll)
        if (that.mGraphData) loadAll()

        function loadAll() {


            _.each(views, function (view) {
                view.setData(that.mGraphData)

            })
            $(".cloudNodeColorSelect").val("group").trigger("change")
        }

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
                distribution: new BaseDistribution(1000, 1).onSort(mySort),
                options: {minClusterSize: 15}
            },
            {
                generator: industrySetGenerator,
                distribution: new BaseDistribution(200, 1).onSort(mySort),
                options: {minClusterSize: 15}
            },
            {distribution: new BaseDistribution(50, 2)}


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
                options: {minClusterSize: 15}
            },
            {distribution: new BaseDistribution(400, 2)}


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
        let sample1 = new ForceGraphDistribution(4000, 3) //1000
        let sample2 = new ForceGraphDistribution(1000, 3)//200
        let sample3 = new ForceGraphDistribution(500, 3)//50

        //  let rand2 = new RandomDistribution(200, 2)

        return [
            {generator: countrySetGenerator, distribution: sample1, options: {minClusterSize: 40}},
            {generator: industrySetGenerator, distribution: sample2, options: {minClusterSize: 15}}
            , {distribution: sample3}


        ]

    }


    setGraphData(graphData) {
        this.mGraphData = graphData;
        // this.init(mGraphData);

        $(this).trigger("data-changed")

    }


}




	