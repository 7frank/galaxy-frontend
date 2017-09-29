import MaterialFadeMixin from "../../utils/MaterialFadeMixin";
import ClusterBaseEdges from "./ClusterBaseEdges";
import {MeshLine, MeshLineMaterial} from "three.meshline"
import BaseCluster3D from "../BaseCluster3D";

import * as THREE from "three";
import * as _ from "lodash";


/**
 * the default implementation for the cluster-to-neighboring-clusters edges
 *
 *
 * simple/fast/no width support (line width = 1)
 *
 */




export default class ClusterMeshEdges extends ClusterBaseEdges {

    constructor(...args) {
        super(...args)

        this.smoothenWidth = true;
        this.minLinkStrength=0
    }


    getDefaultMaterial(options) {


        let defaults = {
            opacity: 1.0,
            transparent: true,
            //lineIsVisible:true, // if disabled the line won't be shown on the scene
            color: 0x999999
        };

        options = _.extend(defaults, options);


        //TODO wireframe meshlines to check if minimal triangle count
        var material = new MeshLineMaterial({
            lineWidth: 1,
            color: new THREE.Color(options.color),
            transparent: options.transparent,
            opacity: options.opacity,
            depthTest: true,
            depthWrite: false
        });

        MaterialFadeMixin(material);


        return material;

    }


    update() {


        //remove previously generated MeshLines

        for (var i = this.children.length - 1; i >= 0; i--) {
            this.remove(this.children[i]);
        }


        //------------------------------------

        let edges = this.createEdgesForClusters(this.mClusters);


        if (edges.length==0) return

        var line_geom = new THREE.Geometry();


        this.geometry.dispose();
        this.geometry = line_geom;

        var that=this
        var invalidEdges = [];


        //TODO sort and show only certain amount of edges based on relative size

        var orderedEdges = _.orderBy(edges, ['link_strength'], ['desc']);
        that.minLinkStrength=0.4*orderedEdges[0].link_strength;//set minLinkStrength to pass the test to 40% of biggest edge


        for (let edge of edges) {
            //TODO we should unify the edges to not always have 2 separate ways to access certain elements
            //TODO also we should use the center of the hull feature instead
            //FIXME for cluster: add edges only if mHull exists

           if (edge.link_strength<that.minLinkStrength) continue;

            let src, dst;

            let s, d;
            s = edge.source instanceof BaseCluster3D ? edge.source : edge.source._el;
            d = edge.target instanceof BaseCluster3D ? edge.target : edge.target._el;

            if (!s || !d) {
                invalidEdges.push(edge);
                continue
            }

            src = this.getPositionForElement(s);
            dst = this.getPositionForElement(d);

            //Note: currently there is no need to cut off edges because they are only drawn from src to dest
            //cut off dst at 50% because the element should occure twice
            // let l_50=dst.clone().sub(src).multiplyScalar(0.5)
            // dst.sub(l_50)

            // line_geom.vertices.push(src);
            //  line_geom.vertices.push(dst);

            //----------------------------------
            //TODO have an option to change the line implementation
            var geometry = new THREE.Geometry();
            geometry.vertices.push(src);


            let widthFN;
            if (this.smoothenWidth == false)
                geometry.vertices.push(dst);
            else {

                // smoothing the line with like in the demo

                for (let i = 0; i <= 1; i += 0.1)
                    geometry.vertices.push(src.clone().lerp(dst, i));

                function parabola(x, k) {
                    return Math.pow(4 * x * ( 1 - x ), k);
                }

                widthFN=function widthFunction(p) {

                    return 1
                    // return 1 * parabola(p, 1)
                }
            }

            var meshLine = new MeshLine();
            meshLine.setGeometry(geometry, widthFN);


            //TODO
            var material = new MeshLineMaterial({
                lineWidth: edge.link_strength/5 || 1, //TODO have a proper width
                color: new THREE.Color(0x333333),
                transparent: true,
                opacity: 0.5,

                depthTest: false,
                depthWrite: false
            });
            // var material = new MeshLineMaterial();


            //TODO material group for lineWidth feature + only one material
            //  material.copy(this.material);
            // material.lineWidth = edge.link_strength;


            if (edge.link_strength == undefined)
                console.error("edge does not have a link_strength''")


            var mesh = new THREE.Mesh(meshLine.geometry, material); // this syntax could definitely be improved!
            mesh.layers.set(1)

            this.add(mesh);


        }


        if (invalidEdges.length > 0)
            console.error("invalid edges", invalidEdges)


    }


}
