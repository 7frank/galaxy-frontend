<html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
	
	<script src="./js/lib/lodash.min.js"></script>
	
	<script src="./js/lib/qwest.min.js"></script>
	<script src="./js/lib/papaparse.min.js"></script>
	<script src="./js/lib/d3-force-3d.bundle.min.js"></script>
	<script src="./js/lib/three.min.js"></script>
	<script src="./js/lib/threex.domevents.js"></script>

	<script src="./js/THREE.MeshLine.js"></script>
	<script src="./js/ConvexGeometry.js"></script>
	<script src="./js/ConvexDynamicGeometry.js"></script>
	<script src="./js/QuickHull.js"></script>
	<script src="./js/SmoothConvexHullGeometry.js"></script>

	<script src="./js/CameraObserverMode.js"></script>


   <!-- <script src="./dist/js/NodesContainer.js"></script> -->
	<script src="./build/bundle.js"></script>


	<script src="./js/THREE.ArrowExt.js"></script>
	<script src="./js/CustomAnimatedLineMesh.js"></script>
	
	<script src="./js/graham_scan.js"></script>
	
	

	<script src="./js/lib/three-trackballcontrols.min.js"></script>
	<script src="./js/data-set-loader.js"></script>
	

	
	<script src="./js/lib/jquery-3.2.0.min.js"></script>
	<script src="./js/lib/jquery.hotkeys.js"></script>
	
	
	
	<script src="./js/lib/jquery-ui.min.js"></script>
	
	<script src="./js/lib/Tween.min.js"></script>
	
	<script src="./js/gpu-info.js"></script>
	<script src="./js/CountryDistanceMetric.js"></script>
	 
	 
	<script src="./js/force-graph-network.js"></script>
	<script src="./js/force-graph-utils.js"></script>
	
	<script src="./js/gui/searchbar.js"></script>
	
	<script src="./js/force-graph.js"></script>
	
	
	<script src="./js/ParticleSystem.js"></script>
		<script src="./js/ParticleNodeGroup.js"></script>
		<script src="./js/SpecificDataUtils.js"></script>
		<script src="./js/TextNodesImpl.js"></script>
	
	
		<script src="./js/AppDataService.js"></script>


    <script src="./js/debug.js"></script>



    <script src="./js/lib/dat.gui.min.js"></script>
	<script>
	
	
	//model for dat.gui
    var SampleModel = function () {

		this.convexHullFeature="simple"
		this.lineOpacity=0.2
		this.initialEngineTicks=0
		this.maxConvergeFrames=7500
		this.maxConvergeTime=150
		this.useGroupFeature=false
		this.useLineWidthFeature=false
		this.useNodeTextFeature=false
		this.useDebugSphere=false
		this.useTooltip=false
		this.useLineGroup=false
		
		
		this.numDimensions=3
		this.highlightArrowType="line"
		//this.test={hello:true}
		
    };
	//loads dat.gui and adds some config options for user interaction
    window.onload = function () {
    	var text = new SampleModel();
    	var gui = new dat.GUI();
		gui.close()
		dat.GUI.toggleHide();
		$(window).bind('keyup', 'ctrl+i', function(){
		dat.GUI.toggleHide();
		
		
		});
		
		
		
		function reloadGraph()
		{
		 var items=Object.keys(this)
		 for (key of items)
		 {
			 if (typeof mGraph[key]=="function")
		     mGraph[key](this[key])
			else
			 mGraph[key]=this[key]	
		 }	 	
		}
		


		
	gui.add(text, 'convexHullFeature',["simple","advanced","none"]).onFinishChange(reloadGraph.bind(text));

	
	gui.add(text, 'useGroupFeature').onFinishChange(reloadGraph.bind(text));
	gui.add(text, 'useLineWidthFeature').onFinishChange(reloadGraph.bind(text));
	gui.add(text, 'useNodeTextFeature').onFinishChange(reloadGraph.bind(text));

	gui.add(text, 'useDebugSphere').onFinishChange(reloadGraph.bind(text));
	gui.add(text, 'useTooltip').onFinishChange(reloadGraph.bind(text));

	gui.add(text, 'useLineGroup').onFinishChange(reloadGraph.bind(text));
	
	gui.add(text, 'highlightArrowType',["line","simple","double"]).onFinishChange(reloadGraph.bind(text));

	
	
	gui.add(text, 'numDimensions',[2,3]).onFinishChange(reloadGraph.bind(text));
	gui.add(text, 'lineOpacity',0,1).onFinishChange(reloadGraph.bind(text));
	gui.add(text, 'initialEngineTicks',0,20).onFinishChange(reloadGraph.bind(text));
	gui.add(text, 'maxConvergeFrames',0,15000).onFinishChange(reloadGraph.bind(text));
	gui.add(text, 'maxConvergeTime',0,300).onFinishChange(reloadGraph.bind(text));

	//gui.add(text, 'test').onFinishChange(reloadGraph.bind(text));

	
    };
	
	</script>
	
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


	::-webkit-scrollbar-button {
    background: transparent;
	}
	
	::-webkit-scrollbar-track-piece {
    background: #888;
	}

	
	.modeSelect{
		position:absolute;
		top:10px;
		right:100;
		cursor:pointer;
	}
	
	.modeSelect *{
		
		padding:0.2em;
		color:white;
		border-radius:1px;
		border:1px solid white;
	}
	
	
	.inverted {
	filter: invert(100%);
	}
	
	
	</style>
	
	<script id="vertexShader1" type="x-shader/x-vertex">
	uniform vec3 viewVector;
	uniform float c;
	uniform float p;
	varying float intensity;
	void main() 
	{
		vec3 vNormal = normalize( normalMatrix * normal );
		vec3 vNormel = normalize( normalMatrix * viewVector );
		intensity = pow( c - dot(vNormal, vNormel), p );
		
		gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
	}
	</script>

	<!-- fragment shader a.k.a. pixel shader -->
	<script id="fragmentShader1" type="x-shader/x-vertex"> 
	uniform vec3 glowColor;
	varying float intensity;
	void main() 
	{
		vec3 glow = glowColor * intensity;
		gl_FragColor = vec4( glow, 1.0 );
	}
	</script>
	
	<script type="x-shader/x-vertex" id="vertexshader2">

			attribute float size;
			attribute vec3 customColor;
			varying vec3 vColor;

			void main() {

				vColor = customColor;

				vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

				gl_PointSize = size * ( 300.0 / length( mvPosition.xyz ) );

				gl_Position = projectionMatrix * mvPosition;

			}

		</script>

		<script type="x-shader/x-fragment" id="fragmentshader2">

			uniform vec3 color;
			uniform sampler2D texture;

			varying vec3 vColor;

			void main() {

				gl_FragColor = vec4( color * vColor, 1.0 );

				gl_FragColor = gl_FragColor * texture2D( texture, gl_PointCoord );

			}

		</script>
	<?php include ("header_include.php"); ?>
	
</head>

<body>



<div id="3d-graph"  style="width: calc(100vw); height: calc(100vh);"></div>
<div class="modeSelect" >
<span onClick="setMode('3d')">3D</span>
<span onClick="setMode('2d')">2D</span>
</div> 
<?php include("control_index.php"); ?>
<script src="./js/index.js"></script>

</body></html>