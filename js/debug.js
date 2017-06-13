/**
 * Created by Frank on 30.05.2017.
 */

/**
 *
 * FIXME make code independent from current implementation
 * runs sample code when ctrl+space is pressed to not interfere with current implementation
 **/

$(function () {

return
    main = new clusters.MyMain;



    /*function runInitialSample() {


       if (window["main"]) return


        setTimeout(function () {
            globalEnv.demoDisabled=true
            globalEnv.nodeClouds.detach();
            globalEnv.lineMesh.visible = false;
            globalEnv.particles.pointCloud.visible = false
            globalEnv.tn.remove()

            globalEnv.countryTextNodes.remove()
            //  globalEnv.useNodeTextFeature=false


            main.clusters.zoomToCluster()

        }, 2000)



        main = new clusters.MyMain;

       main.setupViews();


        //baseClusters.find("United States")[0].getRelationInfo()
        //main_baseCluster.mClusters["United States"].getRelationInfo()

    }*/

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
    function runClusterSample4()
    {
        main.runSample4()
        // main.clusters.zoomToCluster()

    }


  //  $(window).on("keyup", null, "mod+space",runClusterSample)

    //Mousetrap.bind( "mod+space",runInitialSample)


    Mousetrap.bind( "1",runClusterSample1)
    Mousetrap.bind( "2",runClusterSample2)
    Mousetrap.bind( "3",runClusterSample3)
    Mousetrap.bind( "4",runClusterSample4)


   // runInitialSample()


})



