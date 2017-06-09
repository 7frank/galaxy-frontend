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


        if (window["baseCluster"]) return


        setTimeout(function () {

            globalEnv.nodeClouds.detach();
            globalEnv.lineMesh.visible = false;
            globalEnv.particles.pointCloud.visible = false
            globalEnv.tn.remove()

            globalEnv.countryTextNodes.remove()
          //  globalEnv.useNodeTextFeature=false
            baseCluster.zoomToCluster()

        }, 1000)

        setTimeout(function () {

            baseCluster.zoomToCluster()
        },2000)

        a = new clusters.MyMain;
        baseCluster = a.clusters
        baseCluster.mClusters["United States"].getRelationInfo()

    })

})



