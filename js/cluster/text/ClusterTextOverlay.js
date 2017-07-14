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

export default
class ClusterTextOverlay extends HTMLElement{





    constructor() {
        super();
    }




    connectedCallback()
    {
        let view=this.parentElement
        if (!view instanceof  GraphView3D)
            throw new Error("parent must be instance of GraphView3D");


        this.initCSS();

        $(view).on("loaded",() =>{

            this.bindToCluster(this.parentElement.mRootCluster)
            this.addGlobalNodeCaptions(this.parentElement)

        })

    }

    bindToCluster( rootcluster) {





        var $view=$(rootcluster.getView());


        var possibleClusters = [];
        var possibleLeafClusters = [];

        $view.on("before-render", function () {

            //reset nodes
            possibleClusters = [];
            possibleLeafClusters = [];
        });


        $view.on("after-render",  () => {

            //sort by closest distance + leafs are more relevant than clusters, this way if we are close to a leaf only leaf-nodes are rendered
            // and not cluster nodes

            //compare and hide

            let relevant = possibleLeafClusters.length > 0 ? possibleLeafClusters : possibleClusters
            //we assume that if we do have leafs  that are close enough to the camera to render, we don't need other elements to render


           console.log("relevant",relevant)

            this.tn.update();
            this.mPossibleRelevantNodes=relevant

        });


        rootcluster.findClusters().forEach(function (cluster) {

            //push clusters that are rendered and therefore are within frustum
            cluster.on("before-render", function () {

                //in any case push the cluster to the potential visible clusters
                possibleClusters.push(this);

                //in addition push it onto the leaf stack
                if (this.isLeaf()) {

                    //TODO make a distance check for the leaf including the boundingbox
                    possibleLeafClusters.push(this)

                }
            })

        })


    }





     initCSS() {

    //create container for text elements
//TODO import css directly

    var textElementsContainer = $(this).addClass("graph-captions-container").css({
        width: "100%",
        height: "100%",
        // top: 0,
        // left: 0,
        overflow: "hidden",
        position: "absolute",
        "pointer-events": "none"//, border: "1px solid red"
    });

    return textElementsContainer
}


    /**
     *
     * TODO the root cluster manages the visibility of all of it's currently visible nodes
     * we do have a hierarchical structure that we can use to speed up the rendering a bit
     *
     */


    addGlobalNodeCaptions(view) {



        /**
         * for the method to work env  needs to contain the following paraams :
         * env={
         *  renderer.domElement,  for get dimensions and text pos
         *   currentNodesVisible,   // ... nodes visible==all nodes in set is to harsh let rootcluster handle it probably
         *	textNode,               // node container that is overlay with pointerevents none
         *  camera
         *  }
         */


        var mTextNode = $(this);


        mTextNode.height(view.clientHeight);
        mTextNode.width(view.clientWidth);


        mTextNode.empty();



        var that=this;
        let env={
            renderer:view.mRenderer,
            currentNodesVisible:[],//can be left empty if below nodes function is used
            textNode:mTextNode,
            camera:view.mCamera

        };

        if (!this.tn)
            this.tn = TextNodesFactory(env, {
                maxVisibleCount: 10,
                onNodeText: function (node) {

                    if (node.name)
                        return node.name;

                    return node.id

                },
                getNodes: function(){

                   /* if (!that.useClusterText)
                        return [];
                    */

                    let res=(_.isArray(that.mPossibleRelevantNodes))?that.mPossibleRelevantNodes:[];

                    return res

                }
            })


    }

}



customElements.define("cluster-text-overlay", ClusterTextOverlay);









