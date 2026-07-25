/**
 * Created by Frank on 22.06.2017.
 */

/**
 * The default implementation for a hull/volume around a cluster of nodes.
 * This will create an invisible box  using the bounding box of the cluster.
 * Nothing is renderd but some properties of the resulting volume are used to determine distances between
 * neighboring elements in the cluster section.
 *
 * NOTE: for an implementation of a visible volume see {@link BoxVolume}
 */

import { Object3D } from "three/src/core/Object3D.js";
import { BoxGeometry } from "three/src/geometries/BoxGeometry.js";
import { EdgesGeometry } from "three/src/geometries/EdgesGeometry.js";
import { Material } from "three/src/materials/Material.js";
import { LineBasicMaterial } from "three/src/materials/LineBasicMaterial.js";
import { Box3 } from "three/src/math/Box3.js";
import { Vector3 } from "three/src/math/Vector3.js";
import { LineSegments } from "three/src/objects/LineSegments.js";
import { Mesh } from "three/src/objects/Mesh.js";


export default class BaseVolume extends Object3D {

    lod: number
    maxOpacity: number
    mBoundingBox: Box3 | undefined
    mMaterial: Material | undefined
    mesh: LineSegments | Mesh | undefined

    constructor(...args:  ConstructorParameters<typeof Object3D>) {
        super(...args);
        this.lod = 1;
        this.maxOpacity = 0.0
    }

    setLOD(newLOD: number): void {
        if (newLOD < 0) newLOD = 0;
        if (newLOD > 1) newLOD = 1;
        this.lod = newLOD
    }

    getMaterial(): Material {
        if (this.mMaterial) return this.mMaterial;

        this.mMaterial = new LineBasicMaterial({
            color: 0xffffff,
            linewidth: 5,
            opacity: this.maxOpacity,
            transparent: false
        });

        (this.mMaterial as LineBasicMaterial).visible = this.canBeVisible();

        return this.mMaterial
    }

    canBeVisible(): boolean {
        return false
    }

    createVolumeFromVertices(_vertices: Vector3[], boundingBox: Box3): LineSegments | Mesh {

        this.mBoundingBox = boundingBox;

        let _center = boundingBox.getCenter(new Vector3());
        let _size = boundingBox.getSize(new Vector3());

        let box = new BoxGeometry(_size.x, _size.y, _size.z);
        let geo = new EdgesGeometry(box);
        let mat = this.getMaterial();

        let wireframe = new LineSegments(geo, mat);
        wireframe.position.add(_center);
        (wireframe.geometry as any).boundingBox = boundingBox;

        if (this.mesh) this.remove(this.mesh);
        this.mesh = wireframe;
        this.add(wireframe);

        return this.mesh
    }

    setActive(): void {
        this.maxOpacity = 1
    }

    setInactive(): void {
        this.maxOpacity = 0.3
    }

    dispose(): void {
        if (this.mesh) {
            (this.mesh as any).geometry.dispose();
            (this.mesh as any).material.dispose();
        }
        if (this.parent)
            this.parent.remove(this)
    }
}
