
/**


to make it less pronouce
it is quite high profile currently
so I guess my two biggest comments would be 
1. full line highlight with potential use of line above
2. group wrapper for expanded node similar to 2D where is transparent color wrapper stays after it expands. we can polish it up a lot more

*/


/**

TODO when to use onst and when var for materials.. problem is altering material properties will affect all in const case
TODO remove globals && mXXX
TODO improve perfomance by using billborad and dot7.png instead of sphere + shader for nodes

TODO fix arrow color and flicker

NOTE: set initialEngineTicks to a appropriate value to speed up bigger graphs 

FIXME sprite and highlighing with sphere will not work... due to transparency problems
http://stackoverflow.com/questions/15994944/transparent-objects-in-threejs

TODO grouping for collapse feature
TODO tooltip bugs when changing graph (miserables node tooltips appear hovering black areas when orig nodes are loaded afterwards)

TODO scale arrow depending on  group link size

TODO expanding nodes will result in still showing group tooltips
 probably remove group nodes from raycaster or something like that			

 
 TODO bigger nodes instead of plus icon when collapsed
 TODO remove jumpyness of graph when mouse is lciked and moved ==> fix mouse click and over
 
 
 TODO ?when using hull feature? sometimes nodes cannot be clicked .. probably due to hull back or front preventing events from triggering on nodes
 
 TODO search filter for hidden nodes.. exand before zoom
 
 FIXME highlightEdgeElements currently broken due to meshline changes
 
 
 */

//current selected node
var previousNodeClicked=[];
var previousNodeDblClicked;
 
//------------------------------------------------
//Feature 1

var previousNodes;

function highlightNodeElements(bShowOtherNodes=false,bShowEdgeArrows=true) {


	//TODO
	/*if (previousNodes&& previousNodes!=this)
{
	unhighlightNodeElements.apply(previousNodes)
	previousNodes=this

	}*/

	//console.log("highlighting nodes:" + (this.children.length + this.parents.length))

	this.showHighlight()

	
	
	
	if (bShowOtherNodes)
	{
		for (childNode of this.children)
		childNode.showHighlight()

		for (parentNode of this.parents)
			parentNode.showHighlight()
	}
		
			//console.log("highlighting edges:" + (this.edges.length))



		for (edge of this.edges)
				edge.showHighlight()

			if(bShowEdgeArrows)
				for (edge of this.edges)
				{
					var color= edge.source==this ? 0x99ff99: 0xffb2b2


                    addArrow(edge,color)
				}
}

function unhighlightNodeElements() {
	//console.log("unhighlighting nodes:" + (this.children.length + this.parents.length))

	this.hideHighlight()

	for (childNode of this.children)
		childNode.hideHighlight()

		for (parentNode of this.parents)
			parentNode.hideHighlight()

			//console.log("unhighlighting edges:" + (this.edges.length))

			for (edge of this.edges)
				edge.hideHighlight()

				for (edge of this.edges)
					removeArrow(edge)

}

function highlightEdgeElements() {

	this.showHighlight()
	this.source.showHighlight()
	this.target.showHighlight()
	

					var color=   0x666666 
					addArrow(this,color)
			
	
}

function unhighlightEdgeElements() {

	this.hideHighlight()
	this.source.hideHighlight()
	this.target.hideHighlight()
	
		removeArrow(this)
	
}

function extendElement(elements, attrName, options,env) {

 var mDomEvents=env.domEvents

	function _TODO(typeName) {
		return function () {
			console.warn("implement handler for", typeName)
			console.log(this, arguments)
		}
	}

	var defaults = {
		mousemove: _TODO("mousemove"),
		mouseleave: _TODO("mouseleave"),
		click: _TODO("click"),
		dblclick: _TODO("dblclick")
	}
	options = $.extend(true, {}, defaults, options)



	for (el of elements) {

	
	
	if (el._line&&env.useLineGroup)
	{
		el.showHighlight = function () {}
		el.hideHighlight = function () {}
		
		continue
		
	}
		var mesh = el[attrName]

		
		
		
			mDomEvents.addEventListener(mesh, 'click', options.click, false)
			mDomEvents.addEventListener(mesh, 'dblclick', options.dblclick, false)

			mDomEvents.addEventListener(mesh, 'mouseover', function (e) {
				options.mousemove.apply(e.target.node || e.target.edge)
			}, false)
			mDomEvents.addEventListener(mesh, 'mouseout', function (e) {
				options.mouseleave.apply(e.target.node || e.target.edge)
			}, false)

			

			el.showHighlight = function () {
				
				if (this.isHighlighted) return
				this.isHighlighted=true
				
				if (attrName=="_bubble"&& this["_bubble"]==null) console.error("FIXME ") 
				
		if (this._bubble)
		{
				this.addClass("node-highlighted") 
			
		}
			
		if (this._line)
		{
			var mesh = this[attrName]
			 mesh.material.visible=false
			
		}	
		
		if (this.text)
		{	
		this.text.addClass("node-caption-highlighted")
		}
			

		


			
		}
		
		
		el.hideHighlight = function () {
			
			
			
			
				if (!this.isHighlighted) return
				this.isHighlighted=false
			
		if (this._bubble)
		{
				this.removeClass("node-highlighted") 
		
		}
		
		if (this._line)
		{
			var mesh = this[attrName]
			 mesh.material.visible=true
			
		}	
		
		if (this.text)
		{	
		this.text.removeClass("node-caption-highlighted")
		}
		
	
		}

	}

}


	
	//helper to being able to handle click events 
	//isSelected == false will prevent the actual node selection and only will trigger the zoom+highlight parts
	function doOnClickNode(currNodeClicked,stack=false,onAnimationEnd,isSelected=true,doHighlighNeighbours=true,doHighlighEdges=true,doZoomIn=true)
	{

		if (previousNodeClicked.indexOf(currNodeClicked)<0)
		//if (previousNodeClicked!=currNodeClicked)
			{
			//node selected
			highlightNodeElements.apply(currNodeClicked,[doHighlighNeighbours,doHighlighEdges])



                if (doZoomIn)
			doZoomToMesh(currNodeClicked._bubble,onAnimationEnd)



			if (isSelected)
			{
			//GUI.updateNodeInfo(currNodeClicked)
			
			currNodeClicked.addClass("basic-selection")
			
			
			//if (previousNodeClicked)
			if (!stack)
			if (previousNodeClicked.length>0)
				for (p of previousNodeClicked)
				{
				p.removeClass("basic-selection")
				unhighlightNodeElements.apply(p)
				}
		
			if (!stack)
			previousNodeClicked=[currNodeClicked]
			else
			previousNodeClicked.push(currNodeClicked)	
		
			}
		
		
			}
			else 
			{ 
		//GUI.updateNodeInfo(currNodeClicked,false)
				//node unselected
				unhighlightNodeElements.apply(currNodeClicked)
			
				//previousNodeClicked=[]
				previousNodeClicked.splice(currNodeClicked)
				
				currNodeClicked.removeClass("basic-selection")
				
			}
		
	}
	
/*

as long as node is current selection => mouse enter return mouse leave return

if clicked and not current selection trigger mouse leave on last

*/
//inject additional functionality
function extendGraphElements(d3Nodes, d3Links,env) {

	addGraphHierarchy(d3Nodes, d3Links)


	
	extendElement(d3Nodes, "_bubble", {
		mousemove:  function (e) {
			
			if (previousNodeClicked.indexOf(this)>=0)return 
			//if (previousNodeClicked==this) return 
			
			highlightNodeElements.apply(this,[true,true])
		
			//	GUI.updateNodeInfo(this,false)
		
		},
		mouseleave: function(){

		//if (previousNodeClicked==this) return 
		if (previousNodeClicked.indexOf(this)>=0)return 
		
		
		//if (previousNodeClicked!=this)
		unhighlightNodeElements.apply(this)
	
		
		


	},
		click: function (e) {
			var currNodeClicked=e.target.node
			e.stopPropagation()
			
			//if (previousNodeClicked &&previousNodeClicked!=currNodeClicked) 	unhighlightNodeElements.apply(previousNodeClicked) 
			if (previousNodeClicked.length>0 &&previousNodeClicked.indexOf(currNodeClicked)<0)
			for (p of previousNodeClicked)
				unhighlightNodeElements.apply(p) 
		
			doOnClickNode(currNodeClicked,e.origDomEvent.ctrlKey)
	
				return false;
		},
		dblclick: function (e) {
			e.stopPropagation()
			//setCollapsedSateOfChildNodesAndEdgesOfNode(e.target.node)
				var currNodeDblClicked=e.target.node
				
			GUI.updateNodeInfo(currNodeDblClicked,currNodeDblClicked!=previousNodeDblClicked )
			
			if (previousNodeDblClicked==currNodeDblClicked)
			previousNodeDblClicked=null;
		else
			previousNodeDblClicked=currNodeDblClicked
			//unhighlightNodeElements.apply(e.target.node)
			return false;
		}
	},env)
	
	
	//FIXME extending attrName sometimes false
	
	extendElement(d3Links, "_line", {
		click: function (e) {

		},
		mousemove: highlightEdgeElements,
		mouseleave: unhighlightEdgeElements

	},env)

}

/**
 * build a helper structure for parent child relation
 * TODO how to handle/exclude recursive structures
 */

function addGraphHierarchy(d3Nodes, d3Links) {
	/*
	node:
	group:1
	id:"2"
	shape:"sphere" | "cube"
	_bubble: instanceof THREE.Mesh //SphereGeometry
	_id:"2"


	link:
	source:"1"
	target:"3"
	_line:	 instanceof THREE.Mesh //LineGeometry
	 */

	//prepare nodes
	for (let node of d3Nodes) {

		if (!node.edges)
			node.edges = [];
		if (!node.children)
			node.children = [];
		if (!node.parents)
			node.parents = [];

		node._bubble.node = node

	}

	for (let item of d3Links) {

		item._line.edge = item

			//add edge list to nodes
			if (item.source.edges.indexOf(item) < 0)
				item.source.edges.push(item);
			if (item.target.edges.indexOf(item) < 0)
				item.target.edges.push(item);

			//add target of current link to children list of source
			if (item.source.children.indexOf(item.target) < 0)
				item.source.children.push(item.target);

			//add source of current link to parent list of target
			if (item.target.parents.indexOf(item.source) < 0)
				item.target.parents.push(item.source);
	}

}

//------------------------------------------------
//Feature 2 zoom and search

//0-100


function doZoomToPos(vec3Position,distanceToPosition=500) {

	console.warn("deprecated doZoomToPos")
	//  var vec3End = new THREE.Vector3();  vec3End.setFromMatrixPosition( mesh.matrixWorld );

	var env=globalEnv;

		var vec3Start = env.camera.position
		var vec3End = vec3Position


		//we want to have a fixed distance to a node when selecting
		var distVec = vec3End.clone().sub(vec3Start)
		var len = distVec.length()
		distVec.normalize()
		distVec.multiplyScalar(distanceToPosition) //apply fixed distance to the target
		
		var alteredVecEnd = vec3End.clone().sub(distVec)

		//change distance to target
		var tween = new TWEEN.Tween(vec3Start)
		.to(alteredVecEnd, 400)
		.onUpdate(function () {
		
		})
		.start();
		
		//lookat target
		var tween2 = new TWEEN.Tween(globalEnv.controls.target)
		.to(vec3End, 400)
		.onUpdate(function () {
		
		})
		.start();

	requestAnimationFrame(animate);

	function animate(time) {
		requestAnimationFrame(animate);
		TWEEN.update(time);
	}

}


function doZoomByVal(val) {
    console.warn("deprecated doZoomByVal")
var env=globalEnv




		

		var vec3Start = env.camera.position
		var vec3End = env.controls.target


		//we want to have a fixed distance to a node when selecting
		var distVec = vec3End.clone().sub(vec3Start)
		var len = distVec.length()
		distVec.normalize()
		distVec.multiplyScalar(val) //apply fixed distance to the target
		
		var alteredVecEnd = vec3End.clone().sub(distVec)

		//change distance to target
		var tween = new TWEEN.Tween(vec3Start)
		.to(alteredVecEnd, 400)
		.onUpdate(function () {
		
		})
		.start();
		
		//lookat target
		var tween2 = new TWEEN.Tween(globalEnv.controls.target)
		.to(vec3End, 400)
		.onUpdate(function () {
		
		})
		.start();

	requestAnimationFrame(animate);

	function animate(time) {
		requestAnimationFrame(animate);
		TWEEN.update(time);
	}

}

function doZoomToMesh(mesh,onEnd,minMaxDistance=400) {


    let view=$(".view-3d[hasFocus]")[0]

    if (!view)view=$(".view-3d.view-3d-maximised").get(0)

    if (!view) console.warn("no view focused to be able to zoom")


	let camera=view.mCamera;
    let controls=view.mControls;



	var vec3Start = camera.position


    var vec3End = new THREE.Vector3();
    vec3End.setFromMatrixPosition( mesh.matrixWorld );

	//	var vec3End = mesh.position //e.target.position


		//we want to have a fixed distance to a node when selecting
		var distVec = vec3End.clone().sub(vec3Start)
		var len = distVec.length()
		distVec.normalize()
		distVec.multiplyScalar(minMaxDistance) //apply fixed distance to the target
		
		var alteredVecEnd = vec3End.clone().sub(distVec)


		if (typeof onEnd!="function") onEnd=function(){}
		//change distance to target
		var tween = new TWEEN.Tween(vec3Start)
		.to(alteredVecEnd, 400)
		.onUpdate(function () {

		}).onComplete(onEnd)
		.start();
		
		//lookat target
		var tween2 = new TWEEN.Tween(controls.target)
		.to(vec3End, 400)
		.onUpdate(function () {

		})
		.start();

	requestAnimationFrame(animate);

	function animate(time) {
		requestAnimationFrame(animate);
		TWEEN.update(time);
	}

}



//------------------------------------------------
//Feature 3 custom shader

function createShaderMaterial(camera, color) {
	var vertexShaderText = $('#vertexShader1').text()
		var fragmentShaderText = $('#fragmentShader1').text()
	
		return _createShaderMaterial(vertexShaderText, fragmentShaderText, {
			"c": {
				type: "f",
				value: .2
			},
			"p": {
				type: "f",
				value: 2.2
			},
			viewVector: {
				type: "v3",
				value:  camera.position
			},
			glowColor: {
				type: "c",
				value: new THREE.Color(color)
			}
		})
}

function createShaderMaterial2(camera, color) {
	var vertexShaderText = $('#vertexShader2').text()
		var fragmentShaderText = $('#fragmentShader2').text()

		var attributes = {

		size: {
			type: 'f',
			value: null
		},
		customColor: {
			type: 'c',
			value: null
		},
		//destination:        { type: 'f', value: null },

	};

	var uniforms = {

		color: {
			type: "c",
			value: new THREE.Color(color)
		}
		//,texture:   { type: "t", value: THREE.ImageUtils.loadTexture( "images/block.png" ) }

	};

	var shaderMaterial = new THREE.ShaderMaterial({

			uniforms: uniforms,
			attributes: attributes,
			vertexShader: vertexShaderText,
			fragmentShader: fragmentShaderText,

			//blending:       THREE.AdditiveBlending,
			//depthTest:      false,
			//transparent:    true

		});

}

function _createShaderMaterial(vertexShader, fragmentShader, uniformOptions) {
	var uniformDefaults = {
		"c": {
			type: "f",
			value: 1.0
		},
		"p": {
			type: "f",
			value: 1.4
		},
		glowColor: {
			type: "c",
			value: new THREE.Color(0xffff00)
		},
		viewVector: {
			type: "v3",
			value: new THREE.Vector3
		}
	}

	uniformOptions = $.extend(true, {}, uniformDefaults, uniformOptions)

		// create custom material from the shader code
		//   that is within specially labeled script tags
		var customMaterial = new THREE.ShaderMaterial({
			uniforms: uniformOptions,
			vertexShader: vertexShader,
			fragmentShader: fragmentShader,
			side: THREE.FrontSide,
			blending: THREE.AdditiveBlending,
			transparent: true
		});

	return customMaterial
}




//------------------------------------------------
//Feature 5 arrows



function _findSceneForMesh(mesh,maxIter=99)
{
	var scene=null
 while(mesh.parent && maxIter--)
 {
 	if (mesh.parent instanceof THREE.Scene) return mesh.parent
     mesh=mesh.parent
 }

 return scene

}


//NOTE: add arrows only to selection to improve performance
function addArrow(d3LinkObj,color,options) {


	var defaults={
		highlightArrowType:"line"

	}

	var env=_.extend(defaults,options)



	if (d3LinkObj.arrow) return

	var lineMesh = d3LinkObj._line

	//TODO set arrow to sphere radius not center
	

	//	var from0 = d3LinkObj.mStart
	//	var to0 = d3LinkObj.mEnd



    var from0 = new THREE.Vector3();
    from0.setFromMatrixPosition( d3LinkObj.source._bubble.matrixWorld );


    var to0 = new THREE.Vector3();
    to0.setFromMatrixPosition( d3LinkObj.target._bubble.matrixWorld );



		//TODO
		if (!to0) return
		
		var distVec = to0.clone().sub(from0)
		var len = distVec.length()
		
		/**
		* TODO currently the arrow helper gets used which creates some "ditter" effect when rendered at the same position as a edge
		*  
		*/
		
			
		//distVec.normalize()
		distVec.multiplyScalar(0.9) 
		//change start and end of arrow
		var from = from0.clone().add(distVec)
		var to = to0.clone().sub(distVec)
		
		
	var direction = to.clone().sub(from);
	var length = direction.length();
	
	var headLength=0.2 * len *0.2 //use original length
	

	var arrowHelper;
	


	if (env.highlightArrowType=="line")
	{
		let dir=to0.clone().sub(from0)
		let len=dir.length()

		arrowHelper = new THREE.ArrowHelper(dir.normalize(), from0, len, color||0x0000FF,0.001,0.001); //setting headlength and with to zero will trigger lots of warnings
	

	
	}
	else 
	if (env.highlightArrowType=="animated")
	{
		let dir=to0.clone().sub(from0)
		let len=dir.length()
	
	arrowHelper=new CustomAnimatedLineMesh(direction.normalize(), from, length, color||0x0000FF,1,"img/arrow.png")
	
	}
	else 
	if (env.highlightArrowType=="simple")
	arrowHelper = new THREE.ArrowHelper(direction.normalize(), from, length, color||0x0000FF, headLength,0.4 * headLength);
	else 
	if (env.highlightArrowType=="double")
	arrowHelper = new ArrowExt(direction.normalize(), from, length, color||0x0000FF, headLength,0.4 * headLength);

	
	d3LinkObj.arrow = arrowHelper
	//lineMesh.parent.add(arrowHelper);


    var scene=_findSceneForMesh(d3LinkObj.source._bubble)

	if (!scene){
		console.warn("no scene found")
	debugger;
	}
	else
    scene.add(arrowHelper);

}

function removeArrow(d3LinkObj) {
	if (!d3LinkObj.arrow) return
	//TODO
	var env=globalEnv
	var lineMesh = d3LinkObj._line


		if (d3LinkObj.arrow)
		{
		let parent=d3LinkObj.arrow.parent

			//lineMesh.parent.remove(d3LinkObj.arrow);
            if (parent)
            parent .remove(d3LinkObj.arrow);



			d3LinkObj.arrow=null;
		}
}

//------------------------------------------------
//feature 6 store export nodes


$(function () {

setTimeout(function(){

	var searchbar=$(".searchbar-container input")

    $(window).bind('keyup', 'ctrl+s', exportGraph);
    searchbar.on("keyup",null,'ctrl+s',exportGraph)


},1000)

	
	
})


function exportGraph()
{
	
	download("resultGraph.json", _exportNodes(globalNodes,globalLinks))
}


function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

function _exportNodes(nodes,edges,ignoredNodeKeys)
{
	if (!ignoredNodeKeys)
		ignoredNodeKeys="_id,children,parents,edges,_bubble".split(",")
	
	
	
	
	
	var mappedNodes=nodes.map( node => _.omit(node,ignoredNodeKeys))
	
	var mappedEdges=edges.map( edge => ({source:edge.source.id,target:edge.target.id} )  )
	
	var obj={alpha:globalEnv.layout.alpha(),nodes:mappedNodes,links:mappedEdges}
	
	return JSON.stringify(obj)
	
}
//-----------------------------------------------
//adding demo stuff

//make canvas focusable so below actions can be triggered when input is not focused

setTimeout(function(){

$("#3d-graph canvas").attr("tabindex","1").on("click",function(){  $(this).focus() })
},500)	

	$(window).bind('keyup', '+', function(){
		
		curDataSetIdx=(curDataSetIdx+1)%dataSets.length
		toggleDimensions(3)
		
	});
	$(window).bind('keyup', '-', function(){
		
		curDataSetIdx=(curDataSetIdx+dataSets.length-1)%dataSets.length
		toggleDimensions(3)
		
	});

//------------------------------------------------
//helper structures for "class"-like work flow with nodes
var _classes={}
function register3DClass(className,options){
	
  var defaults={
	  geometry:function(env,el){ return new THREE.CubeGeometry(Math.cbrt(env.valAccessor(el) || 1) * env.nodeRelSize,Math.cbrt(env.valAccessor(el) || 1) * env.nodeRelSize,Math.cbrt(env.valAccessor(el) || 1) * env.nodeRelSize);; },
	  material:function(env,el){ return  new THREE.MeshBasicMaterial({ color: env.colorAccessor(el) || 0xffffff, transparent: true })  },
	  instance:function (env,el){
		  return new THREE.Mesh(this.geometry(env,el), this.material(env,el));
	  },onAdd:function(completeCallback){
		if (completeCallback)
		completeCallback()
		  return
		
	
		var mesh=this
	
		mesh.material.opacity=0
		var tween = new TWEEN.Tween(mesh.material)
		.to({opacity:1}, 200)
		.onUpdate(function () {
			
		//mesh.material.opacity=this.opacity
		})
		.onComplete(completeCallback)
		.start();	

		  
	  },
	  onRemove:function(completeCallback){
		  	if (completeCallback)
		  completeCallback()
		  return 
		
		var mesh=this
		mesh.material.opacity=1
		var tween = new TWEEN.Tween(mesh.material)
		.to({opacity:0}, 200)
		.onUpdate(function () {
			
		//mesh.material.opacity=this.opacity
		})
		.onComplete(completeCallback)
		.start();

		
		  
	  },
	  unique:false
  }
  
  options=$.extend(true,{},defaults,options)
  
  if (typeof _classes[className]!="undefined") throw new Error("className already registered:",className)
  
 _classes[className]=options
}

function _newClassViaFactory(className,env,el)
{
	var factory=_classes[className]
	if (!factory) 
	{
		
		//throw new Error("3d class "+className+" not found")
		console.error("3d class "+className+" not found")
	  
		var mMesh=new THREE.Mesh()
			mMesh.onAdd=function(){}
			mMesh.onRemove=mMesh.onAdd=function(c){ if(c) c()}
			mMesh.set=function(){}
	  return mMesh;
	
	  
	}


	if (factory.unique && factory._unique_instance) return factory._unique_instance

	var material;
	var geometry;
	
	
	var mMesh=factory.instance(env,el)
		
	if (factory.unique)
	factory._unique_instance=mMesh

	mMesh.onAdd=factory.onAdd
	mMesh.onRemove=factory.onRemove
	mMesh.set=function(attrName,options){
		//TODO do we needthat in any way?
	
		if (_.isObject(options))
		{if (_.isObject(mMesh[attrName]))
			$.extend(mMesh[attrName],options)
			else
				mMesh[attrName]=options
		}
		else
		mMesh[attrName]=options	
		
	}
	
	
	return mMesh

}


//------------------------------------------

function basicSpriteGeometry(env,el){ 
	 
	 var geometry = new THREE.Geometry();
					var vertex = new THREE.Vector3();
					geometry.vertices.push( vertex );
					
					
	  return (function(env,el){ 		
		return geometry; 
	  })()
	  
  }
  
  function basicSpriteSize(env,el,scale=1){ 
	// Math.cbrt(env.valAccessor(el) || 1) * env.nodeRelSize
	let size=el.size? el.size:32
  size=Math.cbrt(size) * env.nodeRelSize
		return (32+size*3)*scale
  
  }
  

//define some sample "classes"
register3DClass("basic-cube",{})
//----------------------------------------
register3DClass("hull-hint",{
geometry:function(env,el){ return new THREE.CubeGeometry(20,20,20); }
})



//----------------------------------------
register3DClass("basic-cube-highlighted",{
	  geometry:function(env,el){ return new THREE.CubeGeometry(11,11,11); },
	  material:function(env,el){ return  new THREE.MeshBasicMaterial({ color:  0xff0000, transparent: true });  },
	  unique:false
  })
//----------------------------------------
register3DClass("basic-sphere",{
	material:function(env,el){
		return new THREE.MeshBasicMaterial({ color: env.colorAccessor(el) || 0xffffff, transparent: true });
	},
	  geometry:function(env,el){ return new THREE.SphereGeometry(Math.cbrt(env.valAccessor(el) || 1) * env.nodeRelSize,12,10); },
	  unique:false
  })
  //----------------------------------------
  register3DClass("basic-selection",{
	material:function(env,el){
		return new THREE.MeshBasicMaterial({ color:  0xffffff, transparent: true,opacity:0.3/*,side: THREE.BackSide*/  });
	},
	  geometry:function(env,el){ return new THREE.SphereGeometry(Math.cbrt(env.valAccessor(el) || 1) * env.nodeRelSize/3.5,25,25); },
	  unique:true
  })
  
  //----------------------------------------
  
  var basicCollapsedSprite = new THREE.TextureLoader().load("img/dot9.png");	
					
  register3DClass("basic-sprite-collapsed",{
	  geometry:basicSpriteGeometry
	  ,
	  material:function(env,el){ 
	
					material = new THREE.PointsMaterial( { color: env.colorAccessor(el) || 0xffffff, size:basicSpriteSize(env,el), sizeAttenuation: true, map: basicCollapsedSprite, alphaTest: 0.0, transparent: true ,opacity:0.6 ,depthTest:false } );
					return  material

	  },instance(env,el){
		  
		  var mPointMesh=new THREE.Points( this.geometry(env,el), this.material(env,el) )
		 
			
		  return mPointMesh;
		  
	  },
	  unique:false
  })

  
  
  //----------------------------------------
  var ring3Sprite = new THREE.TextureLoader().load("img/ring3.png");	
					
  register3DClass("basic-ring",{
	  geometry:basicSpriteGeometry,
	  material:function(env,el){ 
	  
					
					
					material = new THREE.PointsMaterial( { color: env.colorAccessor(el) || 0xffffff, size:basicSpriteSize(env,el), sizeAttenuation: true, map: ring3Sprite, alphaTest: 0.0, transparent: true ,opacity:0.6 ,depthTest:false } );
					return  material

	  },instance(env,el){
		  
		  var mPointMesh=new THREE.Points( this.geometry(env,el), this.material(env,el) )
		 
			
		  return mPointMesh;
		  
	  },
	  unique:false
  })

  
  //----------------------------------------
  var ring2Sprite = new THREE.TextureLoader().load("img/ring2.png");	
					
  register3DClass("basic-ring-2",{
	  geometry:basicSpriteGeometry
	  ,
	  material:function(env,el){ 
	  
					
					
					material = new THREE.PointsMaterial( { color: env.colorAccessor(el) || 0xffffff, size:basicSpriteSize(env,el), sizeAttenuation: true, map: ring2Sprite, alphaTest: 0.0, transparent: true ,opacity:0.6 ,depthTest:false } );
					return  material

	  },instance(env,el){
		  
		  var mPointMesh=new THREE.Points( this.geometry(env,el), this.material(env,el) )
		 
			
		  return mPointMesh;
		  
	  },
	  unique:false
  })

  
   register3DClass("basic-animated",{
	  geometry:basicSpriteGeometry,
	  material:function(env,el){ 
	  
					
	var runnerTexture = new THREE.ImageUtils.loadTexture( 'img/run.png' );
	 var annie = new TextureAnimator( runnerTexture, 10, 1, 10, 75 ); // texture, #horiz, #vert, #total, duration.
	//var runnerMaterial = new THREE.MeshBasicMaterial( { map: runnerTexture, side:THREE.DoubleSide } );
	//var runnerGeometry = new THREE.PlaneGeometry(50, 50, 1, 1);
	//var runner = new THREE.Mesh(runnerGeometry, runnerMaterial);
	//runner.position.set(-100,25,0);
	//scene.add(runner);
					
	//FIXME animation increases in speed over time
		//animate material
		function animate(time=0) 
		{
			requestAnimationFrame( animate );
			annie.update(time/1000);	
		}
		requestAnimationFrame( animate )

	
					//var sprite = new THREE.TextureLoader().load("img/dot9.png");	
					material = new THREE.PointsMaterial( { color: env.colorAccessor(el) || 0xffffff, size:basicSpriteSize(env,el), sizeAttenuation: true, map: runnerTexture, alphaTest: 0.0, transparent: true ,opacity:0.6 ,depthTest:false } );
					return  material

	  },instance(env,el){
		  
		  var mPointMesh=new THREE.Points( this.geometry(env,el), this.material(env,el) )
		  
	
			
		  return mPointMesh;
		  
	  },
	  unique:false
  })
  
  
//----------------------------------------
  
  var expandedSprite = new THREE.TextureLoader().load("img/minus-square-o.png");	
  register3DClass("basic-sprite-expanded",{
	  geometry:basicSpriteGeometry,
	  material:function(env,el){ 
	  	
					
					material = new THREE.PointsMaterial( { color:  env.colorAccessor(el) || 0xffffff, size:basicSpriteSize(env,el), sizeAttenuation: true, map: expandedSprite, alphaTest: 0.0, transparent: true ,opacity:0.6,depthTest:false  } );
					return  material

	  },instance(env,el){
		  
		  return new THREE.Points( this.geometry(env,el), this.material(env,el) );
		  
	  },
	  unique:false
  })
  
  
  //----------------------------------------
  
  var basicSprite = new THREE.TextureLoader().load("img/dot7.png");	
  register3DClass("basic-sprite",{
	  geometry:basicSpriteGeometry,
	  material:function(env,el){ 	
					
					var material = new THREE.PointsMaterial( { color: env.colorAccessor(el) ||  0xffffff, size:basicSpriteSize(env,el), sizeAttenuation: true, map: basicSprite, alphaTest: 0.0, transparent: true ,opacity:0.6,depthTest:false } );
					
					//depthTest:false, fog:false,blending:THREE.AdditiveBlending,
		
					
					return  material

	  },instance(env,el){
		  
		  return new THREE.Points( this.geometry(env,el), this.material(env,el) );
		  
	  },
	  unique:false
  })
   //----------------------------------------
  register3DClass("node-highlighted",{
	  geometry:basicSpriteGeometry,
	  material:function(env,el){ 	
					var sprite = new THREE.TextureLoader().load("img/dot7.png");	
					var material = new THREE.PointsMaterial( { color: env.colorAccessor(el) ||  0xffffff, size:basicSpriteSize(env,el)*1.8, sizeAttenuation: true, map: sprite, alphaTest: 0.0, transparent: true ,opacity:1.6 ,depthTest:false } );
					
					//depthTest:false, fog:false,blending:THREE.AdditiveBlending,
		
					
					return  material

	  },instance(env,el){
		  
		  return new THREE.Points( this.geometry(env,el), this.material(env,el) );
		  
	  },
	  unique:false
  })
  
  
  
/**

	on/off
	add/remove/toggle Class

*/
  
function basicElementExtend(env,obj,_mesh)
{
	var mDomEvents=env.domEvents


	var self=_.extend(obj,
		{
		_instances:{},
		getClassInstance:function(className){
			return this._instances[className];
		},
		on:function(eventName,eventhandler){	
				mDomEvents.addEventListener(_mesh, eventName, eventhandler, false)	
		},
		off:function(eventName,eventhandler){
				mDomEvents.removeEventListener(_mesh, eventName, eventhandler, false)	
		},trigger:function(eventName,intersect,node){
			
			
			mDomEvents._notify(eventName, _mesh,node,intersect);
			//mDomEvents.triggerEvent(_mesh, eventName, args)
			
			
		},get3DRoot:function(){
		
			return this._bubble 
		},	
		addClass:function(className)
		{
			
			for (className of className.split(" "))
			{
				
			if (this.hasClass(className)) continue;	
				
			var mMesh;
			
			if (this._instances[className])
				mMesh=this._instances[className]
			else 
				mMesh=this._instances[className]=_newClassViaFactory(className,env,obj)
		
		
			
			this.get3DRoot().add(mMesh)
			mMesh.onAdd()
			

			}
			return this
		},removeClass(className){
		  for (className of className.split(" "))
			{
		  var mMesh;
			if (this._instances[className])
			{
			
				mMesh=this._instances[className]
				
				mMesh.onRemove( () => this.get3DRoot().remove(mMesh))
			
			}
			
			}
			return this
		},
		hasClass:function(className){
			var mMesh;
			if (this._instances[className])
				mMesh=this._instances[className]
			
			return (this.get3DRoot().children.indexOf(mMesh)>=0)	
			
		},
		toggleClass:function(className){
			
			for (className of className.split(" "))
			{
			 
			var mMesh;
			
			if (this._instances[className])
				mMesh=this._instances[className]
			
			if (this.hasClass(className))
				this.removeClass(className)
			else
				this.addClass(className)
			
			}
			return this	
		}
		})
		
		return self	
}  
  



		function linkMixin(env,link,options)
		{
			
			if (link._mixin_) return
		link._mixin=true
			
			defaults={
				opacity:0.01,
				transparent: true,
				lineIsVisible:true, // if disabled the line won't be shown on the scene
				 color: 0xffffff
			}
			
			options=_.extend(defaults,options)
			
			function createBasicLineMesh(){
				
				
				var lineMaterial = new THREE.MeshBasicMaterial({ color:options.color, transparent: options.transparent ,opacity:options.opacity});
				if (env.lineOpacity) //deprecated?
				lineMaterial.opacity = env.lineOpacity;
				
				
				 var line = new THREE.Line(new THREE.Geometry(), lineMaterial);
				line.geometry.vertices=[new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0)];
				
				return line;
				
			}
			
			
	//--------------------------------
				
				function createLineGroupElem(){
				
								
					var start=new THREE.Vector3(0,0,0)
					var stop=new THREE.Vector3(0,0,0)	

					
					//naive approach to reduce the edge count for larger graph
					
					if (options.lineIsVisible)
					{
					env.mergedLineMesh.geometry.vertices.push(start);
					env.mergedLineMesh.geometry.vertices.push(stop);		
					}
				
				
				
			
				return {start,stop,update:function(){
					env.mergedLineMesh.geometry.verticesNeedUpdate = true;	
				}
				};
				
			}
			//----------------------------
					
			function createExtLineHelper(){
				
			
				var line = new MeshLine();
				var material = new MeshLineMaterial({transparent: options.transparent,opacity:options.opacity});
				
				var mStart=new THREE.Vector3
				var mEnd=new THREE.Vector3
			
				return { setStart:function(vec3){
					mStart=vec3
				},setEnd:function(vec3){
					mEnd=vec3
				},
				getLine:function(srcWidth=1,dstWidth=1){
					
					
					var geo=new THREE.Geometry()
					geo.vertices=[mStart,mEnd];
					line.setGeometry( geo , function( p ) {
					
					var ratio=(srcWidth*p)+(dstWidth*(1-p))
					return ratio  /10
					} );	
					var lineMesh = new THREE.Mesh( line.geometry, material ); 

					return lineMesh
				}};
				
			}
			
			
			

			if (env.useLineWidthFeature==true && (link.source.isGroupNode || link.target.isGroupNode) )
			{
				
			var helper=createExtLineHelper()
			
				helper.setStart(new THREE.Vector3)
				helper.setEnd(new THREE.Vector3)
						
			
				link._line =//new THREE.Object3D
				helper.getLine()
			
				_.extend(link,{
			
			setStartEnd: function (mVecStart,mVecEnd) {
				this.mStart=new THREE.Vector3(mVecStart.x, mVecStart.y || 0, mVecStart.z || 0)
				this.mEnd=new THREE.Vector3(mVecEnd.x, mVecEnd.y || 0, mVecEnd.z || 0)
				
			
				helper.setStart(this.mStart)
				helper.setEnd(this.mEnd)
	
	
				//FIXME handle line like a container to maintain event handlers and such
				env.scene.remove(link._line);
				link._line
				link._line = helper.getLine(this.source.link_count||1,this.target.link_count||1)
				env.scene.add(link._line);

			}
		})
			
			
			}
			else
			{
				
				
				
				if (env.useLineGroup)
				{
					
					var lg=createLineGroupElem();
				
			
				link._line={}
				_.extend(link,{
			
				setStartEnd: function (mVecStart,mVecEnd) {
					
					lg.start.copy(mVecStart)
					lg.stop.copy(mVecEnd)
					
					this.mStart=lg.start
					this.mEnd=lg.stop
					
					lg.update()
					
					}
				})
			
					
				}
				else
				{
				
				
					link._line = createBasicLineMesh()
				
					_.extend(link,{
				
					setStartEnd: function (mVecStart,mVecEnd) {
						
						this.mStart=new THREE.Vector3(mVecStart.x, mVecStart.y || 0, mVecStart.z || 0)
						this.mEnd=new THREE.Vector3(mVecEnd.x, mVecEnd.y || 0, mVecEnd.z || 0)
						
						this._line.geometry.vertices[0] =this.mStart
						this._line.geometry.vertices[1] =this.mEnd
						
						this._line.geometry.verticesNeedUpdate = true;
						//this._line.geometry.computeBoundingSphere();
						

						
						}
					})
				}
			
			
			}
			
			
			basicElementExtend(env,link,link._line)
			
	
			
			
		}
//------------------------------------------
//better node structure
//TODO not currently used 

//TODO
var sphereGeometry = new THREE.SphereGeometry(1,3,2 );
var emptyGeometry = new THREE.Geometry();
var singleNodeMaterial = new THREE.MeshBasicMaterial( {color: 0xffff00,wireframe:true,visible:true,opacity:0,transparent:true ,
    alphaTest: 0.99 //if set to 1.0 it somehow gets converted to int which will result in the shader failing

} );

var lastSelectedNode;

function nodeMixin(env,node,options) {
	


	if (node._mixin_) return
		node._mixin=true


options=_.extend({onDrawNode:function(){}},options)		
	// have a container as root element  instead of the mesh itself	

				//material is invisible but it seems that raycaster works as intended 
				//FIXME but the onBeforeRender and onAfterRender code won't get executed
				//NOTE the material is currently visible and the opacity ==0 but this still impacts performace
				// so currently the material is set invisible only every x frames in the animation loop





              var material = new THREE.MeshBasicMaterial( {color: 0xffff00,wireframe:true,visible:true,opacity:env.useDebugSphere?1:0,transparent:true ,
				alphaTest: 0.99 //if set to 1.0 it somehow gets converted to int which will result in the shader failing

				} );



/*
    var material = new THREE.MeshBasicMaterial( {color: 0xffff00,wireframe:true,visible:true,opacity:1,transparent:true ,
        alphaTest: 0.99 //if set to 1.0 it somehow gets converted to int which will result in the shader failing

    } );
*/

				
				if (!emptyGeometry.boundingSphere)
				emptyGeometry.boundingSphere= new THREE.Sphere(new THREE.Vector3,1);
				
		//the single material is only for the node counting. so it should be irrelevant for rendering itself
				node._bubble = new THREE.Mesh(sphereGeometry, singleNodeMaterial) //material );
	
	
		
	
	var mMesh=node._bubble;

	
	//the problem is that the onBeforeRender does not execute when the mesh or the material is invisible

		mMesh.onBeforeRender=function(renderer, scene, camera, geometry, material, group)
		{
			
		}
	
		mMesh.onAfterRender=function(renderer, scene, camera, geometry, material, group)
		{
			options.onDrawNode.apply(this,[node])
		}
	

	var size=basicSpriteSize(env,node)/5
	//var size=node.size?node.size*0.66:1
	
	mMesh.scale.setScalar(size	)
	
	
	//FIXME
	//remove all previous nodes without container .. by class so that we can support all browsers
	//if nodes get expanded check for nodes that need to be hidden 
	
	
	basicElementExtend(env,node,mMesh)
	
	var self=_.extend(node,{
		highlight: function () {

			highlightNodeElements.apply(this)

		},
		unhighlight: function () {

			unhighlightNodeElements.apply(this)

		},

		zoom: function () {


			doOnClickNode(this)
		},

		expandGroup: function () {

		
			//setCollapsedSateOfChildNodesAndEdgesOfNode(this, true)
			//if (typeof self.link_count!="number") return
		
			var grp=this.group
			if (typeof grp=="undefined") return //silent fail
			if (env.expand[grp]==true) return //already expanded
			
			env.expand[grp] = true;
			env.digest()
				
			
		},
		collapseGroup: function () {

			//setCollapsedSateOfChildNodesAndEdgesOfNode(this, false)

			var grp=this.group
			if (typeof grp=="undefined") return //silent fail
			if (env.expand[grp]==false) return //already expanded
			
			env.expand[grp] = false;
			env.digest()
				
			
			
			
		}

	})
	
	
	//self.on("click mouseover mousemove ...")
	
	if (env.useTooltip){
		
	
		self.on("mouseover",function(e,f,g){
			//e.type,intersection,node)
		
			var node;
			
			if (e.intersect.object.node)
			node=e.intersect.object.node
			else
			if (e.origDomEvent) node=e.origDomEvent
			
			
			var info="";
			if (node.name)
				info +=" "+node.name	
			if (node.group)
				info +=" "+node.group	
			if (node.info)
				info +=" "+node.info	
			 
			
			if (info.trim()!="")
			{
				var content=$("<span class='content'>").html(info)
				$(env.toolTipElem).html(content)
				
				
			}
			
					
		})
		
		self.on("mouseout",function(e){
					env.toolTipElem.innerHTML=''
		})
	
	
	}
	
	//add extra highlight for last clicked node
	

		/*self.on("click",function(e){
		
			if (lastSelectedNode)
				lastSelectedNode.removeClass("basic-selection")
				
				lastSelectedNode=e.target.node
				
				e.target.node.addClass("basic-selection")
		})*/
	
	
	//add group node expand behaviour
		if (self.isGroupNode)
		self.on("dblclick",function(e){
		e.target.node.expandGroup()
		})
		else //add none group node collapse behaviour
		self.on("dblclick",function(e){
		
		
		if (env.useGroupFeature)
		e.target.node.collapseGroup()
		
		})
	
	return self

}

//----------------------------------------------------


function TextureAnimator(texture, tilesHoriz, tilesVert, numTiles, tileDispDuration) 
{	
	// note: texture passed by reference, will be updated by the update function.
		
	this.tilesHorizontal = tilesHoriz;
	this.tilesVertical = tilesVert;
	// how many images does this spritesheet contain?
	//  usually equals tilesHoriz * tilesVert, but not necessarily,
	//  if there at blank tiles at the bottom of the spritesheet. 
	this.numberOfTiles = numTiles;
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping; 
	texture.repeat.set( 1 / this.tilesHorizontal, 1 / this.tilesVertical );

	// how long should each image be displayed?
	this.tileDisplayDuration = tileDispDuration;

	// how long has the current image been displayed?
	this.currentDisplayTime = 0;

	// which image is currently being displayed?
	this.currentTile = 0;
		
	this.update = function( milliSec )
	{
		this.currentDisplayTime += milliSec;
		while (this.currentDisplayTime > this.tileDisplayDuration)
		{
			this.currentDisplayTime -= this.tileDisplayDuration;
			this.currentTile++;
			if (this.currentTile == this.numberOfTiles)
				this.currentTile = 0;
			var currentColumn = this.currentTile % this.tilesHorizontal;
			texture.offset.x = currentColumn / this.tilesHorizontal;
			var currentRow = Math.floor( this.currentTile / this.tilesHorizontal );
			texture.offset.y = currentRow / this.tilesVertical;
		}
	};
}		




