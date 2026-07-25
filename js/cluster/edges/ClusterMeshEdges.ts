import MaterialFadeMixin from "../../utils/MaterialFadeMixin";
import ClusterBaseEdges, { EdgeMaterialOptions } from "./ClusterBaseEdges";
import { MeshLine, MeshLineMaterial } from "three.meshline"
import BaseCluster3D from "../BaseCluster3D";

import { BufferGeometry } from "three/src/core/BufferGeometry.js";
import { Color } from "three/src/math/Color.js";
import { Vector2 } from "three/src/math/Vector2.js";
import { Mesh } from "three/src/objects/Mesh.js";
import * as _ from "lodash";

export default class ClusterMeshEdges extends ClusterBaseEdges {

    smoothenWidth: boolean
    minLinkStrength: number

    constructor(...args: any[]) {
        super(...args);
        this.smoothenWidth = true;
        this.minLinkStrength = 0;
    }

    getDefaultMaterial(options?: EdgeMaterialOptions): any {
        const defaults: Required<EdgeMaterialOptions> = {
            opacity: 1.0,
            transparent: true,
            color: 0x999999
        };

        const merged = Object.assign({}, defaults, options);

        const material = new MeshLineMaterial({
            lineWidth: 1,
            color: new Color(merged.color),
            transparent: merged.transparent,
            opacity: merged.opacity,
            depthTest: true,
            depthWrite: false,
            resolution: new Vector2(window.innerWidth, window.innerHeight)
        });

        MaterialFadeMixin(material);
        return material;
    }

    update(): void {
        for (let i = this.children.length - 1; i >= 0; i--) {
            this.remove(this.children[i]);
        }

        const edges = this.createEdgesForClusters(this.mClusters!);
        if (edges.length == 0) return;

        this.geometry.dispose();
        this.geometry = new BufferGeometry();

        const that = this;
        const invalidEdges: any[] = [];

        const orderedEdges = _.orderBy(edges, ['link_strength'], ['desc']);
        that.minLinkStrength = 0.4 * (orderedEdges[0].link_strength ?? 0);

        for (const edge of edges) {
            if ((edge.link_strength ?? 0) < that.minLinkStrength) continue;

            const s = edge.source instanceof BaseCluster3D ? edge.source : edge.source._el;
            const d = edge.target instanceof BaseCluster3D ? edge.target : edge.target._el;

            if (!s || !d) {
                invalidEdges.push(edge);
                continue;
            }

            const src = this.getPositionForElement(s);
            const dst = this.getPositionForElement(d);

            let linePoints: Float32Array;
            let widthFN: ((p: number) => number) | undefined;

            if (this.smoothenWidth == false) {
                linePoints = new Float32Array([
                    src.x, src.y, src.z,
                    dst.x, dst.y, dst.z
                ]);
            } else {
                const pts: number[] = [];
                for (let i = 0; i <= 1; i += 0.1) {
                    const p = src.clone().lerp(dst, i);
                    pts.push(p.x, p.y, p.z);
                }
                linePoints = new Float32Array(pts);
                widthFN = (_p: number) => 1;
            }

            const meshLine = new MeshLine();
            meshLine.setPoints(linePoints, widthFN);

            const material = new MeshLineMaterial({
                lineWidth: (edge.link_strength ?? 5) / 5 || 1,
                color: new Color(0x333333),
                transparent: true,
                opacity: 0.5,
                depthTest: false,
                depthWrite: false,
                resolution: new Vector2(window.innerWidth, window.innerHeight)
            });

            if (edge.link_strength == undefined)
                console.error("edge does not have a link_strength");

            const mesh = new Mesh(meshLine, material);
            mesh.layers.set(1);
            this.add(mesh);
        }

        if (invalidEdges.length > 0)
            console.error("invalid edges", invalidEdges);
    }
}
