import template from "./graph-hud.html?raw"
import "./info-panel/InfoPanel"
import { initTweakpane } from "./TweakpaneHUD";
import "./EdgeIndicatorOverlay.css";
import { initEdgeIndicatorOverlay } from "./EdgeIndicatorOverlay";
import { waitForView, resolveView } from "./graphViewMixin.js"

class GraphHUD extends HTMLElement {

    constructor(...args) {
        super(...args);
    }

    setView(view) { this._view = view; return this; }

    connectedCallback() {
        this.innerHTML = template;
        const getView = () => resolveView(this);
        this._tweakpane = initTweakpane(getView);
        this._cancelWait = waitForView(this, (view) => {
            this._destroyEdgeOverlay = initEdgeIndicatorOverlay(view);
            const infoPanel = this.querySelector("info-panel");
            if (infoPanel) infoPanel.setView(view);
        });
    }

    disconnectedCallback() {
        this._cancelWait?.();
        this._destroyEdgeOverlay?.();
    }
}

if (!customElements.get("graph-hud"))
    customElements.define("graph-hud", GraphHUD);
