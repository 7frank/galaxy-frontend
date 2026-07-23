/**
 * @author Mugen87 / https://github.com/Mugen87
 * Updated to use BufferGeometry only (three.js r125+)
 */

import { BufferGeometry, Float32BufferAttribute, Vector3 } from "three";
import { QuickHull } from "./QuickHull";


class ConvexGeometry extends BufferGeometry {

    constructor( points ) {

        super();

        this.type = 'ConvexGeometry';

        const vertices = [];
        const normals = [];

        const quickHull = new QuickHull().setFromPoints( points );

        const faces = quickHull.faces;

        for ( let i = 0; i < faces.length; i ++ ) {

            const face = faces[ i ];
            let edge = face.edge;

            do {

                const point = edge.head().point;

                vertices.push( point.x, point.y, point.z );
                normals.push( face.normal.x, face.normal.y, face.normal.z );

                edge = edge.next;

            } while ( edge !== face.edge );

        }

        this.setAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );
        this.setAttribute( 'normal', new Float32BufferAttribute( normals, 3 ) );

    }

    get vertices() {
        const posAttr = this.getAttribute('position');
        if (!posAttr) return [];
        const result = [];
        for (let i = 0; i < posAttr.count; i++) {
            result.push(new Vector3(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i)));
        }
        return result;
    }

}

export { ConvexGeometry, ConvexGeometry as ConvexBufferGeometry };
