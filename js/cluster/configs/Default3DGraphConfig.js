import GraphView3D from "../../view/GraphView3D";
import BaseCluster3D from "../BaseCluster3D";
import {IndustrialSectorAbbreviation} from "../utils/IndustrialSectorIcon";
import ConvexVolume from "../hull/ConvexVolume";
import BaseVolume from "../hull/BaseVolume";
import NoneHullEffect from "../hull/effects/NoneHullEffect";
import BasicHullEffect from "../hull/effects/BasicHullEffect";

import ForceGraphDistribution from "../distributions/ForceGraphDistribution";
import ZoomUtil from "../../utils/ZoomUtil";
import {removeSelections} from "../refactor/f1";

import { Color } from "three/src/math/Color.js";
import { Vector3 } from "three/src/math/Vector3.js";


/**
 * Some simple configuration-helper class that stores individual properties to render a graph.
 *
 * This includes simple values like background color, graph dimensions (1D,2D,3D),
 * options how the sub-clustering of the data(nodes) is applied
 * as well as the individual distributions (the dependencies in n-D space between a set of sub clustered nodes).
 *
 */


export default class Default3DGraphConfig {


    constructor(target, backgroundColor = 0x000000, cssClass = "darker") {

        this.setView(target)


        this.mBackgroundColor = backgroundColor
        this.mCssClass = cssClass

    }


    /**
     * currently the configuration needs a {@link View3D} instance which is later used to bind the keyboard and mouse controls to the 3d graph {@link RootCluster}
     *
     * @param target ... instanceof  View3D
     *
     */

    setView(target) {

        this.mView = target;

        this._targetView = target;


        return this

    }


    /**
     * Set individual behaviour of a threejs control.
     * Note: The current implementation uses THREE.TrackballControls exclusively.
     */

    setControls() {

        //TODO instead of setting true and false we should create new controls by cloning the current with default options
        let view = this.getView();


        view.mControls.target.set(new Vector3(0, 0, 0));
        view.mControls.noRotate = false;

        view.mControls.reset();

    }


    /**
     * this is a sample configuration for  the cluster.
     * it contains 2 subdivisions:  -first into countries
     *                              -followed by industry
     *
     */




    getSpeccs() {
        if (this._speccs) return this._speccs;
        this._speccs = this._buildSpeccs();
        return this._speccs;
    }

    _buildSpeccs() {


        //the function that is called to create the  country groups
        function countrySetGenerator(groupFunction, node) {
            // the group function takes 2 arguments
            // the first is the value that will determine the key of the group
            //in this case node.group contains country names
            //the second argument is the node itself that is passed into the group created
            groupFunction(node.group, node)
        }

        //same goes for the industy clusters that are sub-clusters of the country clusters in this example
        function industrySetGenerator(groupFunction, node) {
            groupFunction(node.industry, node)
        }


        //there are several distribution classes defined
        //these handle how the current cluster positions it's sub-clusters when rendering
        //basically a distribution function does have 2 parameters
        // the first is the maximum size in x/y/z direction the elements within can be placed
        // the second defined the dimensions 1/2/3 that get used for the element placement


        let countryDistribution = new ForceGraphDistribution(40000, 3); // countries get placed equally on a plane of size 15k X 15k
        let industryDistribution = new ForceGraphDistribution(15000, 3);// industries within countries use the Force-Graph approach to position elements
        let nodesWithinIndustryDistribution = new ForceGraphDistribution(8000, 3);//same goes for the nodes within each industry

        //the final configuration for rendering
        //it contains an additional options attribute per array entry

        // @param options.minClusterSize ... is the lower bound for the nodes within the cluster
        // if the cluster has fewer elements all clusters previously generated are places within this "other" cluster
        // @param options. defaultMergeGroupName the name of the "other" cluster can be changed by this value
        // @param options.hull can be used to add a volume around the cluster
        //by default if no value gets set, the BaseVolume class is used which is invisible by default
        //but is necessary for other components like picking and tet rendering


        // let rootHull = this.isDebug() ? BoxVolume : BaseVolume;

        //TODO these options are a little bit confusing atm.. the mCS option refers to the dist of the sub-clusters
        // while the hull option is used by the cluster itself

        return [

            {
                generator: countrySetGenerator,
                distribution: countryDistribution,
                options: {minClusterSize: 40, hull: BaseVolume, makeHullEffect: () => new NoneHullEffect()}
            },
            {
                generator: industrySetGenerator,
                distribution: industryDistribution,
                events: {
                    click: function () {
                        // this.toggleCollapse()
                    },
                    mouseover: function () {
                        // this.bClusterEdgesVisible= true
                    },
                    mouseout: function () {
                        //  this.bClusterEdgesVisible= false
                    }
                },
                options: {
                    minClusterSize: 15
                    , hull: ConvexVolume,
                    makeHullEffect: () => new BasicHullEffect(),
                    hullBorderMode: "hover",
                    onHullCreated: function (volume) {
                    }

                }// new BoxVolume() ConvexVolume//FIXME  this option is used twice for leaf and parent  and below is ignored
            }
            , {
                distribution: nodesWithinIndustryDistribution,
                options: {
                    hull: ConvexVolume,
                    makeHullEffect: () => new BasicHullEffect(),
                    hullBorderMode: "ambient",

                    text: function () {
                        //return IndustrialSectorIcon(this.name)
                        return IndustrialSectorAbbreviation(this.name)
                    }
                },
                events: {
                    click: function () {
                        console.log("idle")
                    }
                },
            }

        ]

    }


    //-----------------------------------------


    /**
     * TODO this should only be temporary
     *
     * what this is supposed to do is to reset all dom elements of the HUD
     * the css class determined the look and feel. for example the presets "dark" and "lite"
     *
     */

    setDomElements() {
        document.querySelectorAll(".my-accordion,.searchbar-container input, mode-select span,company-info,.graph-node-info,#sig_menu").forEach(el => el.classList.remove(this.mCssClass))

    }


    /**
     *
     *  Returns the instance of the {@link View3D} container which is used to render the graph within.
     *
     */

    getView() {

        if (!(this.mView instanceof GraphView3D)) throw new Error("view mst be set previously and must be instanceof Graph3DView")

        return this.mView

    }


    /**
     * TODO refactor
     *
     * currently used to restarts / reinitialises the rendering process of the graph
     *
     */

    restartGraph() {
        let speccs = this.getSpeccs();
        let view = this.getView();
        let rootCluster = view.mRootCluster;

        rootCluster.cleanUpLeafs();
        //clean up previous clusters
        BaseCluster3D.cleanUpClusters(rootCluster.findClusters("*"), rootCluster);

        rootCluster.applyClustering(speccs);
        view.addCompanyCountListenersToCluster(rootCluster);

        //TODO text is shown to early on update
        view.dispatchEvent(new CustomEvent("graph-changed"));

    }


    /**
     *
     * initialises creating the graph
     *
     * @param onComplete  ... is a callback-function that must be called internally by "setMode" to forward the information that creating the graph has finished
     *
     *
     **/

    setMode(onComplete = function () {
    }) {

        removeSelections()


        let speccs = this.getSpeccs();
        let view = this.getView();
        let rootCluster = view.mRootCluster;


        if (!rootCluster || rootCluster.isLocked()) {
            console.warn("can't setGraph3D wait until animation has finished");
            //  return
        }

        rootCluster.setLock(true);

        // view.mScene.background.copy(new Color(0x000000));
        view.mRenderer.setClearColor(this.mBackgroundColor)


        this.setDomElements()
        this.restartGraph()
        this.setControls()

        //view.mSkyDome.visible=true;


        var that = this
        rootCluster.on("hull-updated", function () {

            //FIXME called too often
            //  that.doZoomToRelevant(rootCluster)

            rootCluster.setLock(false)
            onComplete()

            //    rootCluster.findClusters("*").forEach(function(c){
            //       c.bClusterEdgesVisible=false
            //   })


        })


    }


    /**
     * helper that gets called after graph creation to zoom to specific initial position.
     *
     *
     * TODO refactor/remove?
     */

    doZoomToRelevant() {

        setTimeout(function () {

            //TODO zoom to usa
            /* if (rootCluster.mClusters["United States"])
                 rootCluster.mClusters["United States"].zoomToCluster()
             else*/


            this.zoomToPosition(new Vector3(0, 0, 150000), () => {
                //TODO moake it work without line below...  currently needs another zoom call to be able to use controls again
                this.getView().mRootCluster.zoomToCluster(150000)

            });


        }.bind(this), 3000)


        //   this.getView().mRootCluster.zoomToCluster()


    }


    /**
     * TODO refactor
     *
     * is used internally to move  the user camera to a specific location in 3D - space
     *
     *  @param position  ...  an instance of Vector3
     *  @param onComplete  ... is a callback-function
     *
     **/

    zoomToPosition(position, onComplete) {


        let view = this.getView();

        ZoomUtil.moveToPosition(position, view.mCamera, view.mControls, 0, onComplete)
    }


}