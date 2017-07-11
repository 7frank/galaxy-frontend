/**
 * Created by Frank on 30.05.2017.
 */


import EdgesContainer from "./EdgesContainer"


export default class ClusterLeafElement extends THREE.Mesh {
    constructor(nodes) {
        super();


        this.mNodes = nodes;

        this.mNodeParticles = this.createParticleNodeCloud();
        this.add(this.mNodeParticles.pointCloud);


        // add the nodes to the leaf
        this.appendNodes(nodes);


        //add edges to the leaf
        this.createEdgesFromNodes(nodes);



    }


    getView() {
        return this.parent.getView()


    }

    setLOD(levelOfDetail) {
        if (this.mNodeParticles&&   this.parent.useLOD)
            this.mNodeParticles.pointCloud.visible = levelOfDetail > 0.3;
        //TODO nodes,edges, ... as well

        let edgeFadeLOD=0.3;
        let crossfade=0.2;//TODO add crossfade

        if (this.mEdgesContainer) {

         this.mEdgesContainer.visible = levelOfDetail >= edgeFadeLOD;

            this.mEdgesContainer.mEdges.material.opacity=(levelOfDetail-edgeFadeLOD)/edgeFadeLOD;
        }

        if (this.mEdgesContainer2) {

            this.mEdgesContainer2.visible = levelOfDetail < edgeFadeLOD;

            this.mEdgesContainer2.mEdges.material.opacity=  1-levelOfDetail/edgeFadeLOD;
        }


        if (this.mNodeMeshes)
            this.mNodeMeshes.visible = levelOfDetail > 0.2;

        // if (this.parent && this.parent.mParticles)
        // this.parent.mParticles.pointCloud.visible= levelOfDetail>0.1;


    }


    cleanUp() {


        if (this.mNodeParticles) {
            this.mNodeParticles.remove();
            this.mNodeParticles.pointCloud.geometry.dispose();
            this.mNodeParticles = null;
        }

        if (this.mParticles) {
            this.mParticles.remove();
            this.mParticles.pointCloud.geometry.dispose();
            this.mParticles = null;
        }


        if (this.mEdgesContainer&&this.mEdgesContainer.geometry) {


        this.mEdgesContainer.geometry.dispose();
        this.mEdgesContainer = null;
     }



        if (this.mEdgesContainer2&&this.mEdgesContainer2.geometry) {


            this.mEdgesContainer2.geometry.dispose();
            this.mEdgesContainer2 = null;
        }


        if (this.mNodeMeshes && this.mNodeMeshes.geometry) {
            this.mNodeMeshes.geometry.dispose();
            this.mNodeMeshes = null;
        }





        if (this.geometry)
        this.geometry.dispose();
        if (this.parent)
            this.parent.remove(this)


    }


    appendNodes(nodes) {


        if (!this.mNodeMeshes) {
            this.mNodeMeshes = new THREE.Object3D;
            this.add(this.mNodeMeshes)

        }


        var that = this.mNodeMeshes;//this;
        _.each(nodes, function (node) {
            if (node && node._bubble)
                that.add(node._bubble)


        })


    }


    createEdgesFromNodes(nodes) {

        this.mEdgesContainer = new EdgesContainer();
        this.mEdgesContainer.setRenderMode(true,false,false).setSkipParams(30,40).setFromNodes(nodes);
        this.add(this.mEdgesContainer)

       /* this.mEdgesContainer2 = new EdgesContainer();
        this.mEdgesContainer2.setRenderMode(false,true,false).setSkipParams(100,1).setFromNodes(nodes);
        this.add(this.mEdgesContainer2)
*/


    }


    //TODO refactor
    setDistributionHandler(distribution, onComplete = function () {
    }) {

        var that = this;
        distribution.setNodes(this.mNodes, function (vec, i) {

            let n = that.mNodes[i];
            if (n._bubble) n._bubble.position.set(n.x, n.y, n.z);
            that.mNodeParticles.updateNodePosition(i);

        }, function onStep() {


            that.updateEdges();


        }, function(){


            that._initDotParticles();

            onComplete()




        });

    }

    updateEdges() {


        if (this.mEdgesContainer)
            this.mEdgesContainer.updateEdges();

        if (this.mEdgesContainer2)
            this.mEdgesContainer2.updateEdges();

    }

    updateDots(time)
    {
            if ( this.mParticles )
                this.mParticles.update(time);
    }




    /**
     * creates a structure that contains a point cloud for the nodes for mre effiecient rendering
     *
     * @returns {{nodes, pointCloud, updateCrossFade, update, updateNode, updateNodePosition, updateNodeColor, updateNodeSize, on, remove}|*}
     */

    createParticleNodeCloud() {

        var elem = ParticleNodeGroup(this.mNodes, {
            nodeDefaultSize: 10,
            nodeDefaultScale: 10,
            nodeTexture: "img/dot7.png"
        });


        return elem
    }


    //create/update particleSystem (little dots inside nodes)
    //potentially add them at specific time
    _initDotParticles() {

        if (this.mParticles)
            this.mParticles.start();


        if (!this.mParticles) {

            var nodes = this.mNodes;
            var demoOptions = {
                increment: 1,
                duration: 1000,
                easing: TWEEN.Easing.Exponential.Out
            };

            if (!nodes) //FIXME this only works that way because to realData is not generated properly
                demoOptions.npc = function (n) {

                    return n.itemCount || 5
                    //return 5
                };


            //TODO refactor force-graph-utils

            var particles = createParticleSystemForNodes(nodes, demoOptions);
            this.add(particles.pointCloud);


            //TODO this timeout currently fixes wrong positioning bug..
            setTimeout(function(){
                particles.start();
            },10)

            //TODO call start if distribution function is finished
            /*this.parent.on("distribution-complete", function () {

                particles.start()


            });*/


            this.mParticles = particles;
        }

    }


    updateDotParticlesColor() {

            if (this.mParticles) {
                this.mParticles.updateColors();


                //  this.mParticles.pointCloud.position.sub(this.position); //this.parent.position
            }


    }



}

