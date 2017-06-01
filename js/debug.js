/**
 * Created by Frank on 30.05.2017.
 */

/**
* runs sample code when ctrl+space is pressed to not interfere with current implementation
* */

$(function(){


    $(window).on("keyup",null,"ctrl+space",function(){

        a=new clusters.MyMain;

        /*a.firstSample();
        setTimeout(() => a.startForceGraphSampleOnContainers("United States"),2000)

        setTimeout(() => a.startForceGraphSampleOnSubsets("United States"),4000)
*/

        b=a.betterSample()


    })

})



