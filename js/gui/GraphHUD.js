import template from "./graph-hud.html?raw"
import "./info-panel/InfoPanel"
import { initTweakpane } from "./TweakpaneHUD";

class GraphHUD extends HTMLElement {

    constructor(...args) {
        super(...args);
    }

    connectedCallback() {
        this.innerHTML = template;
        initTweakpane();
    }
}

if (!customElements.get("graph-hud"))
    customElements.define("graph-hud", GraphHUD);
