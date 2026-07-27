import template from "./info-panel.html?raw"

class InfoPanel extends HTMLElement {

    constructor(...args) {
        super(...args);
    }

    setView(view) { this._view = view; return this; }

    connectedCallback() {

        this.innerHTML = template;

        const getView = () => this._view;

        this.querySelector("#clusterTextVisible").addEventListener("change", function () {
            getView().setTextVisible(this.value);
        });

        this.querySelector("#nodes").addEventListener("change", function () {
            getView().mRootCluster.setNodesVisible(this.value == "true");
        });

        this.querySelector("#edges").addEventListener("change", function () {
            getView().mRootCluster.setEdgesVisible(this.value == "true");
        });

        this.querySelector("#leafs").addEventListener("change", function () {
            getView().mRootCluster.setLeafsVisible(this.value == "true");
        });

        this.querySelector("#particles").addEventListener("change", function () {
            getView().mRootCluster.setParticlesVisible(this.value == "true");
        });


    }


}

if (!customElements.get("info-panel"))
customElements.define("info-panel", InfoPanel);
