/**
 * Created by Frank on 29.05.2017.
 */

/**
 * TODO  possible different ways to distribute elements => moveTo, goTo, stack?
 *
 *
 */

import BaseCluster3D from "../BaseCluster3D"


export default  class BaseDistribution
{
    constructor(scale=50,dimensions=1){

        //TODO have some kind of dynamic width function as alternative to the static scale value
        //this way it would be possible to have equal with child nodes for example
        let defaults={scale:()=> 50 ,dimensions:1}


        this.mDuration=2000 //FIXME longer duration does not render as intended

        this.dimensions=dimensions //TODO
        this.mScale=scale
    }


    setNodes(nodes,onNodePositionChange,onEnd) {
        if (nodes instanceof BaseCluster3D) {

            //TODO
         /*   if (nodes.isLeaf())
                nodes =nodes.mNodes
                else*/
                nodes = nodes.mClusters

        }
        else
        if (!_.isArray(nodes)) throw new Error("not supported, must be array of nodes or BaseClester3D")


        var mDuration=this.mDuration

        //for canceling animation
        var mTimeout;

        let len= nodes.length|Object.keys(nodes).length


        var i=0,j=0,k=0;

        let _len;
        if (this.dimensions==1)
            _len=len;
        if (this.dimensions==2)
            _len= Math.sqrt(len);
        if (this.dimensions==3)
            _len=Math.pow(len,1/3);

        if (this.dimensions<3)  k=0.5*_len
        if (this.dimensions<2)  j=0.5*_len


        let step=1/_len

        //1d/2d/3d helpers
        //for (let i=0;i<=1;i+=step)

        var c=0;
        var that=this;
        var fixmeOnce=true;

        var tweens=[]

        _.each(nodes,function(n){

            if (i>_len){
                j++;
                i=0;
            }

            if (j>_len){
                k++;
                j=0;
            }


            var dist= that.distribute(n, i/_len-0.5,j/_len-0.5,k/_len-0.5);



           //  onNodePositionChange(dist.position,c)


            //------------------------
            //------------------------

            //animating from current position to new one
        var mc=c;
        let origPos=(n.position)?n.position:n



            let tween = new TWEEN.Tween(origPos)
                .to(dist.position,mDuration)
                .onUpdate(function () {

                    onNodePositionChange(origPos,mc)

                }).onComplete(function(){


                    //TODO instead of onEnd we shoudhave a timed function that gets called very 20 ms or so until onColplete is triggered by at least one node

                    if (fixmeOnce) {

                        _.each(tweens,function(tween){
                            TWEEN.remove(tween)

                        })

                        if (onEnd) onEnd()
                        fixmeOnce=false
                    }

                    cancelAnimationFrame(mTimeout)

                })
                .start();

            //------------------------
            //------------------------

            tweens.push(tween)
            //i+=step
            i++;
            c++;
        })



        requestAnimationFrame(animate);

        function animate(time) {


           // TWEEN.update(time);

            _.each(tweens,function(tween){
                tween.update(time)

            })


            mTimeout=    requestAnimationFrame(animate);

        }




    }

    //TODO this should be called to distribute the elements of the country layer when finished
    //TODO also it will be useful to add rotation as well in the future


    distribute(node,dx,dy,dz){

        return {position:new THREE.Vector3(dx,dy,dz).multiplyScalar(this.mScale)};
    }
}

