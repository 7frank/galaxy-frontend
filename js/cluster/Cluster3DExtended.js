/**
 * Created by Frank on 06.06.2017.
 */



import BaseCluster3D from "./BaseCluster3D"

import BaseDistribution from "./distributions/BaseDistribution"

import ForceGraphDistribution from "./distributions/ForceGraphDistribution"
import ZoomUtil from "../utils/ZoomUtil"



/**
 * extended cluster

 */

//refactoring current cluster structure
export default
class Cluster3DExtended extends BaseCluster3D {



    constructor(nodes, clusteringHandlers,view) {
        super(nodes, clusteringHandlers,view);



    this.addListeners();


    }


    /**
     *   have a dynamic distance based on the size of the cluster
     *
     */
    zoomToCluster(defaultDistance=400)
    {


        let  view=this.getView()

        var distance=this.getRadius(defaultDistance)*3


        ZoomUtil.moveToCluster(this,{distance})
    }


    /**
     * adds some listeners and actions
     *  - zoom via keyboard default hotkey "space"
     *  - show hide cluster border defaults to "mouseover"/"mouseout"
     *  - change ordering/distibution of child clusters defaults to "dblclick"
     */


    addListeners()
    {


        var curr=0
        function onClickFactory(res,speccs){


            return function clickAndSpeccHandler(){



                var _dist=speccs[curr++%speccs.length].distribution

                console.log("setting distribution function",_dist)
                res.setDistributionHandler(   _dist ,function onComplete(){

                    //distribution-complete
                    res.onAfterClusteredAndDistributed()



                } )

                //FIXME add complete handler
/*                setTimeout(function()
                {

                    res.onAfterClusteredAndDistributed()

                },1000 )
*/
            }
        }

        //FIXME find a way to not get click triggered if dblclick is triggered when both are bound to same element
        this.on("space",function(e) {
           // e.stopPropagation()

         this.zoomToCluster()

        })

        var diameter=null;
            this.on("s",function(e) {
            e.stopPropagation()


        if (!diameter)
            diameter=this.geometry.boundingSphere.radius*2
            console.log("clicky clicky",diameter)
            let speccsRoot=[
                {distribution: new BaseDistribution(diameter,1)},
                {distribution: new BaseDistribution(diameter*0.66,2)},
                {distribution: new BaseDistribution(diameter*0.33,3)},
                {distribution: new ForceGraphDistribution(diameter*0.66,3)}
                ]


            var fn= onClickFactory(this, speccsRoot)

            fn()
        })

        this.on("mouseover mousemove",function(){

            if (  this.mHull)
            this.mHull.material.visible=true;
        })


        this.on("mouseout",function(){
            if (  this.mHull)
            this.mHull.material.visible=false;


        })



    }



    /**
     *  NOTE:don't call update for any cluster directly,it will be called via before-render
     *
     */
    update()
    {
        super.update();

        //TODO have a "cluster-ready" event
        this.addNodeCaptions()


        if (this.mTextNodes)
        this.mTextNodes.update();


        if (this.isLeaf())
        if (this.mParticles)
            this.mParticles.update();


    }




    appendNodes(nodes){

        var that=this;
        _.each(nodes,function(node){
            if (node&& node._bubble)
                that.add(node._bubble)


        })


    }


    /**
     * has to be called after initialisation to re-calculate dependent elements
     * like dot clouds and cluster boder and hull
     */
    onAfterClusteredAndDistributed(){
        super.onAfterClusteredAndDistributed();
        let leafs=this.getLeafs()
        console.warn("onAfterClusteredAndDistributed",leafs.length)

      _.each(leafs,function(leaf){

          leaf.parent._initDotParticles();

          leaf.parent.updateDotParticles()

          leaf.parent.adjustHullSize()

      })







    }


    updateDotParticles()
    {
        if (this.isLeaf())
            if (this.mParticles)
            {
               this.mParticles.updateColors();


              //  this.mParticles.pointCloud.position.sub(this.position);
            }


    }

    //create/update particleSystem (little dots inside nodes)
    //potentially add them at specific time
    _initDotParticles() {

        if (this.mParticles)  this.mParticles.start()


            if (this.isLeaf() && !this.mParticles) {

             var nodes=this.mLeaf.mNodes
            var demoOptions = {increment:1}

            if (!nodes) //FIXME this only works that way because to realData is not generated properly
                demoOptions.npc = function (n) {

                    return n.itemCount|5
                    //return 5
                }



            //TODO refactor force-graph-utils

            var particles = createParticleSystemForNodes(nodes, demoOptions);
            this.add(particles.pointCloud);


                particles.start()
                //TODO call start if distribution function is finished
                this.on("distribution-complete",function(){

                    particles.start()


                })


            this.mParticles = particles;
        }

    }


    /**
     * add some text to the sub-clusters providing informations
     *
     *
     *
     */


    addNodeCaptions(){


        var rootCluster=this.getRoot()
        if (!rootCluster.mParentView) return



        function _getNodePosition(node) {

            var mVec3 = new THREE.Vector3();
            mVec3.setFromMatrixPosition( node.matrixWorld );


            return mVec3; //node.position.clone()
        }

        var nodes=Object.values(this.mClusters)

        //TODO remove global dependency in TextNodes


        var mTextNode = $(rootCluster.mParentView.mRenderer.domElement).parent().children(".graph-captions-container")


        let env={
                renderer:rootCluster.mParentView.mRenderer,
                currentNodesVisible:[],//can be left empty if below nodes function is used
                textNode:mTextNode,
                camera:rootCluster.mParentView.mCamera

            }






        //TODO make sure radius is dynamically changed when cluster radius changes

        let minDistance=this.getRadius()/3
        let maxDistance=minDistance*10

        if (!this.mTextNodes)
        this.mTextNodes = TextNodes(env, {
            maxVisibleCount: 50,
            maxDistance: maxDistance,//30000
            minDistance: minDistance, //3000
            getNodes: function () {

                return nodes

            },
            onNodeText: function (node) {

                if (node.name) return node.name;

                return node.id;

            },
            getCSSClasses: function () {
                return 'graph-country-caption'

            },
            getNodePosition: _getNodePosition,
            interactable: true,
            onAfterCreateTextField: function (node, el) {

                var newSize;
                if (node instanceof Cluster3DExtended)
                {
                    newSize = 12 + Math.ceil(Math.log2(node.mNodes.length) - 5);


                }
                else
                newSize = 12 + Math.ceil(Math.log2(node.nodes.length) - 5);

                newSize = _.round(newSize / 12, 3) + "em";

                el.css("font-size", newSize);

                el.on("click", function () {
                    node.zoomToCluster();
                  //  doZoomToPos(_getNodePosition(node))
                })

            }
        })





    }



}