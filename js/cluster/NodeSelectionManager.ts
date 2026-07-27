import ZoomUtil from "../utils/ZoomUtil";
import type { HighlightNode } from "./GraphElementExtension";
import type { ArrowEdge } from "./edges/ArrowEdge";
import { addArrow, removeArrow } from "./edges/ArrowEdge";
import type { Mesh } from "three/src/objects/Mesh.js";

export interface SelectionManagerView {
    el: HTMLElement
    mCamera?: unknown
    mControls?: unknown
    graphId?: string
}

export default class NodeSelectionManager {

    private view: SelectionManagerView | null

    constructor(view: SelectionManagerView | null = null) {
        this.view = view;
    }

    private selectedNodes: HighlightNode[] = []
    private pinnedNodes: HighlightNode[] = []
    private lastDblClicked: HighlightNode | undefined

    highlight(node: HighlightNode, showNeighbours = false, showEdgeArrows = true): void {
        node.showHighlight?.();

        if (showNeighbours) {
            for (const child of node.linkedChildren) child.showHighlight?.();
            for (const parent of node.linkedParents) parent.showHighlight?.();
        }

        if (showEdgeArrows) {
            for (const edge of node.edges) {
                const color = (edge as ArrowEdge).source === (node as unknown as ArrowEdge['source']) ? 0x99ff99 : 0xffb2b2;
                addArrow(edge as ArrowEdge, color);
            }
        }
    }

    unhighlight(node: HighlightNode): void {
        node.hideHighlight?.();
        for (const child of node.linkedChildren) child.hideHighlight?.();
        for (const parent of node.linkedParents) parent.hideHighlight?.();
        if (!this.isPinned(node)) {
            for (const edge of node.edges) removeArrow(edge as ArrowEdge);
        }
    }

    clearAll(): void {
        for (const node of this.selectedNodes) this.unhighlight(node);
        this.selectedNodes = [];
    }

    isSelected(node: HighlightNode): boolean {
        return this.selectedNodes.indexOf(node) >= 0;
    }

    getSelected(): HighlightNode[] {
        return this.selectedNodes;
    }

    getLastSelected(): HighlightNode | null {
        return this.selectedNodes[this.selectedNodes.length - 1] ?? null;
    }

    select(
        node: HighlightNode,
        options: {
            stack?: boolean
            zoom?: boolean
            onZoomEnd?: () => void
            emitHighlightNeighbours?: boolean
            emitHighlightEdges?: boolean
        } = {}
    ): void {
        const { stack = false, zoom = true, onZoomEnd, emitHighlightNeighbours = true, emitHighlightEdges = true } = options;

        if (!this.isSelected(node)) {
            this.highlight(node, emitHighlightNeighbours, emitHighlightEdges);
            node.show();

            if (zoom) {
                const leafEl = node.getParentCluster?.() as { getParentCluster?: () => { getClusterOptions?: () => { zoomDirection?: [number, number, number] } } | null } | null;
                const cluster = leafEl?.getParentCluster?.() as { getClusterOptions?: () => { zoomDirection?: [number, number, number] } } | null;
                const zoomDirection = cluster?.getClusterOptions?.()?.zoomDirection;
                this._zoomToNode(node._bubble, onZoomEnd, 400, zoomDirection);
            }

            node.addClass("basic-selection");

            if (!stack) {
                for (const prev of this.selectedNodes) {
                    prev.removeClass("basic-selection");
                    this.unhighlight(prev);
                }
                this.selectedNodes = [node];
            } else {
                this.selectedNodes.push(node);
            }
        } else {
            this.deselect(node);
        }

        this._emitSelectionChanged();
    }

    deselect(node: HighlightNode): void {
        this.unhighlight(node);
        const idx = this.selectedNodes.indexOf(node);
        if (idx >= 0) this.selectedNodes.splice(idx, 1);
        node.removeClass("basic-selection");
    }

    handleDblClick(node: HighlightNode): void {
        const isDeselect = this.lastDblClicked === node;
        this._eventTarget().dispatchEvent(new CustomEvent("node-selected", {
            detail: isDeselect ? null : node, bubbles: true
        }));
        this.lastDblClicked = isDeselect ? undefined : node;
    }

    private _zoomToNode(mesh: Mesh, onEnd?: () => void, minMaxDistance = 400, approachDirection?: [number, number, number]): void {
        const view = this.view
            ?? (document.querySelector<HTMLElement & { _view3d?: SelectionManagerView }>(".view-3d[hasFocus]"))?._view3d
            ?? (document.querySelector<HTMLElement & { _view3d?: SelectionManagerView }>(".view-3d.view-3d-maximised"))?._view3d;
        if (!view) { console.warn("no view focused to be able to zoom"); return; }
        ZoomUtil.moveToMesh(mesh, view.mCamera, view.mControls, minMaxDistance, onEnd, approachDirection ?? null);
    }

    isPinned(node: HighlightNode): boolean {
        return this.pinnedNodes.indexOf(node) >= 0;
    }

    getPinned(): HighlightNode[] {
        return this.pinnedNodes;
    }

    pin(node: HighlightNode): void {
        if (this.isPinned(node)) return;
        this.pinnedNodes.push(node);
        node.addClass?.("node-pinned");
        this._emitPinboardChanged();
    }

    unpin(node: HighlightNode): void {
        const idx = this.pinnedNodes.indexOf(node);
        if (idx < 0) return;
        this.pinnedNodes.splice(idx, 1);
        node.removeClass?.("node-pinned");
        this._emitPinboardChanged();
    }

    togglePin(node: HighlightNode): void {
        this.isPinned(node) ? this.unpin(node) : this.pin(node);
    }

    private _eventTarget(): EventTarget {
        return this.view?.el ?? window;
    }

    private _emitSelectionChanged(): void {
        this._eventTarget().dispatchEvent(new CustomEvent("node-clicked", {
            detail: this.getLastSelected(), bubbles: true
        }));
    }

    private _emitPinboardChanged(): void {
        this._eventTarget().dispatchEvent(new CustomEvent("pinboard-changed", {
            detail: [...this.pinnedNodes], bubbles: true
        }));
    }
}
