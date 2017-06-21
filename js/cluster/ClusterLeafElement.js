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


        this.add( this.mNodeParticles.pointCloud)

        //TODO check if still mayor performane hit
        this.appendNodes(nodes)



        this.createEdgesFromNodes(nodes)

    }

    appendNodes(nodes){

        var that=this;
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

