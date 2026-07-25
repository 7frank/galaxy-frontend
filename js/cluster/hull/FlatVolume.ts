/**
 * Created by Frank on 23.06.2017.
 */

import BoxVolume from "./BoxVolume"
import MaterialFadeMixin from "../../utils/MaterialFadeMixin"
import { BackSide } from "three/src/constants.js";
import { Shape } from "three/src/extras/core/Shape.js";
import { BoxGeometry } from "three/src/geometries/BoxGeometry.js";
import { CircleGeometry } from "three/src/geometries/CircleGeometry.js";
import { ShapeGeometry } from "three/src/geometries/ShapeGeometry.js";
import { MeshBasicMaterial } from "three/src/materials/MeshBasicMaterial.js";
import { Sphere } from "three/src/math/Sphere.js";
import { Vector2 } from "three/src/math/Vector2.js";
import { Vector3 } from "three/src/math/Vector3.js";
import { Mesh } from "three/src/objects/Mesh.js";
import { BufferGeometry } from "three/src/core/BufferGeometry.js";
import { Box3 } from "three/src/math/Box3.js";
import * as _ from "lodash";

import convexHull2d from "monotone-convex-hull-2d"

/**
 * 2D flat convex hull using monotone-convex-hull-2d algorithm.
 */

export default class FlatVolume extends BoxVolume {

    mTime: number | undefined
    mGeometryZero: BufferGeometry | undefined

    constructor() {
        super();
        this.setInactive();
    }

    createConvexShapeGeometry(vertices: Vector3[]): ShapeGeometry {
        const pts: [number, number][] = _.map(vertices, v => [v.x, v.y] as [number, number]);
        const ids: number[] = convexHull2d(pts);

        const resArr: Vector3[] = [];
        _.each(ids, function (id: number) {
            resArr.push(vertices[id]);
        });

        const resShape = new Shape(resArr as unknown as Vector2[]);
        return new ShapeGeometry(resShape);
    }

    smoothHullModifier(geometry: BufferGeometry & { vertices?: Vector3[] }, numSegments: number, margin: number): ShapeGeometry {
        const allPoints: Vector3[] = [];

        const verts = geometry.vertices ?? [];
        for (let v of verts) {
            const circle = new CircleGeometry(margin, numSegments);
            const pos = circle.getAttribute('position');
            for (let i = 0; i < pos.count; i++) {
                allPoints.push(new Vector3(
                    pos.getX(i) + v.x,
                    pos.getY(i) + v.y,
                    pos.getZ(i) + v.z
                ));
            }
        }

        return this.createConvexShapeGeometry(allPoints);
    }

    createVolumeFromVertices(vertices: Vector3[], boundingBox: Box3): Mesh {
        this.mTime = Date.now();

        let vert = vertices.filter(v => !(v.x == 0 && v.y == 0 && v.z == 0));

        if (vert.length < 4 && vertices.length > 4) {
            vertices = [];
            boundingBox.min = new Vector3(-1, -1, -1);
            boundingBox.max = new Vector3(1, 1, 1);
        }

        if (vertices.length < 4) {
            if (boundingBox.getSize(new Vector3()).length() == 0)
                boundingBox.max.add(new Vector3(0.1, 0.1, 0.1));
            vertices = this.getVerticesFromBoundingBox(boundingBox);
        }

        let geo0: BufferGeometry;
        try {
            geo0 = this.mGeometryZero = this.createConvexShapeGeometry(vertices);
        } catch (e) {
            geo0 = this.mGeometryZero = this.createBoxGeometryFromBoundingBox(boundingBox);
            console.warn(e, vertices);
        }

        this.mBoundingBox = boundingBox;

        const mat = new MeshBasicMaterial({
            color: 0xffffff,
            opacity: 0.03,
            transparent: true,
            depthWrite: true,
            depthTest: false
        });

        MaterialFadeMixin(mat);
        (mat as any).fade = 0;
        (mat as any).fadeTo(1, 400);

        const mesh = new Mesh(geo0, mat);
        mesh.geometry.boundingBox = boundingBox;
        mesh.geometry.boundingSphere = boundingBox.getBoundingSphere(new Sphere());

        const rc = mesh.raycast.bind(mesh);
        mesh.raycast = function (raycaster: any, intersects: any[]) {
            if (this.geometry && this.geometry.attributes && !this.geometry.attributes.position)
                return;
            return rc(raycaster, intersects);
        };

        if (this.mesh) this.remove(this.mesh);
        this.mesh = mesh;
        this.add(mesh);

        return this.mesh as Mesh;
    }

    createBoxGeometryFromBoundingBox(boundingBox: Box3): BoxGeometry {
        const _center = boundingBox.getCenter(new Vector3());
        const _size = boundingBox.getSize(new Vector3());
        const box = new BoxGeometry(_size.x, _size.y, _size.z);
        box.translate(_center.x, _center.y, _center.z);
        return box;
    }

    getVerticesFromBoundingBox(boundingBox: Box3): Vector3[] {
        const box = this.createBoxGeometryFromBoundingBox(boundingBox);
        const pos = box.getAttribute('position');
        const verts: Vector3[] = [];
        for (let i = 0; i < pos.count; i++) {
            verts.push(new Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)));
        }
        return verts;
    }

    transferFunction(x: number): number {
        return x
    }

    createVariousResolutionSubGeometry(name: string, resolution: number): BufferGeometry {
        const key = 'geometry' + name;
        if (!(this as any)[key] || (this as any)[key].mTime != this.mTime) {
            const margin = this.mBoundingBox!.getSize(new Vector3()).length() / 10;
            const geo2 = this.smoothHullModifier(this.mGeometryZero!, resolution, margin);
            geo2.computeBoundingBox();
            (geo2 as any).mTime = this.mTime;
            (this as any)[key] = geo2;
        }
        return (this as any)[key];
    }

    setLOD(l: number): void {
        if (l < 0) l = 0;
        if (l > 1) l = 1;

        const minOpacity = 0.00;

        function mTransfer(x: number): number {
            return 0.5 * Math.sin(1.5 * Math.PI + x * Math.PI * 2) + 0.5 + minOpacity;
        }

        const y = mTransfer(l);
        super.setLOD(y * this.maxOpacity * 2);

        if (!this.mesh) return;

        if (l < 0.2)
            (this.mesh as Mesh).geometry = this.createVariousResolutionSubGeometry("Least", 1);
        else if (l > 0.2 && l < 0.6)
            (this.mesh as Mesh).geometry = this.createVariousResolutionSubGeometry("Low", 4);
        else if (l >= 0.6)
            (this.mesh as Mesh).geometry = this.createVariousResolutionSubGeometry("Average", 6);
    }

    setActive(): void {
        this.maxOpacity = 0.4;
    }

    setInactive(): void {
        this.maxOpacity = 0.2;
    }

    dispose(): void {
        if (this.mesh) (this.mesh as Mesh).material.dispose();

        const g = this as any;
        if (g.geometryLowPoly) g.geometryLowPoly.dispose();
        if (g.geometryAveragePoly) g.geometryAveragePoly.dispose();
        if (g.geometryHighPoly) g.geometryHighPoly.dispose();

        if (this.parent) this.parent.remove(this);
    }
}
