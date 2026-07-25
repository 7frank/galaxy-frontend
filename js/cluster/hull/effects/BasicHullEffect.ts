import { MeshBasicMaterial } from "three/src/materials/MeshBasicMaterial.js";
import { FrontSide } from "three/src/constants.js";
import { Color } from "three/src/math/Color.js";
import { Mesh } from "three/src/objects/Mesh.js";
import BaseHullEffect from "./BaseHullEffect";

export interface BasicHullEffectOptions {
    opacity?: number
    hoverOpacity?: number
}

export default class BasicHullEffect extends BaseHullEffect {

    mOpacity: number
    mHoverOpacity: number
    mOwnMeshes: Map<Mesh, Mesh>
    _mat: MeshBasicMaterial | null = null

    constructor({ opacity = 0.15, hoverOpacity = 0.35 }: BasicHullEffectOptions = {}) {
        super();
        this.mOpacity = opacity;
        this.mHoverOpacity = hoverOpacity;
        this.mOwnMeshes = new Map();
    }

    _makeMat(): MeshBasicMaterial {
        return new MeshBasicMaterial({
            color: new Color().setHSL(Math.random(), 0.7, 0.5),
            opacity: this.mOpacity,
            transparent: true,
            depthWrite: false,
            side: FrontSide,
        });
    }

    onAttach(hullMesh: Mesh): void {
        if (!this._mat) this._mat = this._makeMat();
        let own = this.mOwnMeshes.get(hullMesh);
        if (!own) {
            own = new Mesh(hullMesh.geometry, this._mat);
            own.layers.set(0);
            hullMesh.parent!.add(own);
            this.mOwnMeshes.set(hullMesh, own);
        } else {
            own.geometry = hullMesh.geometry;
        }
        own.visible = true;
    }

    onDetach(hullMesh: Mesh): void {
        for (const [, own] of this.mOwnMeshes) {
            if (own.parent) own.parent.remove(own);
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
        }
        this.mOwnMeshes.clear();
        if (this._mat) { this._mat.dispose(); this._mat = null; }
    }
}
