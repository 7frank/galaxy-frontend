/**
  @author frank1147 https://gist.github.com/frank1147
 

 original @author Mugen87 / https://github.com/Mugen87
 for ConvexGeometry.js
 
 simple approach for a convex hull geometry
 which uses the points itself instead of the original implementation
 to be able to animate the hull when points are moved
 
 */

( function() {



	function ConvexDynamicGeometry( points ) {

	  THREE.Geometry.call( this );

		this.type = 'ConvexDynamicGeometry';

	  // execute QuickHull

		if ( THREE.QuickHull === undefined ) {

			console.error( 'THREE.ConvexDynamicGeometry: ConvexDynamicGeometry relies on THREE.QuickHull' );

		}

	 if (points.length>=4) 
	 {
	  var quickHull = new THREE.QuickHull().setFromPoints( points );

	  // generate vertices

	  var faces = quickHull.faces;

	  for ( var i = 0; i < faces.length; i ++ ) {

	    var face = faces[ i ];
	    var edge = face.edge;

	    // we move along a doubly-connected edge list to access all face points (see HalfEdge docs)
		
	    do {

	      var point = edge.head().point;

		  this.vertices.push(point)
	      edge = edge.next;

	    } while ( edge !== face.edge );

		this.faces.push( new THREE.Face3( i*3, i*3+1, i*3+2 ) );
		
		
	  }
	 }
	 else  if (points.length==3)
	 {
		 
		 this.vertices.push(points)
		 this.faces.push( new THREE.Face3( 0, 1,2 ) );
		 
	 } 
	 // else .. if a group contains less than 3 elements we can't create much usefull additional hull meshes
	 
	 
	 
	}

	ConvexDynamicGeometry.prototype = Object.create( THREE.Geometry.prototype );
	ConvexDynamicGeometry.prototype.constructor = ConvexDynamicGeometry;

	// export

	THREE.ConvexDynamicGeometry = ConvexDynamicGeometry;

} ) ();