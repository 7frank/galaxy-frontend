import { selectionManager, doOnClickNode } from "../cluster/GraphElementExtension.js";
import "./NodeListPanel.css";

class GraphNodeList extends HTMLElement {

    connectedCallback() {
        this._collapsed = false;
        this._highlighted = new Set();
        this._edgesHighlighted = new Set();
        this._build();
        this._onPinboardChanged = (e) => {
            const nodes = e.detail || [];
            const prev = new Set(this._edgesHighlighted);
            nodes.forEach(n => {
                if (!prev.has(n)) {
                    selectionManager.highlight(n, false, true);
                    this._edgesHighlighted.add(n);
                }
            });
            this._edgesHighlighted.forEach(n => {
                if (!nodes.includes(n)) this._edgesHighlighted.delete(n);
            });
            this._dispatchEdgeFocus();
            this._render(nodes);
        };
        window.addEventListener("pinboard-changed", this._onPinboardChanged);
    }

    disconnectedCallback() {
        window.removeEventListener("pinboard-changed", this._onPinboardChanged);
    }

    _allHighlighted(nodes) {
        return nodes.length > 0 && nodes.every(n => this._highlighted.has(n));
    }

    _allEdgesHighlighted(nodes) {
        return nodes.length > 0 && nodes.every(n => this._edgesHighlighted.has(n));
    }

    _build() {
        this._panel = document.createElement("div");
        this._panel.className = "node-list-panel";

        const header = document.createElement("div");
        header.className = "node-list-panel-header";

        const title = document.createElement("span");
        title.className = "node-list-panel-header-title";
        title.textContent = "Pinned nodes";
        header.appendChild(title);

        const collapseBtn = document.createElement("button");
        collapseBtn.className = "node-list-panel-item-btn";
        collapseBtn.textContent = "▾";
        collapseBtn.addEventListener("click", () => {
            this._collapsed = !this._collapsed;
            this._body.style.display = this._collapsed ? "none" : "";
            collapseBtn.textContent = this._collapsed ? "▸" : "▾";
        });
        header.appendChild(collapseBtn);

        this._panel.appendChild(header);

        this._toolbar = document.createElement("div");
        this._toolbar.className = "node-list-panel-toolbar";
        this._panel.appendChild(this._toolbar);

        this._body = document.createElement("div");
        this._body.className = "node-list-panel-body";
        this._panel.appendChild(this._body);

        this.appendChild(this._panel);
        this._render(selectionManager.getPinned());
    }

    _renderToolbar(nodes) {
        this._toolbar.innerHTML = "";
        if (!nodes || nodes.length === 0) return;

        const allVis = this._allHighlighted(nodes);
        const showAllBtn = document.createElement("button");
        showAllBtn.className = "node-list-panel-toolbar-btn";
        showAllBtn.textContent = allVis ? "Hide all" : "Show all";
        showAllBtn.title = allVis ? "Unhighlight all pinned nodes" : "Highlight all pinned nodes";
        showAllBtn.addEventListener("click", () => {
            if (this._allHighlighted(nodes)) {
                nodes.forEach(n => { selectionManager.unhighlight(n); this._highlighted.delete(n); });
            } else {
                nodes.forEach(n => { selectionManager.highlight(n, false, false); this._highlighted.add(n); });
            }
            this._render(selectionManager.getPinned());
        });

        const allEdges = this._allEdgesHighlighted(nodes);
        const edgesAllBtn = document.createElement("button");
        edgesAllBtn.className = "node-list-panel-toolbar-btn";
        edgesAllBtn.textContent = allEdges ? "Hide all edges" : "Show all edges";
        edgesAllBtn.title = allEdges ? "Remove edge arrows for all" : "Show edge arrows for all";
        edgesAllBtn.addEventListener("click", () => {
            if (this._allEdgesHighlighted(nodes)) {
                nodes.forEach(n => { selectionManager.unhighlight(n); this._edgesHighlighted.delete(n); });
            } else {
                nodes.forEach(n => { selectionManager.highlight(n, false, true); this._edgesHighlighted.add(n); });
            }
            this._dispatchEdgeFocus();
            this._render(selectionManager.getPinned());
        });

        this._toolbar.appendChild(showAllBtn);
        this._toolbar.appendChild(edgesAllBtn);
    }

    _render(nodes) {
        this._renderToolbar(nodes);
        this._body.innerHTML = "";

        if (!nodes || nodes.length === 0) {
            const empty = document.createElement("div");
            empty.className = "node-list-panel-empty";
            empty.textContent = "No pinned nodes";
            this._body.appendChild(empty);
            return;
        }

        for (const node of nodes) {
            const label = node.name ?? node.id ?? "Node";
            const item = document.createElement("div");
            item.className = "node-list-panel-item";

            const labelEl = document.createElement("span");
            labelEl.className = "node-list-panel-item-label";
            labelEl.textContent = label;
            labelEl.title = label;
            labelEl.addEventListener("click", () => {
                doOnClickNode(node, false, undefined, true, false, false, true);
            });

            const isHighlighted = this._highlighted.has(node);
            const highlightBtn = document.createElement("button");
            highlightBtn.className = "node-list-panel-item-btn";
            highlightBtn.textContent = isHighlighted ? "◉" : "◎";
            highlightBtn.title = isHighlighted ? "Hide highlight" : "Show highlight";
            highlightBtn.addEventListener("click", () => {
                if (this._highlighted.has(node)) {
                    selectionManager.unhighlight(node);
                    this._highlighted.delete(node);
                } else {
                    selectionManager.highlight(node, false, false);
                    this._highlighted.add(node);
                }
                this._render(selectionManager.getPinned());
            });

            const hasEdges = this._edgesHighlighted.has(node);
            const edgesBtn = document.createElement("button");
            edgesBtn.className = "node-list-panel-item-btn";
            edgesBtn.textContent = hasEdges ? "⇶" : "⇉";
            edgesBtn.title = hasEdges ? "Hide edges" : "Show edges";
            edgesBtn.addEventListener("click", () => {
                if (this._edgesHighlighted.has(node)) {
                    selectionManager.unhighlight(node);
                    this._edgesHighlighted.delete(node);
                } else {
                    selectionManager.highlight(node, false, true);
                    this._edgesHighlighted.add(node);
                }
                this._dispatchEdgeFocus();
                this._render(selectionManager.getPinned());
            });

            const removeBtn = document.createElement("button");
            removeBtn.className = "node-list-panel-item-btn";
            removeBtn.textContent = "✕";
            removeBtn.title = "Remove from pinboard";
            removeBtn.addEventListener("click", () => {
                this._highlighted.delete(node);
                this._edgesHighlighted.delete(node);
                selectionManager.unpin(node);
            });

            item.appendChild(labelEl);
            item.appendChild(highlightBtn);
            item.appendChild(edgesBtn);
            item.appendChild(removeBtn);
            this._body.appendChild(item);
        }
    }

    _dispatchEdgeFocus() {
        window.dispatchEvent(new CustomEvent("pinboard-edge-focus", {
            detail: [...this._edgesHighlighted]
        }));
    }
}

customElements.define("graph-node-list", GraphNodeList);

export { GraphNodeList };
