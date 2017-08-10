
import template from "./info-panel.html"

class InfoPanel extends HTMLElement {

    constructor(...args) {
        super(...args);




    }

    connectedCallback(){

        $(this).append(template)


    }


}


customElements.define("info-panel", InfoPanel);
