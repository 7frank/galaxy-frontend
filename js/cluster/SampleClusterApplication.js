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


//-----------------------------------------
//-----------DEBUG-------------------------
//-----------------------------------------


export {Cluster3DExtended}
/**
 * currently used for debugging purposes
 */
export class MyMain {

    constructor() {

        this.clusters = this.init();
       this.runSample1();
    }

    getPossibleClusterSpeccsArray() {

        function countrySetGenerator(groupFunction, node) {

            groupFunction(node.group, node)
        }

        function industrySetGenerator(groupFunction, node) {
            groupFunction(node.industry, node)
        }

        //using these 2 we should have a 2d plane with 3d cubes on it
        let sample1 = new BaseDistribution(1000, 2)
        let sample2 = new BaseDistribution(200, 2)


        let sample3 = new BaseDistribution(50, 3)

        let rand2 = new RandomDistribution(200, 2)

        return [
            {generator: countrySetGenerator, distribution: sample1, options: {minClusterSize: 3}},
            {generator: industrySetGenerator, distribution: sample2, options: {minClusterSize: 3}},
            {generator: industrySetGenerator, distribution: sample3, options: {minClusterSize: 3}},

            , {distribution: sample3}


        ]

    }

    init()
    {
        let speccs = this.getPossibleClusterSpeccsArray();
       // var res = new RootCluster(globalNodes, [speccs[0], speccs[1], speccs[2]]);
       var res = new RootCluster(globalNodes);

        globalEnv.scene.add(res);
        res.position.set(0, 10000, 0);

        return res



    }


    runSample1() {
        console.log("runSample1")
        let speccs = this.getPossibleClusterSpeccsArray();

        this.clusters.applyClustering([speccs[0], speccs[1], speccs[2]])


    }


    runSample2() {
        console.log("runSample2")
        let speccs = this.getPossibleClusterSpeccsArray();
        var res = new RootCluster(globalNodes, [speccs[1],speccs[0], speccs[2]]);


        this.clusters.applyClustering([speccs[1],speccs[0], speccs[2]])

      return

      /*  let speccs = this.getPossibleClusterSpeccsArray();
        var res = new RootCluster(globalNodes, [speccs[1],speccs[0], speccs[2]]);

        globalEnv.scene.add(res);
        res.position.set(5000, 10000, 0);

        return res*/

    }

    runSample3() {
        console.log("runSample3")
        let defaultEntry={distribution:new DefaultDistribution()}

        this.clusters.applyClustering([defaultEntry])



    }




}




	