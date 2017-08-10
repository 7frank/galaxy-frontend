

var lineGeometry, coneGeometry;

function arrowPart()
{
	/*
var points=[
	{"x":1.23,"y":1.07},
	{"x":-1.23,"y":-1.07},
	{"x":0.81,"y":0},
	{"x":1.23,"y":1.07},
	{"x":-1.23,"y":1.07},
	{"x":-0.81,"y":0},
	{"x":1.23,"y":-1.07}
	]
	*/
		
var points=[
	{"x":1.23,"y":1.07},
	{"x":-1.23,"y":-1.07},
	{"x":0.81,"y":0},
	{"x":1.23,"y":1.07},
	{"x":-1.23,"y":1.07},
	{"x":-0.81,"y":0},
	{"x":1.23,"y":-1.07}
	]
	
	
	var someShape = new THREE.Shape();

	someShape.fromPoints(points)
	

//var extrudeSettings = { amount: 8, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };
//var geometry = new THREE.ExtrudeGeometry( someShape, extrudeSettings );


return new THREE.ShapeGeometry(someShape)
}



function ArrowExt( dir, origin, length, color, headLength, headWidth ) {

	// dir is assumed to be normalized

	THREE.Object3D.call( this );

	if ( color === undefined ) color = 0xffff00;
	if ( length === undefined ) length = 1;
	if ( headLength === undefined ) headLength = 0.2 * length;
	if ( headWidth === undefined ) headWidth = 0.2 * headLength;

	if ( lineGeometry === undefined ) {

		lineGeometry = new THREE.BufferGeometry();
		lineGeometry.addAttribute( 'position', new THREE.Float32BufferAttribute( [ 0, 0, 0, 0, 1, 0 ], 3 ) );

		coneGeometry = new THREE.CylinderBufferGeometry( 0, 0.5, 1, 5, 1 );
		coneGeometry.translate( 0, - 0.5, 0 );

	}
	


	this.position.copy( origin );

	this.line = new THREE.Line( lineGeometry, new THREE.LineBasicMaterial( { color: color } ) );
	this.line.matrixAutoUpdate = false;
	this.add( this.line );

	this.cone = new THREE.Mesh( coneGeometry, new THREE.MeshBasicMaterial( { color: color } ) );
	this.cone.matrixAutoUpdate = false;
	this.add( this.cone );

	
	//line2
	this.line2 = new THREE.Line( lineGeometry, new THREE.LineBasicMaterial( { color: color } ) );
	this.line2.matrixAutoUpdate = false;
	this.add( this.line2 );
	
	
	//cone2 
	//this.cone2 = new THREE.Mesh( coneGeometry, new THREE.MeshBasicMaterial( { color: color } ) );
	
	
	//FIXME the arrow head should be as in the example given
	/*var cone2Mesh = new THREE.Mesh( arrowPart(), new THREE.MeshBasicMaterial( {wireframe:true, color: 0x0000ff }) );
	
		cone2Mesh.onBeforeRender=function( renderer, scene, camera, geometry, material, group ){
		
			this.rotation.setFromRotationMatrix( camera.matrix );

		}

	
	cone2Mesh.scale.set( 10,10,10);
	

	
	this.cone2=cone2Mesh
	*/
	this.cone2 = new THREE.Mesh( coneGeometry, new THREE.MeshBasicMaterial( { color: color } ) );
	
	
	
	this.cone2.matrixAutoUpdate = false;
	this.add( this.cone2 );
	
	
	
	//this.cone.visible=false
	//this.cone2.visible=false
	
	this.setDirection( dir );
	this.setLength( length, headLength, headWidth );

	//this.setColor(color)
	
}

ArrowExt.prototype = Object.create( THREE.Object3D.prototype );
ArrowExt.prototype.constructor = ArrowExt;

ArrowExt.prototype.setDirection = ( function () {

	var axis = new THREE.Vector3();
	var radians;
	return function setDirection( dir ) {
			this.mDirection=dir
			
		// dir is assumed to be normalized

		if ( dir.y > 0.99999 ) {

			this.quaternion.set( 0, 0, 0, 1 );

		} else if ( dir.y < - 0.99999 ) {

			this.quaternion.set( 1, 0, 0, 0 );

		} else {

			axis.set( dir.z, 0, - dir.x ).normalize();

			radians = Math.acos( dir.y );

			this.quaternion.setFromAxisAngle( axis, radians );

		}

	};

}() );

ArrowExt.prototype.setLength = function ( length, headLength, headWidth ) {

const freeCenterSpace=0.5 //pct of space in between both lines NOTE: is used to place the two arrow shapes


	if ( headLength === undefined ) headLength = 0.2 * length;
	if ( headWidth === undefined ) headWidth = 0.2 * headLength;

	this.line.scale.set( 1, Math.max( 0, length - headLength )/(2+freeCenterSpace*2), 1 );
	this.line.updateMatrix();
	
	//TODO fix actual position
	this.line2.position.y=length
	
	this.line2.scale.set( -1, Math.min( 0, (length - headLength)*-1 )/(2+freeCenterSpace*2), -1 );
	this.line2.updateMatrix();
	

	this.cone.scale.set( headWidth, headLength, headWidth );
	this.cone.position.y = length*0.55;
	this.cone.updateMatrix();
	
	
	this.cone2.scale.set( headWidth, headLength, headWidth );
	this.cone2.position.y = length*0.45;
	this.cone2.updateMatrix();

};

ArrowExt.prototype.setColor = function ( color ) {

	this.line.material.color.copy( color );
	this.cone.material.color.copy( color );
	
	this.line2.material.color.copy( 0x0000ff );
	this.cone2.material.color.copy( color );

};

