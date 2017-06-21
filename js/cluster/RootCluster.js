/**
 * Created by Frank on 06.06.2017.
 */


//TODO refactor RootCluster
import Cluster3DExtended from "./Cluster3DExtended"

/**
 *
 *  a RootCluster is a root node that contains additional rendering infos over multiple nodes
 * for example: it handles node captions (text nodes)
 */

export default
class RootCluster extends Cluster3DExtended {

    constructor(...args)
    {
        super(...args)

       // this.addGlobalNodeCaptions()


        //TODO have an actual event triggered for when sub-clusters are distributed to adjust elements
       // setTimeout(()=> this.onAfterClusteredAndDistributed(),5000)



       this.addColorHandler()


    }


    addColorHandler()
    {

   var nodes=this.mNodes;
   var that=this


        function getCountryNamesFromNodes(nodes)
        {
            var res={}
            _.each(nodes,(n) => res[n.group]=true)

         return Object.keys(res)
        }




        function updateParticles(leaf)
        {
        if (leaf && leaf.parent && leaf.parent.mParticles) {

            leaf.parent.mParticles.updateColors();


        }
            else setTimeout(() => updateParticles(leaf), 100 )
        }


        var countryNames=null;

        $(window).on("node-color-change",function(e,val){


          if (!countryNames)countryNames=getCountryNamesFromNodes(nodes)

            var helper=computeGroupNodeColorHelper(countryNames)


         //   var val=$sel.val()
            if (val=="group")
                nodes.forEach(function(v){ v.color=helper.getColor(v.group)});
            else
                nodes.forEach(function(v){ v.color=computeCompanyNodeColor(parseInt(v.sent),val)   } )

            _.each(that.getLeafs(),function(leaf){


                leaf.mNodeParticles.update()


                updateParticles(leaf)


            })






        })


    }



    /**
     * @override
     * prevent multiple recursive  root clusters from being created by default
     */

    getChildClusterConstructor()
    {
        return Cluster3DExtended;

    }


    /**
     * attaches to root cluster to a specific View3D element to be able to perform container based operations
     *
     *
     */
    attachToView3D(view3D){
        this.mParentView=view3D

        this.addGlobalNodeCaptions()

    }

    /**
     *
     * TODO the root cluster manages the visibility of all of it's currently visible nodes
     * we do have a hierarchical structure that we can use to speed up the rendering a bit
     *
     */


    addGlobalNodeCaptions() {

        if (!this.mParentView) {
            console.warn("use attachToView3D() to attach cluster to a view container first")
            return
        }

        function createTextNodeContainer() {

            //create container for text elements

            var textElementsContainer = $("<div>").addClass("graph-captions-container").css({
                width: "100%",
                height: "100%",
               // top: 0,
               // left: 0,
                overflow: "hidden",
                position: "absolute",
                "pointer-events": "none"//, border: "1px solid red"
            })

            return textElementsContainer
        }

        /**
         * for the method to work env  needs to contain the following paraams :
         * env={
         *  renderer.domElement,  for get dimensions and text pos
         *   currentNodesVisible,   // ... nodes visible==all nodes in set is to harsh let rootcluster handle it probably
         *	textNode,               // node container that is overlay with pointerevents none
         *  camera
         *  }
         */


        var mTextNode = $(this.mParentView.mRenderer.domElement).parent().children(".graph-captions-container")

       if (mTextNode.length == 0) {

            mTextNode = createTextNodeContainer(this.mParentView.mRenderer.domElement);
            $(this.mParentView.mRenderer.domElement).parent().append(mTextNode)
            this.mTextNodesContainer=mTextNode

        }

        this.mGlobalTextNodesContainer=mTextNode

        mTextNode.height(this.mParentView.clientHeight)
        mTextNode.width(this.mParentView.clientWidth)


       mTextNode.empty()




        let env={
            renderer:this.mParentView.mRenderer,
            currentNodesVisible:[],//can be left empty if below nodes function is used
            textNode:mTextNode,
            camera:this.mParentView.mCamera

        }

        if (!this.tn)
            this.tn = TextNodes(env, {
                maxVisibleCount: 10,
                onNodeText: function (node) {

                    if (node.name)
                        return node.name

                    return node.id

                },
                getNodes: () => this.mNodes //FIXME use only visible nodes to improve performance
            })


    }



    update(){
        super.update()

        if (this.tn)
       this.tn.update();

    }




    applyClustering(mClusteringSpeccsArray) {

        this.storeParentPositionInNodes()
        super.applyClustering(mClusteringSpeccsArray)

        this.restoreNodePositionFromExParent()
    }



}