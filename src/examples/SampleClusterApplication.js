import "./SampleClusterApplication.css"

import "../../css/style.css"
import "../../css/force-graph.css"
import "../../js/gui/searchbar"

import GraphView3D from "../../js/view/GraphView3D"
import "../../js/gui/ModeSelect"

import CsvDatasource from "../../js/data/CsvDatasource"
import { ClusteringUtils } from "../../js/cluster/ClusteringUtils"

import Mousetrap from "mousetrap";
import _ from "lodash";

export { CsvDatasource }


export class SampleClusterApplication extends HTMLElement {

    connectedCallback() {

        if (!this.datasource) {
            this.datasource = new CsvDatasource(
                "assets/realDataNodesv5_ticker.csv",
                "assets/realDataLinksv5.csv"
            )
        }

        this.setupViews()

        const hud = document.createElement("graph-hud");
        this.appendChild(hud);
    }


    isDebug() {
        return window.location.hash == "#debug"
    }


    setupViews() {

        function createContainer() {

            let containerCSS = {
                display: "grid",
                "grid-auto-rows": "300px",
                "grid-template-columns": "50% 50%",
                padding: "1em",
                position: "absolute",
                top: "10em",
                left: "20em",
                width: 840,
                height: "40em",
                "overflow-y": "scroll",
                "overflow-x": "hidden",
                background: "rgba(255, 255, 255, 0.2)",
                border: "1px solid rgba(128, 128, 128, 0.5)",
            };

            var container = document.createElement("div");
            Object.assign(container.style, containerCSS);
            document.body.appendChild(container);

            let title = document.createElement("div");
            title.textContent = "press 'space' to toggle menu, 'double-click' elements to maximise";
            Object.assign(title.style, {
                position: "absolute",
                pointerEvents: "none",
                width: "100%",
                fontSize: "1em",
                color: "rgba(255, 255, 255, 0.5)"
            });

            function toggleMenu() {
                container.style.display = container.style.display === "none" ? "" : "none";
            }

            title.addEventListener("click", toggleMenu);
            container.appendChild(title);

            Mousetrap.bind("space", toggleMenu);

            return container
        }

        var that = this;
        var container = createContainer();


        function createView(name = "View3D", speccs, isMaximised = false) {

            function maximiseView() {

                if (this.isMaximised()) {
                    this.el.classList.add("view-thumbnail");
                    return;
                }

                this.el.classList.remove("view-thumbnail");
                container.style.display = "none";

                var prevViews = that._views || [];
                _.each(prevViews, function (view) {
                    if (view.isMaximised()) {
                        view.undoMaximise();
                        container.appendChild(view.el);
                    }
                });

                that.appendChild(this.el);
                this.maximise()
            }

            let viewEl = document.createElement("div");
            let mGraphView = new GraphView3D(viewEl);
            mGraphView.setCaption(name);

            if (that.isDebug()) {
                mGraphView.maxFPS = 55;
            }

            viewEl.classList.add("view-thumbnail");
            viewEl._view3d = mGraphView;
            viewEl.addEventListener("dblclick", maximiseView.bind(mGraphView));

            mGraphView.setSpeccs(speccs);

            let events = new Mousetrap();

            var edgesVisible = true;
            events.bind("e", function () {
                edgesVisible = !edgesVisible;
                _.each(mGraphView.mRootCluster.getLeafs(), function (leaf) {
                    leaf.mEdgesContainer.visible = edgesVisible;
                    leaf.mEdgesContainer2.visible = edgesVisible
                })
            });

            var infoVisible = true;
            events.bind("h", function () {
                infoVisible = !infoVisible;
                that.querySelectorAll("info-panel").forEach(el => el.style.display = infoVisible ? "" : "none");
            });

            mGraphView.initStatic();

            if (isMaximised)
                maximiseView.bind(mGraphView)();

            window.addEventListener("resize", _.throttle(function () {
                if (!mGraphView.isMaximised()) return;
                mGraphView.el.dispatchEvent(new CustomEvent("resize"));
            }, 100));

            return mGraphView;
        }


        const speccs = ClusteringUtils.buildSpeccs(['group', 'industry']);

        let views = [];
        let view = createView("force-graph", speccs, true).loadDatasource(that.datasource);
        views.push(view);

        that._views = views;

        _.each(views, function (view) {
            if (!view.el.parentElement)
                container.appendChild(view.el)
        })
    }


    getCurrentView() {
        let el = document.querySelector(".view-3d.view-3d-maximised");
        return el ? el._view3d : null
    }

    getView() {
        return this.getCurrentView()
    }
}

customElements.define("sample-cluster-application", SampleClusterApplication);
