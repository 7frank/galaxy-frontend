/**
 * Created by Frank on 08.06.2017.
 */

import BaseEdge from "./BaseEdge"
import EdgeUtil from "./EdgeUtil"
import type { ClusterEdge, EdgeNode } from "./EdgeUtil"
import { BufferAttribute } from "three/src/core/BufferAttribute.js";
import { BufferGeometry } from "three/src/core/BufferGeometry.js";
import { Object3D } from "three/src/core/Object3D.js";
import { LineBasicMaterial } from "three/src/materials/LineBasicMaterial.js";
import { Matrix4 } from "three/src/math/Matrix4.js";
import { Vector3 } from "three/src/math/Vector3.js";
import { LineSegments } from "three/src/objects/LineSegments.js";
import _ from "lodash";
import type { GraphNode, BubbleNode as BaseBubbleNode } from "./particles/ParticleNodeGroup";

interface BubbleNode extends Omit<BaseBubbleNode, '_bubble'> {
    _bubble: { position: Vector3; matrixWorld: Matrix4 }
    _parent: { parent: { matrixWorld: Matrix4; updateWorldMatrix: (updateParents: boolean, updateChildren: boolean) => void } | null } | null
}

interface ExternalNodeHelper {
    position: Vector3
    update: () => void
}

interface LineGroupOptions {
    opacity?: number
    transparent?: boolean
    color?: number
}

export default class EdgesContainer extends Object3D {

    mExternalNodesHelpers: ExternalNodeHelper[]
    _vertexList: Vector3[]
    mEdges: LineSegments
    skipEdges: number
    numDefaultMinimum: number
    drawInternalEdges: boolean
    drawOutgoingEdges: boolean
    drawIngoingEdges: boolean
    mOwner: Object3D | null

    constructor() {
        super();
        this.mExternalNodesHelpers = [];
        this._vertexList = [];
        this.mEdges = null!;
        this.skipEdges = 1;
        this.numDefaultMinimum = 20;
        this.drawInternalEdges = true;
        this.drawOutgoingEdges = true;
        this.drawIngoingEdges = true;
        this.mOwner = null;

        this.initLineMesh();
        this.setSkipParams(1);
        this.setRenderMode(true, true, true);
    }

    setSkipParams(numSkipEdges: number, numDefaultMinimum: number = 20): this {
        if (numSkipEdges < 1) numSkipEdges = 1;
        this.skipEdges = numSkipEdges;
        this.numDefaultMinimum = numDefaultMinimum;
        return this;
    }

    setOwner(owner: Object3D): this {
        this.mOwner = owner;
        return this;
    }

    setRenderMode(drawInternalEdges: boolean, drawOutgoingEdges: boolean, drawIngoingEdges: boolean): this {
        this.drawInternalEdges = drawInternalEdges;
        this.drawOutgoingEdges = drawOutgoingEdges;
        this.drawIngoingEdges = drawIngoingEdges;
        return this;
    }

    addEdge(_edge: ClusterEdge): BaseEdge {
        const owner = this.mOwner;

        const createExternalNodeHelper = (node: BubbleNode): ExternalNodeHelper => {
            const localPos = new Vector3();
            const externalLeaf = node._parent?.parent ?? null;
            return {
                position: localPos,
                update: function () {
                    localPos.copy(node._bubble.position);
                    if (externalLeaf) {
                        externalLeaf.updateWorldMatrix(true, false);
                        localPos.applyMatrix4(externalLeaf.matrixWorld);
                    }
                    if (owner) {
                        owner.updateWorldMatrix(true, false);
                        owner.worldToLocal(localPos);
                    }
                }
            };
        };

        const src = _edge.source as BubbleNode;
        const trg = _edge.target as BubbleNode;
        const newEdge = new BaseEdge(src._bubble.position, trg._bubble.position);

        if (!_edge.isSrcInternalNode) {
            const helper = createExternalNodeHelper(src);
            this.mExternalNodesHelpers.push(helper);
            this._vertexList.push(helper.position);
        } else {
            this._vertexList.push(newEdge.getStart());
        }

        if (!_edge.isTrgInternalNode) {
            const helper = createExternalNodeHelper(trg);
            this.mExternalNodesHelpers.push(helper);
            this._vertexList.push(helper.position);
        } else {
            this._vertexList.push(newEdge.getEnd());
        }

        return newEdge;
    }

    updateEdges(): void {
        if (this.mExternalNodesHelpers.length > 0)
            _.each(this.mExternalNodesHelpers, (helper: ExternalNodeHelper) => helper.update());

        const verts = this._vertexList;
        const arr = new Float32Array(verts.length * 3);
        for (let i = 0; i < verts.length; i++) {
            arr[i * 3] = verts[i].x;
            arr[i * 3 + 1] = verts[i].y;
            arr[i * 3 + 2] = verts[i].z;
        }
        const attr = new BufferAttribute(arr, 3);
        this.mEdges.geometry.setAttribute('position', attr);
        (this.mEdges.geometry.attributes.position as BufferAttribute).needsUpdate = true;
    }

    setFromNodes(nodes: GraphNode[]): void {
        let edges = EdgeUtil.getEdgesForNodes(nodes as EdgeNode[], this.drawInternalEdges, this.drawOutgoingEdges, this.drawIngoingEdges);

        let edgeCounter = 0;
        let skip = this.skipEdges;

        if (nodes.length / this.skipEdges < this.numDefaultMinimum)
            skip = Math.floor(nodes.length / this.numDefaultMinimum);

        edges = edges.filter(() => edgeCounter++ % skip == 0);

        for (const edge of edges)
            this.addEdge(edge);

        this.updateEdges();
    }

    initLineMesh(): void {
        this._vertexList = [];

        const line_geom = new BufferGeometry();
        line_geom.setAttribute('position', new BufferAttribute(new Float32Array(0), 3));

        const initLineGroup = (options: LineGroupOptions): LineSegments => {
            const defaults: Required<LineGroupOptions> = {
                opacity: 0.01,
                transparent: true,
                color: 0xffffff
            };

            const merged = Object.assign({}, defaults, options);

            const lineMaterial = new LineBasicMaterial({
                color: merged.color,
                transparent: merged.transparent,
                opacity: merged.opacity,
                depthTest: true,
                depthWrite: false
            });

            return new LineSegments(line_geom, lineMaterial);
        };

        this.mEdges = initLineGroup({
            opacity: 0.2,
            color: 0x49616C,
            transparent: true,
        });

        this.add(this.mEdges);
    }
}
