/**
 * Created by Frank on 30.05.2017.
 */

/**
 *
 * FIXME make code independent from current implementation
 * runs sample code when ctrl+space is pressed to not interfere with current implementation
 **/

$(function () {


    function runInitialSample() {


        if (window["main"]) return


        setTimeout(function () {

       /*     globalEnv.nodeClouds.detach();
            globalEnv.lineMesh.visible = false;
            globalEnv.particles.pointCloud.visible = false
            globalEnv.tn.remove()

            globalEnv.countryTextNodes.remove()
            //  globalEnv.useNodeTextFeature=false
            */

            main.clusters.zoomToCluster()

        }, 1000)







        main = new clusters.MyMain;

        //baseClusters.find("United States")[0].getRelationInfo()
        //main_baseCluster.mClusters["United States"].getRelationInfo()

    }

    function runClusterSample1()
    {
        main.runSample1()
        //main.clusters.zoomToCluster()

    }

    function runClusterSample2()
    {
        main.runSample2()
        //main.clusters.zoomToCluster()

    }

    function runClusterSample3()
    {
        main.runSample3()
       // main.clusters.zoomToCluster()

    }


  //  $(window).on("keyup", null, "mod+space",runClusterSample)

    Mousetrap.bind( "mod+space",runInitialSample)


    Mousetrap.bind( "mod+1",runClusterSample1)
    Mousetrap.bind( "mod+2",runClusterSample2)
    Mousetrap.bind( "mod+3",runClusterSample3)



})



