/**
 * Created by Frank on 30.05.2017.
 */

/**
 *
 * FIXME make code independent from current implementation
 * runs sample code when ctrl+space is pressed to not interfere with current implementation
 **/

$(function () {


    $(window).on("keyup", null, "ctrl+space", function () {

        //these four additional things should be put into toe ClusterExt class

        setTimeout(function () {

            globalEnv.nodeClouds.detach();
            globalEnv.lineMesh.visible = false;
            globalEnv.particles.pointCloud.visible = false
            globalEnv.tn.remove()

            globalEnv.countryTextNodes.remove()

        }, 1000)




        if (window["baseCluster"]) return
        a = new clusters.MyMain;
        baseCluster = a.clusters
        baseCluster.mClusters["United States"].getRelationInfo()

    })

})



