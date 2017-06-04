/**
 * Created by Frank on 29.05.2017.
 */

/**
 * TODO  possible different ways to distribute elements => moveTo, goTo, stack?
 *
 *
 */

import BaseCluster3D from "./BaseCluster3D"


export default  class BaseDistribution
{
    constructor(scale=50,dimensions=1){
        this.dimensions=dimensions //TODO
        this.mScale=scale
    }


    setNodes(nodes,onNodePositionChange)
    {
        if (nodes instanceof BaseCluster3D)
            nodes=nodes.mClusters
        else
        if (!_.isArray(nodes)) throw new Error("not supported, must be array of nodes or BaseClester3D")


        //for canceling animation
        var mTimeout;

        let len= nodes.length|Object.keys(nodes).length

        let _len;
        if (this.dimensions==1)
            _len=len;
        if (this.dimensions==1)
            _len= len/Math.sqrt(len);
        if (this.dimensions==1)
            _len= len/Math.pow(len,1/3);


        let step=1/_len

        //1d/2d/3d helpers
        //for (let i=0;i<=1;i+=step)
        var i=0;
        var c=0;
        var that=this;
        _.each(nodes,function(n){

            var dist= that.distribute(n, i,0,0);



           //  onNodePositionChange(dist.position,c)


            //------------------------
            //------------------------

            //animating from current position to new one
        var mc=c;
        let origPos=(n.position)?n.position:n



            let tween = new TWEEN.Tween(origPos)
                .to(dist.position,400)
                .onUpdate(function () {

                    onNodePositionChange(origPos,mc)

                }).onComplete(function(){

                    cancelAnimationFrame(mTimeout)

                })
                .start();

            //------------------------
            //------------------------


            i+=step
            c++;
        })



        requestAnimationFrame(animate);

        function animate(time) {
            mTimeout=    requestAnimationFrame(animate);
            TWEEN.update(time);
        }


    }

    //TODO this should be called to distribute the elements of the country layer when finished
    //TODO also it will be useful to add rotation as well in the future


    distribute(node,dx,dy,dz){

        return {position:new THREE.Vector3(dx,dy,dz).multiplyScalar(this.mScale)};
    }
}

