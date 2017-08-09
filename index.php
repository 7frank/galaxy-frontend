<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">

    <!-- TODO refactor -->

    <!--  Rendering -->



      <!-- <script src="./js/THREE.MeshLine.js"></script>
    <!-- <script src="./js/THREE.ArrowExt.js"></script>
        <script src="./js/CustomAnimatedLineMesh.js"></script> -->

    <script src="./js/CameraObserverMode.js"></script>
    <script src="./js/gpu-info.js"></script>





    <script src="./build/bundle.js"></script>


    <style>




        .info-panel {
            display: none;
            width: 40%;
            z-index: 9999;
            position: absolute;
            top: 30%;
            left: 30%;
        }


    </style>

    <?php include("header_include.php"); ?>






</head>

<body>

<pre class="info-panel">
    keymap
    ------------------------------------
    h ... toggle this help menu

    s ... recluster hovered cluster/leaf
    t ... toogle select current cluster
    z/click ... zoom to cluster
    u TODO toggle cluster text nodes ?
    e ... toggle edges
    ------------------------------------
</pre>


<sample-cluster-application  style="width: calc(100vw); height: calc(100vh);"></sample-cluster-application>


<?php include("control_index.php"); ?>


</body>
</html>