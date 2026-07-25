/**
 * Created by Frank on 12.07.2017.
 */


import TextNodesFactory from "./TextNodesFactory"
import GraphView3D from "../../view/GraphView3D"

import Cluster3DExtended from "../Cluster3DExtended"

import "./cluster-text-overlay.css"

import { Vector3 } from "three/src/math/Vector3.js";
import * as _ from "lodash";


/**
 * A overlay class that can be used to put text elements on top of a{@link View3D}.
 * Primarily this is used to create text elements for clusters and nodes,
 * instead of generating 3D text which should be considerably slower.
 *
 *  TODO collect onBefore render of each cluster and nodeMixin(
 *  TODO change order of importance. From text for single node which is more relevant to text nodes for clusters.
 *
 */


export default class ClusterTextOverlay {

    constructor() {
        this.el = document.createElement("div");

        this.possibleClusters = [];
        this.possibleLeafClusters = [];
        this.selectedLeafCluster = null;
        this.separator = " › ";

        this.enabled = true;

    }

    /**
     * Initializes CSS and waits for graph {@link GraphView3D} to be loaded, before continuing to create the overlay.
     */

    init(view) {
        if (!(view instanceof GraphView3D))
            throw new Error("parent must be instance of GraphView3D");


        this.initCSS();

        const _onLoadedOrChanged = () => {

            this.bindToCluster(view.mRootCluster);
            this.addGlobalNodeCaptions(view)

        };
        view.addEventListener("loaded", _onLoadedOrChanged, { once: true });
        view.addEventListener("graph-changed", _onLoadedOrChanged);

        if (view.mRootCluster) _onLoadedOrChanged();

    }

    /**
     * Add listeners to the  {@link GraphView3D} to collect data of the visible cluster and leaf elements
     * when rendering each frame to update the current visible text nodes.
     */
    bindToCluster(rootcluster) {


        var _view = rootcluster.getView();

        var that = this;


        _view.addEventListener("before-render", function () {

            //reset nodes
            that.possibleClusters = [];
            that.possibleLeafClusters = [];
        });


        _view.addEventListener("after-render", () => {

            that.el.style.display = that.enabled ? "" : "none";
            if (!that.enabled) return;

            this.tn.update();
            this.mTextNodes.update();

            //console.log("clusters for text considered",that.possibleClusters .length+  that.possibleLeafClusters.length)

        });


        rootcluster.findClusters().forEach(function (cluster) {

            //push clusters that are rendered and therefore are within frustum
            cluster.on("before-render", function () {

                //in any case push the cluster to the potential visible clusters
                that.possibleClusters.push(this);

                //in addition push it onto the leaf stack
                if (this.isLeaf()) {

                    //TODO make a distance check for the leaf including the boundingbox
                    that.possibleLeafClusters.push(this)

                }
            })

        })


    }

    /**
     * Load/add style attributes to the overlay.
     *
     */
    initCSS() {

        //TODO import css directly: check if this css class still has styleing code somewhere else
        this.el.classList.add("graph-captions-container")

    }


    /**
     * Add a container that shows additional informations of the current position
     * of the user within the 3D-space by showing a breadcrum-like trail of text elements of the 3D-cluster.
     * NOTE: The text used is the name of the cluster/node excluding the root.
     * For a set of nodes which is clustered by 'country' first and 'industrial' sector second the text will
     * show up as follows: 'country-name' - 'industrial-sector'
     *
     */
    addBreadcrumbContainer() {
        if (this.mBreadcrumb) {
            this.el.appendChild(this.mBreadcrumb)
            return
        }
        this.mBreadcrumb = document.createElement("span");
        this.mBreadcrumb.className = "cluster-text-overlay-breadcrumb";

        this.el.appendChild(this.mBreadcrumb)

    }


    /**
     * Updates the visible text of the breadcrumb.
     *
     * @param parentClusters ... a set of parent clusters in hierarchical order from root to leaf
     */

    setBreadcrumb(parentClusters) {

        //compare arrays if an update is necessary
        if (_.last(parentClusters) == this.mBreadcrumb.item) return
        this.mBreadcrumb.item = _.last(parentClusters)

        parentClusters.shift()//discard root

        var res = []
        _.each(parentClusters, function (cluster) {

            let item = "<span class='cluster-text-overlay-breadcrumb-item'>" + cluster.name + "</span>"
            res.push(item)


        });

        this.mBreadcrumb.innerHTML = res.join(this.separator)

    }


    /**
     * This method will be invoked after the ClusterTextOverlay finishes waiting for the {@link GraphView3D} to load.
     *  It will initialise the factory responsible for updating and recycling text nodes whenever the user navigates the 3D-graph
     */

    addGlobalNodeCaptions(view) {

        this.el.style.height = view.clientHeight + "px";
        this.el.style.width = view.clientWidth + "px";
        this.el.innerHTML = "";
        var mTextNode = this.el;

        this.addBreadcrumbContainer()


        var that = this;


        // for explanation of parameters {@link TextNodesFactory}
        let env = {
            renderer: view.mRenderer,
            currentNodesVisible: [],//can be left empty if below nodes function is used
            textNode: mTextNode,
            camera: view.mCamera

        };

        //determine the distance between user and cluster
        function getDistance(cluster) {
            let point1 = view.mCamera.position;
            let point2 = cluster.localToWorld(new Vector3);
            let distance = point1.distanceTo(point2);

            return distance

        }

        //sort clusters from smallest distance to biggest
        function sortClusters(clusters) {

            var res = _.map(clusters, function (c) {

                return {item: c, distance: getDistance(c)}
            });
            return _.sortBy(res, [function (o) {
                return o.distance;
            }]);

        }


        /**
         * Determines the nodes and clusters that are relevant for their text-node to be shown.
         *
         */
        function getNodesForLeaf() {
            //return only the closest cluster
            that.selectedLeafCluster = null

            if (!that.possibleLeafClusters) return [];

            // get closest leaf only

            var res = sortClusters(that.possibleLeafClusters)

            //TODO nodes aren't in order so we should sort them also

            //FIXME deplace overlay after changing 3d => 2d view or have an event to track changing leafs/clusters
            //check for empty array which can happen if graph data changes and clusters get deleted
            if (!res[0] || !res[0].item) return [];


            //(1)see below if changing the distance
            let leaf1 = res[0].item;
            if (leaf1.getRadius() < res[0].distance)
                return [] // discard clostest leaf if it is too far away

            that.selectedLeafCluster = leaf1;
            return leaf1.mNodes ? leaf1.mNodes : []
        }

        //the handler for the leaf text
        if (!this.tn)
            this.tn = TextNodesFactory(env, {
                maxVisibleCount: 10,
                maxDistance: function (node) {
                    //(1)see above if changing the distance
                    if (!that.selectedLeafCluster) return 0;
                    return that.selectedLeafCluster.getRadius()
                },
                onNodeText: (node) => node.name ? node.name : node.id,
                getNodes: function () {
                    let nodes = getNodesForLeaf();

                    _.each(nodes, function (n) {

                        let mesh = n.get3DRoot();
                        if (mesh.parent)
                            mesh.updateMatrixWorld();
                        else {
                            mesh.parent = n._parent;
                            mesh.updateMatrixWorld();
                            mesh.parent = null

                        }


                    });

                    return nodes;
                }
            });


        // TODO The bounding volume determines the visibility of the text nodes. So when text nodes are not properly generated - with no volume - the text nodes are invisible.

        function getNodeParentCluster(node) {
            return node.parent.parent

        }


        //the handler for the cluster text
        this.mTextNodes = TextNodesFactory(env, {
            maxVisibleCount: 30,
            maxDistance: function (node) {
                return getNodeParentCluster(node).getRadius(getNodeParentCluster(node).mNodes.length) / 3 * 10
            },  //eg. 30000
            minDistance: function (node) {
                return getNodeParentCluster(node).getRadius(getNodeParentCluster(node).mNodes.length) / 3 * 3
            },  //eg. 3000
            getNodes: function () {

                if (that.possibleClusters.length > 0) {
                    var res = sortClusters(that.possibleClusters)

                    that.setBreadcrumb([].concat(res[0].item.getParents(), res[0].item))
                }
                return that.possibleClusters
            },
            onNodeText: function (node) {

                if (node.name) return node.name;

                return node.id;

            },
            getCSSClasses: function () {
                return 'graph-cluster-caption'

            },
            getNodePosition: function (node) {

                var mVec3 = new Vector3();
                mVec3.setFromMatrixPosition(node.matrixWorld);

                //fixing the offset/position as soon as the hull is created
                if (node.mHull)
                    mVec3.add(node.mHull.mBoundingBox.getCenter(new Vector3()));

                return mVec3; //node.position.clone()
            },
            interactable: true,
            onAfterCreateTextField: function (node, el) {

                var newSize;
                if (node instanceof Cluster3DExtended) {
                    newSize = 12 + Math.ceil(Math.log2(node.mNodes.length) - 5);

                    var newText = node.getClusterOptions().text.bind(node)();
                    if (newText) {
                        el.innerHTML = "";
                        el.appendChild(typeof newText === 'string' ? Object.assign(document.createElement('span'), {innerHTML: newText}) : newText);
                    }


                }
                else
                    newSize = 12 + Math.ceil(Math.log2(node.nodes.length) - 5);

                newSize = _.round(newSize / 12, 3) + "em";

                el.style.fontSize = newSize;

                el.addEventListener("click", function () {
                    node.zoomToCluster();
                })


            }
        })


    }

}











