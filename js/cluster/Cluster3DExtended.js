/**
 * Created by Frank on 06.06.2017.
 */


import BaseCluster3D from "./BaseCluster3D"

import BaseDistribution from "./distributions/BaseDistribution"

import ForceGraphDistribution from "./distributions/ForceGraphDistribution"
import ZoomUtil from "../utils/ZoomUtil"


/**
 * TODO refactor some methods from BaseCluster that are not part of the core
 */

//refactoring current cluster structure
export default class Cluster3DExtended extends BaseCluster3D {


    constructor(nodes, clusteringHandlers, view) {
        super(nodes, clusteringHandlers, view);


        this.selected = false;


        this.addListeners();


    }


    /**
     *   have a dynamic distance based on the size of the cluster
     *
     */
    zoomToCluster(defaultDistance = 400) {


        let view = this.getView();

        var distance = this.getRadius(defaultDistance) * 3;


        ZoomUtil.moveToCluster(this, {distance})
    }


    /**
     * adds some listeners and actions
     *  - zoom via keyboard default hotkey "space"
     *  - show hide cluster border defaults to "mouseover"/"mouseout"
     *  - change ordering/distibution of child clusters defaults to "dblclick"
     */


    addListeners() {


        //have a "cluster-ready" event
        /*  this.on("cluster-ready",function(){

              this.addNodeCaptions();

          });*/


        var curr = 0;

        function onClickFactory(res, speccs) {


            return function clickAndSpeccHandler() {


                var _dist = speccs[curr++ % speccs.length].distribution;

                console.log("setting distribution function", _dist);
                res.setDistributionHandler(_dist, function onComplete() {


                    res.adjustHullSize();
                    //distribution-complete
                    if (res.isLeaf()) {
                        res.updateIfIsLeaf()
                    }

                    //res.onAfterClusteredAndDistributed()


                })

                //FIXME add complete handler
                /*                setTimeout(function()
                 {

                 res.onAfterClusteredAndDistributed()

                 },1000 )
                 */
            }
        }

        //FIXME find a way to not get click triggered if dblclick is triggered when both are bound to same element
        // also dragging will trigger click events
        this.on("z dblclick", function (e) {
            e.stopPropagation();

            this.zoomToCluster()

        });

        var diameter = null;
        this.on("s", function (e) {
            e.stopPropagation();
            if (!diameter)
                diameter = this.geometry.boundingSphere.radius * 2;
            console.log("clicky clicky", diameter);
            let speccsRoot = [
                {distribution: new BaseDistribution(diameter, 1)},
                {distribution: new BaseDistribution(diameter * 0.66, 2)},
                {distribution: new BaseDistribution(diameter * 0.33, 3)},
                {distribution: new ForceGraphDistribution(diameter * 0.66, 3)}
            ];


            var fn = onClickFactory(this, speccsRoot);

            fn()
        });


        this.on("a", function (e) {
            e.stopPropagation();
            if (!diameter)
                diameter = this.geometry.boundingSphere.radius * 2;
            console.log("clicky clicky", diameter);
            let speccsRoot = [
                {distribution: new ForceGraphDistribution(diameter * 0.66, 3)}
            ];


            var fn = onClickFactory(this, speccsRoot);

            fn()
        });


        this.on("mouseover", function (e) {
            e.stopPropagation();

            if (this.mHull) {

                this.mHull.mesh.material.visible = this.mHull.canBeVisible();
                this.mHull.setActive();

            }

            let name = (this.name ? this.name : this.id);

            let parents = this.getParents();


            //hide tooltip for root cluster
            if (parents.length == 0) {
                this.getView().setTooltip("");
                return
            }

            parents.shift();
            let root = parents.map(p => p.name ? p.name : p.id).join(" - ");
            //TODO public setter function


            // let lod=(this.mHull)? this.mHull.lod:-1;


            this.getView().setTooltip(root + " " + name) //+" LOD:"+lod


        });


        this.on("mouseout", function (e) {
            e.stopPropagation();
            if (this.mHull) {
                this.mHull.setInactive();
            }

            this.getView().setTooltip("")
        });

        this.on("t", function (e) {
            e.stopPropagation();
            this.toggleSelect()
        })


    }


    /**
     *  NOTE:don't call update for any cluster directly,it will be called via before-render
     *
     */
    update() {

        super.update();


        //FIXME performance
        if (this.isLeaf())
            if (this.mLeaf && this.getView())
                this.mLeaf.updateDots(this.getView().mTime);


    }


    appendNodes(nodes) {

        var that = this;
        _.each(nodes, function (node) {
            if (node && node._bubble)
                that.mExpandedGroup.add(node._bubble)


        })


    }

    /**
     * add some text to the sub-clusters providing informations
     *
     * deprecated, text is handled via overlay
     *
     */

    /*
        addNodeCaptions() {

            if (this._hasNodeCaptions_) return;
            console.log("addNodeCaptions");
            this._hasNodeCaptions_=true;
            var rootCluster = this.getRoot();
            if (!rootCluster.mParentView) return;


            function _getNodePosition(node) {

                var mVec3 = new THREE.Vector3();
                mVec3.setFromMatrixPosition(node.matrixWorld);


                return mVec3; //node.position.clone()
            }

            var nodes = Object.values(this.mClusters);

            //TODO remove global dependency in TextNodes


            var mTextNode = $(rootCluster.mParentView.mRenderer.domElement).parent().children(".graph-captions-container");


            let env = {
                renderer: rootCluster.mParentView.mRenderer,
                currentNodesVisible: [],//can be left empty if below nodes function is used
                textNode: mTextNode,
                camera: rootCluster.mParentView.mCamera

            };

        }
        */

    isSelected() {
        return this.selected

    }

    toggleSelect() {
        if (this.isSelected())
            this.unselectCluster();
        else
            this.selectCluster()


    }

    /**
     * selecting a cluster will show all child elements of this sub-cluster and hide all other branches of the root-cluster
     *
     *
     */

    selectCluster() {

        if (this.isSelected()) return;


        var allLeafs = this.getRoot().getLeafs();
        var mLeafs = this.getLeafs();


        _.each(allLeafs, function (other) {

            let isChildOfCluster = mLeafs.indexOf(other) >= 0;

            other.parent.visible = isChildOfCluster
            //other.material.visible=isChildOfCluster

        });


        this.selected = true

    }


    unselectCluster() {

        if (!this.isSelected()) return;


        var allLeafs = this.getRoot().getLeafs();


        _.each(allLeafs, function (other) {

            other.parent.visible = true

        });


        this.selected = false

    }


}