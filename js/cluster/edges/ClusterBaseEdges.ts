import EdgeUtil, { ClusterEdge } from "../EdgeUtil";
import MaterialFadeMixin from "../../utils/MaterialFadeMixin";
import type { FadeMaterial } from "../../utils/FadeMaterial";
import BaseCluster3D from "../BaseCluster3D";

import { AdditiveBlending } from "three/src/constants.js";
import { BufferAttribute } from "three/src/core/BufferAttribute.js";
import { BufferGeometry } from "three/src/core/BufferGeometry.js";
import { LineBasicMaterial } from "three/src/materials/LineBasicMaterial.js";
import { ShaderMaterial } from "three/src/materials/ShaderMaterial.js";
import { Box3 } from "three/src/math/Box3.js";
import { Color } from "three/src/math/Color.js";
import { Sphere } from "three/src/math/Sphere.js";
import { Vector3 } from "three/src/math/Vector3.js";
import { Line } from "three/src/objects/Line.js";
import * as _ from "lodash";

export interface EdgeMaterialOptions {
    opacity?: number
    transparent?: boolean
    color?: number
}

function buildLinePositions(pairs: [Vector3, Vector3][]): Float32Array {
    const arr = new Float32Array(pairs.length * 6);
    for (let i = 0; i < pairs.length; i++) {
        const [s, d] = pairs[i];
        arr[i * 6 + 0] = s.x; arr[i * 6 + 1] = s.y; arr[i * 6 + 2] = s.z;
        arr[i * 6 + 3] = d.x; arr[i * 6 + 4] = d.y; arr[i * 6 + 5] = d.z;
    }
    return arr;
}

function makeLineGeometry(pairs: [Vector3, Vector3][]): BufferGeometry {
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(buildLinePositions(pairs), 3));
    return geo;
}

export default class ClusterBaseEdges extends Line {

    mClusters: Record<string, InstanceType<typeof BaseCluster3D>> | undefined
    mChildClustersEdges: ClusterEdge[] | undefined

    constructor(siblingClustersArray?: Record<string, InstanceType<typeof BaseCluster3D>>, materialOptions?: EdgeMaterialOptions) {
        super();

        this.layers.set(1);

        if (siblingClustersArray)
            this.setClusters(siblingClustersArray);

        this.name = "EdgesElement";
        this.initEdgeMesh(materialOptions);
    }

    getDefaultMaterial(options?: EdgeMaterialOptions): LineBasicMaterial {
        const defaults: Required<EdgeMaterialOptions> = {
            opacity: 1.0,
            transparent: true,
            color: 0x999999
        };

        const merged = Object.assign({}, defaults, options);

        const lineMaterial = new LineBasicMaterial({
            color: merged.color,
            transparent: merged.transparent,
            opacity: merged.opacity,
            depthTest: true,
            depthWrite: false
        });

        MaterialFadeMixin(lineMaterial);
        return lineMaterial;
    }

    getShaderLineMaterial(): ShaderMaterial {
        const fragmentShader = `
            uniform vec3 color;
            uniform float opacity;

            void main() {
                if (gl_FragColor.w > 0.5) discard;
                gl_FragColor = vec4(color, opacity * gl_FragCoord.z);
            }
        `;

        const uniforms = {
            amplitude: { type: "f", value: 5.0 },
            opacity: { type: "f", value: 0.3 },
            color: { type: "c", value: new Color(0xff0000) }
        };

        const lineMaterial = new ShaderMaterial({
            uniforms,
            fragmentShader,
            blending: AdditiveBlending,
            depthTest: false,
            transparent: true
        });

        type ExtShader = ShaderMaterial & { linewidth?: number; _color?: Color; uniforms: { color: { value: Color } } };
        (lineMaterial as ExtShader).linewidth = 1;
        (lineMaterial as ExtShader)._color = (lineMaterial as unknown as { color: Color }).color;

        Reflect.defineProperty(lineMaterial, "color", {
            enumerable: false,
            configurable: false,
            get: function (this: ExtShader) { return this._color; },
            set: function (this: ExtShader, c: Color) {
                this._color = c;
                this.uniforms.color.value = c;
            }
        });

        return lineMaterial;
    }

    createEdgesForClusters(clusters: Record<string, InstanceType<typeof BaseCluster3D>>): ClusterEdge[] {
        if (this.mChildClustersEdges) return this.mChildClustersEdges;
        return this.mChildClustersEdges = EdgeUtil.createEdgesBetweenClustersFromMap(clusters);
    }

    initEdgeMesh(materialOptions?: EdgeMaterialOptions): void {
        const lineMaterial = this.getDefaultMaterial(materialOptions);

        this.geometry = makeLineGeometry([]);
        this.material = lineMaterial;

        this.geometry.boundingBox = new Box3();
        this.geometry.boundingSphere = new Sphere(new Vector3(), 1);

        (lineMaterial as FadeMaterial<LineBasicMaterial>).fade = 0;
        (lineMaterial as FadeMaterial<LineBasicMaterial>).fadeTo!(1, 2000);
    }

    setClusters(clusters: Record<string, InstanceType<typeof BaseCluster3D>>): void {
        this.mClusters = clusters;
    }

    getPositionForElement(el: InstanceType<typeof BaseCluster3D>): Vector3 {
        let pos: Vector3 | undefined;

        if (el.mExpanded == true) {
            if (el.mHull)
                pos = el.mHull.mBoundingBox!.getCenter(new Vector3());
        } else {
            if (el.mCollapsedClusterHull)
                pos = el.mCollapsedClusterHull!.position.clone();
        }

        if (!pos) pos = new Vector3();
        pos.add(el.position);
        return pos;
    }

    update(): void {
        const edges = this.createEdgesForClusters(this.mClusters!);
        const invalidEdges: ClusterEdge[] = [];
        const pairs: [Vector3, Vector3][] = [];

        for (const edge of edges) {
            const s = edge.source instanceof BaseCluster3D ? edge.source : edge.source._el;
            const d = edge.target instanceof BaseCluster3D ? edge.target : edge.target._el;

            if (!s || !d) {
                invalidEdges.push(edge);
                continue;
            }

            pairs.push([this.getPositionForElement(s), this.getPositionForElement(d)]);
        }

        this.geometry.dispose();
        this.geometry = makeLineGeometry(pairs);

        if (invalidEdges.length > 0)
            console.error("invalid edges", invalidEdges);
    }
}
