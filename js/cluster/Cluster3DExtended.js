/**
 * Created by Frank on 06.06.2017.
 */



import BaseCluster3D from "./BaseCluster3D"

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


    addListeners()
    {
        var opacity;


        this.on("mouseover",function(){
            opacity=this.material.opacity
            this.material.opacity=1;

        })



        this.on("mouseout",function(){

            this.material.opacity=opacity;

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




    //TODO
    updateTest(){
        super.updateTest();

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