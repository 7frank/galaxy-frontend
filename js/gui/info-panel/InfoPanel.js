import template from "./info-panel.html"

class InfoPanel extends HTMLElement {

    constructor(...args) {
        super(...args);


    }

    connectedCallback() {

        $(this).append(template)

        $(this).find("#clusterTextVisible").change(function () {
            let val = $(this).val()
            let view = document.querySelector("sample-cluster-application").getView();
            view.setAttribute("text-visible", val)
        })

        $(this).find("#nodes").change(function () {
            let val = $(this).val()
            let view = document.querySelector("sample-cluster-application").getView();

            view.mRootCluster.setNodesVisible(val == "true")
        })

        $(this).find("#edges").change(function () {
            let val = $(this).val()
            let view = document.querySelector("sample-cluster-application").getView();

            view.mRootCluster.setEdgesVisible(val == "true")
        })

        $(this).find("#leafs").change(function () {
            let val = $(this).val()
            let view = document.querySelector("sample-cluster-application").getView();

            view.mRootCluster.setLeafsVisible(val == "true")
        })

        $(this).find("#particles").change(function () {
            let val = $(this).val()
            let view = document.querySelector("sample-cluster-application").getView();

            view.mRootCluster.setParticlesVisible(val == "true")
        })


    }


}


customElements.define("info-panel", InfoPanel);
