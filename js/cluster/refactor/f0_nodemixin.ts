import { basicElementExtend, basicSpriteSize, type NodeEnv, type NodeEl, type ExtendedNode } from "./f0-basic-element-3d-classes"
import { highlightNodeElements, unhighlightNodeElements, doOnClickNode, type HighlightNode } from "./f1"

import { SphereGeometry } from "three/src/geometries/SphereGeometry.js";
import { MeshBasicMaterial } from "three/src/materials/MeshBasicMaterial.js";
import { Mesh } from "three/src/objects/Mesh.js";
import * as _ from "lodash";

const sphereGeometry = new SphereGeometry(1, 3, 2);

const singleNodeMaterial = new MeshBasicMaterial({
    color: 0xffff00,
    wireframe: true,
    visible: false,
    opacity: 1,
    transparent: true,
    alphaTest: 0.99
});

export type MixedNode = NodeEl & ExtendedNode & HighlightNode & {
    _mixin?: boolean
    _mixin_?: boolean
    name?: string
    group?: string
    info?: string
    highlight: () => void
    unhighlight: () => void
    zoom: () => void
}

export default function nodeMixin(env: NodeEnv, node: NodeEl): MixedNode {
    if (!node) throw new Error("2nd param must be a valid node");

    const n = node as MixedNode;

    if (n._mixin_) return n;

    n._mixin = true;

    n._bubble = new Mesh(sphereGeometry, singleNodeMaterial);

    const mMesh = n._bubble;
    const size = basicSpriteSize(env, node) / 5;
    mMesh.scale.setScalar(size);

    basicElementExtend(env, node, mMesh);

    _.extend(n, {
        highlight() {
            highlightNodeElements.call(this as unknown as HighlightNode);
        },
        unhighlight() {
            unhighlightNodeElements.call(this as unknown as HighlightNode);
        },
        zoom() {
            doOnClickNode(this as unknown as HighlightNode);
        }
    });

    n.on("mousemove", function (e) {
        e.stopPropagation();

        let nodeRef: MixedNode | undefined;

        if ((e.target as { node?: MixedNode }).node)
            nodeRef = (e.target as { node?: MixedNode }).node;
        else if (e.origDomEvent) nodeRef = e.origDomEvent as unknown as MixedNode;

        if (!nodeRef) return;

        let info = "";
        if (nodeRef.name) info += " " + nodeRef.name;
        if (nodeRef.group) info += " " + nodeRef.group;
        if (nodeRef.info) info += " " + nodeRef.info;

        if (info.trim() != "") {
            if (env.toolTipElem) env.toolTipElem.innerHTML = "<span class='content'>" + info + "</span>";

            const cluster = nodeRef.getParentCluster?.();
            if (cluster && cluster.getView?.()) {
                cluster.getView!()!.setTooltip(info);
            }
        }
    });

    n._bubble.name = env.nameAccessor(node) || '';
    n.size = env.sizeAccessor(node) || undefined;

    return n;
}
