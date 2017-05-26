/**
 * SmoothConvexHullGeometry
 * @author frank1147
 * 
 * a more advanced approach to generate a hull geometry around a set of vertices/points
 * require: ConvexHullGrahamScan, ConvexGeometry
 *
 * 
	TODO optimise performance
	-remove unnecessary calls and updates

 */


/*

-all possible points eg. of group
- get hull points
- get hull/shape points from current camera position

example
SmoothHull(globalNodes.filter((v) =>v.group==2 )).getMesh()



 */
function SmoothHull(points, options) {
	var defaults = {
		showHull: false,
		showBorder: true,
		showShape: true,
		showMeshLine: false,
		hullColor: 0x444444,
		borderColor: 0xffffff,
		borderSrc:'img/stroke.png',
		hullPointCount:25,
		hullScaleFactor:1.4
	}
	options = _.extend({}, defaults, options)

		var nodes =[]
		//------------------------------------------
		function _addNodes(points){
		
		var newNodes=points.map( (v) => new THREE.Vector3(v.x, v.y, v.z) )
			
		nodes=nodes.concat(newNodes)
					
		}
		
		//------------------------------------------

		/**

		create 3d shape from 3d points which will function as a overlay

		NOTE:using the 2d overlay instead of the 3d hull should improve geometry and allow us to scale shape and use SubdivisionModifier
		previousHullPoints (Vector3) are to comare next iteration of hull vs previous one to stop

		 */

		function generateShapeGeometryHelper(nodes, previousHullPoints) {


					
				//compare to previous points //if both arrays are equal return false
				function hullNeedsUpdate(hullPoints, previousHullPoints) {
					if (!previousHullPoints)
						return true

						if (hullPoints.length == previousHullPoints.length) {
							for (p of hullPoints) {
								if (previousHullPoints.indexOf(p) >= 0)
									return true
							}
						}

					return false
				}

			//next we'll use a convex hull algorithm for a 3d hull
			//by projecting the 3d points into screen space
			var convexHull = new ConvexHullGrahamScan();
			for (n of nodes)
				convexHull.addPoint3d(n, globalEnv.camera);
			
			var hullPoints = convexHull.getHull();

			//from the previous calculated 3d points we now 
			//retrieve the 3d original points
			hullPoints = hullPoints.map((v) => v.orig)

				//compare to previous points 
				//if both arrays are equal return false

				if (!hullNeedsUpdate(hullPoints, previousHullPoints)) {
					return false
				}

				//Create a closed wavey loop
				var curve = new THREE.CatmullRomCurve3(hullPoints);
				curve.closed = true
				//curve.type="catmullrom"
				var curvePoints = curve.getPoints(options.hullPointCount);

				var shapeGeometry = new THREE.ConvexGeometry(curvePoints);

				var borderGeometry = new THREE.Geometry();
				borderGeometry.vertices = curvePoints;

			return {
				shape: shapeGeometry,
				border: borderGeometry,
				points: curvePoints,
				hull: function () {

					var geo = new THREE.Geometry();
					geo.vertices = hullPoints.concat([hullPoints[0]]);
					return geo

				}
			}

		}


		//------------------------------------------
		
		
		_addNodes(points)
		
		
	var mGroup,	frameID;
	
	//TODO after refactoring into a THREE.Group? it should retrieve the parent itself 
	var mScene = globalEnv.scene

		var preHullNodes;

	var loader = new THREE.TextureLoader();
	var strokeTexture;
	loader.load(options.borderSrc, function (texture) {
		strokeTexture = texture;
		strokeTexture.wrapS = strokeTexture.wrapT = THREE.RepeatWrapping;

	});

	return {
		addNodes:_addNodes,
		clean: function () {

			if (!mGroup)
				return

				var children = mGroup.children
					for (var j = 0; j < children.length; j++) {
						if (children[j].geometry)
							children[j].geometry.dispose();
						if (children[j].material)
							children[j].material.dispose(); //don't know if you need these, even
						children[j] = undefined; //or
						delete (children[j]);

					}

					mScene.remove(mGroup)

					mGroup = undefined; //or some other value
		},
		start: function () {
			var self = this
				this.stop()

			function animate(time = 0) {

				frameID = requestAnimationFrame(animate);

				var helper = generateShapeGeometryHelper(nodes)

					if (helper == false)
						return

						//remove previous generated elements
						self.clean()
						
						mGroup = new THREE.Group

							if (options.showShape) {
								//create the area-mesh
								var mMaterial = new THREE.MeshBasicMaterial({
										depthTest: false,
										depthWrite: false,
										transparent: true,
										opacity: 0.3,
										wireframe: false,
										color: options.hullColor
									})
									var mMesh = new THREE.Mesh(helper.shape, mMaterial);
								
								var offset=mMesh.geometry.center()	
								mMesh.position.copy(offset.multiplyScalar(-1))	
								mMesh.scale.multiplyScalar(options.hullScaleFactor)
								
								
								mGroup.add(mMesh)
							}

							if (options.showHull) {
								//create a  line of the hull points itself
								var material = new THREE.LineBasicMaterial({
										color: 0x00ff00
									});
								var hullGeometry = helper.hull()


									var hullObj = new THREE.Line(hullGeometry, material);
								mGroup.add(hullObj)
							}

							if (options.showBorder) {
								//create a border line
								var material = new THREE.LineBasicMaterial({
											transparent: true,
											opacity: 0.5,
											color: new THREE.Color(options.borderColor)
									});
								var curveObject = new THREE.Line(helper.border, material);
								
								
									var offset=curveObject.geometry.center()	
								curveObject.position.copy(offset.multiplyScalar(-1))	
								curveObject.scale.multiplyScalar(options.hullScaleFactor)
								
								
								mGroup.add(curveObject)
							}

							if (options.showMeshLine) {

								//create meshline for better border

								var line = new MeshLine();
								var textureOptions
								if (strokeTexture)
									textureOptions = {
										lineWidth: 5,
										useMap: 1,
										map: strokeTexture,
										//repeat: new THREE.Vector2( 1,2 ),
										depthTest: false,
										sizeAttenuation: true,
										blending: THREE.NormalBlending,
									}

								var material

								material = new MeshLineMaterial(_.extend({

											transparent: true,
											opacity: 0.5,
											color: new THREE.Color(options.borderColor)

										}, textureOptions));

								line.setGeometry(helper.border, function (p) {

									//var ratio=(srcWidth*p)+(dstWidth*(1-p))
									//return ratio  /10
									return 1
								})

								var lineMesh = new THREE.Mesh(line.geometry, material);
							
								var offset=lineMesh.geometry.center()	
								lineMesh.position.copy(offset.multiplyScalar(-1))	
								lineMesh.scale.multiplyScalar(options.hullScaleFactor)
								
								mGroup.add(lineMesh)

							}

							//TODO change => center-scale-reset center
							//var center=shapeGeometry.center()

							//TODO scale points
							//find approx. center of object
							//and scale accordingly

							/*
							box.center( mesh.position ); // this re-sets the mesh position
							mesh.position.multiplyScalar( - 1 );
							var pivot = new THREE.Group();
							scene.add( pivot );
							pivot.add( mesh );
							 */

							//FIXME apply correct perspective and position

							//mGroup.scale.set(1.5,1.5,1.5)

							//r=globalEnv.camera.rotation.toVector3();
							//mGroup.rotation.setFromVector3(r)

							mScene.add(mGroup)

			}

			frameID = requestAnimationFrame(animate)

		},
		stop: function () {

			cancelAnimationFrame(frameID)

			this.clean()

		}
	}
}

//test case of above 

var hulls = {}
function multiHullTestCase() {

	for (hull of Object.values(hulls)) {
		hull.stop()
	}
	hulls = {}

	/*hulls["all"] = SmoothHull(globalNodes, {
			showShape: true,
			showBorder: false,
			showMeshLine: true,
			showHull: true 
			//,hullColor:0x0000ff,borderColor:0x0000ff
		});
	*/
		
	var expandedGroupIDS = Object.keys(globalEnv.expand).map((val) => parseInt(val))

		for (groupID of expandedGroupIDS) {
			var groupNodes = globalNodes.filter((v) => v.group == groupID)

				hulls["" + groupID] = SmoothHull(groupNodes, {
					showShape: true,
					showBorder: true,
					showMeshLine: false,
					showHull: false
					//,
					//hullColor: 0x0000ff,
					//borderColor: 0xffff00
				});

		}

		for (hull of Object.values(hulls)) {
			hull.start()
		}

}
