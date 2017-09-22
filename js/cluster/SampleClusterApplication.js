/**
 *  TODO re-structure graph
 * -into graph + subgraphs or simply multiple graphs
 * -each graph may have distribution class/function which handles the layouting of the node/edges
 * -for example a node-set might divided into different sub-sets depending on current assosiations
 *  they may further contain sub-sets
 * - for rendering, these sets are going to be put into a container class like the "nodeClouds"
 * so a "nodesContainer" and a nodesClusterContainer will be needed which also have the distribution function
 */


//--------------------------------

//TODO find a better way to import libraries as simple scripts
//NOTE:don't remove imports


import "./SampleClusterApplication.css"

import "../../css/style.css"
import "../../css/force-graph.css"
//import "../../css/jquery-ui.css"  //TODO refactor and only use necessary parts


import "../gui/searchbar"


import "./refactor/SpecificDataUtils"
import "./refactor/AppDataService"

//used by View3D
//TODO fix imports
import CombinedCamera from "../lib/CombinedCamera"
import TrackballControls from "../lib/TrackballControls"

//used by ConvexVolume
import ConvexGeometry from "../lib/ConvexGeometry"
import QuickHull from "../lib/QuickHull"

// --------------------------------




import "../view/GraphView3D"
import "../gui/ModeSelect"



import CompanyNewsDS from "../data/CompanyNewsDS"

import {getGraphDataSets} from "../data/data-set-loader"

import Default3DGraphConfig from "./configs/Default3DGraphConfig";


//-----------------------------------------
//-----------DEBUG-------------------------
//-----------------------------------------




/**
 * currently used for debugging purposes.. TODO should receive a mayor overhaul, if used for production
 */


export class SampleClusterApplication extends HTMLElement {


    connectedCallback() {

        let datasets = getGraphDataSets()

        this.setDataSets(datasets);
        this.setupViews()

        this.addNewsListeners()


        $(this).append("<graph-hud></graph-hud>")


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


            var container = $("<div>")
                .css(containerCSS)//.hide()
                .appendTo("body");

            let title = $("<div>press 'space' to toggle menu, 'double-click' elements to maximise </div>")
                .css({
                    position: "absolute",
                    "pointer-events": "none",
                    width: "100%",
                    "font-size": "1em",
                    color: "rgba(255, 255, 255, 0.5)"
                });


            function toggleMenu() {
                container.toggle()
            }

            title.on("click", toggleMenu);

            container.append(title);


            Mousetrap.bind("space", toggleMenu);

            return container
        }

        var that = this;


        var container = createContainer();


        function createView(name = "View3D", speccs, isMaximised = false) {

            function maximiseView() {

                if (this.isMaximised()) {

                    $(this)
                        .addClass("view-thumbnail")
                    return;
                }


                $(this)
                    .removeClass("view-thumbnail")

                container.hide();

                let maximisedContainer = $(that) //$("#3d-graph");
                //globalEnv.scene=mGraphView.mScene
                var prevMaximisedElement = maximisedContainer.children(".view-3d");//("graph-view-3d")

                _.each(prevMaximisedElement, function (view) {

                    view.undoMaximise()

                });

                container.append(prevMaximisedElement);


                //TODO remove small bug with connectCallback in view3D recursion
                maximisedContainer.append(this);

                this.maximise()

            }


            let mGraphView = document.createElement("graph-view-3d");
            mGraphView.setCaption(name);


            if (that.isDebug()) {
                mGraphView.maxFPS = 55;

            }

            mGraphView.showFPSCounter = that.isDebug();


            $(mGraphView)
                .addClass("view-thumbnail")

            $(mGraphView).on("dblclick", maximiseView);


            mGraphView.setSpeccs(speccs);

            //TODO per view ... mGraphView.mRenderer.domElement
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
                $(that).find("info-panel").toggle(infoVisible)


            });

            //FIXME
            if (isMaximised)
                maximiseView.bind(mGraphView)();
            /*$(mGraphView).on("loaded",function (){

             maximiseView.bind(mGraphView)()
             } );
             */

            $(window).on("resize", _.throttle(function () {
                //TODO use native events

                if (!mGraphView.isMaximised()) return;

                $(mGraphView).trigger("resize")
                //console.warn("TODO handle window resize + (f11)")
            }, 100));


            return mGraphView

        }


        let views = [];


        if (that.isDebug()) {


            //NOTE: target rendering

            var config = new Default3DGraphConfig()

            var speccs = config.getSpeccs()// this.getForceSpeccs();
            let view2 = createView("new force-graph", speccs, true)
                .loadDataSet(this.getDSByID(1));

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
                .loadDataSet(this.getDSByID(0));
            config.setView(view2)
            views.push(view2)


        }


        _.each(views, function (view) {
            if ($(view).parent().length == 0)
                container.append(view)
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


    setDataSets(datasets) {
        this.mDataSets = datasets;

    }


    getDSByID(id) {
        return this.mDataSets[id]
    }


    getCurrentView() {

        return $(".view-3d.view-3d-maximised").get(0)

    }


}

customElements.define("sample-cluster-application", SampleClusterApplication);



	