import ClusterTextOverlay from "../cluster/text/ClusterTextOverlay"
import { waitForView } from "./graphViewMixin.js"
import "./Breadcrumb.css"

class GraphBreadcrumb extends HTMLElement {

    setView(view) { this._view = view; return this; }

    connectedCallback() {
        this.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1;";
        this._cancelWait = waitForView(this, (view) => {
            if (this._overlay) this._overlay.el.remove();
            this._overlay = new ClusterTextOverlay();
            this._overlay.init(view);
            this.appendChild(this._overlay.el);
        });
    }

    disconnectedCallback() {
        this._cancelWait?.();
    }
}

if (!customElements.get("graph-breadcrumb"))
    customElements.define("graph-breadcrumb", GraphBreadcrumb);
