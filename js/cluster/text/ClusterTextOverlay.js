/**
 * Created by Frank on 12.07.2017.
 */



/**
 * the text overlay class can be used to put text elements on top of an other container element
 *
 *
 *
 *  ...
 *  TODO
 collect onbefore render of eeach cluster and nodeMixin(
 order from node which is more relevant to cluster
 if visible nodes => show them else show cluster elements
 *
 */


import TextNodesFactory from "./TextNodesFactory"
import GraphView3D from  "../../view/GraphView3D"

import Cluster3DExtended from "../Cluster3DExtended"


export default
class ClusterTextOverlay extends HTMLElement {

    constructor() {
        super();

        this.possibleClusters = [];
        this.possibleLeafClusters = [];

        this.enabled=true;

    }

    /**
     *
     * init css and wait for data/graph to be loaded
     * then create overlay
     */

    connectedCallback() {
        let view = this.parentElement;
        if (!view instanceof GraphView3D)
            throw new Error("parent must be instance of GraphView3D");


        this.initCSS();

        $(view).on("loaded graph-changed", () => {

            if (!this.parentElement) return ;

        this.bindToCluster(this.parentElement.mRootCluster);
            this.addGlobalNodeCaptions(this.parentElement)

       })

    }


    /**
     *
     * add listeners to collect the visible cluster and leaf elements
     *
     */


    bindToCluster(rootcluster) {


        var $view = $(rootcluster.getView());

        var that = this;


        $view.on("before-render", function () {

            //reset nodes
            that.possibleClusters = [];
            that.possibleLeafClusters = [];
        });


        $view.on("after-render", () => {

            $(that).toggle(that.enabled);
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
     * add style attributes to the overlay
     *
     * TODO import css directly
     *
     */
    initCSS() {


        $(this).addClass("graph-captions-container").css({
            width: "100%",
            height: "100%",
            // top: 0,
            // left: 0,
            overflow: "hidden",
            position: "absolute",
            "pointer-events": "none"//, border: "1px solid red"
        });

    }


    /**
     *
     * TODO the root cluster manages the visibility of all of it's currently visible nodes
     * we do have a hierarchical structure that we can use to speed up the rendering a bit
     *
     */

    addGlobalNodeCaptions(view) {


        /**
         * for the method to work the "env" object  needs to contain the following params :
         * env={
         *  renderer.domElement,  for get dimensions and text pos
         *   currentNodesVisible,   // ... nodes visible==all nodes in set is to harsh let rootcluster handle it probably
         *	textNode,               // node container that is overlay with pointerevents none
         *  camera
         *  }
         */


        var mTextNode = $(this)
            .height(view.clientHeight)
            .width(view.clientWidth)
            .empty();


        var that = this;
        let env = {
            renderer: view.mRenderer,
            currentNodesVisible: [],//can be left empty if below nodes function is used
            textNode: mTextNode,
            camera: view.mCamera

        };



        function getDistance(cluster){
            let point1 = view.mCamera.position;
            let point2 = cluster.localToWorld(new THREE.Vector3);
            let distance = point1.distanceTo(point2);

          return distance

        }

        function getNodesForLeaf() {
            //return only the closest cluster
            if (!that.possibleLeafClusters) return [];

            // get closest leaf only

            var res=_.map(that.possibleLeafClusters,function(leaf){

            return{item:leaf,distance:getDistance(leaf)}
            });
            res= _.sortBy(res, [function(o) { return o.distance; }]);

            //TODO nodes aren't in order so we should sort them also

            //FIXME deplace overlay after changing 3d => 2d view or have an event to track changing leafs/clusters
            //check for empty array which can happen if graph data changes and clusters get deleted
            if (!res[0] ||!res[0] .item) return [];

            let leaf1 =res[0].item;
            return leaf1.mNodes ? leaf1.mNodes : []


        }


        //the handler for the leaf text
        if (!this.tn)
            this.tn = TextNodesFactory(env, {
                maxVisibleCount: 10,
                onNodeText: (node) => node.name ? node.name : node.id,
                getNodes:function(){
                    let nodes=getNodesForLeaf();

                    _.each( nodes, function(n){

                        let mesh= n.get3DRoot();
                        if (mesh.parent)
                        mesh.updateMatrixWorld();
                        else
                        {
                            mesh.parent=n._parent;
                            mesh.updateMatrixWorld();
                            mesh.parent=null

                        }


                    });

                    return nodes;
                }
            });


        // TODO the bounding volume determines the visibility of the text nodes
        //TODO so currently with no volume generated properly the text nodes are invisible

        function getNodeParentCluster(node)
        {
            return node.parent.parent

        }


        //the handler for the cluster text
        this.mTextNodes = TextNodesFactory(env, {
            maxVisibleCount: 30,
            maxDistance: function (node) {
                return getNodeParentCluster(node).getRadius(getNodeParentCluster(node).mNodes.length) / 3 * 10
            },//30000
            minDistance: function (node) {
                return getNodeParentCluster(node).getRadius(getNodeParentCluster(node).mNodes.length) / 3 * 3
            }, //3000
            getNodes: function () {
                return that.possibleClusters
            },
            onNodeText: function (node) {

                if (node.name) return node.name;

                return node.id;

            },
            getCSSClasses: function () {
                return 'graph-country-caption'

            },
            getNodePosition: function (node) {

                var mVec3 = new THREE.Vector3();
                mVec3.setFromMatrixPosition(node.matrixWorld);

                //fixing the offset/position as soon as the hull is created
                if (node.mHull)
                    mVec3.add(node.mHull.mBoundingBox.getCenter());

                return mVec3; //node.position.clone()
            },
            interactable: true,
            onAfterCreateTextField: function (node, el) {

                var newSize;
                if (node instanceof Cluster3DExtended) {
                    newSize = 12 + Math.ceil(Math.log2(node.mNodes.length) - 5);

                   var newText= node.getClusterOptions().text.bind(node)();
                    if (newText)
                    el.html("").append(newText)




                }
                else
                    newSize = 12 + Math.ceil(Math.log2(node.nodes.length) - 5);

                newSize = _.round(newSize / 12, 3) + "em";

                el.css("font-size", newSize);

                el.on("click", function () {
                    node.zoomToCluster();
                })



            }
        })


    }

}


customElements.define("cluster-text-overlay", ClusterTextOverlay);









