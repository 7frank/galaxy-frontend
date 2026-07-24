/**
 * Created by Frank on 02.06.2017.
 */

import BaseDistribution from "./BaseDistribution"


import BaseCluster3D from "../BaseCluster3D"

import RoundRobin from "../utils/AnimationFrameBasedScheduler"

import { Vector3 } from "three/src/math/Vector3.js";
import * as _ from "lodash";
import * as d3_force from "d3-force-3d";


/*
 * ForceGraphDistribution implements a distribution animation using a force graph simulation.
 *
 * Because the force graph distribution might be more resource consuming especially with a bigger node set,
 * in addition a queue-like approach is used.
 * This way all instances of the ForceGraphDistribution share one queue that guarantees that all simultaniously running distribution processes
 * get an equal amount of cpu time.
 *
 * NOTE: As a side effect it is possible that on low cpu machines the distribution looks
 *         different because not as many cycles are run within the same time frame.
 *
 * NOTE: To improve performance, when using this class, a second distribution function might be called previously
 *          to have the nodes pre-positioned

 * */


export default class ForceGraphDistribution extends BaseDistribution {

    /**
     * the default constructor
     * {@link BaseDistribution}
     *
     */

    constructor(scale = 50, dimensions = 1) {
        super(scale, dimensions);


        this.initialEngineTicks = 200;

        this.maxConvergeTime = 9000;
        this.maxConvergeFrames = 700;

    }


    /**
     * A queue shared among all instances of ForceGraphDistribution so all get an equal amount of cpu time to interpolate.
     * This approach makes the rendering smoother conpared to not using a queue.
     **/
    queue() {
        if (!this.constructor._queue) this.constructor._queue = new RoundRobin()
        return this.constructor._queue

    }


    /**
     * The core of the force graph simulation using a queue to smooth out rendering.
     * NOTE: only a subset of possible options is used to improve performance for large amounts of nodes.
     *   For a full set of options see the online documentation for {@link d3_force.forceSimulation}
     *
     * @param nodes ... an array of nodes for the graph
     * @param edges ... an array of edges representing a relation between certain nodes
     * @param onTick ... a callback function which is triggered each tick (whenever one batch was iterated) of the simulation
     * @param onComplete  ... a callback function triggered when the simulation has finished
     */
    startSimulation(nodes, edges = [], onTick, onComplete) {


        var that = this;


        // Add force-directed layout
        let layout = d3_force.forceSimulation();


        var scale = this.mScale;

        //TODO containers need links
        layout
            .numDimensions(this.dimensions)
            .alphaDecay(0.05)
            .velocityDecay(0.6)
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
        if (nodes.length > 0 && nodes[0]._el && nodes[0]._el instanceof BaseCluster3D) {
            const is2D = this.dimensions < 3;
            const collideRadius = is2D ? scale * 1.2 : scale / 2;
            const collideIterations = is2D ? 8 : 2;
            layout.force("collide", d3_force
                .forceCollide(collideRadius)
                .iterations(collideIterations));
            if (is2D) {
                layout
                    .force("forceX", d3_force.forceX(0).strength(0.05))
                    .force("forceY", d3_force.forceY(0).strength(0.05));
            }
        }


        for (let i = 0; i < this.initialEngineTicks; i++) {
            layout.tick();
        } // Initial ticks before starting to render

        let cntTicks = 0;
        const startTickTime = new Date();
        var alphaAbort = 0.01

        this.queue().add(function onQueue() {

            if (cntTicks++ > that.maxConvergeFrames || (new Date()) - startTickTime > that.maxConvergeTime || layout.alpha() < alphaAbort) {
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
        /*  .on("tick", function () {

              if (cntTicks++ > that.maxConvergeFrames || (new Date()) - startTickTime > that.maxConvergeTime ) {
                  layout.alpha(0); //trigger end
                  layout.stop(); // Stop ticking graph
              }

              onTick(layout, nodes, edges)

          })*/
            .on('end', function () {

                if (onComplete) onComplete()

            })
        //.restart();


    }


    /**
     *
     *  For further information: {@link BaseDistribution.setNodes}
     *
     * @param nodes ...  should be an instanceof BaseCluster3D as default or an array of node primitives
     *               Those are used to determine the edges / links for the simulation
     */
    setNodes(nodes, onNodePositionChange, onStep, onComplete) {


        if (!(nodes instanceof BaseCluster3D) && !_.isArray(nodes)) throw new Error("not supported, must be array of nodes or BaseClester3D");


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

        var that = this
        _.each(mNodes, function (n) {
            //reset y,z dimension of dist to to animate node onto the plane it should be
            if (that.dimensions < 3) n.z = 0;
            if (that.dimensions < 2) n.y = 0;

        })

        this.startSimulation(mNodes, mEdges, function layoutTick(layout, d3Nodes, d3Links) {

            //handle each node callback
            _.each(d3Nodes, onNodePositionChange);
            //handle step callback
            if (onStep)
                onStep(layout.alpha())

        }, onComplete);


    }

    /**
     * Although the distribution function is not used by the ForceGraphDistribution it is overridden for clarification.
     *
     **/

    distribute(node, dx, dy, dz) {

        return {position: new Vector3(0, 0, 0)}

    }
}

