import { DataTexture } from "three/src/textures/DataTexture.js";
import { MeshToonMaterial } from "three/src/materials/MeshToonMaterial.js";
import { RedFormat, UnsignedByteType } from "three/src/constants.js";
import { Color } from "three/src/math/Color.js";
import { FrontSide } from "three/src/constants.js";
import BaseBorderEffect from "./BaseBorderEffect";

function buildGradientMap(steps) {
    const data = new Uint8Array(steps);
    for (let i = 0; i < steps; i++) {
        data[i] = Math.round((i / (steps - 1)) * 255);
    }
    const tex = new DataTexture(data, steps, 1, RedFormat, UnsignedByteType);
    tex.needsUpdate = true;
    return tex;
}

export default class ToonBorderEffect extends BaseBorderEffect {

    constructor({ steps = 4, opacity = 0.15, color = 0xaaccff, hoverOpacity = 0.35, hoverColor = 0xffffff } = {}) {
        super();
        this.mSteps = steps;
        this.mOpacity = opacity;
        this.mColor = color;
        this.mHoverOpacity = hoverOpacity;
        this.mHoverColor = hoverColor;
        this.mGradientMap = buildGradientMap(steps);
        this.mOriginalMaterials = new Map();
        this.mModeMap = new Map();
    }

    onHullRegister(mesh, mode) {
        if (mode === "none") return;
        this.mModeMap.set(mesh, mode);
        this.mOriginalMaterials.set(mesh, mesh.material);
        mesh.material = new MeshToonMaterial({
            color: new Color(this.mColor),
            gradientMap: this.mGradientMap,
            opacity: this.mOpacity,
            transparent: true,
            depthWrite: false,
            side: FrontSide,
        });
    }

    onHullUnregister(mesh) {
        const original = this.mOriginalMaterials.get(mesh);
        if (original) {
            mesh.material.dispose();
            mesh.material = original;
            this.mOriginalMaterials.delete(mesh);
        }
        this.mModeMap.delete(mesh);
    }

    onHullActive(mesh) {
        if (this.mModeMap.get(mesh) === "hover" && mesh.material.isMeshToonMaterial) {
            mesh.material.color.set(this.mHoverColor);
            mesh.material.opacity = this.mHoverOpacity;
        }
    }

    onHullInactive(mesh) {
        if (this.mModeMap.get(mesh) === "hover" && mesh.material.isMeshToonMaterial) {
            mesh.material.color.set(this.mColor);
            mesh.material.opacity = this.mOpacity;
        }
    }

    dispose() {
        this.mGradientMap.dispose();
        for (const [mesh, original] of this.mOriginalMaterials) {
            mesh.material.dispose();
            mesh.material = original;
        }
        this.mOriginalMaterials.clear();
        this.mModeMap.clear();
    }

}
