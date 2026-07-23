/**
 *	@author zz85 / http://twitter.com/blurspline / http://www.lab4games.net/zz85/blog
 *
 *	A general purpose camera, for setting FOV, Lens Focal Length,
 *		and switching between perspective and orthographic views easily.
 *		Use this only if you do not wish to manage
 *		both a Orthographic and Perspective Camera
 *
 */

import {
	Camera,
	OrthographicCamera,
	PerspectiveCamera,
} from "three";

var RAD2DEG = 180 / Math.PI;


function CombinedCamera( width, height, fov, near, far, orthoNear, orthoFar ) {

	Camera.call( this );

	this.fov = fov;

	this.far = far;
	this.near = near;

	this.left = - width / 2;
	this.right = width / 2;
	this.top = height / 2;
	this.bottom = - height / 2;

	this.aspect =  width / height;
	this.zoom = 1;
	this.view = null;

	this.cameraO = new OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, 	orthoNear, orthoFar );
	this.cameraP = new PerspectiveCamera( fov, width / height, near, far );

	this.toPerspective();

}

CombinedCamera.prototype = Object.create( Camera.prototype );
CombinedCamera.prototype.constructor = CombinedCamera;

CombinedCamera.prototype.toPerspective = function () {

	this.near = this.cameraP.near;
	this.far = this.cameraP.far;

	this.cameraP.aspect = this.aspect;
	this.cameraP.fov =  this.fov / this.zoom ;
	this.cameraP.view = this.view;

	this.cameraP.updateProjectionMatrix();

	this.projectionMatrix = this.cameraP.projectionMatrix;

	this.inPerspectiveMode = true;
	this.inOrthographicMode = false;

	this.matrixWorldInverse = this.cameraP.matrixWorldInverse;
	this.matrixWorld = this.cameraP.matrixWorld;

};

CombinedCamera.prototype.toOrthographic = function () {

	var fov = this.fov;
	var aspect = this.cameraP.aspect;
	var near = this.cameraP.near;
	var far = this.cameraP.far;

	var hyperfocus = ( near + far ) / 2;

	var halfHeight = Math.tan( fov * Math.PI / 180 / 2 ) * hyperfocus;
	var halfWidth = halfHeight * aspect;

	halfHeight /= this.zoom;
	halfWidth /= this.zoom;

	this.cameraO.left = - halfWidth;
	this.cameraO.right = halfWidth;
	this.cameraO.top = halfHeight;
	this.cameraO.bottom = - halfHeight;
	this.cameraO.view = this.view;

	this.cameraO.updateProjectionMatrix();

	this.near = this.cameraO.near;
	this.far = this.cameraO.far;
	this.projectionMatrix = this.cameraO.projectionMatrix;

	this.inPerspectiveMode = false;
	this.inOrthographicMode = true;

	this.matrixWorldInverse = this.cameraO.matrixWorldInverse;
	this.matrixWorld = this.cameraO.matrixWorld;

};

CombinedCamera.prototype.copy = function ( source ) {

	Camera.prototype.copy.call( this, source );

	this.fov = source.fov;
	this.far = source.far;
	this.near = source.near;

	this.left = source.left;
	this.right = source.right;
	this.top = source.top;
	this.bottom = source.bottom;

	this.zoom = source.zoom;
	this.view = source.view === null ? null : Object.assign( {}, source.view );
	this.aspect = source.aspect;

	this.cameraO.copy( source.cameraO );
	this.cameraP.copy( source.cameraP );

	this.inOrthographicMode = source.inOrthographicMode;
	this.inPerspectiveMode = source.inPerspectiveMode;

	return this;

};

CombinedCamera.prototype.setViewOffset = function( fullWidth, fullHeight, x, y, width, height ) {

	this.view = {
		fullWidth: fullWidth,
		fullHeight: fullHeight,
		offsetX: x,
		offsetY: y,
		width: width,
		height: height
	};

	if ( this.inPerspectiveMode ) {

		this.aspect = fullWidth / fullHeight;

		this.toPerspective();

	} else {

		this.toOrthographic();

	}

};

CombinedCamera.prototype.clearViewOffset = function() {

	this.view = null;
	this.updateProjectionMatrix();

};

CombinedCamera.prototype.setSize = function( width, height ) {

	this.cameraP.aspect = this.aspect = width / height;
	this.left = - width / 2;
	this.right = width / 2;
	this.top = height / 2;
	this.bottom = - height / 2;

};

CombinedCamera.prototype.setFov = function( fov ) {

	this.fov = fov;

	this.update();

};

CombinedCamera.prototype.setFar = function( far ) {

	this.cameraP.far = this.far = far;
	this.cameraO.far = this.far = far;
	this.update();

};

CombinedCamera.prototype.setNear = function( near ) {

	this.cameraP.near = this.near = near;
	this.update();

};

CombinedCamera.prototype.update = function() {

	if ( this.inPerspectiveMode ) {

		this.toPerspective();

	} else {

		this.toOrthographic();

	}

};

CombinedCamera.prototype.updateProjectionMatrix = function() {

	if ( this.inPerspectiveMode ) {

		this.toPerspective();

	} else {

		this.toPerspective();
		this.toOrthographic();

	}

};

CombinedCamera.prototype.setLens = function ( focalLength, filmGauge ) {

	if ( filmGauge === undefined ) filmGauge = 35;

	var vExtentSlope = 0.5 * filmGauge /
			( focalLength * Math.max( this.cameraP.aspect, 1 ) );

	var fov = RAD2DEG * 2 * Math.atan( vExtentSlope );

	this.setFov( fov );

	return fov;

};

CombinedCamera.prototype.setZoom = function( zoom ) {

	this.zoom = zoom;
	this.update();

};

CombinedCamera.prototype.toFrontView = function() {

	this.rotation.x = 0;
	this.rotation.y = 0;
	this.rotation.z = 0;

};

CombinedCamera.prototype.toBackView = function() {

	this.rotation.x = 0;
	this.rotation.y = Math.PI;
	this.rotation.z = 0;

};

CombinedCamera.prototype.toLeftView = function() {

	this.rotation.x = 0;
	this.rotation.y = - Math.PI / 2;
	this.rotation.z = 0;

};

CombinedCamera.prototype.toRightView = function() {

	this.rotation.x = 0;
	this.rotation.y = Math.PI / 2;
	this.rotation.z = 0;

};

CombinedCamera.prototype.toTopView = function() {

	this.rotation.x = - Math.PI / 2;
	this.rotation.y = 0;
	this.rotation.z = 0;

};

CombinedCamera.prototype.toBottomView = function() {

	this.rotation.x = Math.PI / 2;
	this.rotation.y = 0;
	this.rotation.z = 0;

};

export { CombinedCamera };
