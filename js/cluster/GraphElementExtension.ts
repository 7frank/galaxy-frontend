import { addArrow, removeArrow, type ArrowEdge } from "./edges/ArrowEdge"
import type { ExtendedNode, NodeEnv, DomEvent } from "./Node3DClassRegistry";
import * as _ from "lodash"
import type { Mesh } from "three/src/objects/Mesh.js";
import NodeSelectionManager from "./NodeSelectionManager";

export interface HighlightNode extends ExtendedNode {
    edges: ArrowEdge[]
    children: HighlightNode[]
    parents: HighlightNode[]
    text?: { addClass?: (s: string) => void; removeClass?: (s: string) => void }
}

export const selectionManager = new NodeSelectionManager();

export function removeSelections(): void {
    selectionManager.clearAll();
}

export function highlightNodeElements(this: HighlightNode, bShowOtherNodes = false, bShowEdgeArrows = true): void {
    selectionManager.highlight(this, bShowOtherNodes, bShowEdgeArrows);
}

export function unhighlightNodeElements(this: HighlightNode): void {
    selectionManager.unhighlight(this);
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
        return function () { console.warn("implement handler for", typeName); };
    }

    const merged = Object.assign({
        mousemove: _TODO("mousemove"),
        mouseleave: _TODO("mouseleave"),
        click: _TODO("click"),
        dblclick: _TODO("dblclick")
    }, options);

    for (const el of elements) {
        const mesh = el[attrName] as unknown as Mesh;
        const meshParam = mesh as unknown as Parameters<NodeEnv['domEvents']['addEventListener']>[0];

        mDomEvents.addEventListener(meshParam, 'click', merged.click as (e: DomEvent) => void, false);
        mDomEvents.addEventListener(meshParam, 'dblclick', merged.dblclick as (e: DomEvent) => void, false);

        mDomEvents.addEventListener(meshParam, 'mouseover', function (e: DomEvent) {
            const ctx = (e.target as { node?: HighlightNode }).node;
            if (ctx) (merged.mousemove as ((this: HighlightNode) => void)).call(ctx);
        }, false);

        mDomEvents.addEventListener(meshParam, 'mouseout', function (e: DomEvent) {
            const ctx = (e.target as { node?: HighlightNode }).node;
            if (ctx) (merged.mouseleave as ((this: HighlightNode) => void)).call(ctx);
        }, false);

        el.showHighlight = function () {
            el.show();
            if (el.isHighlighted) return;
            el.isHighlighted = true;
            if ((el as unknown as { _bubble?: unknown })._bubble != null) el.addClass("node-highlighted");
            if (el.text?.addClass) el.text.addClass("node-caption-highlighted");
        };

        el.hideHighlight = function () {
            el.hide();
            if (!el.isHighlighted) return;
            el.isHighlighted = false;
            if ((el as unknown as { _bubble?: unknown })._bubble) el.removeClass("node-highlighted");
            if (el.text?.removeClass) el.text.removeClass("node-caption-highlighted");
        };
    }
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
    if (!isSelected) {
        selectionManager.highlight(currNodeClicked, doHighlighNeighbours, doHighlighEdges);
        currNodeClicked.show();
        return;
    }

    selectionManager.select(currNodeClicked, {
        stack,
        zoom: doZoomIn,
        onZoomEnd: onAnimationEnd,
        emitHighlightNeighbours: doHighlighNeighbours,
        emitHighlightEdges: doHighlighEdges
    });
}

export function extendGraphElements(d3Nodes: HighlightNode[], d3Links: ArrowEdge[], env: NodeEnv): void {
    addGraphHierarchy(d3Nodes, d3Links);

    extendElement(d3Nodes, "_bubble", {
        mousemove: function (this: HighlightNode) {
            if (selectionManager.isSelected(this)) return;
            selectionManager.highlight(this, true, false);
            const node = this as unknown as { name?: string; group?: string; info?: string; getParentCluster?: () => { getView?: () => { setTooltip(s: string): void } } | null };
            const info = [node.name, node.group, node.info].filter(Boolean).join(" ");
            if (info.trim()) node.getParentCluster?.()?.getView?.()?.setTooltip(info);
        },
        mouseleave: function (this: HighlightNode) {
            if (selectionManager.isSelected(this)) return;
            selectionManager.unhighlight(this);
        },
        click: function (e: DomEvent) {
            const currNodeClicked = (e.target as { node?: HighlightNode }).node!;
            e.stopPropagation();

            for (const prev of selectionManager.getSelected())
                if (prev !== currNodeClicked) selectionManager.unhighlight(prev);

            doOnClickNode(currNodeClicked, e.origDomEvent?.ctrlKey ?? false);
            return false;
        },
        dblclick: function (e: DomEvent) {
            e.stopPropagation();
            const node = (e.target as { node?: HighlightNode }).node!;
            selectionManager.handleDblClick(node);
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
