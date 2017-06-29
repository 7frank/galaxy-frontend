
	const Graph =mGraph= ForceGraph()
	.numDimensions(3)
	(document.getElementById("3d-graph"));


   var  cameraModi;
    var   main =null;



	function setMode(mode)
	{
	var env=globalEnv;

	if (!cameraModi) cameraModi=new CameraObserverMode(env);

	if (mode=="3d")
	{
        main.setGraph3D()
       // cameraModi.setMode("3d")


	//Graph.numDimensions(3);
	$("body").removeClass("inverted");

     //   env.controls.target.set(new THREE.Vector3(0,0,0));
	
	doZoomToPos(new THREE.Vector3(0,0,5000));

     //   env.controls.noRotate=false
      //TODO for orbit controls controls.mouseButtons = { PAN: THREE.MOUSE.LEFT, ZOOM: THREE.MOUSE.MIDDLE, ORBIT: THREE.MOUSE.RIGHT }; // swapping left and right buttons
	}
	else
	if (mode=="2d")
	{
        main.setGraph2D()

      //  cameraModi.setMode("2d")

	//Graph.numDimensions(2);
	$("body").addClass("inverted");
      //  env.controls.target.set(new THREE.Vector3(0,0,0));
	doZoomToPos(new THREE.Vector3(0,0,3000));

     //   env.controls.noRotate=true

    }
}	




    function loadDefaultView() {

        let curDataSetIdx;
        const dataSets = getGraphDataSets();
        let dataSet = dataSets[0];
        let mGraph = null;

        function alternativehandler(mGraphData)
		{
			console.log("graphData",mGraphData);


            Graph
                .resetState()
                .nameAccessor(node => node.id)
                .colorAccessor(function (node) {
                    if (node.color) return node.color;

                    if (typeof node.group == "undefined") {
                        node.group = 0;
                        return Math.round(Math.random() * 256 * 256 * 256)
                    }

                    if (typeof node.group!="string")
                        return parseInt(colors[node.group % colors.length].slice(1), 16);
                    else
                        return 0xffffff
                })

                .shapeAccessor(node => node.shape ? node.shape : "sphere")
                .graphData(mGraphData);


		}

        dataSet(mGraph,alternativehandler); // default Load data set

    }


    function loadAlternativeView() {

      main = new clusters.MyMain(getGraphDataSets());


    }

$(function(){
    //loadDefaultView()
    loadAlternativeView()

});