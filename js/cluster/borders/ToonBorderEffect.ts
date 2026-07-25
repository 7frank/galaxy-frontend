import { DataTexture } from "three/src/textures/DataTexture.js";
import { MeshToonMaterial } from "three/src/materials/MeshToonMaterial.js";
import { Material } from "three/src/materials/Material.js";
import { RedFormat, UnsignedByteType } from "three/src/constants.js";
import { Color } from "three/src/math/Color.js";
import { FrontSide } from "three/src/constants.js";
import { Mesh } from "three/src/objects/Mesh.js";
import BaseBorderEffect, { BorderEffectMode } from "./BaseBorderEffect";

function buildGradientMap(steps: number): DataTexture {
    const data = new Uint8Array(steps);
    for (let i = 0; i < steps; i++) {
        data[i] = Math.round((i / (steps - 1)) * 255);
    }
    const tex = new DataTexture(data, steps, 1, RedFormat, UnsignedByteType);
    tex.needsUpdate = true;
    return tex;
}

export interface ToonBorderEffectOptions {
    steps?: number
    opacity?: number
    color?: number
    hoverOpacity?: number
    hoverColor?: number
}

export default class ToonBorderEffect extends BaseBorderEffect {

    mSteps: number
    mOpacity: number
    mColor: number
    mHoverOpacity: number
    mHoverColor: number
    mGradientMap: DataTexture
    mOriginalMaterials: Map<Mesh, Material>
    mModeMap: Map<Mesh, BorderEffectMode>

    constructor({ steps = 4, opacity = 0.15, color = 0xaaccff, hoverOpacity = 0.35, hoverColor = 0xffffff }: ToonBorderEffectOptions = {}) {
        super();
        console.log("[Toon] constructed");
        this.mSteps = steps;
        this.mOpacity = opacity;
        this.mColor = color;
        this.mHoverOpacity = hoverOpacity;
        this.mHoverColor = hoverColor;
        this.mGradientMap = buildGradientMap(steps);
        this.mOriginalMaterials = new Map();
        this.mModeMap = new Map();
    }

    onHullRegister(mesh: Mesh, mode: BorderEffectMode): void {
        if (mode === "none") return;
        console.log("[Toon] register", mode, "mesh.visible=", mesh.visible, "mat.visible=", (mesh.material as Material).visible, mesh);
        this.mModeMap.set(mesh, mode);
        this.mOriginalMaterials.set(mesh, mesh.material as Material);
        const mat = new MeshToonMaterial({
            color: new Color(this.mColor),
            gradientMap: this.mGradientMap,
            opacity: this.mOpacity,
            transparent: true,
            depthWrite: false,
            side: FrontSide,
        });
        mat.visible = true;
        mesh.material = mat;
        mesh.visible = true;
        mesh.layers.set(0);
    }

    onHullUnregister(mesh: Mesh): void {
        const original = this.mOriginalMaterials.get(mesh);
        if (original) {
            (mesh.material as Material).dispose();
            mesh.material = original;
            mesh.visible = original.visible;
            mesh.layers.enableAll();
            this.mOriginalMaterials.delete(mesh);
        }
        this.mModeMap.delete(mesh);
    }

    onHullActive(mesh: Mesh): void {
        if (this.mModeMap.get(mesh) === "hover" && (mesh.material as MeshToonMaterial).isMeshToonMaterial) {
            (mesh.material as MeshToonMaterial).color.set(this.mHoverColor);
            (mesh.material as MeshToonMaterial).opacity = this.mHoverOpacity;
        }
    }

    onHullInactive(mesh: Mesh): void {
        if (this.mModeMap.get(mesh) === "hover" && (mesh.material as MeshToonMaterial).isMeshToonMaterial) {
            (mesh.material as MeshToonMaterial).color.set(this.mColor);
            (mesh.material as MeshToonMaterial).opacity = this.mOpacity;
        }
    }

    dispose(): void {
        this.mGradientMap.dispose();
        for (const [mesh, original] of this.mOriginalMaterials) {
            (mesh.material as Material).dispose();
            mesh.material = original;
        }
        this.mOriginalMaterials.clear();
        this.mModeMap.clear();
    }
}
