import { addArrow, removeArrow, type ArrowEdge } from "./f5-arrows"
import ZoomUtil from "../../utils/ZoomUtil";
import { GUI } from "./SpecificDataUtils";
import type { ExtendedNode, NodeEnv, DomEvent } from "./f0-basic-element-3d-classes";
import * as _ from "lodash"
import type { Mesh } from "three/src/objects/Mesh.js";

export interface HighlightNode extends ExtendedNode {
    edges: ArrowEdge[]
    children: HighlightNode[]
    parents: HighlightNode[]
    text?: { addClass?: (s: string) => void; removeClass?: (s: string) => void }
}

var previousNodeClicked: HighlightNode[] = [];
var previousNodeDblClicked: HighlightNode | undefined;

var previousNodes: HighlightNode[] | undefined;

export function removeSelections(): void {
    function undoStuff(node: HighlightNode) {
        unhighlightNodeElements.call(node);
    }

    _.each(previousNodeClicked, undoStuff);
    _.each(previousNodes, undoStuff);
}

export function highlightNodeElements(this: HighlightNode, bShowOtherNodes = false, bShowEdgeArrows = true): void {
    this.showHighlight?.();

    if (bShowOtherNodes) {
        for (const childNode of this.children)
            childNode.showHighlight?.();

        for (const parentNode of this.parents)
            parentNode.showHighlight?.();
    }

    if (bShowEdgeArrows)
        for (const edge of this.edges) {
            const color = edge.source === (this as unknown as ArrowEdge['source']) ? 0x99ff99 : 0xffb2b2;
            addArrow(edge, color);
        }
}

export function unhighlightNodeElements(this: HighlightNode): void {
    this.hideHighlight?.();

    for (const childNode of this.children)
        childNode.hideHighlight?.();

    for (const parentNode of this.parents)
        parentNode.hideHighlight?.();

    for (const edge of this.edges)
        removeArrow(edge);
}

function extendElement(
    elements: HighlightNode[],
    attrName: keyof HighlightNode,
    options: {
        mousemove?: (this: HighlightNode) => void
        mouseleave?: (this: HighlightNode) => void
        click?: (e: DomEvent) => void
        dblclick?: (e: DomEvent) => void
    },
    env: NodeEnv
): void {
    const mDomEvents = env.domEvents;

    function _TODO(typeName: string) {
        return function () {
            console.warn("implement handler for", typeName);
        };
    }

    const defaults = {
        mousemove: _TODO("mousemove"),
        mouseleave: _TODO("mouseleave"),
        click: _TODO("click"),
        dblclick: _TODO("dblclick")
    };
    const merged = Object.assign({}, defaults, options);

    for (const el of elements) {
        const mesh = el[attrName] as unknown as Mesh;

        mDomEvents.addEventListener(mesh as unknown as Parameters<NodeEnv['domEvents']['addEventListener']>[0], 'click', merged.click as (e: DomEvent) => void, false);
        mDomEvents.addEventListener(mesh as unknown as Parameters<NodeEnv['domEvents']['addEventListener']>[0], 'dblclick', merged.dblclick as (e: DomEvent) => void, false);

        mDomEvents.addEventListener(mesh as unknown as Parameters<NodeEnv['domEvents']['addEventListener']>[0], 'mouseover', function (e: DomEvent) {
            const target = e.target as { node?: HighlightNode; edge?: unknown };
            const ctx = target.node;
            if (ctx) (merged.mousemove as ((this: HighlightNode) => void)).call(ctx);
        }, false);

        mDomEvents.addEventListener(mesh as unknown as Parameters<NodeEnv['domEvents']['addEventListener']>[0], 'mouseout', function (e: DomEvent) {
            const target = e.target as { node?: HighlightNode; edge?: unknown };
            const ctx = target.node;
            if (ctx) (merged.mouseleave as ((this: HighlightNode) => void)).call(ctx);
        }, false);

        el.showHighlight = function () {
            el.show();
            if (el.isHighlighted) return;
            el.isHighlighted = true;

            if ((el as unknown as { _bubble?: unknown })._bubble != null) {
                el.addClass("node-highlighted");
            }

            if (el.text?.addClass) {
                el.text.addClass("node-caption-highlighted");
            }
        };

        el.hideHighlight = function () {
            el.hide();
            if (!el.isHighlighted) return;
            el.isHighlighted = false;

            if ((el as unknown as { _bubble?: unknown })._bubble) {
                el.removeClass("node-highlighted");
            }

            if (el.text?.removeClass) {
                el.text.removeClass("node-caption-highlighted");
            }
        };
    }
}

function doZoomToMesh(mesh: Mesh, onEnd?: () => void, minMaxDistance = 400): void {
    let viewEl = document.querySelector<HTMLElement & { _view3d?: unknown }>(".view-3d[hasFocus]");
    if (!viewEl) viewEl = document.querySelector<HTMLElement & { _view3d?: unknown }>(".view-3d.view-3d-maximised");
    const view = viewEl?._view3d as { mCamera?: unknown; mControls?: unknown } | null;

    if (!view) { console.warn("no view focused to be able to zoom"); return; }

    const camera = view.mCamera;
    const controls = view.mControls;

    ZoomUtil.moveToMesh(mesh, camera, controls, minMaxDistance, onEnd);
}

export function doOnClickNode(
    currNodeClicked: HighlightNode,
    stack = false,
    onAnimationEnd?: () => void,
    isSelected = true,
    doHighlighNeighbours = true,
    doHighlighEdges = true,
    doZoomIn = true
): void {
    if (previousNodeClicked.indexOf(currNodeClicked) < 0) {
        highlightNodeElements.call(currNodeClicked, doHighlighNeighbours, doHighlighEdges);

        currNodeClicked.show();

        if (doZoomIn)
            doZoomToMesh(currNodeClicked._bubble, onAnimationEnd);

        if (isSelected) {
            currNodeClicked.addClass("basic-selection");

            if (!stack)
                if (previousNodeClicked.length > 0)
                    for (const p of previousNodeClicked) {
                        p.removeClass("basic-selection");
                        unhighlightNodeElements.call(p);
                    }

            if (!stack)
                previousNodeClicked = [currNodeClicked];
            else
                previousNodeClicked.push(currNodeClicked);
        }
    } else {
        unhighlightNodeElements.call(currNodeClicked);
        previousNodeClicked.splice(previousNodeClicked.indexOf(currNodeClicked), 1);
        currNodeClicked.removeClass("basic-selection");
    }

    window.dispatchEvent(new CustomEvent("node-clicked", {
        detail: previousNodeClicked.length > 0 ? previousNodeClicked[previousNodeClicked.length - 1] : null
    }));
}

export function extendGraphElements(d3Nodes: HighlightNode[], d3Links: ArrowEdge[], env: NodeEnv): void {
    addGraphHierarchy(d3Nodes, d3Links);

    extendElement(d3Nodes, "_bubble", {
        mousemove: function (this: HighlightNode) {
            if (previousNodeClicked.indexOf(this) >= 0) return;
            highlightNodeElements.call(this, true, false);
        },
        mouseleave: function (this: HighlightNode) {
            if (previousNodeClicked.indexOf(this) >= 0) return;
            unhighlightNodeElements.call(this);
        },
        click: function (e: DomEvent) {
            const currNodeClicked = (e.target as { node?: HighlightNode }).node!;
            e.stopPropagation();

            if (previousNodeClicked.length > 0 && previousNodeClicked.indexOf(currNodeClicked) < 0)
                for (const p of previousNodeClicked)
                    unhighlightNodeElements.call(p);

            doOnClickNode(currNodeClicked, e.origDomEvent?.ctrlKey ?? false);

            return false;
        },
        dblclick: function (e: DomEvent) {
            e.stopPropagation();
            const currNodeDblClicked = (e.target as { node?: HighlightNode }).node!;
            const isDeselect = previousNodeDblClicked == currNodeDblClicked;
            window.dispatchEvent(new CustomEvent("node-selected", {
                detail: isDeselect ? null : currNodeDblClicked
            }));
            previousNodeDblClicked = isDeselect ? undefined : currNodeDblClicked;
            return false;
        }
    }, env);
}

function addGraphHierarchy(d3Nodes: HighlightNode[], d3Links: ArrowEdge[]): void {
    for (const node of d3Nodes) {
        if (!node.edges) node.edges = [];
        if (!node.children) node.children = [];
        if (!node.parents) node.parents = [];

        (node._bubble as unknown as { node: HighlightNode }).node = node;
    }

    for (const item of d3Links) {
        const src = item.source as unknown as HighlightNode;
        const trg = item.target as unknown as HighlightNode;

        if (src.edges.indexOf(item) < 0) src.edges.push(item);
        if (trg.edges.indexOf(item) < 0) trg.edges.push(item);

        if (src.children.indexOf(trg) < 0) src.children.push(trg);
        if (trg.parents.indexOf(src) < 0) trg.parents.push(src);
    }
}
