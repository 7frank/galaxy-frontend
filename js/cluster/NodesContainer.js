/**
 *  TODO re-structure graph
 * -into graph + subgraphs or simply multiple graphs
 * -each graph may have distribution class/function which handles the layouting of the node/edges
 * -for example a node-set might divided into different sub-sets depending on current assosiations
 *  they may further contain sub-sets
 * - for rendering, these sets are going to be put into a container class like the "nodeClouds"
 * so a "nodesContainer" and a nodesClusterContainer will be needed which also have the distribution function
 */


import BaseDistribution from "./BaseDistribution"
import RandomDistribution from "./RandomDistribution"
import ForceGraphDistribution from "./ForceGraphDistribution"
import SphericalDistribution from "./SphericalDistribution"

import ClusterNodeArray from "./ClusterNodeArray"
import ClusterFactory from "./ClusterFactory"
import ClusterLeafElement from "./ClusterLeafElement"

import BaseCluster3D from "./BaseCluster3D"
import Cluster3DExtended from "./Cluster3DExtended"
import RootCluster from "./RootCluster"



//---------------------------
class GlobalNodesContainer {
    constructor(nodes) {
        this.mNodes = new ClusterNodeArray(...nodes)

        //TODO mClusters should work that way
        this.root = new THREE.Object3D()

    }


    applyClustering(arr) {
        let res = ClusterFactory.doSubdivideIntoClusters({root: this.mNodes}, arr)
        this.mClusters = res.root

        return this
    }


}
//---------------------------

export class MyGlobalNodesContainer extends GlobalNodesContainer {
    constructor(nodes) {
        super(nodes)

        this.createSample(nodes)

    }

    /**
     * code below for sample clustering
     *
     * -allNodes
     * --sameCompany
     * ---sameIndustry
     *
     */

    /*
    createSample(nodes) {


        //TODO re-merge function to be able to undo grouping for sizes < 40 like in the default implementation

        function countrySetGenerator(groupFunction, node) {

            groupFunction(node.group, node)
        }

        function industrySetGenerator(groupFunction, node) {
            groupFunction(node.industry, node)
        }

        //others migh be .. RandomDistribution
        let companyDistributionFunction = new BaseDistribution()
        let categoryDistributionFunction = new RandomDistribution()

        //if a distribution parameter is set, the generated cluster will use it to position the nodes depending on it
        // TODO is it of any use to be able to apply multiple distributions per cluster? like spherical,force-graph?
        //or is it better to create the force graph "by hand"
        this.applyClustering([
            {generator: countrySetGenerator, distribution: companyDistributionFunction, options: {minClusterSize: 15}},
            {generator: industrySetGenerator, distribution: categoryDistributionFunction, options: {minClusterSize: 5}}

        ])


    }
*/

}


//like cluster united states or united states+someindustry
export function getNodesFromCluster(clusters) {
    let _clusters = _.map(clusters, (c) => c.mNodes);

    return _.concat([], ..._clusters)

}

//helper function should be part of utils probably
//get relevant edges for a given (sub)set of nodes
//by default it will return a set of edges that are limited to the subset itself (edges that leave the cluster are ignored)
/**
 * @deprecated
 */

export function getEdgesForNodes(nodes, bInternal = true, bExternal = false) {

    if (nodes instanceof ClusterLeafElement) nodes = nodes.mNodes

    if (!bInternal && !bExternal) return []
    //get relevant edges from
    //a.clusters.mClusters.mClusters["United States"][0].mNodes

    var edges = [];

    _.each(nodes, function (node, id) {

        //check if it is a container element
        if (node instanceof ClusterLeafElement) {
            let _edges = getEdgesForNodes(node.mNodes, bInternal, bExternal)
            edges = edges.concat(_edges);
            edges = _.uniq(edges)
            return
        }

        _.each(node.edges, function (edge, id) {


            let srcContained = nodes.indexOf(edge.source) >= 0;
            let trgContained = nodes.indexOf(edge.target) >= 0;


            let isInternalNode = srcContained && trgContained;

            // console.log(srcContained,trgContained,isInternalNode)
            if (bInternal && isInternalNode || bExternal && !isInternalNode) {
                edges = edges.concat(node.edges);
                edges = _.uniq(edges)
            }

        })


    })


    return edges

}


//-----------------------------------------
//-----------DEBUG-------------------------
//-----------------------------------------

/**
 * currently used for debugging purposes
 */
export class MyMain {

    constructor() {


    }

    firstSample(){

        var a = new MyGlobalNodesContainer(globalNodes);
        globalEnv.scene.add(a.mClusters);
        a.mClusters.position.set(0, 1000, 0);

        this.clusters = a.mClusters.mClusters


    }




    getPossibleClusterSpeccsArray()
    {

        function countrySetGenerator(groupFunction, node) {

            groupFunction(node.group, node)
        }

        function industrySetGenerator(groupFunction, node) {
            groupFunction(node.industry, node)
        }

        //using these 2 we should have a 2d plane with 3d cubes on it
        let sample1 = new BaseDistribution(1000,2)
        let sample2 = new BaseDistribution(200,2)


        let sample3= new BaseDistribution(50,3)



       // let companyDistributionFunction = new BaseDistribution(200,3)
       // let categoryDistributionFunction = new RandomDistribution(100)


      //  let forceFraphDistribution = new ForceGraphDistribution(100,3)

        let rand2 = new RandomDistribution(200,2)

        return [
             {generator: countrySetGenerator, distribution: sample1, options: {minClusterSize: 3}},
            {generator: industrySetGenerator, distribution: sample2, options: {minClusterSize: 3}},
            {generator: industrySetGenerator, distribution: sample3, options: {minClusterSize: 3}},

             ,{distribution: sample3}

          //  ,{distribution: forceFraphDistribution}
           // ,{distribution: rand2}


      ]

    }

    betterSample()
    {
        let speccs=this.getPossibleClusterSpeccsArray();
//        var res= new BaseCluster3D(globalNodes,[speccs[0],speccs[1]]);
        var res= new RootCluster(globalNodes,[speccs[0],speccs[1],speccs[2]]);

        globalEnv.scene.add(res);
        res.position.set(0, 1000, 0);

        setTimeout(function()
        {
            //   res.updateCluster()
            res.updateTest()

        },1000 )


        this.clusters = res;

//random distribution on click


      function onClickFactory(res,speccs){
          var curr=0

         return function clickAndSpeccHandler(){



              var _dist=speccs[curr++%speccs.length].distribution

              console.log("setting distribution function",_dist)
              res.setDistributionHandler(   _dist  )

              //FIXME add complete handler
              setTimeout(function()
              {

                  res.updateTest()

              },1000 )



          }


      }


       let speccsRoot=[ {distribution: new BaseDistribution(2500,1)},{distribution: new BaseDistribution(1000,2)},{distribution: new BaseDistribution(800,3)},{distribution: new SphericalDistribution(800)}]
        res.on("click",onClickFactory(res,speccsRoot))


        _.each(res.mClusters,function(res){

            let speccsRoot=[ {distribution: new BaseDistribution(150,1)},{distribution: new BaseDistribution(100,2)},{distribution: new BaseDistribution(50,3)},{distribution: new ForceGraphDistribution(100,3)}]
            res.on("click",onClickFactory(res,speccsRoot))



        })


        //------------------------------




      return res


    }


    startForceGraphSampleOnSubsets(obj) {

        let clusters = this.clusters;


        if (typeof obj == "undefined")
            obj = "United States";


        let mNodes;
        var pcbs;
        //TODO refactor a cluster should already have the reference for its nodes
        if (typeof obj == "string") {
            mNodes = getNodesFromCluster(clusters[obj]);
            pcbs = _.map(clusters[obj], (c) => c.mParticles);


        }

        if (obj instanceof ClusterLeafElement) {
            mNodes = obj.mNodes

            pcbs = [obj.mParticles]
        }


        let mEdges = getEdgesForNodes(mNodes, true, false);


        this.startSimulation2(mNodes, mEdges, function layoutTick(layout, d3Nodes, d3Links) {

            // Update nodes position
            //TODO remove this when particle node groups work with picking and selecting
            d3Nodes.forEach(node => {

                const sphere = node._bubble;
                sphere.position.x = node.x;
                sphere.position.y = node.y || 0;
                sphere.position.z = node.z || 0;

            });

        }, function () {

            _.each(pcbs, function (pcElem) {
                //updates the array buffer for the point cloud
                pcElem.update()

            })

        });

        //start the force graph simulation
        //TODO this has to be placed within another sub class

    }


//TODO apply changes so that it works with e.g.g c and c.china and c.china.others in the same way
// for that the objects and arrays currently used should be THREE.Object3D at least

    startForceGraphSampleOnContainers(obj = "China") {
        var foobar = _.map(this.clusters[obj], (v, k) => v)
        var clusters = this.clusters

        let mNodes = foobar;
        let XNodes;
        //TODO refactor a cluster should already have the reference for its nodes
        if (typeof obj == "string") {
            XNodes = getNodesFromCluster(clusters[obj]);

        }

        //todo not working this way
        let mEdges = getEdgesForNodes(XNodes, true, false);


        this.startSimulation2(mNodes, mEdges, function layoutTick(layout, clusterContainers, d3Links) {


            // Update nodes position

            //TODO remove this when particle node groups work with picking and selecting
            clusterContainers.forEach(node => {

                const sphere = node;
                sphere.position.x = node.x;
                sphere.position.y = node.y || 0;
                sphere.position.z = node.z || 0;

            });


        });

        //start the force graph simulation
        //TODO this has to be placed within another sub class

    }


    //---------------------------------

    /**
     * a reduced simulation (for testing)
     *
     *
     * @param nodes
     * @param edges
     * @param onTick
     * @param onTICKComplete
     */
    startSimulation2(nodes, edges = [], onTick, onTICKComplete) {

        // Add force-directed layout
        let layout = d3_force.forceSimulation();

        //   console.log(... arguments)


        //FIXME containers need links
        layout
            .numDimensions(3)
            .nodes(nodes)
            .force('link', d3_force.forceLink().id(function (d) {
                return d._id
            })
                .distance(function computeLinkDistance() {
                    return 20;

                })
                .links(edges))
            .force("collide", d3_force.forceCollide(60)
                .iterations(1))
            .force('charge', (node) => -300)
            .force('linkStrength', (link) => 1)


            .stop();

        layout.on("tick", function () {
            onTick(layout, nodes, edges)
            if (onTICKComplete) onTICKComplete()
        }).on('end', function () {
        }).restart();

    }

    // --------------------------------
    startSimulation(nodes, edges, onTICKComplete) {

        // Add force-directed layout
        let layout = d3_force.forceSimulation();


        let cntTicks = 0;
        const startTickTime = new Date();

        function layoutTick(layout, d3Nodes, d3Links) {

            //console.error("tick tack", new Date() - startTickTime)

            /*  if (cntTicks++ > env.maxConvergeFrames || (new Date()) - startTickTime > env.maxConvergeTime) {
             layout.alpha(0); //trigger end
             layout.stop(); // Stop ticking graph
             }
             */
            // Update nodes position

            //TODO remove this when particle node groups work with picking and selecting
            d3Nodes.forEach(node => {

                const sphere = node._bubble;
                sphere.position.x = node.x;
                sphere.position.y = node.y || 0;
                sphere.position.z = node.z || 0;

            });

            // env.nodeClouds.update()

            //todo animationg this will currently not work
            /*	// Update links position
             d3Links.forEach(link => {

             link.setStartEnd(link.source, link.target)

             });

             */

            if (onTICKComplete)
                onTICKComplete()

        }


        layout
        //.numDimensions(env.numDimensions)
            .nodes(nodes)
            .force('link', d3_force.forceLink().id(function (d) {
                return d._id
            })
                .distance(function computeLinkDistance() {
                    return 20;

                }).links(edges))
            .force("collide", d3_force.forceCollide(60).iterations(1))
            //.force('charge', d3_force.forceManyBody())
            .force('charge', function (node) {

                return -300

            })
            .force('linkStrength', function (link) {

                return 1

            })

            //.force('gravity',function(){ return 0})
            //.force('charge',function(){ return 0})

            //.force('center', d3_force.forceCenter())

            .stop();


        //
        // handleConvexHullFeature()

        /*   for (let i = 0; i < env.initialEngineTicks; i++) {
         layout.tick();
         } // Initial ticks before starting to render
         */


        //hide text overlay and show after layout finishes
        //   env.textNode.hide()


        layout.on("tick", function () {

            layoutTick(layout, nodes, edges)
        }).on('end', function () {

            /*
             // Run this when the layout has finished!
             console.log("rendering graph finished.. use 'ctrl+s' to download result ")

             //set link positions for final node/link positions
             d3Links.forEach(link => {

             link.setStartEnd(link.source, link.target)

             });


             //trigger coloring //TODO this should be done earlier
             $(".cloudNodeColorSelect").val("group").trigger("change")

             //set update the cloud to be able to use it for text positioning
             if (env.nodeClouds)
             env.nodeClouds.updateBoundingSpheres();

             //start the node particle effect
             setTimeout(function () {
             if (env.particles)
             //env.particles.updateDestinations()
             env.particles.start()

             }, 1000)

             //set the text labels to the correct positions

             env.updateTextWhenCameraIsMoving()
             env.textNode.fadeIn(200)

             //createCloudCenterSphereForGroupsByID()
             //globalEnv.particles.pointCloud.visible=false;setVisibleGroups(null,false);setVisibleGroups(["United States"],true);createCloudCenterSphereForGroups(["United States"])

             */

        }).restart();

        //
        //  initDotParticles()


    }


}




	