
//todo bounding sphere => sprite
/*
pc=globalEnv.nodeClouds.container["Germany"].particles.pointCloud
bs=pc.geometry.boundingSphere;
var geometry = new THREE.SphereGeometry(1, 50, 50, 0, Math.PI * 2, 0, Math.PI * 2);
var material = new THREE.MeshNormalMaterial();
var cube = new THREE.Mesh(geometry, material); globalEnv.scene.add(cube);
cube.scale.setScalar(bs.radius);cube.position.copy(bs.center)
 */

//onBeforeRender for ppointclouds => opacity: distance bbox,camera
//onBeforeRender for pointcloudcentermeshes => opacity: distance bbox,camera

//TODO how to hide particles inside of node rendered when further away






//-------------------------------------
//helper for text nodes and hull
function getCenterOfMass(pointCloud) {
		var positions = pointCloud.geometry.attributes.position
			var sizes = pointCloud.geometry.attributes.size

			var tx = 0,
		ty = 0,
		tz = 0
			var totalmass = 0; // += n.mass
		for (let i = 0; i < positions.count; i++) {

			var mSize = sizes.array[i]
				totalmass += mSize
				tx += positions.array[i * 3 + 0] * mSize
				ty += positions.array[i * 3 + 1] * mSize
				tz += positions.array[i * 3 + 2] * mSize
		}

		return new THREE.Vector3(tx / totalmass, ty / totalmass, tz / totalmass)

	}


//-------------------------------------
function createCloudCenterSphereForGroupsByID(groupIDsToSet) {

	var allGroupIDs = globalEnv.nodeClouds.groupIdList
		if (!groupIDsToSet)
			groupIDsToSet = allGroupIDs

				var container = []
				for (var gID of groupIDsToSet) {

					var c = globalEnv.nodeClouds.container[gID]
						if (c && c.particles.pointCloud)
							container.push(c.particles.pointCloud)

				}

				createCloudCenterSphereForPointClouds(container, function (mMesh) {

					globalEnv.scene.add(cube);

				})

}

function createCloudCenterSphereForPointClouds(pointclouds, nodeCreatedCallback) {

	var env = globalEnv

		//for group /cluster helper
	function calcOpacity() {

		var mMesh = this
			//var bs=mMesh.geometry.boundingSphere

			var point1 = new THREE.Vector3;
		point1.setFromMatrixPosition(env.camera.matrixWorld)
		var point2 = mMesh.position //bs.center


			var distance = point1.distanceTo(point2);

		var opacity

		opacity = distance / (mMesh.scale.x * 10) //bs.radius

			if (opacity > 0.5)
				opacity = 0.5
					if (opacity < 0.01)
						opacity = 0

							//console.log(opacity)

							mMesh.material.opacity = opacity

	}
	//-------------------------------------
	//create the helper structure that gets rendered instead of the node cloud if the threshold is to high
	function createElem(pointCloud) {

		var pc = pointCloud
			var bs = pc.geometry.boundingSphere;
		var geometry = new THREE.SphereGeometry(1, 20, 20, 0, Math.PI * 2, 0, Math.PI * 2);

		var material = new THREE.MeshNormalMaterial({
				transparent: true,
				opacity: 0.1,
				side: THREE.BackSide
			});
		var cube = new THREE.Mesh(geometry, material);
		cube.scale.setScalar(bs.radius / 20);

		//cube.position.copy(bs.center)

		var mCenter = getCenterOfMass(pc)
			cube.position.copy(mCenter)

			//cube.onBeforeRender=calcOpacity

			nodeCreatedCallback(cube)

	}

	

	var delay = 0
		for (var pc of pointclouds) {

			_.delay(createElem, delay, pc);
			delay += 10

		}

}

function setVisibleGroups(groupIDsToSet, visState) {
	var allGroupIDs = globalEnv.nodeClouds.groupIdList
		if (!groupIDsToSet)
			groupIDsToSet = allGroupIDs

				for (gID of groupIDsToSet) {

					var pc = globalEnv.nodeClouds.container[gID].particles.pointCloud
						pc.visible = visState

				}

}

/**
 **	use for group of nodes that share some similarities (nCountry <= company)
 *	this approach does not allow for adding removing nodes use multiple ParticleNodeGroups to mimic add/remove/show/hide
 */

function ParticleNodeGroup(nodes, options) {

	options = _.extend({
			hullMinDistanceVisible: 3 * 1000,
			nodeMaxDistanceVisible: 3 * 1500, //cross fade options
			nodeDefaultSize: 10,
			nodeDefaultScale: 1,
			nodeTexture: "img/dot7.png",
			baseColor: 0xFFFFFF,
			baseOpacity: 1.4
		}, options)

	function getParticleShaderMaterial2() {
		var vertexShader = `
									
									attribute float size;
									attribute vec3 customColor;
									varying vec3 vColor;

									void main() {

										vColor = customColor;

										vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

										gl_PointSize = size * ( 300.0 / length( mvPosition.xyz ) );

										gl_Position = projectionMatrix * mvPosition;

									}
							`;

		var fragmentShader = `
									uniform float opacity;
									uniform vec3 color;
									uniform sampler2D texture;

									varying vec3 vColor;

									void main() {

										gl_FragColor = vec4( color * vColor, opacity );

										gl_FragColor = gl_FragColor * texture2D( texture, gl_PointCoord );
									}
							`;

		var uniforms = {

			color: {
				type: "c",
				value: new THREE.Color(options.baseColor)
			},
			opacity: {
				type: "f",
				value: 1.0
			},
			texture: {
				type: "t",
				value: new THREE.TextureLoader().load(options.nodeTexture)
			}

		};

		var shaderMaterial = new THREE.ShaderMaterial({

				uniforms: uniforms,
				// attributes:     attributes,
				vertexShader: vertexShader,
				fragmentShader: fragmentShader,

				blending: THREE.AdditiveBlending,

				depthTest: true,
				depthWrite: false,
				transparent: true
			});

		return shaderMaterial
	}

	var shaderMaterial = getParticleShaderMaterial2()

		var nCount = nodes.length

		var positions = new Float32Array(nCount * 3);

	var values_color = new Float32Array(nCount * 3);
	var values_size = new Float32Array(nCount);
	var geometry = new THREE.BufferGeometry();

	geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
	geometry.addAttribute('customColor', new THREE.BufferAttribute(values_color, 3));
	geometry.addAttribute('size', new THREE.BufferAttribute(values_size, 1));

	var particleSystem = new THREE.Points(geometry, shaderMaterial);
	//added to be able to retrieve the original node from the point within the raycaster code
	particleSystem.srcNodes = nodes
		particleSystem.frustrumCulled = true;

	//for now just have a huge bounding volume //TODO recalc sphere every nowad then
	particleSystem.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3, 50000);

	for (let i = 0; i < nCount; i++)
		updateNode(i)

		function updateNode(i) {
			updateNodePosition(i)
			updateNodeColor(i)
			updateNodeSize(i)

		}

	function updateNodePosition(i) {
		//updates the current nodes properties

		var positions = geometry.attributes.position.array;

		positions[i * 3] = nodes[i].x
			positions[i * 3 + 1] = nodes[i].y
			positions[i * 3 + 2] = nodes[i].z

			geometry.attributes.position.needsUpdate = true;

	}

	function updateNodeColor(i) {
		var colors = geometry.attributes.customColor.array;

		var color = (typeof nodes[i].color == "number") ? new THREE.Color(nodes[i].color) : new THREE.Color(0xffffff);

		colors[i * 3 + 0] = color.r;
		colors[i * 3 + 1] = color.g;
		colors[i * 3 + 2] = color.b;

		geometry.attributes.customColor.needsUpdate = true;
	}

	function updateNodeSize(i) {
		var sizes = geometry.attributes.size.array;
		if (typeof nodes[i].size == "number")
			sizes[i] = nodes[i].size * options.nodeDefaultScale;
		else
			sizes[i] = options.nodeDefaultSize * options.nodeDefaultScale

				geometry.attributes.size.needsUpdate = true;

	}

	function checkHull(pointCloud, distance, opacity) {

		//FIXME if generated check if the bbox mass center has changed recently


		//TODO calc real opacity with cross fade
		function update(hull) {

			//calcOpacity.apply(hull)

			//return
			var mat = hull.material
				mat.opacity = (1 - opacity) / 5

				var newHullVis = hull.material.opacity > 0 //(distance<maxDistance)
				if (mat.visible && !newHullVis) {
					console.log("pc hull hidden")
				}
				if (!mat.visible && newHullVis) {
					console.log("pc hull shown")
				}
				hull.visible = newHullVis

		}

		//generate a hull on the fly

		if (distance > options.hullMinDistanceVisible) //partially lazy init	for elements
		{
			if (!pointCloud.hasHull) {
				pointCloud.hasHull = true //prevent  multi async calls
					createCloudCenterSphereForPointClouds([pointCloud], function (mMesh) {

						globalEnv.scene.add(mMesh);

						pointCloud.mHull = mMesh

							update(pointCloud.mHull)

					})

			} else if (pointCloud.mHull)
				update(pointCloud.mHull)

		} else
			if (distance <= options.hullMinDistanceVisible) {
				if (pointCloud.mHull)
					update(pointCloud.mHull)
			}

	}

	function updateCloudOpacityBasedOnDistance() {
		//FIXME refactor? and fix opa


		var maxDistance = options.nodeMaxDistanceVisible //opacity==0 visible == false
			var env = globalEnv //TODO


			if (!particleSystem.geometry.boundingSphere)
				return 1

				var point1 = env.camera.position
					var point2 = particleSystem.geometry.boundingSphere.center //TODO getCenterOfMass .. would be better but is generated to often


					var distance = point1.distanceTo(point2);

			//set opacity based on distance
			mat = particleSystem.material;

		var newVis = (distance < maxDistance)

		//if (mat.visible && !newVis) {  console.log("pc hidden")	}
		//if (!mat.visible && newVis){   console.log("pc shown")}

		var newOpacity = 1.0 - (distance / maxDistance)

			if (newOpacity < 0)
				newOpacity = 0.0
					if (newOpacity > 1)
						newOpacity = 1.0

							//mat.visible=newVis
							//mat.uniforms.opacity.value=newOpacity


							//TODO apply if other things are working .. wee need the dots for now to  be able to see proper placement
							//besides that its working as intended


							mat.uniforms.opacity.value = options.baseOpacity
							mat.visible = true

							//return  	newOpacity//
							//checkHull(particleSystem,distance,newOpacity)

							return newOpacity

	}

	return {
		nodes: nodes,
		pointCloud: particleSystem,
		updateCrossFade: updateCloudOpacityBasedOnDistance,
		update: function () {

			//update node attrs
			for (let i = 0; i < nCount; i++)
				updateNode(i)

		},
		updateNode: updateNode,
		updateNodePosition: updateNodePosition,
		updateNodeColor: updateNodeColor,
		updateNodeSize: updateNodeSize,
		on: function () {
			console.log("TODO implement click/hover etc")

		},
		remove: function () {

			if (particleSystem.geometry)
				particleSystem.geometry.dispose();
			if (particleSystem.material)
				particleSystem.material.dispose();

			delete (particleSystem);

			if (particleSystem.parent)
				particleSystem.parent.remove(particleSystem)

		}
	}

}

/**
 *
 * primary function to create separate groups of particle systems by using the "group" attribute of a node
 *
 * this is the default implementation, it will be replaced by the NoeContainer which can have several sub clusters defined instead of only using the group attribute
 *
 */

function createParticleSystemsByGroupAttr(allNodes, options) {

	options = _.extend({
			minGroupSize: 40
		}, options)

		var groupContainer = {}
	var groupIDs = allNodes.map((v) => v.group);
	groupIDs = _.uniq(groupIDs)

		for (var id of groupIDs) {
			var nodes = globalNodes.filter((v) => v.group == id)

				var elem = ParticleNodeGroup(nodes, {
					nodeDefaultSize: 10,
					nodeDefaultScale: 10,
					nodeTexture: "img/dot7.png"
				})

				groupContainer["" + id] = {
				nodes: nodes,
				particles: elem,
				id: id
			}

		}

	function update() {

		_.each(groupContainer, function (el) {
			el.particles.update()
		})

	}

	function updateCrossFade() {

		_.each(groupContainer, function (el) {
			el.particles.updateCrossFade()
		})

	}

	function attachTo(object3d) {

		for (id of groupIDs) {

			object3d.add(groupContainer[id].particles.pointCloud)

		}

	}

	function detach() {

		for (id of groupIDs) {
			var pc = groupContainer[id].particles.pointCloud
				if (pc.parent)
					pc.parent.remove(pc)

		}

	}

	function updateBoundingSpheres() {

		for (id of groupIDs) {
			//var pc = groupContainer[id].particles.pointCloud.geometry.computeBoundingSphere()
		var pc = groupContainer[id].particles.pointCloud;
		
		var centerPos=getCenterOfMass(pc)
		
		pc.geometry.computeBoundingSphere()
		pc.geometry.boundingSphere.center.copy(centerPos)	
		
		
		}

	}

	return {
		container: groupContainer,
		groupIdList: groupIDs,
		update,
		updateCrossFade,
		attachTo,
		detach,
		updateBoundingSpheres
	}

}

/*
//test stuff a little bit
function demo(){

globalNodes.forEach( function(v) { v.size=_.random(1,20); v.color=_.random(50,255)*_.random(50,255)*_.random(50,255) })


var groupParticleSystems=createParticleSystemsByGroupAttr(globalNodes)


var group=new THREE.Group
group.position.x+=100
globalEnv.scene.add(group)
groupParticleSystems.attachTo(group)



setInterval( function(){


var n=globalNodes[_.random(0,globalNodes.length-1)]

n.color=_.random(50,255)*_.random(50,255)*_.random(50,255)

groupParticleSystems.update()

},100)



}
 */


/**
 *
 * this is a custom implementation for the raytracer of the point cloud
 * NOTE: currently it is not used because the nodes are handled partially as empty meshes
 * so the default threex.domEvents library can be used instead of the current work around
 *
 * @param pointclouds
 * @param camera
 * @returns {{raycast: raycast, on}}
 */


function createParticleNodeGroupIntersectionHelper(pointclouds, camera) {

	if (!pointclouds)
		throw new Error("needs THREE.Points array")
		if (!camera)
			throw new Error("needs THREE.Camera object")

			var mouse = new THREE.Vector2();
	function onDocumentMouseMove(event) {
		event.preventDefault();
		mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
		mouse.y =  - (event.clientY / window.innerHeight) * 2 + 1;
	}
	document.addEventListener('mousemove', onDocumentMouseMove, false);

	var lastClick = 0;
	function onDocumentMouseClick() {

		lastClick = Date.now()

	}
	document.addEventListener('click', onDocumentMouseClick, false);

	var lastDblClick = 0;
	function onDocumentMouseDblClick() {

		lastDblClick = Date.now()

	}
	document.addEventListener('click', onDocumentMouseDblClick, false);

	//-----------------------------
	var threshold = 20;

	var raycaster = new THREE.Raycaster();
	raycaster.params.Points.threshold = threshold;

	var eventList = $({})
		var lastIntersectedNode;

	function raycast() {
		raycaster.setFromCamera(mouse, camera);
		var intersections = raycaster.intersectObjects(pointclouds);
		var intersection = (intersections.length) > 0 ? intersections[0] : null;
		if (intersection !== null) {

			var intersectedNode = intersection.object.srcNodes[intersection.index]

				eventList.trigger("mouseover", [intersection, intersectedNode, intersections])

				if (lastIntersectedNode && lastIntersectedNode != intersectedNode)
					eventList.trigger("mouseout", [intersection, lastIntersectedNode, intersections])

					if (Date.now() - lastClick < 50)
						eventList.trigger("click", [intersection, intersectedNode, intersections])

						if (Date.now() - lastDblClick < 50)
							eventList.trigger("dblclick", [intersection, intersectedNode, intersections])

							lastIntersectedNode = intersectedNode
		} else
			if (lastIntersectedNode)
				eventList.trigger("mouseout", [intersection, lastIntersectedNode, intersections])

	}

	return {
		raycast,
		on: eventList.on.bind(eventList)
	}
}
