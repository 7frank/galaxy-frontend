import { DataTexture } from "three/src/textures/DataTexture.js";
import { MeshToonMaterial } from "three/src/materials/MeshToonMaterial.js";
import { RedFormat, UnsignedByteType, FrontSide } from "three/src/constants.js";
import { Color } from "three/src/math/Color.js";
import BaseHullEffect from "./BaseHullEffect";

function buildGradientMap(steps) {
    const data = new Uint8Array(steps);
    for (let i = 0; i < steps; i++) {
        data[i] = Math.round((i / (steps - 1)) * 255);
    }
    const tex = new DataTexture(data, steps, 1, RedFormat, UnsignedByteType);
    tex.needsUpdate = true;
    return tex;
}

export default class ToonHullEffect extends BaseHullEffect {

    constructor({ steps = 4, opacity = 0.15, color = 0xaaccff, hoverOpacity = 0.35, hoverColor = 0xffffff } = {}) {
        super();
        this.mOpacity = opacity;
        this.mColor = color;
        this.mHoverOpacity = hoverOpacity;
        this.mHoverColor = hoverColor;
        this.mGradientMap = buildGradientMap(steps);
        this.mOriginals = new Map();
    }

    onAttach(mesh) {
        if (!this.mOriginals.has(mesh)) {
            this.mOriginals.set(mesh, { material: mesh.material, visible: mesh.visible });
        }
        const mat = new MeshToonMaterial({
            color: new Color(this.mColor),
            gradientMap: this.mGradientMap,
            opacity: this.mOpacity,
            transparent: true,
            depthWrite: false,
            side: FrontSide,
        });
        mesh.material = mat;
        mesh.visible = true;
        mesh.layers.set(0);
    }

    onDetach(mesh) {
        const original = this.mOriginals.get(mesh);
        if (original) {
            if (mesh.material !== original.material) mesh.material.dispose();
            mesh.material = original.material;
            mesh.visible = original.visible;
            mesh.layers.enableAll();
            this.mOriginals.delete(mesh);
        }
    }

    onActive(mesh) {
        if (mesh.material.isMeshToonMaterial) {
            mesh.material.color.set(this.mHoverColor);
            mesh.material.opacity = this.mHoverOpacity;
        }
    }

    onInactive(mesh) {
        if (mesh.material.isMeshToonMaterial) {
            mesh.material.color.set(this.mColor);
            mesh.material.opacity = this.mOpacity;
        }
    }

    dispose() {
        for (const [mesh, original] of this.mOriginals) {
            if (mesh.material !== original.material) mesh.material.dispose();
            mesh.material = original.material;
            mesh.visible = original.visible;
            mesh.layers.enableAll();
        }
        this.mOriginals.clear();
        this.mGradientMap.dispose();
    }
}
