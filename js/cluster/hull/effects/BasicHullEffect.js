import { MeshBasicMaterial } from "three/src/materials/MeshBasicMaterial.js";
import { FrontSide } from "three/src/constants.js";
import { Color } from "three/src/math/Color.js";
import { Mesh } from "three/src/objects/Mesh.js";
import BaseHullEffect from "./BaseHullEffect";

export default class BasicHullEffect extends BaseHullEffect {

    constructor({ opacity = 0.15, hoverOpacity = 0.35 } = {}) {
        super();
        this.mOpacity = opacity;
        this.mHoverOpacity = hoverOpacity;
        this.mOwnMeshes = new Map();
    }

    _makeMat() {
        return new MeshBasicMaterial({
            color: new Color().setHSL(Math.random(), 0.7, 0.5),
            opacity: this.mOpacity,
            transparent: true,
            depthWrite: false,
            side: FrontSide,
        });
    }

    onAttach(hullMesh) {
        if (!this._mat) this._mat = this._makeMat();
        let own = this.mOwnMeshes.get(hullMesh);
        if (!own) {
            own = new Mesh(hullMesh.geometry, this._mat);
            own.layers.set(0);
            hullMesh.parent.add(own);
            this.mOwnMeshes.set(hullMesh, own);
        } else {
            own.geometry = hullMesh.geometry;
        }
        own.visible = true;
    }

    onDetach(hullMesh) {
        const own = this.mOwnMeshes.get(hullMesh);
        if (own) {
            if (own.parent) own.parent.remove(own);
            this.mOwnMeshes.delete(hullMesh);
        }
    }

    onActive(hullMesh) {
        const own = this.mOwnMeshes.get(hullMesh);
        if (own) own.material.opacity = this.mHoverOpacity;
    }

    onInactive(hullMesh) {
        const own = this.mOwnMeshes.get(hullMesh);
        if (own) own.material.opacity = this.mOpacity;
    }

    dispose() {
        for (const [, own] of this.mOwnMeshes) {
            if (own.parent) own.parent.remove(own);
        }
        this.mOwnMeshes.clear();
        if (this._mat) { this._mat.dispose(); this._mat = null; }
    }
}
