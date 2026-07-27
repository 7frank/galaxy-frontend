import { MeshBasicMaterial } from "three/src/materials/MeshBasicMaterial.js";
import { RingGeometry } from "three/src/geometries/RingGeometry.js";
import { DoubleSide } from "three/src/constants.js";
import { Color } from "three/src/math/Color.js";
import { Mesh } from "three/src/objects/Mesh.js";
import { Vector3 } from "three/src/math/Vector3.js";
import BaseHullEffect from "./BaseHullEffect";
import type BaseVolume from "../BaseVolume";

export interface CircleHullEffectOptions {
    opacity?: number
    hoverOpacity?: number
    ringWidth?: number
}

export default class CircleHullEffect extends BaseHullEffect {

    mOpacity: number
    mHoverOpacity: number
    mRingWidth: number
    mOwnMeshes: Map<Mesh, Mesh>

    constructor({ opacity = 0.2, hoverOpacity = 0.5, ringWidth = 0.08 }: CircleHullEffectOptions = {}) {
        super();
        this.mOpacity = opacity;
        this.mHoverOpacity = hoverOpacity;
        this.mRingWidth = ringWidth;
        this.mOwnMeshes = new Map();
    }

    _makeMat(): MeshBasicMaterial {
        return new MeshBasicMaterial({
            color: new Color().setHSL(Math.random(), 0.7, 0.5),
            opacity: this.mOpacity,
            transparent: true,
            depthWrite: false,
            side: DoubleSide,
        });
    }

    onAttach(hullMesh: Mesh): void {
        const hull = hullMesh.parent as (InstanceType<typeof BaseVolume> & Mesh) | null;
        const bb = hull && hull.mBoundingBox;
        if (!bb) return;

        const size = bb.getSize(new Vector3());
        const center = bb.getCenter(new Vector3());
        const outerRadius = Math.max(size.x, size.z) / 2;
        const innerRadius = outerRadius * (1 - this.mRingWidth);

        let own = this.mOwnMeshes.get(hullMesh);
        if (!own) {
            const geo = new RingGeometry(innerRadius, outerRadius, 64);
            const mat = this._makeMat();
            own = new Mesh(geo, mat);
            own.rotation.x = -Math.PI / 2;
            own.layers.set(0);
            hullMesh.parent!.add(own);
            this.mOwnMeshes.set(hullMesh, own);
        } else {
            own.geometry.dispose();
            own.geometry = new RingGeometry(innerRadius, outerRadius, 64);
        }

        own.position.set(center.x, 0, center.z);
        own.visible = true;
    }

    onDetach(_hullMesh: Mesh): void {
        for (const [, own] of this.mOwnMeshes) {
            if (own.parent) own.parent.remove(own);
            own.geometry.dispose();
            (own.material as MeshBasicMaterial).dispose();
        }
        this.mOwnMeshes.clear();
    }

    onActive(hullMesh: Mesh): void {
        const own = this.mOwnMeshes.get(hullMesh);
        if (own) (own.material as MeshBasicMaterial).opacity = this.mHoverOpacity;
    }

    onInactive(hullMesh: Mesh): void {
        const own = this.mOwnMeshes.get(hullMesh);
        if (own) (own.material as MeshBasicMaterial).opacity = this.mOpacity;
    }

    dispose(): void {
        for (const [, own] of this.mOwnMeshes) {
            if (own.parent) own.parent.remove(own);
            own.geometry.dispose();
            (own.material as MeshBasicMaterial).dispose();
        }
        this.mOwnMeshes.clear();
    }
}
