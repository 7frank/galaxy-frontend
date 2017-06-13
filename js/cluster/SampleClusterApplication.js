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

        var container = $("<div>")
            .css({display:"flex",position: "absolute", top: "10em", left: "20em", width: "60em"})
            .appendTo("body")

        let thumbCSS = {
            height: 150,
            width: "200",
            display: "flex",
            border: "1px solid rgba(128, 128, 128, 0.5)",
            margin:"0.2em"
        }

        var that=this

        var speccs=[].concat(this.getPossibleClusterSpeccsArray());//FIXME speccs does have 4 elements 0,1,3?
        function loadData() {

            if (!that.mGraphData) {
                console.warn("data not loaded")
                return ;
            }

            let mSpeccs=[speccs[0], speccs[1], speccs[3]]

            this.setSpeccs(mSpeccs).setData(that.mGraphData)
        }


        let mGraphView1 = document.createElement("graph-view-3d")

        $(mGraphView1)
            .css(thumbCSS)



        $(mGraphView1).on("click",loadData )


        let mGraphView2 = document.createElement("graph-view-3d")
        $(mGraphView2)
            .css(thumbCSS)

        $(mGraphView2).on("click",loadData )


        //$(this).on("data-changed",function(){})



        container.append(mGraphView1, mGraphView2)


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

            , {distribution: sample3}


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
        let sample1 = new ForceGraphDistribution(40000, 3) //1000
        let sample2 = new ForceGraphDistribution(5000, 3)//200
        let sample3 = new ForceGraphDistribution(100, 3)//50

        //  let rand2 = new RandomDistribution(200, 2)

        return [
            {generator: countrySetGenerator, distribution: sample1, options: {minClusterSize: 15}},
            {generator: industrySetGenerator, distribution: sample2, options: {minClusterSize: 15}}
            , {distribution: sample3}


        ]

    }


    setGraphData(graphData) {
        this.mGraphData = graphData;
       // this.init(mGraphData);

        //TODO
        //$(this).trigger("data-changed")

    }



    runSample1() {
        console.log("runSample1")
        let speccs = this.getPossibleClusterSpeccsArray();

        this.clusters.applyClustering([speccs[0], speccs[1], speccs[2]])


    }


    runSample2() {
        console.log("runSample2")
        let speccs = this.getForceSpeccs();

        this.clusters.applyClustering(speccs);
    }

    runSample3() {
        console.log("runSample3")
        let defaultEntry = {distribution: new BaseDistribution(4000, 2)}

        this.clusters.applyClustering([defaultEntry])


    }

    runSample4() {
        console.log("runSample4")
        let defaultEntry = {distribution: new DefaultDistribution()}

        this.clusters.applyClustering([defaultEntry])


    }


}




	