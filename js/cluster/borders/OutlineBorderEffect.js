import {
    EffectComposer,
    RenderPass,
    EffectPass,
    OutlineEffect,
    SMAAEffect,
    SMAAPreset,
    EdgeDetectionMode,
    BlendFunction
} from "postprocessing";
import { HalfFloatType, LinearSRGBColorSpace } from "three";

import BaseBorderEffect from "./BaseBorderEffect";

export default class OutlineBorderEffect extends BaseBorderEffect {

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

        const smaaEffect = new SMAAEffect({
            preset: SMAAPreset.HIGH,
            edgeDetectionMode: EdgeDetectionMode.COLOR
        });

        smaaEffect.edgeDetectionMaterial.setEdgeDetectionThreshold(0.05);

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

        const outlinePass = new EffectPass(camera, outlineEffectDim, outlineEffect);
        const smaaPass = new EffectPass(camera, smaaEffect);

        this.mComposer.addPass(outlinePass);
        this.mComposer.addPass(smaaPass);
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
