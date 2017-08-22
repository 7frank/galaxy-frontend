/**
 * Created by Frank on 02.06.2017.
 */

import BaseDistribution from "./BaseDistribution"

import EdgeUtil from "../EdgeUtil"

import BaseCluster3D from "../BaseCluster3D"

import RoundRobin from "../utils/RoundRobin"
/*
 * TODO the forceGraphDistribution should work like a normal force graph
 * but optimally is could use a initial distribution from another dist function with no animation enabled
 *
 * */


export default class ForceGraphDistribution extends BaseDistribution {
    constructor(scale = 50, dimensions = 1) {
        super(scale, dimensions);


        this.initialEngineTicks = 0;

        // NOTE: using values lower than 3000ms and 90 frames to stop the force graph will sometimes show the nodes in a line instead
        this.maxConvergeTime = 5000//2000;//ms ... 5 seconds upper bound for loading phase
        this.maxConvergeFrames = 400//90//frames  ... for slower machines the time will be reached earlier for faster it will hit th frame limit earlier

    }

    queue() {
        if (!this.constructor._queue) this.constructor._queue = new RoundRobin()
        return this.constructor._queue

    }


    /**
     * a reduced simulation (for testing)
     * TODO add edges and rest of original src
     * @param nodes
     * @param edges
     * @param onTick
     * @param onTICKComplete
     */
    startSimulation(nodes, edges = [], onTick, onComplete) {


        var that = this;


        // Add force-directed layout
        let layout = d3_force.forceSimulation();


        var scale = this.mScale;

        //TODO containers need links
        layout
            .numDimensions(this.dimensions)
            .nodes(nodes)
            .force('link', d3_force.forceLink().id(function (d) {
                    return d._id
                })
                    .distance(function computeLinkDistance() {
                        return scale / 5;

                    })
                    .links(edges)
            )
            .force('charge', (node) => -scale / 5)
            .force('linkStrength', (link) => 1)
            // .force("collide", d3_force.forceCollide(scale/10).iterations(1))
            .stop();


        //enable collision only for clusters not for leafs to improve performance
        if (nodes.length > 0 && nodes[0]._el && nodes[0]._el instanceof BaseCluster3D)
            layout.force("collide", d3_force
                .forceCollide(scale / 2)

                /*
                //TODO this isn't doing much for us currently
                 //-improve node size value by updating it when hull is generated to
                 //
                .radius(function (node) {

                    //NOTE: can't use radius here because it is not already generated
                    //   let backupVal=1//that.dimensions*scale/nodes.length;
                    //   let rad=backupVal//node._el?node._el.getRadius()*10: backupVal;
                    return scale/nodes.length  //  node.size * 10 || 1//rad
                })
                */
                .iterations(2))



        for (let i = 0; i < this.initialEngineTicks; i++) {
            layout.tick();
        } // Initial ticks before starting to render

        let cntTicks = 0;
        const startTickTime = new Date();


        this.queue().add(function onQueue() {

            if (cntTicks++ > that.maxConvergeFrames || (new Date()) - startTickTime > that.maxConvergeTime) {
                layout.alpha(0); //trigger end
                layout.stop(); // Stop ticking graph
            }

            layout.tick();
            onTick(layout, nodes, edges)
            if (layout.alpha() == 0) {
                that.queue().remove(onQueue)
                if (onComplete) onComplete()
            }
        })


        layout// .on('start', start)
            .on("tick", function () {

                if (cntTicks++ > that.maxConvergeFrames || (new Date()) - startTickTime > that.maxConvergeTime) {
                    layout.alpha(0); //trigger end
                    layout.stop(); // Stop ticking graph
                }

                onTick(layout, nodes, edges)

            }).on('end', function () {

            if (onComplete) onComplete()

        })
        //.restart();


    }


    //TODO nodes + setNodes should provide an instanceof BaseCluster3D as default or an array of node primitives
    //in both cases we can determine the edges from it

    setNodes(nodes, onNodePositionChange, onStep, onComplete) {


        if (!nodes instanceof BaseCluster3D && !_.isArray(nodes)) throw new Error("not supported, must be array of nodes or BaseClester3D");


        let mEdges = [];
        let mNodes = [];
        //in case nodes are instance of BaseNode3D
        if (nodes instanceof BaseCluster3D) {


            //TODO this part might not to be used at all currently
            mEdges = nodes.createEdgesForChildClusters();


            mEdges.forEach(function (edge) {
                edge.source = edge.source.position;
                edge.target = edge.target.position;

            });

            mNodes = Object.values(nodes.mClusters).map(function (n) {
                //add a back reference to the cluster
                n.position._el = n;

                return n.position;
            });


        }
        else if (_.isArray(nodes)) {
            mNodes = nodes.map(function (n) {
                //mEdges   = EdgeUtil.getEdgesForNodes(nodes, true, false);
                mEdges = mEdges.concat(n.edges);
                n.x = n.x || 0;
                n.y = n.y || 0;
                n.z = n.z || 0;
                return n;
            });
        }

        this.startSimulation(mNodes, mEdges, function layoutTick(layout, d3Nodes, d3Links) {

            //handle each node callback
            _.each(d3Nodes, onNodePositionChange);
            //handle step callback
            if (onStep)
                onStep(layout.alpha())

        }, onComplete);


    }

    //this is called to distribute the elements
    //TODO add rotation as well in the future

    distribute(node, dx, dy, dz) {

        return {position: new THREE.Vector3(0, 0, 0)}

        //  return {position:new THREE.Vector3(dx,dy,dz).multiplyScalar(this.mScale)};

    }
}

