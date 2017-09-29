import EdgeUtil from "../EdgeUtil";
import MaterialFadeMixin from "../../utils/MaterialFadeMixin";
import BaseCluster3D from "../BaseCluster3D";

import * as THREE from "three";
import * as _ from "lodash";


/**
 * the default implementation for the cluster-to-neighboring-clusters edges
 *
 *
 * simple/fast/no width support (line width = 1)
 *
 * usage:
 * initialize using: setClusters()
 * run the drawing process: update()
 * TODO add support to only recreate cluster edges if clusters have changed this way  supporting streaming clusters in the future
 */




export default class ClusterBaseEdges extends THREE.Line {


    constructor(siblingClustersObj, materialOptions) {
        super();

        this.layers.set(1)


        if (siblingClustersObj)
            this.setClusters(siblingClustersObj);

        this.name = "EdgesElement";

        this.initEdgeMesh(materialOptions)


    }

    getDefaultMaterial(options) {


        let defaults = {
            opacity: 1.0,
            transparent: true,
            //lineIsVisible:true, // if disabled the line won't be shown on the scene
            color: 0x999999
        };

        options = _.extend(defaults, options);


        var lineMaterial = new THREE.LineBasicMaterial({
            color: options.color,
            transparent: options.transparent,
            opacity: options.opacity,
            depthTest: true,
            depthWrite: false
            //depthFunc:THREE.NeverDepth
        });

        /*     var lineMaterial = new THREE.LineBasicMaterial({
                 color: 0xffffff,//options.color,
                 transparent:false,// options.transparent,
                 opacity: 1,//options.opacity,
                 depthTest: true,
                 depthWrite: true//,
                 //depthFunc:THREE.NeverDepth
             });*/

        //   FIXME lines should not interfere with it's cluster (currently are overdrawing)
        /*
          lineMaterial = this.getShaderLineMaterial();
          lineMaterial.color = new THREE.Color(options.color);
          lineMaterial.opacity = options.opacity;

          if (!window["lineMaterial"]) window["lineMaterial"] = []
          window["lineMaterial"].push(lineMaterial)

          */


        MaterialFadeMixin(lineMaterial);


        return lineMaterial;

    }


    getShaderLineMaterial() {


        let fragmentShader = `
        
        	uniform vec3 color;
			uniform float opacity;

			//varying vec3 vColor;

			void main() {

            //if (gl_FragCoord.z > 0.001) discard;
            if (gl_FragColor.w > 0.5) discard;


				gl_FragColor = vec4(// vColor *
                 color,opacity*gl_FragCoord.z );

			}
        
        `;


        let attributes = {

            displacement: {type: 'v3', value: []},
            customColor: {type: 'c', value: []}

        };

        let uniforms = {

            amplitude: {type: "f", value: 5.0},
            opacity: {type: "f", value: 0.3},
            color: {type: "c", value: new THREE.Color(0xff0000)}

        };

        var lineMaterial = new THREE.ShaderMaterial({

            uniforms: uniforms,
            // attributes:     attributes,
            //  vertexShader:   vertexShader,
            fragmentShader: fragmentShader,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent: true

        });

        lineMaterial.linewidth = 1;


        lineMaterial._color = lineMaterial.color;
        Reflect.defineProperty(lineMaterial, "color", {
            enumerable: false,
            configurable: false,
            get: function () {
                return this._color
            },
            set: function (c) {

                this._color = c;
                this.uniforms.color.value = c

            }
        });


        return lineMaterial
    }

    /**
     * TODO have a mechaminsm that resets this stae in case other clsuters get streamed afterwards
     *
     *
     * @param clusters
     */
    createEdgesForClusters(clusters) {

        if (this.mChildClustersEdges) return this.mChildClustersEdges;

        return this.mChildClustersEdges = EdgeUtil.createEdgesBetweenClustersFromMap(clusters);

    }

    /**
     * generated and updates edges between clusters
     *
     */
    initEdgeMesh(options) {


        var line_geom = new THREE.Geometry();

        var lineMaterial = this.getDefaultMaterial(options);


        // this.mChildClustersEdgesMesh = new THREE.Line(line_geom, lineMaterial, THREE.LineSegments);
        this.geometry = line_geom;
        this.material = lineMaterial;

        //TODO check if this might be helpful to put edges behind nodes

        // this.renderOrder = -2;


        this.geometry.boundingBox = new THREE.Box3;
        this.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3, 1);


        lineMaterial.fade = 0;
        lineMaterial.fadeTo(1, 2000)


    }

    setClusters(clusters) {
        this.mClusters = clusters

    }


    getPositionForElement(el) {
        let pos;
        if (el.mExpanded == true) {
            //expanded: we use the bounding box of the hull if it exists
            if (el.mHull)
                pos = el.mHull.mBoundingBox.getCenter();


        }
        else {
            //collapsed: we use the center of the bBox that should have been set when creating the mCollapsedClusterHull
            if (el.mCollapsedClusterHull)
            //pos = el.geometry.boundingBox.getCenter();
                pos = el.mCollapsedClusterHull.position.clone();


        }

        if (!pos) pos = new THREE.Vector3;

        //above elements do only contain the relative position to its container, so we'll add the position of the cluster
        pos.add(el.position);

        return pos

    }


    /**
     * updates the edges of the clusters as soon as the hull feature is rendered
     *
     *
     */


    update() {


        let edges = this.createEdgesForClusters(this.mClusters);


        var line_geom = new THREE.Geometry();


        this.geometry.dispose();
        this.geometry = line_geom;


        var invalidEdges = [];

        for (let edge of edges) {

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

            line_geom.vertices.push(src);
            line_geom.vertices.push(dst);

        }


        if (invalidEdges.length > 0)
            console.error("invalid edges", invalidEdges)


    }


}
