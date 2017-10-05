/**
 * Created by Frank on 29.05.2017.
 */

/**
 * TODO  possible different ways to distribute elements => moveTo, goTo, stack?
 *
 *
 */

import BaseCluster3D from "../BaseCluster3D"
//import TWEEN from "@tweenjs/tween.js"
import TWEEN from "../../lib/Tween"

import * as THREE from "three";
import * as _ from "lodash";


export default class BaseDistribution {
    constructor(scale = 50, dimensions = 1) {

        //TODO have some kind of dynamic width function as alternative to the static scale value
        //this way it would be possible to have equal with child nodes for example
        let defaults = {scale: () => 50, dimensions: 1}


        this.mDuration = 2000 //FIXME longer duration does not render as intended

        this.dimensions = dimensions //TODO
        this.mScale = scale
        this.mEasingFunction = TWEEN.Easing.Quadratic.In
    }


    //TODO have an options setter instead that checks if this["key"] exists and warns if option not exists
    onSort(sortFN) {
        this.mSortFunction = sortFN
        return this
    }

    doSort(nodesArray) {
        if (!this.mSortFunction) return

        nodesArray.sort(this.mSortFunction)


    }


    setNodes(nodes, onNodePositionChange, onStepComplete, onEnd) {


        if (nodes instanceof BaseCluster3D) {

            //TODO
            /*   if (nodes.isLeaf())
             nodes =nodes.mNodes
             else*/
            nodes = Object.values(nodes.mClusters)

        }
        else if (!_.isArray(nodes)) throw new Error("not supported, must be array of nodes or BaseClester3D")


        this.doSort(nodes)

        var mDuration = this.mDuration

        //for canceling animation
        var mTimeout;


        let len = nodes.length//|Object.keys(nodes).length


        var i = 0, j = 0, k = 0;

        let _len;
        if (this.dimensions == 1)
            _len = len;
        if (this.dimensions == 2)
            _len = Math.sqrt(len);
        if (this.dimensions == 3)
            _len = Math.pow(len, 1 / 3);

        if (this.dimensions < 3) k = 0.5 * (_len-1)
        if (this.dimensions < 2) j = 0.5 * (_len-1)


        let step = 1 / _len

        //1d/2d/3d helpers
        //for (let i=0;i<=1;i+=step)

        var c = 0;
        var count = nodes.length;
        var that = this;
        var notTweenFinished = true;

        //stop previous animations
        this.stop()

        var tweens = this.mTweens = []

        _.each(nodes, function (n) {

            if (i > _len) {
                j++;
                i = 0;
            }

            if (j > _len) {
                k++;
                j = 0;
            }



            var dist = that.distribute(n, i / (_len-1) - 0.5, j / (_len-1) - 0.5, k / (_len-1) - 0.5);


            //  onNodePositionChange(dist.position,c)


            //------------------------
            //------------------------

            //animating from current position to new one
            var mc = c;
            let origPos = (n.position) ? n.position : n

            //reset y,z dimension of dist to to animate node onto the plane it should be
            //   if (that.dimensions<3) dist.position.z=0;
            //   if (that.dimensions<2) dist.position.y=0;


            let tween = new TWEEN.Tween(origPos)
                .easing(that.mEasingFunction)
                .to(dist.position, mDuration)
                .onUpdate(function () {

                    //after the last node was updated
                    if (mc == count - 1) {
                        if (onStepComplete)
                            onStepComplete()

                        // console.warn("Step",origPos.x,origPos.y,origPos.z,dist.position.x,dist.position.y,dist.position.z)
                    }

                    onNodePositionChange(origPos, mc)

                }).onComplete(function () {


                    if (notTweenFinished) {
                        notTweenFinished = false;
                        that.stop();
                        //   console.warn("onEnd",origPos.x,origPos.y,origPos.z,dist.position.x,dist.position.y,dist.position.z)
                        if (onEnd) onEnd()


                        //console.log("cancel",mTimeout)
                        cancelAnimationFrame(mTimeout)
                    }


                })
                .start();


            //------------------------
            //------------------------

            tweens.push(tween)
            //i+=step
            i++;
            c++;
        })


        mTimeout = requestAnimationFrame(animate);

        function animate(time) {


            _.each(tweens, function (tween) {
                tween.update(time)
                //  tween.end(time)

            })

            if (notTweenFinished)
                mTimeout = requestAnimationFrame(animate);

        }


    }

    stop() {


        _.each(this.mTweens, function (tween) {

            TWEEN.remove(tween)

        })

    }


    //TODO this should be called to distribute the elements of the country layer when finished
    //TODO also it will be useful to add rotation as well in the future


    distribute(node, dx, dy, dz) {

        return {position: new THREE.Vector3(dx, dy, dz).multiplyScalar(this.mScale)};
    }
}

