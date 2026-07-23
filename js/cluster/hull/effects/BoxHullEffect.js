import { MeshBasicMaterial } from "three/src/materials/MeshBasicMaterial.js";
import { BoxGeometry } from "three/src/geometries/BoxGeometry.js";
import { FrontSide } from "three/src/constants.js";
import { Color } from "three/src/math/Color.js";
import { Mesh } from "three/src/objects/Mesh.js";
import { Vector3 } from "three/src/math/Vector3.js";
import BaseHullEffect from "./BaseHullEffect";

export default class BoxHullEffect extends BaseHullEffect {

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
        hullMesh.visible = false;
        const hull = hullMesh.parent;
        const bb = hull && hull.mBoundingBox;
        if (!bb) return;

        const size = bb.getSize(new Vector3());
        const center = bb.getCenter(new Vector3());

        let own = this.mOwnMeshes.get(hullMesh);
        if (!own) {
            const geo = new BoxGeometry(size.x, size.y, size.z);
            const mat = this._makeMat();
            own = new Mesh(geo, mat);
            own.layers.set(0);
            hullMesh.parent.add(own);
            this.mOwnMeshes.set(hullMesh, own);
        } else {
            own.geometry.dispose();
            own.geometry = new BoxGeometry(size.x, size.y, size.z);
        }

        own.position.copy(center);
        own.visible = true;
    }

    onDetach(hullMesh) {
        hullMesh.visible = true;
        for (const [, own] of this.mOwnMeshes) {
            if (own.parent) own.parent.remove(own);
            own.geometry.dispose();
            own.material.dispose();
        }
        this.mOwnMeshes.clear();
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
            own.geometry.dispose();
            own.material.dispose();
        }
        this.mOwnMeshes.clear();
    }
}
