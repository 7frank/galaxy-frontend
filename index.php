<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">

    <!-- TODO refactor -->

    <!--  LOADING -->

    <script src="./js/lib/qwest.min.js"></script>
    <script src="./js/lib/papaparse.min.js"></script>
    <script src="./js/data-set-loader.js"></script>

    <!--  Rendering -->

  <!--  <script src="./js/lib/three.min.js"></script> -->
   <script src="./js/lib/Tween.js"></script>    <!-- TODO npm import won't work for hull feature somehow -->



      <!-- <script src="./js/THREE.MeshLine.js"></script>    -->
    <!-- <script src="./js/THREE.ArrowExt.js"></script>
        <script src="./js/CustomAnimatedLineMesh.js"></script> -->

    <script src="./js/CameraObserverMode.js"></script>
    <script src="./js/gpu-info.js"></script>





    <script src="./build/bundle.js"></script>

    <!--  GUI -->


    <script src="./js/lib/jquery-3.2.0.min.js"></script>     <!--  TODO -->
    <script src="./js/lib/jquery-ui.min.js"></script>

    <script src="./js/gui/searchbar.js"></script>
    <script src="./js/SpecificDataUtils.js"></script>
    <script src="./js/AppDataService.js"></script>






    <style>
        @import url('https://fonts.googleapis.com/css?family=Exo+2');
    </style>

    <link rel="stylesheet" href="./css/style.css">

    <link rel="stylesheet" href="./css/jquery-ui.css">

    <link rel="stylesheet" href="./css/force-graph.css">
    <style>

        body * {
            font-family: 'roboto' !important;
        }

        ::-webkit-scrollbar {
            width: 5px;
            height: 5px;
        }

        ::-webkit-scrollbar-thumb {
            background: red;

        }

        ::-webkit-scrollbar-button {
            background: transparent;
            width: 0px;
            height: 0px;
        }

        ::-webkit-scrollbar-track {
            background: #888;
        }

        .modeSelect {
            position: absolute;
            top: 10px;
            right: 100;
            cursor: pointer;
        }

        .modeSelect * {

            padding: 0.2em;
            color: white;
            border-radius: 1px;
            border: 1px solid white;
        }

        .inverted {
            filter: invert(100%);
        }

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


<div id="3d-graph" style="width: calc(100vw); height: calc(100vh);"></div>
<div class="modeSelect">
    <span onClick="setMode('3d')">3D</span>
    <span onClick="setMode('2d')">2D</span>
</div>
<?php include("control_index.php"); ?>
<script src="./js/index.js"></script>

</body>
</html>