import template from "./info-panel.html?raw"

class InfoPanel extends HTMLElement {

    constructor(...args) {
        super(...args);


    }

    connectedCallback() {

        this.innerHTML = template;

        const getView = () => document.querySelector("sample-cluster-application").getView();

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
