import template from "./graph-hud.html?raw"
import "./info-panel/InfoPanel"
import { initTweakpane } from "./TweakpaneHUD";
import "./EdgeIndicatorOverlay.css";
import { initEdgeIndicatorOverlay } from "./EdgeIndicatorOverlay";

class GraphHUD extends HTMLElement {

    constructor(...args) {
        super(...args);
    }

    setView(view) {
        this._view = view;
        if (this._tweakpane) return;
        return this;
    }

    connectedCallback() {
        this.innerHTML = template;
        const getView = () => this._view;
        this._tweakpane = initTweakpane(getView);
        this._destroyEdgeOverlay = initEdgeIndicatorOverlay(this._view);
        const infoPanel = this.querySelector("info-panel");
        if (infoPanel) infoPanel.setView(this._view);
    }
}

if (!customElements.get("graph-hud"))
    customElements.define("graph-hud", GraphHUD);
