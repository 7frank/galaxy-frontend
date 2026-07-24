import "./SampleClusterApplication.css"

import "../../css/style.css"
import "../../css/force-graph.css"
import "../gui/searchbar"


import "./refactor/SpecificDataUtils"
import "./refactor/AppDataService"
import GraphView3D from "../view/GraphView3D"
import "../gui/ModeSelect"


import CompanyNewsDS from "../data/CompanyNewsDS"

import CsvDatasource from "../data/CsvDatasource"
import GraphQLDatasource from "../data/GraphQLDatasource"

export {CsvDatasource, GraphQLDatasource}

import Default3DGraphConfig from "./configs/Default3DGraphConfig";
import Mousetrap from "mousetrap";
import _ from "lodash";



/**
 *  TODO re-structure graph
 * -into graph + subgraphs or simply multiple graphs
 * -each graph may have distribution class/function which handles the layouting of the node/edges
 * -for example a node-set might divided into different sub-sets depending on current assosiations
 *  they may further contain sub-sets
 * - for rendering, these sets are going to be put into a container class like the "nodeClouds"
 * so a "nodesContainer" and a nodesClusterContainer will be needed which also have the distribution function

 * NOTE: currently used for debugging purposes..
 * TODO should receive a mayor overhaul, if used for production
 */


export class SampleClusterApplication extends HTMLElement {


    // noinspection JSUnusedGlobalSymbols
    connectedCallback() {

        if (!this.datasource) {
            this.datasource = new CsvDatasource(
                "assets/realDataNodesv5_ticker.csv",
                "assets/realDataLinksv5.csv"
            )
        }

        this.setupViews()

        this.addNewsListeners()


        const hud = document.createElement("graph-hud");
        this.appendChild(hud);


    }


    addNewsListeners() {

        console.error("fixme addNewsListeners needs socket server and handler if server is not found")

        return
        var myDS = new CompanyNewsDS('http://localhost:3000')

        myDS.onNewsReceived(function (news) {

        })

    }


    isDebug() {

        return window.location.hash == "#debug"

    }


    setupViews() {

        function createContainer() {

            let containerCSS = {
                //"pointer-events": "none",
                // display: "flex",
                // "flex-flow": "row wrap",

                display: "grid",
                // "grid-template-rows": "repeat(10, 287px)",
                "grid-auto-rows": "300px",
                "grid-template-columns": "50% 50%",

                padding: "1em",

                position: "absolute",
                top: "10em",
                left: "20em",
                width: 840,//"60em",
                height: "40em"
                , "overflow-y": "scroll"
                , "overflow-x": "hidden",
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
                    console.log("TODO toggling edges won't work because of LOD impl");
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

            //FIXME
            if (isMaximised)
                maximiseView.bind(mGraphView)();
            window.addEventListener("resize", _.throttle(function () {

                if (!mGraphView.isMaximised()) return;

                mGraphView.el.dispatchEvent(new CustomEvent("resize"));

            }, 100));

            return mGraphView;
        }


        let views = [];


        if (that.isDebug()) {


            //NOTE: target rendering

            var config = new Default3DGraphConfig()

            var speccs = config.getSpeccs()// this.getForceSpeccs();
            let view2 = createView("new force-graph", speccs, true)
                .loadDatasource(that.datasource);

            config.setView(view2)

            views.push(view2);


            //TODO views should only be loaded when visible


            /*

             let view3 = createView("node distribution test case",
             [{
             distribution: new BaseDistribution(2000, 3),
             options: { hull: new BoxVolume()}
             }])
             .loadDataSet(this.getDSByID(1))

             views.push(view3)
             */


            /*  var speccs = this.getPossibleClusterSpeccsArray();
             let view1 = createView("View1", speccs)
             views.push(view1)*/


        } else {


            var config = new Default3DGraphConfig()

            var speccs = config.getSpeccs()
            let view2 = createView("new force-graph", speccs, true)
                .loadDatasource(that.datasource);
            config.setView(view2)
            views.push(view2)


        }


        that._views = views;

        _.each(views, function (view) {
            if (!view.el.parentElement)
                container.appendChild(view.el)
        })


    }


    getSampleSpeccs() {


        //TODO check where a facade could be used to have more stable option generation
        //also possibly use options as attributes for the graph-view to be able to alter directly
        /*
        new ClusterSpeccFacade()
            .setGenerator(function countrySetGenerator(groupFunction, node) {
                groupFunction(node.group, node)
            })
            .setExpandedFunction(function(){
                return this.name=="United States"
            })

        */

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



	