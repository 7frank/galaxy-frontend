/**
 * Created by Frank on 06.06.2017.
 */



import BaseCluster3D from "./BaseCluster3D"

import BaseDistribution from "./BaseDistribution"
import ForceGraphDistribution from "./ForceGraphDistribution"
import ZoomUtil from "./ZoomUtil"



/**
 * extended cluster

 */

//refactoring current cluster structure
export default
class Cluster3DExtended extends BaseCluster3D {



    constructor(nodes, clusteringHandlers) {
        super(nodes, clusteringHandlers);

    this.addListeners();
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
                res.setDistributionHandler(   _dist  )

                //FIXME add complete handler
                setTimeout(function()
                {

                    res.onAfterClusteredAndDistributed()

                },1000 )

            }
        }

        //FIXME find a way to not get click triggered if dblclick is triggered when both are bound to same element
        this.on("space",function(e) {
           // e.stopPropagation()

            //have a dynamic distance based on the size of the cluster
           var distance=this.geometry.boundingSphere.radius*3

            ZoomUtil.moveToMesh(this,function onComplete(){  },distance)

        })

            this.on("dblclick",function(e) {
            e.stopPropagation()



            var diameter=this.geometry.boundingSphere.radius*2
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

            this.mHull.material.visible=true;
        })


        this.on("mouseout",function(){

            this.mHull.material.visible=false;


        })



    }



    update()
    {
        super.update();



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

      _.each(this.getLeafs(),function(leaf){

          leaf.parent._initDotParticles();

          leaf.parent.updateDotParticles()

      })







    }


    updateDotParticles()
    {
        if (this.isLeaf())
            if (this.mParticles)
            {

                this.mParticles.start();

              //  this.mParticles.pointCloud.position.sub(this.position);
            }


    }

    //create/update particleSystem (little dots inside nodes)
    //potentially add them at specific time
    _initDotParticles() {

     /*   if (this.mParticles) {
            this.mParticles.remove();
            delete(this.mParticles)
        }*/

        if (this.mParticles)  this.mParticles.start()


            if (this.isLeaf() && !this.mParticles) {

  var nodes=this.mLeaf.mNodes
            var demoOptions = {increment:1}

            if (!nodes) //FIXME this only works that way because to realData is not generated properly
                demoOptions.npc = function (n) {

                    return n.itemCount|5
                    //return 5
                }



            //TDODO refactor force-graph-utils
            console.log(nodes)
            var particles = createParticleSystemForNodes(nodes, demoOptions);
            this.add(particles.pointCloud);

            this.mParticles = particles;
        }

    }





}