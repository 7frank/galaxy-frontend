/**
 * the hud is the text overlay over the 3d scene. it contains all the other visual components
 */

//TODO import css rules
//TODO import other vusual components and templates

import $ from "jquery"

import template from "./graph-hud.html"

import "./info-panel/InfoPanel"
import "./company-info/CompanyInfo"

class GraphHUD extends HTMLElement {

    constructor(...args) {
        super(...args);

    }

    connectedCallback() {

        $(this).append(template)


    }


}


customElements.define("graph-hud", GraphHUD);
