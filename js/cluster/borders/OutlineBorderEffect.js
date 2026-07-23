import { EffectComposer } from "postprocessing/src/core/EffectComposer.js";
import { RenderPass } from "postprocessing/src/passes/RenderPass.js";
import { EffectPass } from "postprocessing/src/passes/EffectPass.js";
import { OutlineEffect } from "postprocessing/src/effects/OutlineEffect.js";
import { SMAAEffect } from "postprocessing/src/effects/SMAAEffect.js";
import { SMAAPreset } from "postprocessing/src/enums/SMAAPreset.js";
import { EdgeDetectionMode } from "postprocessing/src/enums/EdgeDetectionMode.js";
import { BlendFunction } from "postprocessing/src/enums/BlendFunction.js";
import { HalfFloatType, LinearSRGBColorSpace } from "three/src/constants.js";

import BaseBorderEffect from "./BaseBorderEffect";

export default class OutlineBorderEffect extends BaseBorderEffect {

    constructor({ enableSmaa = false } = {}) {
        super();
        this.enableSmaa = enableSmaa;
    }

    init(renderer, scene, camera) {
        this.mRenderer = renderer;
        this.mScene = scene;
        this.mCamera = camera;
        this.mPrevColorSpace = renderer.outputColorSpace;
        renderer.outputColorSpace = LinearSRGBColorSpace;

        this.mComposer = new EffectComposer(renderer, { frameBufferType: HalfFloatType });

        const renderPass = new RenderPass(scene, camera);
        renderPass.renderToScreen = false;
        this.mComposer.addPass(renderPass);

        let smaaEffect;
        if (this.enableSmaa) {
            smaaEffect = new SMAAEffect({ preset: SMAAPreset.HIGH, edgeDetectionMode: EdgeDetectionMode.COLOR });
            smaaEffect.edgeDetectionMaterial.setEdgeDetectionThreshold(0.05);
        }

        const outlineEffect = new OutlineEffect(scene, camera, {
            blendFunction: BlendFunction.SCREEN,
            multisampling: Math.min(4, renderer.capabilities.maxSamples),
            edgeStrength: 2.5,
            pulseSpeed: 0.0,
            visibleEdgeColor: 0xffffff,
            hiddenEdgeColor: 0x22090a,
            height: 480,
            blur: false,
            xRay: true
        });

        const outlineEffectDim = new OutlineEffect(scene, camera, {
            blendFunction: BlendFunction.SCREEN,
            multisampling: Math.min(4, renderer.capabilities.maxSamples),
            edgeStrength: 0.8,
            pulseSpeed: 0.0,
            visibleEdgeColor: 0x8888aa,
            hiddenEdgeColor: 0x111111,
            height: 480,
            blur: false,
            xRay: false
        });

        this.effect = outlineEffect;
        this.effectDim = outlineEffectDim;
        this.mModeMap = new Map();

        const outlinePass = new EffectPass(camera, outlineEffectDim, outlineEffect);
        this.mComposer.addPass(outlinePass);
        if (this.enableSmaa) {
            this.mComposer.addPass(new EffectPass(camera, smaaEffect));
        }
    }

    onHullRegister(mesh, mode) {
        this.mModeMap.set(mesh, mode);
        if (mode === "ambient" || mode === "hover") {
            this.effectDim.selection.add(mesh);
        }
    }

    onHullUnregister(mesh) {
        this.effect.selection.delete(mesh);
        this.effectDim.selection.delete(mesh);
        this.mModeMap.delete(mesh);
    }

    onHullActive(mesh) {
        const mode = this.mModeMap.get(mesh);
        if (mode === "hover") {
            this.effectDim.selection.delete(mesh);
            this.effect.selection.add(mesh);
        }
    }

    onHullInactive(mesh) {
        const mode = this.mModeMap.get(mesh);
        if (mode === "hover") {
            this.effect.selection.delete(mesh);
            this.effectDim.selection.add(mesh);
        }
    }

    render() {
        const renderer = this.mRenderer;
        const scene = this.mScene;
        const camera = this.mCamera;

        renderer.autoClear = false;
        renderer.autoClearStencil = false;

        camera.layers.set(0);
        this.mComposer.render();

        renderer.autoClear = false;
        camera.layers.set(1);
        renderer.render(scene, camera);

        camera.layers.enableAll();
    }

    resize(width, height) {
        if (this.mComposer) {
            this.mComposer.setSize(width, height);
        }
    }

    dispose() {
        if (this.mComposer) {
            this.mComposer.dispose();
            this.mComposer = null;
        }
        if (this.mRenderer && this.mPrevColorSpace !== undefined) {
            this.mRenderer.outputColorSpace = this.mPrevColorSpace;
        }
    }

}
