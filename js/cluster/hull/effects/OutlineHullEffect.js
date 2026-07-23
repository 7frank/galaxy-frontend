import { EffectComposer } from "postprocessing/src/core/EffectComposer.js";
import { RenderPass } from "postprocessing/src/passes/RenderPass.js";
import { EffectPass } from "postprocessing/src/passes/EffectPass.js";
import { OutlineEffect } from "postprocessing/src/effects/OutlineEffect.js";
import { SMAAEffect } from "postprocessing/src/effects/SMAAEffect.js";
import { SMAAPreset } from "postprocessing/src/enums/SMAAPreset.js";
import { EdgeDetectionMode } from "postprocessing/src/enums/EdgeDetectionMode.js";
import { BlendFunction } from "postprocessing/src/enums/BlendFunction.js";
import { HalfFloatType, LinearSRGBColorSpace } from "three/src/constants.js";
import BaseHullEffect from "./BaseHullEffect";

/**
 * Shared outline composer — one per view, shared across all OutlineHullEffect instances.
 * Created lazily when the first OutlineHullEffect attaches to a view.
 */
export class OutlineComposer {

    constructor({ enableSmaa = false } = {}) {
        this.enableSmaa = enableSmaa;
        this.mMeshModes = new Map();
    }

    init(renderer, scene, camera) {
        if (this.mComposer) return;
        this.mRenderer = renderer;
        this.mScene = scene;
        this.mCamera = camera;
        this.mPrevColorSpace = renderer.outputColorSpace;
        renderer.outputColorSpace = LinearSRGBColorSpace;

        this.mComposer = new EffectComposer(renderer, { frameBufferType: HalfFloatType });
        this.mComposer.addPass(new RenderPass(scene, camera));

        this.effectDim = new OutlineEffect(scene, camera, {
            blendFunction: BlendFunction.SCREEN,
            edgeStrength: 0.8,
            pulseSpeed: 0.0,
            visibleEdgeColor: 0x8888aa,
            hiddenEdgeColor: 0x111111,
            height: 480,
            blur: false,
            xRay: false,
        });

        this.effectBright = new OutlineEffect(scene, camera, {
            blendFunction: BlendFunction.SCREEN,
            edgeStrength: 2.5,
            pulseSpeed: 0.0,
            visibleEdgeColor: 0xffffff,
            hiddenEdgeColor: 0x22090a,
            height: 480,
            blur: false,
            xRay: true,
        });

        this.mComposer.addPass(new EffectPass(camera, this.effectDim, this.effectBright));

        if (this.enableSmaa) {
            const smaa = new SMAAEffect({ preset: SMAAPreset.HIGH, edgeDetectionMode: EdgeDetectionMode.COLOR });
            this.mComposer.addPass(new EffectPass(camera, smaa));
        }
    }

    add(mesh, mode) {
        this.mMeshModes.set(mesh, mode);
        if (mode === "ambient" || mode === "hover") this.effectDim.selection.add(mesh);
    }

    remove(mesh) {
        this.effectBright.selection.delete(mesh);
        this.effectDim.selection.delete(mesh);
        this.mMeshModes.delete(mesh);
    }

    activate(mesh) {
        if (this.mMeshModes.get(mesh) === "hover") {
            this.effectDim.selection.delete(mesh);
            this.effectBright.selection.add(mesh);
        }
    }

    deactivate(mesh) {
        if (this.mMeshModes.get(mesh) === "hover") {
            this.effectBright.selection.delete(mesh);
            this.effectDim.selection.add(mesh);
        }
    }

    render() {
        const { mRenderer: r, mScene: s, mCamera: c } = this;
        r.autoClear = false;
        r.autoClearStencil = false;
        c.layers.set(0);
        this.mComposer.render();
        r.autoClear = false;
        c.layers.set(1);
        r.render(s, c);
        c.layers.enableAll();
    }

    resize(w, h) { this.mComposer?.setSize(w, h); }

    dispose() {
        this.mComposer?.dispose();
        this.mComposer = null;
        if (this.mRenderer) {
            this.mRenderer.autoClear = true;
            this.mRenderer.autoClearStencil = true;
            if (this.mPrevColorSpace !== undefined)
                this.mRenderer.outputColorSpace = this.mPrevColorSpace;
            this.mCamera.layers.enableAll();
        }
    }
}

/**
 * Per-cluster hull effect that registers into a shared OutlineComposer.
 */
export default class OutlineHullEffect extends BaseHullEffect {

    constructor(mode = "hover", composer = null) {
        super();
        this.mMode = mode;
        this.mComposer = composer;
        this.mMesh = null;
    }

    setComposer(composer) {
        this.mComposer = composer;
    }

    onAttach(mesh) {
        this.mMesh = mesh;
        if (this.mComposer) this.mComposer.add(mesh, this.mMode);
    }

    onDetach(mesh) {
        if (this.mComposer) this.mComposer.remove(mesh);
        this.mMesh = null;
    }

    onActive(mesh) {
        if (this.mComposer) this.mComposer.activate(mesh);
    }

    onInactive(mesh) {
        if (this.mComposer) this.mComposer.deactivate(mesh);
    }

    dispose() {
        if (this.mMesh && this.mComposer) this.mComposer.remove(this.mMesh);
        this.mMesh = null;
    }
}
