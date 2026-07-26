import { selectionManager, doOnClickNode } from "../cluster/GraphElementExtension.js";
import "./NodeListPanel.css";

class GraphNodeList extends HTMLElement {

    connectedCallback() {
        this._collapsed = false;
        this._highlighted = new Set();
        this._build();
        this._onPinboardChanged = (e) => this._render(e.detail);
        window.addEventListener("pinboard-changed", this._onPinboardChanged);
    }

    disconnectedCallback() {
        window.removeEventListener("pinboard-changed", this._onPinboardChanged);
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

        this._body = document.createElement("div");
        this._body.className = "node-list-panel-body";
        this._panel.appendChild(this._body);

        this.appendChild(this._panel);
        this._render(selectionManager.getPinned());
    }

    _render(nodes) {
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

            const highlightBtn = document.createElement("button");
            highlightBtn.className = "node-list-panel-item-btn";
            const isHighlighted = this._highlighted.has(node);
            highlightBtn.textContent = isHighlighted ? "◉" : "◎";
            highlightBtn.title = isHighlighted ? "Hide highlight" : "Show highlight";
            highlightBtn.addEventListener("click", () => {
                if (this._highlighted.has(node)) {
                    selectionManager.unhighlight(node);
                    this._highlighted.delete(node);
                } else {
                    selectionManager.highlight(node, true, false);
                    this._highlighted.add(node);
                }
                this._render(selectionManager.getPinned());
            });

            const removeBtn = document.createElement("button");
            removeBtn.className = "node-list-panel-item-btn";
            removeBtn.textContent = "✕";
            removeBtn.title = "Remove from pinboard";
            removeBtn.addEventListener("click", () => {
                this._highlighted.delete(node);
                selectionManager.unpin(node);
            });

            item.appendChild(labelEl);
            item.appendChild(highlightBtn);
            item.appendChild(removeBtn);
            this._body.appendChild(item);
        }
    }
}

customElements.define("graph-node-list", GraphNodeList);

export { GraphNodeList };
