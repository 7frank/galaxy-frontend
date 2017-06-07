/**
 * Created by Frank on 30.05.2017.
 */



export default class ClusterLeafElement extends THREE.Mesh
{
    constructor(nodes){
        super();




        this.mNodes=nodes;
        this.mParticles=this.createParticleCloud();

        this.add( this.mParticles.pointCloud)

        //FIXME wrong positions
        this.appendNodes(nodes)



    }

    appendNodes(nodes){

        var that=this;
        _.each(nodes,function(node){
            if (node&& node._bubble)
               that.add(node._bubble)


        })


    }


    //TODO refactor
    setDistributionHandler(distribution)
    {

        var that=this;
        distribution.setNodes(this.mNodes,function onStep(vec,i){

            let n=that.mNodes[i]
            if (n._bubble) n._bubble.position.set(n.x,n.y,n.z)
            that.mParticles.updateNodePosition(i)




        });

    }

    createParticleCloud()
    {

        var elem = ParticleNodeGroup( this.mNodes, {
            nodeDefaultSize: 10,
            nodeDefaultScale: 10,
            nodeTexture: "img/dot7.png"
        })


        return elem
    }


    /**
     * @deprecated might be ok to remove
     */
    updateHull(){
        return

        let pc=this.mParticles.pointCloud;
      //  pc.geometry.center()

        //FIXME not working as intended



        let box=new THREE.Box3;box.setFromObject(pc);
        pc.geometry.boundingBox=box;

    }


}

