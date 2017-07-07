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
        if (this.mNodeParticles)
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
        if (this.parent && this.parent.mParticles) {
            this.parent.mParticles.remove();
            this.parent.mParticles.pointCloud.geometry.dispose();
            this.parent.mParticles = null;
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


        }, onComplete);

    }

    updateEdges() {


        if (this.mEdgesContainer)
            this.mEdgesContainer.updateEdges();

        if (this.mEdgesContainer2)
            this.mEdgesContainer2.updateEdges();

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

}

