





function ForceGraph() {

	var digest=_.debounce(__digest,20)
	
	
	const CAMERA_DISTANCE2NODES_FACTOR = 150;

	class CompProp {
		constructor(name, initVal = null, redigest = true, onChange = newVal => {}) {
			this.name = name;
			this.initVal = initVal;
			this.redigest = redigest;
			this.onChange = onChange;
		}
	}

	const env = { // Holds component state
		initialised: false,
		onFrame: () => {}
	};

	//TODO remove and forward env to modules
	globalEnv = env

		const exposeProps = [
			new CompProp('width', window.innerWidth, false, resizeCanvas),
			new CompProp('height', window.innerHeight, false, resizeCanvas),
			new CompProp('graphData', {
				nodes: {
					1: {
						name: 'mock',
						val: 1
					}
				},
				links: [[1, 1]]// [from, to]
			}),
			new CompProp('numDimensions', 3),
			new CompProp('numSkipEdgesRendered', 5, false),

			new CompProp('nodeRelSize', 4), // volume per val unit
			new CompProp('lineOpacity', 0.1),
			new CompProp('valAccessor', node => node.val),
			new CompProp('nameAccessor', node => node.name),
			new CompProp('groupAccessor', node => node.group),
			new CompProp('colorAccessor', node => node.color),
			new CompProp('shapeAccessor', node => node.shape),
			new CompProp('initialEngineTicks', 0), // how many times to tick the force engine at init before starting to render
			new CompProp('maxConvergeTime', 2 * 7500), // ms
			new CompProp('maxConvergeFrames', 2 * 150),
			new CompProp('useGroupFeature', false),
			new CompProp('useLineWidthFeature', false),
			new CompProp('useNodeTextFeature', true, false),
			new CompProp('convexHullFeature', "none"),
			new CompProp('useDebugSphere', false),
			new CompProp('useTooltip', true),
			new CompProp('highlightArrowType', "line"), //line,animated,simple,mesh

			new CompProp('useLineGroup', true)

		];
	//----------------------------------------
	function createTooltip() {

		// Setup tooltip


		env.toolTipElem = document.createElement('div');
		env.toolTipElem.classList.add('graph-tooltip');

		env.domNode.appendChild(env.toolTipElem);

		// Capture mouse coords on move
		env.raycaster = new THREE.Raycaster();
		env.mouse = new THREE.Vector2();
		env.mouse.x = -2; // Initialize off canvas
		env.mouse.y = -2;
		env.domNode.addEventListener("mousemove", ev => {
			// update the mouse pos

			if (!env.useTooltip) {
				$(env.toolTipElem).hide()
				return

			} else
				$(env.toolTipElem).show()

				const offset = getOffset(env.domNode),
				relPos = {
					x: ev.pageX - offset.left,
					y: ev.pageY - offset.top
				};
			env.mouse.x = (relPos.x / env.width) * 2 - 1;
			env.mouse.y =  - (relPos.y / env.height) * 2 + 1;
			//console.log(offset);
			// Move tooltip
			env.toolTipElem.style.top = (relPos.y - 40) + 'px';
			env.toolTipElem.style.left = (relPos.x - 20) + 'px';

			function getOffset(el) {
				const rect = el.getBoundingClientRect(),
				scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
				scrollTop = window.pageYOffset || document.documentElement.scrollTop;
				return {
					top: rect.top + scrollTop,
					left: rect.left + scrollLeft
				};
			}
		}, false);

	}
	//----------------------------------------
	//init

	

	function initPossibleControls(){




	}



	function initStatic() {
		// Wipe DOM
		env.domNode.innerHTML = '';
		// Add nav info section

		/*
		const navInfo = document.createElement('div');
		navInfo.classList.add('graph-nav-info');
		navInfo.innerHTML = "";
		env.domNode.appendChild(navInfo);
		 */

		createTooltip()

		// Setup camera
		env.camera = mCamera = new THREE.PerspectiveCamera();
		env.camera.far = 100000;

		// Setup scene
		env.scene = new THREE.Scene();

		// Setup renderer
		env.renderer = new THREE.WebGLRenderer({
				antialias: true
			});
		env.domNode.appendChild(env.renderer.domElement);

		//init domEnvents
		env.domEvents = mDomEvents = new THREEx.DomEvents(env.camera, env.renderer.domElement)

			// Add camera interaction


		env.controls = new TrackballControls(env.camera, env.renderer.domElement);
		env.controls.rotateSpeed = 0.3

			env.initialised = true;

			
			
			function _updateFromVisibleNodes() {

				GUI.updateFromVisibleNodes(env.currentNodesVisible)

			}
			
		var throttled_GUI_updateFromVisibleNodes = _.throttle(_updateFromVisibleNodes, 300)

		function _Node_Texts() {

				if (env.tn && env.useNodeTextFeature)
					env.tn.update();

				if (env.tn && !env.useNodeTextFeature)
					env.tn.remove();

				if (env.countryTextNodes && env.useNodeTextFeature && !env.demoDisabled)
					env.countryTextNodes.update();

				if (env.countryTextNodes && !env.useNodeTextFeature)
					env.countryTextNodes.remove();

			}
		
			var throttled_Node_Texts = _.throttle(_Node_Texts, 10)

			//used within utils too
			//FIXME this is only currently there for the search function to trigger text generation because the onComplete Mehthod might have a problem
		function updateTextWhenCameraIsMoving2() {
		console.error("!")
		setTimeout(function(){
			_updateFromVisibleNodes()
			
			_Node_Texts()	
				
			},600)
			

		}
		
		function updateTextWhenCameraIsMoving() {
		
			throttled_GUI_updateFromVisibleNodes()
			throttled_Node_Texts()
		}
		
		env.updateTextWhenCameraIsMoving = updateTextWhenCameraIsMoving
		env.updateTextWhenCameraIsMoving2 = updateTextWhenCameraIsMoving2

			env.controls.addEventListener("change", updateTextWhenCameraIsMoving)




        // Kick-off renderer

			var _____skipFrames = 0;
		(function animate() { // IIFE
			env.onFrame();

			// Frame cycle
			env.controls.update();



			if (env.nodeClouds && env.nodeClouds.raytracer)
				env.nodeClouds.raytracer.raycast(console.log)

				//skip onBeforeRenderFor NumberOfFrames
				_____skipFrames++

				if (window['globalNodes'])
					globalNodes.forEach((n) => n._bubble.material.visible = (_____skipFrames % 20) ? false : true)

					//TODO what we want here instead is, a probably already existsing list of sorted visible meshes
					// so we only have to determine which ones are nodes

					//if we can do this, we can skip the onBeforeRender stuff
					//also we can speed uo a lot of gui relevant code

					//the nodecounter gets filled by the meshes that trigger a onBeforeRender event if they are visible
					//TODO refactor ... bad practice though
					env._nodeCounter = []
					env.renderer.render(env.scene, env.camera);
			if (env._nodeCounter.length > 0)
				env.currentNodesVisible = env._nodeCounter

					if (env.nodeClouds)
						env.nodeClouds.updateCrossFade()

						requestAnimationFrame(animate);
		})()
	}

	//----------------------------------------
	function __digest() {


		if (!env.initialised) {
			return
		}
		
		console.log("digest")
		
		//remove previous text nodes
		if (env.textNode)
			env.textNode.empty()

			env.onFrame = () => {}; // Clear previous frame hook
		env.scene = new THREE.Scene(); // Clear the place

        var mNodes=_.extend({},env.graphData.nodes)


		// Build graph with data
		var d3Nodes = globalNodes = [];
		for (let nodeId in mNodes) { // Turn nodes into array
            const node = _.extend({},mNodes[nodeId]);
			//const node = env.graphData.nodes[nodeId];
			node._id = nodeId;
			d3Nodes.push(node);
		}

		if (!d3Nodes.length) {
			return;
		} //if no data is present return for now

//TODO
		var d3Links
		if (!env.useGroupFeature) {
			d3Links = globalLinks = env.graphData.links.map(link => {
					return {
						source: link[0],
						target: link[1]
					};
				});
		} else {

			//This is for the network/group part working
			d3Links = globalLinks = env.graphData.links.map(link => {
					return {
						source: mNodes[link[0]],
						target: mNodes[link[1]]
					};
				})

		}




		//---------------------
		//adding grouping feature

		env.digest = digest

			if (env.useGroupFeature) {

				if (!env.expand)
					env.expand = env.graphData.expand
						//env.expand={}

						env.net = network({
							nodes: globalNodes,
							links: globalLinks
						}, env.net, getGroup, env.expand);

				console.log("current visible network contains:", env.net.nodes.length, "nodes", env.net.links.length, "links", env.net)

				for (let node of env.net.nodes) {

					//create an id for the group node
					if (!node.id)
						node.id = "Group " + node.group

							if (typeof node.link_count == "number")
								node.isGroupNode = true
									var nodeinfo = node.nodes ? node.nodes.length + " nodes, " : ""
									node.info = nodeinfo + node.link_count + " edges"
				}

				var d3Links = globalLinks = env.net.links.map(link => {
						return {
							source: env.net.nodes[link.source],
							target: env.net.nodes[link.target]
						};
						//return { source: groupNodesByID["Group "+link.source], target: groupNodesByID["Group "+link.target] };
					});

				d3Nodes = globalNodes = env.net.nodes
					//d3Links=globalLinks=env.net.links
					//------------------------
			}

		function countVisibleNodes(node) {

			env._nodeCounter.push(node)

		}

		// Add WebGL objects
		d3Nodes.forEach(node => {

			node = nodeMixin(env, node, {
					onDrawNode: countVisibleNodes
				})
				node._bubble.name = env.nameAccessor(node) || '';

			//FIXME have a second scene atop the particle node and edges for easier interaction
			env.scene.add(node._bubble);

			let bubble,
			bubble_geometry;

			//TODO not highlighted group nodes should be rendered with separate point cloud
			if (node.isGroupNode) {

				//node.addClass("basic-sprite-collapsed")
				node.addClass("basic-ring")

				//node.on("mouseover",()=> node.addClass("basic-animated"))
				//node.on("mouseout",()=> node.removeClass("basic-animated"))
				node.on("mouseover", () => node.addClass("basic-ring-2"))
				node.on("mouseout", () => node.removeClass("basic-ring-2"))

			} else {

				//TODO specific renderings for node should be handled via class property at node data itself
				//NOTE: the default node/group nodes/links will be put inside a point  cloud for each so we woud need a point cloud for each 3d-class that generates a points object

				//node.addClass("basic-sphere")

				// nothing to begin with
				//node.addClass("basic-sprite")

			}

		});

		//-----------------------------------------------

		//init mesh for groupline
			 if (env.useLineGroup)
			 initLineGroup(env,{
				opacity:0.01,
				color:0x49616C,
				transparent: true,	
			})

			var linecount = 0;
		var skipLines = env.numSkipEdgesRendered + 1;
		if (skipLines < 1)
			skipLines = 1
			function shouldLineByVisible(link, id) {

				return !(linecount++ % skipLines)
			}

		//d3Links.forEach(link => {
		_.each(d3Links, (link, id) => {

			//FIXME ... if we... use an external heuristic to change visibility of lines
			/*
			graph.setEdgeVisMod(function(edge){})



			 */
			var bVisible = shouldLineByVisible()

				linkMixin(env, link, {
					lineIsVisible: bVisible,
					color: 0xff0000,
					opacity: 1
				})

				if (!env.useLineGroup && bVisible)
					env.scene.add(link._line);

		});

		env.camera.lookAt(env.scene.position);
		//env.camera.position.z = Math.cbrt(d3Nodes.length) * CAMERA_DISTANCE2NODES_FACTOR;
		env.camera.position.z = 5000;

		//----------------------------------------

		//demo impl of better/more performant nodes
		//add some color for now
		//globalNodes.forEach( function(v) { if (!v.size) v.size=_.random(1,20); if (!v.color) v.color=_.random(50,255)*_.random(50,255)*_.random(50,255) })

		//create the grouped pointclouds
		var nodeClouds = createParticleSystemsByGroupAttr(globalNodes);
		globalEnv.nodeClouds = nodeClouds;
		//add it to the scene
		var group = new THREE.Group;
		//group.position.x+=100
		globalEnv.scene.add(group);
		nodeClouds.attachTo(group);

		//----------------------

		
		function initRandomNodePositions(dimensions=3)
		{
		
				//test to init group positions
				for (gID of nodeClouds.groupIdList) {
					var x = _.random(-5000, 5000),
					y = dimensions>1? _.random(-5000, 5000):0,
					z = dimensions>2?_.random(-5000, 5000):0;
					for (node of nodeClouds.container[gID].nodes) {

						node.x = x + _.random(-100, 100);
						node.y = dimensions>1? y + _.random(-100, 100):0;
						node.z =  dimensions>2?z + _.random(-100, 100):0;

					}
				}
		
		}
		
		
		initRandomNodePositions(env.numDimensions)
		
		
		
		//-----------------
		//add raytracer
		//the raytracer is only necessary if the node mesh (node._bubble) isn't used
		/*	var pcs=_.map(globalEnv.nodeClouds.container,function(v){ return v.particles.pointCloud  })
		var cam=globalEnv.camera
		globalEnv.nodeClouds.raytracer=createParticleNodeGroupIntersectionHelper(pcs,cam)


		//TODO possible events ["click", "dblclick", "mouseover", "mouseout", "mousemove", "mousedown", "mouseup", "contextmenu", "touchstart", "touchend"]
		globalEnv.nodeClouds.raytracer.on("click dblclick mouseover mouseout",function(e,intersection,node){


		node.trigger(e.type,intersection,node)




		})
		 */

		if (!env.tn)
			env.tn = TextNodes(env, {
					maxVisibleCount: 10,
					onNodeText: function (node) {

						if (node.name)
							return node.name

							return node.id

					}
				})

			function _getNodePosition(node) {
				return node.particles.pointCloud.geometry.boundingSphere.center.clone()
			}

		if (!env.countryTextNodes)
			env.countryTextNodes = TextNodes(env, {
					maxVisibleCount: 50,
					maxDistance: 30000,
					minDistance: 3000,
					getNodes: function () {

						return _.map(globalEnv.nodeClouds.container, function (v, k) {
							return v
						}).filter(function (v, k) {
							return v.nodes.length > 10
						})

					},
					onNodeText: function (node) {

						return node.id

					},
					getCSSClasses: function () {
						return 'graph-country-caption'

					},
					getNodePosition: _getNodePosition,
					interactable: true,
					onAfterCreateTextField: function (node, el) {

						var newSize = 12 + Math.ceil(Math.log2(node.nodes.length) - 5);

						newSize = _.round(newSize / 12, 3) + "em";

						el.css("font-size", newSize);

						el.on("click", function () {
							doZoomToPos(_getNodePosition(node))
						})

					}
				})

		
				
				// Add force-directed layout
				const layout = env.layout = d3_force.forceSimulation();

		//in case the data contains an initial alpha value we'll use that one
		if (typeof env.graphData.alpha == "number")
			layout.alpha(env.graphData.alpha)

			layout
			.numDimensions(env.numDimensions)
			.nodes(d3Nodes)
			.force('link', d3_force.forceLink().id(function (d) {
					return d._id
				}).distance(computeLinkDistance).links(d3Links))
			.force("collide", d3_force.forceCollide(60).iterations(1))
			//.force('charge', d3_force.forceManyBody())
			.force('charge', function (node) {

				return -300

			})
			.force('linkStrength', function (link) {

				return 1

			})

			//.force('gravity',function(){ return 0})
			//.force('charge',function(){ return 0})

			//.force('center', d3_force.forceCenter())

			.stop();

		//nodes are prepared by previous step for further altering
		extendGraphElements(d3Nodes, d3Links, env)

		//
		handleConvexHullFeature()

		for (let i = 0; i < env.initialEngineTicks; i++) {
			layout.tick();
		} // Initial ticks before starting to render


		
		//hide text overlay and show after layout finishes
		env.textNode.hide()
		layout.on("tick", function () {

			layoutTick(layout, d3Nodes, d3Links)
		}).on('end', function () {
			// Run this when the layout has finished!
			console.log("rendering graph finished.. use 'ctrl+s' to download result ")

			//set link positions for final node/link positions
			d3Links.forEach(link => {

				link.setStartEnd(link.source, link.target)

			});

		
			//trigger coloring //TODO this should be done earlier
			$(".cloudNodeColorSelect").val("group").trigger("change")

			//set update the cloud to be able to use it for text positioning
			if (env.nodeClouds)
				env.nodeClouds.updateBoundingSpheres();

			//start the node particle effect
				setTimeout(function () {


						//FIXME see flickering bug
                    //	if (env.particles)
						//env.particles.start()

				}, 1000)

			//set the text labels to the correct positions
			
			env.updateTextWhenCameraIsMoving()	
			env.textNode.fadeIn(200)	
				
				//createCloudCenterSphereForGroupsByID()
				//globalEnv.particles.pointCloud.visible=false;setVisibleGroups(null,false);setVisibleGroups(["United States"],true);createCloudCenterSphereForGroups(["United States"])

		}).restart();

		//
		initDotParticles()

	}

	//----------------------------------------
	//----------------------------------------
	//----------------------------------------


	function computeLinkDistance(l, i) {

		var n1 = l.source,
		n2 = l.target;
		// larger distance for bigger groups:
		// both between single nodes and _other_ groups (where size of own node group still counts),
		// and between two group nodes.
		//
		// reduce distance for groups with very few outer links,
		// again both in expanded and grouped form, i.e. between individual nodes of a group and
		// nodes of another group or other group node or between two group nodes.
		//
		// The latter was done to keep the single-link groups ('blue', rose, ...) close.

		if (globalEnv.graphData.hasCountryGroups) {
			if (n1.group && n2.group && n1.group != n2.group)
				//return 2500 + (mGraph.dist.getDistance(n1.group, n2.group)|| 2000) //*2/3
				return 1500 // + mGraph.dist.getDistance(n1.group, n2.group) //*2/3
				else
					return 50 //50
		}

		//if (n1.group == n2.group) return 100
		//if (n1.group != n2.group) return 4000


		var groupDataSize1 = (n1.group_data && n1.group_data.size ? n1.group_data.size : 0)
		var groupDataSize2 = (n2.group_data && n2.group_data.size ? n2.group_data.size : 0)
		//var groupDataSize1=(n1.group_data)?n1.size*2:0
		//var groupDataSize2=(n2.group_data)?n2.size*2:0


		var groupDataLS1 = (n1.group_data && n1.group_data.link_count ? n1.group_data.link_count : 0)
		var groupDataLS2 = (n2.group_data && n2.group_data.link_count ? n2.group_data.link_count : 0)

		var scale = 2
			return scale * 60 +
			Math.min(20 * Math.min((n1.size || (n1.group != n2.group ? groupDataSize1 : 0)),
					(n2.size || (n1.group != n2.group ? groupDataSize2 : 0))),
				-30 +
				30 * Math.min((n1.link_count || (n1.group != n2.group ? groupDataLS1 : 0)),
					(n2.link_count || (n1.group != n2.group ? groupDataLS2 : 0))),
				150);

	}

	//---------------------------------------

	function handleConvexHullFeature() {

		//add/update hull meshes
		if (env.convexHullFeature == "simple")
			setTimeout(function () {

				updateHullsForExpandedGroups(globalNodes, env.expand, env.scene, env)

			}, 500);
		else if (env.convexHullFeature == "advanced") {

			multiHullTestCase()

		}

	}

	//---------------------------------------
	let cntTicks = 0;
	const startTickTime = new Date();
	function layoutTick(layout, d3Nodes, d3Links) {

		//console.error("tick tack", new Date() - startTickTime)

		if (cntTicks++ > env.maxConvergeFrames || (new Date()) - startTickTime > env.maxConvergeTime) {
			layout.alpha(0); //trigger end
			layout.stop(); // Stop ticking graph
		}

		// Update nodes position

		//TODO remove this when particle node groups work with picking and selecting
		d3Nodes.forEach(node => {

			const sphere = node._bubble;
			sphere.position.x = node.x;
			sphere.position.y = node.y || 0;
			sphere.position.z = node.z || 0;

		});

		env.nodeClouds.update()

		//todo animationg this will currently not work
		/*	// Update links position
		d3Links.forEach(link => {

		link.setStartEnd(link.source, link.target)

		});

		 */

	}

	//---------------------------------------

	function resizeCanvas() {
		if (env.width && env.height && env.renderer) {
			env.renderer.setSize(env.width, env.height);
			env.camera.aspect = env.width / env.height;
			env.camera.updateProjectionMatrix();
		}
	}

	//---------------------------------------

	//create/update particleSystem (little dots inside nodes)
	//potentially add them at specific time
	function initDotParticles() {
		var demoOptions = {}

		if (!globalNodes[0].nodes) //FIXME this only works that way because to realData is not generated properly
			demoOptions.npc = function (n) {

				return n.itemCount
				//return 5
			}

		if (env.particles)
			env.particles.remove();
		var particles = createParticleSystemForNodes(globalNodes, demoOptions);
		env.scene.add(particles.pointCloud);

		//FIXME currently does not animate
		//particles.start()

		env.particles = particles;
	}

	//----------------------------------------

	function initTextNodeContainer(nodeElement) {

		//add container for text elements
		if ($(nodeElement).parent().children(".textElements").length == 0) {
			var textElementsContainer = $("<div>").addClass("textElements").css({
					width: "100%",
					height: "100%",
					top: 0,
					left: 0,
					overflow: "hidden",
					position: "absolute",
					"pointer-events": "none"
				})
				env.textNode = textElementsContainer;
			$(nodeElement).parent().append(textElementsContainer)

		}
	}

	//----------------------------------------

	var initialisedLineGroup = false
		var line_geom = new THREE.Geometry();
	var lineMaterial
	var mergedLineMesh
	function initLineGroup(env, options) {
		if (initialisedLineGroup)
		{
			
			
			if (env.useLineGroup)
			env.scene.add(mergedLineMesh);
			//if (env.useLineGroup)
		/*		
			if (mergedLineMesh)
			{
				
				
			env.scene.remove(mergedLineMesh);	
			 mergedLineMesh.material.dispose();
				mergedLineMesh.geometry.dispose();
			}*/
			return
			}
		
		

			defaults = {
				opacity: 0.01,
				transparent: true,
				//lineIsVisible:true, // if disabled the line won't be shown on the scene
				color: 0xffffff
			}

		options = _.extend(defaults, options)

			lineMaterial = new THREE.MeshBasicMaterial({
				color: options.color,
				transparent: options.transparent,
				opacity: options.opacity,
				depthTest: false,
				depthWrite: false
			});

		/*var material = new THREE.MeshBasicMaterial( {color: 0xffff00,wireframe:true,visible:true,opacity:env.useDebugSphere?1:0,transparent:true ,
		alphaTest: 1
		//blending:THREE.SubtractiveBlending
		//depthTest:      false, //	depthTest:      false,
		//						depthWrite: false

		} );*/

		lineMaterial.opacity = env.lineOpacity;
		mergedLineMesh = new THREE.Line(line_geom, lineMaterial, THREE.LineSegments);

		mergedLineMesh.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3, 50000);

		//TODO

		env.lineMesh = mergedLineMesh;

		//mergedLineMesh.visible=false


		if (env.useLineGroup)
			env.scene.add(mergedLineMesh);

		env.mergedLineMesh = mergedLineMesh;

		initialisedLineGroup = true;

	}

	//------------------------------------------

	// Component constructor
	function chart(nodeElement) {
		env.domNode = nodeElement;
		env._nodeCounter = []
		env.currentNodesVisible = []
		initTextNodeContainer(nodeElement)

		initStatic();

		digest();

		resizeCanvas();

		return chart;
	}

	//----------------------------------------
	// Getter/setter methods
	exposeProps.forEach(prop => {
		chart[prop.name] = getSetEnv(prop.name, prop.redigest, prop.onChange);
		env[prop.name] = prop.initVal;
		prop.onChange(prop.initVal);

		function getSetEnv(prop, redigest = false, onChange = newVal => {}) {
			return _ => {
				if (!arguments.length) {
					return env[prop]
				}
				env[prop] = _;
				onChange(_);
				if (redigest) {
					digest()
				
				}
				return chart;
			}
		}
	});

	// Reset to default state
	chart.resetState = function () {

		this.graphData({
			nodes: [],
			links: []
		})
		.nodeRelSize(4)
		.lineOpacity(0.1)
		.valAccessor(node => node.val)
		.nameAccessor(node => node.name)
		.colorAccessor(node => node.color)
		.shapeAccessor(node => node.shape)
		.groupAccessor(node => node.group)
		.initialEngineTicks(0) //TODO fiddle with values to find a nice approximation for different graphs
		.maxConvergeTime(7500) // ms
		.maxConvergeFrames(150);

		env.expand = undefined;
		env.net = undefined;

		return this;
	};

	chart.env = env;

	chart.resetState(); // Set defaults at instantiation

	return chart;
}
