/**
 * Created by Frank on 30.05.2017.
 */


import EdgesContainer from "./EdgesContainer"


export default class ClusterLeafElement extends THREE.Mesh
{
    constructor(nodes){
        super();




        this.mNodes=nodes;
        this.mNodeParticles=this.createParticleNodeCloud();


        this.add( this.mNodeParticles.pointCloud);



        //TODO this still has mayor performance impact but is needed for counting the companies
        //we'll use lod non the nodes as well therewore nodes forther away in the background wont count towards the coumpany count
        this.appendNodes(nodes)



        this.createEdgesFromNodes(nodes)

    }

    setLOD(levelOfDetail)
    {
        if (  this.mNodeParticles)
        this.mNodeParticles.pointCloud.visible= levelOfDetail>0.3;
        //TODO nodes,edges, ... as well

        if (  this.mEdgesContainer)
       this.mEdgesContainer.visible= levelOfDetail>0.5;


        if (  this.mNodeMeshes)
            this.mNodeMeshes.visible= levelOfDetail>0.2;

        if (this.parent && this.parent.mParticles)
        this.parent.mParticles.pointCloud.visible= levelOfDetail>0.1;



    }



    appendNodes(nodes){

        if (!this.mNodeMeshes)
        {
            this.mNodeMeshes=new THREE.Object3D;
            this.add(this.mNodeMeshes)

        }


        var that=this.mNodeMeshes//this;
        _.each(nodes,function(node){
            if (node&& node._bubble)
               that.add(node._bubble)


        })


    }



    createEdgesFromNodes(nodes){

       this.mEdgesContainer=new EdgesContainer();

        this.mEdgesContainer.setFromNodes(nodes);


        this.add( this.mEdgesContainer)

    }



    //TODO refactor
    setDistributionHandler(distribution,onComplete=function(){})
    {

        var that=this;
        distribution.setNodes(this.mNodes,function(vec,i){

            let n=that.mNodes[i];
            if (n._bubble) n._bubble.position.set(n.x,n.y,n.z);
            that.mNodeParticles.updateNodePosition(i);

        },function onStep(){


            that.updateEdges();


        },onComplete);

    }

        updateEdges()
        {
            if (this.mEdgesContainer)
                this.mEdgesContainer.updateEdges();

        }



    /**
     * creates a structure that contains a point cloud for the nodes for mre effiecient rendering
     *
     * @returns {{nodes, pointCloud, updateCrossFade, update, updateNode, updateNodePosition, updateNodeColor, updateNodeSize, on, remove}|*}
     */

    createParticleNodeCloud()
    {

        var elem = ParticleNodeGroup( this.mNodes, {
            nodeDefaultSize: 10,
            nodeDefaultScale: 10,
            nodeTexture: "img/dot7.png"
        })


        return elem
    }

}

