/**
 * the hud is the text overlay over the 3d scene. it contains all the other visual components
 */

//TODO import css rules
//TODO import other vusual components and templates

import template from "./graph-hud.html"

import "./info-panel/InfoPanel"
import "./company-info/CompanyInfo"

class GraphHUD extends HTMLElement {

    constructor(...args) {
        super(...args);

    }

    connectedCallback() {

        this.innerHTML = template;


    }


}

if (!customElements.get("graph-hud"))
customElements.define("graph-hud", GraphHUD);
