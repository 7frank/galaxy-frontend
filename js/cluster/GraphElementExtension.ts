import { addArrow, removeArrow, type ArrowEdge } from "./edges/ArrowEdge"
import type { ExtendedNode, NodeEnv, DomEvent } from "./Node3DClassRegistry";
import * as _ from "lodash"
import type { Mesh } from "three/src/objects/Mesh.js";
import NodeSelectionManager from "./NodeSelectionManager";
// @ts-ignore
import RadialMenu from "../lib/RadialMenu.js";

export interface HighlightNode extends ExtendedNode {
    edges: ArrowEdge[]
    linkedChildren: HighlightNode[]
    linkedParents: HighlightNode[]
    text?: { addClass?: (s: string) => void; removeClass?: (s: string) => void }
}

export const selectionManager = new NodeSelectionManager();

export function removeSelections(): void {
    selectionManager.clearAll();
}

let _radialMenuInstance: { menu: InstanceType<typeof RadialMenu>; node: HighlightNode } | null = null;
let _mouseDownPos: { x: number; y: number } | null = null;

document.addEventListener("mousedown", (e) => {
    if (e.button === 2) _mouseDownPos = { x: e.clientX, y: e.clientY };
}, true);

function _isDrag(x: number, y: number): boolean {
    if (!_mouseDownPos) return false;
    const dx = x - _mouseDownPos.x;
    const dy = y - _mouseDownPos.y;
    return Math.sqrt(dx * dx + dy * dy) > 5;
}

function openNodeRadialMenu(node: HighlightNode, x: number, y: number): void {
    if (_isDrag(x, y)) return;
    if (_radialMenuInstance) {
        _radialMenuInstance.menu.close();
        _radialMenuInstance = null;
    }

    const container = document.querySelector<HTMLElement>(".view-3d") ?? document.body;

    const holder = document.createElement("div");
    holder.style.position = "absolute";
    holder.style.left = x + "px";
    holder.style.top = y + "px";
    holder.style.zIndex = "9999";
    holder.style.transform = "translate(-50%, -50%)";
    container.appendChild(holder);

    const sm = (node as unknown as { _sm?: NodeSelectionManager })._sm ?? selectionManager;
    const isPinned = sm.isPinned(node);

    const menu = new RadialMenu({
        parent: holder,
        size: 150,
        closeOnClick: true,
        menuItems: [
            { id: isPinned ? "unpin" : "pin", title: isPinned ? "Unpin" : "Pin" },
            { id: "focus", title: "Focus" },
        ],
        onClick: (item: { id: string }) => {
            if (item.id === "pin" || item.id === "unpin") {
                sm.togglePin(node);
            } else if (item.id === "focus") {
                doOnClickNode(node, false, undefined, true, false, false, true);
            }
            holder.remove();
            _radialMenuInstance = null;
        }
    });

    _radialMenuInstance = { menu, node };
    menu.open();

    const onClickAway = (e: MouseEvent) => {
        if (!holder.contains(e.target as Node)) {
            menu.close();
            holder.remove();
            _radialMenuInstance = null;
            document.removeEventListener("click", onClickAway, { capture: true });
        }
    };
    setTimeout(() => document.addEventListener("click", onClickAway, { capture: true }), 0);
}

export function highlightNodeElements(this: HighlightNode, bShowOtherNodes = false, bShowEdgeArrows = true): void {
    const sm = (this as unknown as { _sm?: NodeSelectionManager })._sm ?? selectionManager;
    sm.highlight(this, bShowOtherNodes, bShowEdgeArrows);
}

export function unhighlightNodeElements(this: HighlightNode): void {
    const sm = (this as unknown as { _sm?: NodeSelectionManager })._sm ?? selectionManager;
    sm.unhighlight(this);
}

function extendElement(
    elements: HighlightNode[],
    attrName: keyof HighlightNode,
    options: {
        mousemove?: (this: HighlightNode) => void
        mouseleave?: (this: HighlightNode) => void
        click?: (e: DomEvent) => void
        dblclick?: (e: DomEvent) => void
        contextmenu?: (e: DomEvent) => void
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
        dblclick: _TODO("dblclick"),
        contextmenu: null
    }, options);

    for (const el of elements) {
        (el as unknown as { _sm?: NodeSelectionManager })._sm = env.selectionManager ?? selectionManager;
        const mesh = el[attrName] as unknown as Mesh;
        const meshParam = mesh as unknown as Parameters<NodeEnv['domEvents']['addEventListener']>[0];

        mDomEvents.addEventListener(meshParam, 'click', merged.click as (e: DomEvent) => void, false);
        mDomEvents.addEventListener(meshParam, 'dblclick', merged.dblclick as (e: DomEvent) => void, false);
        if (merged.contextmenu) {
            mDomEvents.addEventListener(meshParam, 'contextmenu', merged.contextmenu as (e: DomEvent) => void, false);
        }

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
    const sm = (currNodeClicked as unknown as { _sm?: NodeSelectionManager })._sm ?? selectionManager;
    if (!isSelected) {
        sm.highlight(currNodeClicked, doHighlighNeighbours, doHighlighEdges);
        currNodeClicked.show();
        return;
    }

    sm.select(currNodeClicked, {
        stack,
        zoom: doZoomIn,
        onZoomEnd: onAnimationEnd,
        emitHighlightNeighbours: doHighlighNeighbours,
        emitHighlightEdges: doHighlighEdges
    });
}


export function extendGraphElements(d3Nodes: HighlightNode[], d3Links: ArrowEdge[], env: NodeEnv): void {
    addGraphHierarchy(d3Nodes, d3Links);

    const sm = env.selectionManager ?? selectionManager;

    extendElement(d3Nodes, "_bubble", {
        mousemove: function (this: HighlightNode) {
            if (sm.isSelected(this)) return;
            sm.highlight(this, true, false);
            const node = this as unknown as { name?: string; group?: string; info?: string; getParentCluster?: () => { getView?: () => { setTooltip(s: string): void } } | null };
            const info = [node.name, node.group, node.info].filter(Boolean).join(" ");
            if (info.trim()) node.getParentCluster?.()?.getView?.()?.setTooltip(info);
        },
        mouseleave: function (this: HighlightNode) {
            if (sm.isSelected(this)) return;
            sm.unhighlight(this);
        },
        click: function (e: DomEvent) {
            const currNodeClicked = (e.target as { node?: HighlightNode }).node!;
            e.stopPropagation();

            for (const prev of sm.getSelected())
                if (prev !== currNodeClicked) sm.unhighlight(prev);

            sm.select(currNodeClicked, { stack: e.origDomEvent?.ctrlKey ?? false });
            return false;
        },
        dblclick: function (e: DomEvent) {
            e.stopPropagation();
            const node = (e.target as { node?: HighlightNode }).node!;
            sm.handleDblClick(node);
            return false;
        },
        contextmenu: function (e: DomEvent) {
            e.stopPropagation();
            e.origDomEvent?.preventDefault?.();
            const node = (e.target as { node?: HighlightNode }).node!;
            openNodeRadialMenu(node, e.origDomEvent?.clientX ?? 0, e.origDomEvent?.clientY ?? 0);
            return false;
        }
    }, env);
}

function addGraphHierarchy(d3Nodes: HighlightNode[], d3Links: ArrowEdge[]): void {
    for (const node of d3Nodes) {
        if (!node.edges) node.edges = [];
        if (!node.linkedChildren) node.linkedChildren = [];
        if (!node.linkedParents) node.linkedParents = [];
        (node._bubble as unknown as { node: HighlightNode }).node = node;
    }

    for (const item of d3Links) {
        const src = item.source as unknown as HighlightNode;
        const trg = item.target as unknown as HighlightNode;

        if (src.edges.indexOf(item) < 0) src.edges.push(item);
        if (trg.edges.indexOf(item) < 0) trg.edges.push(item);
        if (src.linkedChildren.indexOf(trg) < 0) src.linkedChildren.push(trg);
        if (trg.linkedParents.indexOf(src) < 0) trg.linkedParents.push(src);
    }
}
