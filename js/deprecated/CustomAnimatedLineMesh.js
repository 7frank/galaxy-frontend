
function CustomSinCurve(scale) {

	THREE.Curve.call(this);

	this.scale = (scale === undefined) ? 1 : scale;

}

CustomSinCurve.prototype = Object.create(THREE.Curve.prototype);
CustomSinCurve.prototype.constructor = CustomSinCurve;

CustomSinCurve.prototype.getPoint = function (t) {

	//var tx = t * 3 - 1.5;
	//var ty = Math.sin( 2 * Math.PI * t );
	//var tz = 0;

	var tx = 0;
	var ty = t;
	var tz = 0;

	return new THREE.Vector3(tx, ty, tz).multiplyScalar(this.scale);

};

//------------------
var animatedLineGeometry, animatedLineTexture;
function CustomAnimatedLineMesh(direction, from, length = 1, color = 0xFFFFFF, radius = 1, textureSrc) {

	THREE.Object3D.call(this);

	if (animatedLineGeometry === undefined) {

		var path = new CustomSinCurve(1);
		var segments = 20,
		radiusSegments = 8;

		var geometry = new THREE.TubeGeometry(path, segments, radius, radiusSegments, false);

		animatedLineGeometry = geometry
		
		
		var texture = THREE.ImageUtils.loadTexture(textureSrc, {}, function () {
			texture.wrapS = THREE.RepeatWrapping;
			texture.wrapT = THREE.RepeatWrapping;

			animatedLineTexture = texture;

		})
		
		
		function animate(time=0) 
		{
			requestAnimationFrame( animate );
			texture.offset.x	-= 0.008;
			texture.offset.x	%= 1;
			texture.needsUpdate	= true;

			
		}
		requestAnimationFrame( animate )
		
	}



		var material = new THREE.MeshBasicMaterial({
			color: color,
			map: animatedLineTexture,
			transparent:true
		});
	this.line = new THREE.Mesh(animatedLineGeometry, material);
	this.line.matrixAutoUpdate = false;
	this.add(this.line);

	this.position.copy(from);

	this.setDirection(direction);
	this.setLength(length);

}

CustomAnimatedLineMesh.prototype = Object.create(THREE.Object3D.prototype);
CustomAnimatedLineMesh.prototype.constructor = CustomAnimatedLineMesh;

CustomAnimatedLineMesh.prototype.setDirection = (function () {

	var axis = new THREE.Vector3();
	var radians;

	return function setDirection(dir) {

		// dir is assumed to be normalized

		if (dir.y > 0.99999) {

			this.quaternion.set(0, 0, 0, 1);

		} else if (dir.y <  - 0.99999) {

			this.quaternion.set(1, 0, 0, 0);

		} else {

			axis.set(dir.z, 0,  - dir.x).normalize();

			radians = Math.acos(dir.y);

			this.quaternion.setFromAxisAngle(axis, radians);

		}

	};

}
	());

CustomAnimatedLineMesh.prototype.setLength = function (length, headLength, headWidth) {

	this.scale.set(1, length, 1);
	//this.line.updateMatrix();


};

CustomAnimatedLineMesh.prototype.setColor = function (color) {

	this.line.material.color.copy(color);

};
