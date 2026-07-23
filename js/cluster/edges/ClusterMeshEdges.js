import MaterialFadeMixin from "../../utils/MaterialFadeMixin";
import ClusterBaseEdges from "./ClusterBaseEdges";
import {MeshLine, MeshLineMaterial} from "three.meshline"
import BaseCluster3D from "../BaseCluster3D";

import * as THREE from "three";
import * as _ from "lodash";


/**
 * an extended implementation of {@link ClusterBaseEdges}
 * to support line width via {@link THREE.MeshLine
 *
 * NOTE: As this approach is more GPU-intensive it should be used whenever a fewer amount of lines is drawn.
 *  For larger amounts  {@link ClusterBaseEdges} should be favoured, depending on the target device and such.
 */




export default class ClusterMeshEdges extends ClusterBaseEdges {

    /**
     * {@link ClusterBaseEdges.constructor}
     */

    constructor(...args) {
        super(...args)

        this.smoothenWidth = true;
        this.minLinkStrength = 0
    }

    /**
     * {@link ClusterBaseEdges.constructor}
     */
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
            depthWrite: false,
            resolution: new THREE.Vector2(window.innerWidth, window.innerHeight)
        });

        MaterialFadeMixin(material);


        return material;

    }

    /**
     * {@link ClusterBaseEdges.constructor}
     */
    update() {


        //remove previously generated MeshLines

        for (var i = this.children.length - 1; i >= 0; i--) {
            this.remove(this.children[i]);
        }


        //------------------------------------

        let edges = this.createEdgesForClusters(this.mClusters);


        if (edges.length == 0) return

        this.geometry.dispose();
        this.geometry = new THREE.BufferGeometry();

        var that = this
        var invalidEdges = [];


        //TODO sort and show only certain amount of edges based on relative size

        var orderedEdges = _.orderBy(edges, ['link_strength'], ['desc']);
        that.minLinkStrength = 0.4 * orderedEdges[0].link_strength;//set minLinkStrength to pass the test to 40% of biggest edge


        for (let edge of edges) {
            //TODO we should unify the edges to not always have 2 separate ways to access certain elements
            //TODO also we should use the center of the hull feature instead
            //FIXME for cluster: add edges only if mHull exists

            if (edge.link_strength < that.minLinkStrength) continue;

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

            //----------------------------------
            let linePoints;
            let widthFN;
            if (this.smoothenWidth == false) {
                linePoints = new Float32Array([
                    src.x, src.y, src.z,
                    dst.x, dst.y, dst.z
                ]);
            } else {
                const pts = [];
                for (let i = 0; i <= 1; i += 0.1) {
                    const p = src.clone().lerp(dst, i);
                    pts.push(p.x, p.y, p.z);
                }
                linePoints = new Float32Array(pts);

                widthFN = function widthFunction(p) {
                    return 1
                }
            }

            var meshLine = new MeshLine();
            meshLine.setPoints(linePoints, widthFN);


            //TODO
            var material = new MeshLineMaterial({
                lineWidth: edge.link_strength / 5 || 1,
                color: new THREE.Color(0x333333),
                transparent: true,
                opacity: 0.5,
                depthTest: false,
                depthWrite: false,
                resolution: new THREE.Vector2(window.innerWidth, window.innerHeight)
            });
            // var material = new MeshLineMaterial();


            //TODO material group for lineWidth feature + only one material
            //  material.copy(this.material);
            // material.lineWidth = edge.link_strength;


            if (edge.link_strength == undefined)
                console.error("edge does not have a link_strength''")


            var mesh = new THREE.Mesh(meshLine, material);
            mesh.layers.set(1)

            this.add(mesh);


        }


        if (invalidEdges.length > 0)
            console.error("invalid edges", invalidEdges)


    }


}
