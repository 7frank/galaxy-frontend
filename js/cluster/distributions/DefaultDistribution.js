/**
 * Created by Frank on 29.05.2017.
 */

/**
 * TODO  possible different ways to distribute elements => moveTo, goTo, stack?
 *
 *
 */


import BaseDistribution from "./BaseDistribution"

import BaseCluster3D from "../BaseCluster3D"



    export default  class DefaultDistribution extends BaseDistribution
    {
    constructor(scale=1,dimensions=3){

        super(scale,dimensions)

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
                    .to(dist.position,1)
                    .onUpdate(function () {



                    }).onComplete(function(){

                        onNodePositionChange(dist.position,mc)
                        //TODO instead of onEnd we shoudhave a timed function that gets called very 20 ms or so until onColplete is triggered by at least one node

                        if (fixmeOnce) {
                            if (onEnd) onEnd()
                            fixmeOnce=false
                        }

                        cancelAnimationFrame(mTimeout)

                    })
                    .start();

                //------------------------
                //------------------------


                //i+=step
                i++;
                c++;
            })



            requestAnimationFrame(animate);

            function animate(time) {
                mTimeout=    requestAnimationFrame(animate);
                TWEEN.update(time);
            }


        }


//TODO this is quite redundant we want the same work flow but not at idle copy costs if possible
    distribute(node,dx,dy,dz) {


        var mesh = (node._bubble) ? node._bubble : node;
        var absPos;
        if (mesh) {
            absPos = new THREE.Vector3();
            absPos.setFromMatrixPosition(mesh.matrixWorld);

        //TODO this is only working for specific cases currently
            if (mesh instanceof BaseCluster3D)
            absPos.sub(mesh.getRoot().position)
             else
            absPos.sub(mesh.parent.parent.getRoot().position)

        }
        else {

        absPos={};  //if above fails, we interpret the node as a yet rendered node with  potential initial x,y,z

            (typeof node.x!="undefined")?absPos.x=node.x:0;
            (typeof node.y!="undefined")?absPos.y=node.x:0;
            (typeof node.z!="undefined")?absPos.z=node.x:0;

            }
        return {position:new THREE.Vector3(absPos.x,absPos.y,absPos.z).multiplyScalar(this.mScale)};
    }
}

