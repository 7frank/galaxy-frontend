/**
 * Created by Frank on 06.06.2017.
 */


//TODO refactor RootCluster
import Cluster3DExtended from "./Cluster3DExtended"

import ClusterTextOverlay from "./text/ClusterTextOverlay"


import {computeCompanyNodeColor, computeGroupNodeColorHelper} from "./refactor/SpecificDataUtils"


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

        this.useClusterText=true;


        //TODO have an actual event triggered for when sub-clusters are distributed to adjust elements
       // setTimeout(()=> this.onAfterClusteredAndDistributed(),5000)
        // "cluster-ready" as alternative event
        this.on("hull-updated",function(){


         this.findClusters("*").forEach(function(cluster){
             cluster.useLOD=true
         })


        })

       this.addColorHandler()


    }

    addListeners() {

        super.addListeners();


        this.on("u", e=>{
            e.stopPropagation();

            this.useClusterText=!this.useClusterText;
            console.log("useClusterText", this.useClusterText)
        });

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


        if (leaf && leaf.mParticles) {

            leaf.mParticles.updateColors();


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




    }



   resetTextOverlay(){


        if (this.mTextOverlay) this.mTextOverlay.remove()

       this.mTextOverlay=$("<cluster-text-overlay>");

       $(this.mParentView).append(this.mTextOverlay)

   }




    applyClustering(mClusteringSpeccsArray,overrideExpand=false) {

       //FIXME transitions betweens graphs
      //this.storeParentPositionInNodes()
        super.applyClustering(mClusteringSpeccsArray,overrideExpand)

        this.resetTextOverlay()




       // this.restoreNodePositionFromExParent()
    }



}