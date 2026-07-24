import template from "./graph-hud.html?raw"
import "./info-panel/InfoPanel"
import { initTweakpane } from "./TweakpaneHUD";
import "./EdgeIndicatorOverlay.css";
import { initEdgeIndicatorOverlay } from "./EdgeIndicatorOverlay";

class GraphHUD extends HTMLElement {

    constructor(...args) {
        super(...args);
    }

    connectedCallback() {
        this.innerHTML = template;
        initTweakpane();
        initEdgeIndicatorOverlay();
    }
}

if (!customElements.get("graph-hud"))
    customElements.define("graph-hud", GraphHUD);
