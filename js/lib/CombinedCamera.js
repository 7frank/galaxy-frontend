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

const RAD2DEG = 180 / Math.PI;


class CombinedCamera extends Camera {

	constructor( width = 1, height = 1, fov = 50, near = 0.1, far = 2000, orthoNear = -500, orthoFar = 1000 ) {

		super();

		this.fov = fov;
		this.far = far;
		this.near = near;

		this.left = - width / 2;
		this.right = width / 2;
		this.top = height / 2;
		this.bottom = - height / 2;

		this.aspect = width / height;
		this.zoom = 1;
		this.view = null;

		this.cameraO = new OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, orthoNear, orthoFar );
		this.cameraP = new PerspectiveCamera( fov, width / height, near, far );

		this.inPerspectiveMode = true;
		this.inOrthographicMode = false;

		this.toPerspective();

	}

	toPerspective() {

		this.near = this.cameraP.near;
		this.far = this.cameraP.far;

		this.cameraP.aspect = this.aspect;
		this.cameraP.fov = this.fov / this.zoom;
		this.cameraP.view = this.view;

		this.cameraP.updateProjectionMatrix();

		this.projectionMatrix = this.cameraP.projectionMatrix;
		this.projectionMatrixInverse = this.cameraP.projectionMatrixInverse;

		this.inPerspectiveMode = true;
		this.inOrthographicMode = false;

	}

	toOrthographic() {

		const fov = this.fov;
		const aspect = this.cameraP.aspect;
		const near = this.cameraP.near;
		const far = this.cameraP.far;

		const hyperfocus = ( near + far ) / 2;

		let halfHeight = Math.tan( fov * Math.PI / 180 / 2 ) * hyperfocus;
		let halfWidth = halfHeight * aspect;

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
		this.projectionMatrixInverse = this.cameraO.projectionMatrixInverse;

		this.inPerspectiveMode = false;
		this.inOrthographicMode = true;

	}

	copy( source ) {

		super.copy( source );

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

	}

	setViewOffset( fullWidth, fullHeight, x, y, width, height ) {

		this.view = { fullWidth, fullHeight, offsetX: x, offsetY: y, width, height };

		if ( this.inPerspectiveMode ) {
			this.aspect = fullWidth / fullHeight;
			this.toPerspective();
		} else {
			this.toOrthographic();
		}

	}

	clearViewOffset() {

		this.view = null;
		this.updateProjectionMatrix();

	}

	setSize( width, height ) {

		this.cameraP.aspect = this.aspect = width / height;
		this.left = - width / 2;
		this.right = width / 2;
		this.top = height / 2;
		this.bottom = - height / 2;

	}

	setFov( fov ) {

		this.fov = fov;
		this.update();

	}

	setFar( far ) {

		this.cameraP.far = this.far = far;
		this.cameraO.far = this.far = far;
		this.update();

	}

	setNear( near ) {

		this.cameraP.near = this.near = near;
		this.update();

	}

	update() {

		if ( this.inPerspectiveMode ) {
			this.toPerspective();
		} else {
			this.toOrthographic();
		}

	}

	updateProjectionMatrix() {

		if ( this.inPerspectiveMode ) {
			this.toPerspective();
		} else {
			this.toPerspective();
			this.toOrthographic();
		}

	}

	setLens( focalLength, filmGauge = 35 ) {

		const vExtentSlope = 0.5 * filmGauge /
			( focalLength * Math.max( this.cameraP.aspect, 1 ) );

		const fov = RAD2DEG * 2 * Math.atan( vExtentSlope );

		this.setFov( fov );

		return fov;

	}

	setZoom( zoom ) {

		this.zoom = zoom;
		this.update();

	}

	toFrontView() { this.rotation.set( 0, 0, 0 ); }
	toBackView()   { this.rotation.set( 0, Math.PI, 0 ); }
	toLeftView()   { this.rotation.set( 0, - Math.PI / 2, 0 ); }
	toRightView()  { this.rotation.set( 0, Math.PI / 2, 0 ); }
	toTopView()    { this.rotation.set( - Math.PI / 2, 0, 0 ); }
	toBottomView() { this.rotation.set( Math.PI / 2, 0, 0 ); }

}

export { CombinedCamera };
