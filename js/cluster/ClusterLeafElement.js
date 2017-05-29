/**
 * Created by Frank on 30.05.2017.
 */



export default class ClusterLeafElement extends THREE.Object3D
{
    constructor(nodes){
        super();

        this.mNodes=nodes;
        this.mParticles=this.createParticleCloud();

        this.add( this.mParticles.pointCloud)


    }


    //TODO refactor
    setDistributionHandler(distribution)
    {

        var that=this;
        distribution.setNodes(this.mNodes,function(vec,i){
            var n= that.mNodes[i];

            n.x=vec.x;
            n.y=vec.y;
            n.z=vec.z;

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



}

