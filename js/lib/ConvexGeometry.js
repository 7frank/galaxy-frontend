/**
 * @author Mugen87 / https://github.com/Mugen87
 */

import { Geometry, BufferGeometry, Float32BufferAttribute } from "three";
import { QuickHull } from "./QuickHull";


function ConvexGeometry( points ) {

	Geometry.call( this );

	this.type = 'ConvexGeometry';

	this.fromBufferGeometry( new ConvexBufferGeometry( points ) );
	this.mergeVertices();

}

ConvexGeometry.prototype = Object.create( Geometry.prototype );
ConvexGeometry.prototype.constructor = ConvexGeometry;


function ConvexBufferGeometry( points ) {

	BufferGeometry.call( this );

	this.type = 'ConvexBufferGeometry';

	var vertices = [];
	var normals = [];

	var quickHull = new QuickHull().setFromPoints( points );

	var faces = quickHull.faces;

	for ( var i = 0; i < faces.length; i ++ ) {

		var face = faces[ i ];
		var edge = face.edge;

		do {

			var point = edge.head().point;

			vertices.push( point.x, point.y, point.z );
			normals.push( face.normal.x, face.normal.y, face.normal.z );

			edge = edge.next;

		} while ( edge !== face.edge );

	}

	this.addAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );
	this.addAttribute( 'normal', new Float32BufferAttribute( normals, 3 ) );

}

ConvexBufferGeometry.prototype = Object.create( BufferGeometry.prototype );
ConvexBufferGeometry.prototype.constructor = ConvexBufferGeometry;

export { ConvexGeometry, ConvexBufferGeometry };
