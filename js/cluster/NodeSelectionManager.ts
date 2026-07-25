import ZoomUtil from "../utils/ZoomUtil";
import type { HighlightNode } from "./GraphElementExtension";
import type { ArrowEdge } from "./edges/ArrowEdge";
import { addArrow, removeArrow } from "./edges/ArrowEdge";
import type { Mesh } from "three/src/objects/Mesh.js";

export default class NodeSelectionManager {

    private selectedNodes: HighlightNode[] = []
    private lastDblClicked: HighlightNode | undefined

    highlight(node: HighlightNode, showNeighbours = false, showEdgeArrows = true): void {
        node.showHighlight?.();

        if (showNeighbours) {
            for (const child of node.children) child.showHighlight?.();
            for (const parent of node.parents) parent.showHighlight?.();
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
        for (const child of node.children) child.hideHighlight?.();
        for (const parent of node.parents) parent.hideHighlight?.();
        for (const edge of node.edges) removeArrow(edge as ArrowEdge);
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

            if (zoom) this._zoomToNode(node._bubble, onZoomEnd);

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
        window.dispatchEvent(new CustomEvent("node-selected", {
            detail: isDeselect ? null : node
        }));
        this.lastDblClicked = isDeselect ? undefined : node;
    }

    private _zoomToNode(mesh: Mesh, onEnd?: () => void, minMaxDistance = 400): void {
        const viewEl = document.querySelector<HTMLElement & { _view3d?: unknown }>(".view-3d[hasFocus]")
            ?? document.querySelector<HTMLElement & { _view3d?: unknown }>(".view-3d.view-3d-maximised");
        const view = viewEl?._view3d as { mCamera?: unknown; mControls?: unknown } | null;
        if (!view) { console.warn("no view focused to be able to zoom"); return; }
        ZoomUtil.moveToMesh(mesh, view.mCamera, view.mControls, minMaxDistance, onEnd);
    }

    private _emitSelectionChanged(): void {
        window.dispatchEvent(new CustomEvent("node-clicked", {
            detail: this.getLastSelected()
        }));
    }
}
