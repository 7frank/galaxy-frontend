
	const Graph =mGraph= ForceGraph()
	.numDimensions(3)
	(document.getElementById("3d-graph"));


   var  cameraModi



	function setMode(mode)
	{
	var env=globalEnv;

	if (!cameraModi) cameraModi=new CameraObserverMode(env)

	if (mode=="3d")
	{

       // cameraModi.setMode("3d")

	Graph.numDimensions(3)
	$("body").removeClass("inverted")

        env.controls.target.set(new THREE.Vector3(0,0,0))
	
	doZoomToPos(new THREE.Vector3(0,0,5000))

        env.controls.noRotate=false
      //TODO for orbit controls controls.mouseButtons = { PAN: THREE.MOUSE.LEFT, ZOOM: THREE.MOUSE.MIDDLE, ORBIT: THREE.MOUSE.RIGHT }; // swapping left and right buttons
	}
	else
	if (mode=="2d")
	{

      //  cameraModi.setMode("2d")

	Graph.numDimensions(2)
	$("body").addClass("inverted")
        env.controls.target.set(new THREE.Vector3(0,0,0))
	doZoomToPos(new THREE.Vector3(0,0,3000))

        env.controls.noRotate=true

    }
}	
	
	
let curDataSetIdx;
const dataSets = getGraphDataSets();

let toggleData;
(toggleData = function() {
	curDataSetIdx = curDataSetIdx === undefined ? 0 : (curDataSetIdx+1)%dataSets.length;
	const dataSet = dataSets[curDataSetIdx];

	dataSet(Graph); // Load data set
	//document.getElementById('graph-data-description').innerHTML = dataSet.description ? `Viewing ${dataSet.description}` : '';
})(); // IIFE init

let toggleDimensions = function(numDimensions) {
	Graph
		.resetState()				// Wipe nodes
		.numDimensions(numDimensions);
	dataSets[curDataSetIdx](Graph); // Reload nodes
};


$(function(){
	
$(window).on("resize",function(){
	
	Graph.width(window.innerWidth).height(window.innerHeight)

})


})