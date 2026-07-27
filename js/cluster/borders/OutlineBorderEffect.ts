import { EffectComposer, RenderPass, EffectPass, OutlineEffect, SMAAEffect, SMAAPreset, EdgeDetectionMode, BlendFunction } from "postprocessing";
import { HalfFloatType, LinearSRGBColorSpace } from "three/src/constants.js";
import { WebGLRenderer } from "three/src/renderers/WebGLRenderer.js";
import { Scene } from "three/src/scenes/Scene.js";
import { Camera } from "three/src/cameras/Camera.js";
import { Mesh } from "three/src/objects/Mesh.js";

import BaseBorderEffect, { BorderEffectMode } from "./BaseBorderEffect";

export interface OutlineBorderEffectOptions {
    enableSmaa?: boolean
}

export default class OutlineBorderEffect extends BaseBorderEffect {

    enableSmaa: boolean
    mPrevColorSpace: string | undefined
    mComposer: InstanceType<typeof EffectComposer> | undefined
    effect: InstanceType<typeof OutlineEffect> | undefined
    effectDim: InstanceType<typeof OutlineEffect> | undefined
    mModeMap: Map<Mesh, BorderEffectMode>

    constructor({ enableSmaa = false }: OutlineBorderEffectOptions = {}) {
        super();
        this.enableSmaa = enableSmaa;
        this.mModeMap = new Map();
    }

    init(renderer: WebGLRenderer, scene: Scene, camera: Camera): void {
        this.mRenderer = renderer;
        this.mScene = scene;
        this.mCamera = camera;
        this.mPrevColorSpace = renderer.outputColorSpace;
        renderer.outputColorSpace = LinearSRGBColorSpace;

        this.mComposer = new EffectComposer(renderer, { frameBufferType: HalfFloatType });

        const renderPass = new RenderPass(scene, camera);
        renderPass.renderToScreen = false;
        this.mComposer.addPass(renderPass);

        let smaaEffect: InstanceType<typeof SMAAEffect> | undefined;
        if (this.enableSmaa) {
            smaaEffect = new SMAAEffect({ preset: SMAAPreset.HIGH, edgeDetectionMode: EdgeDetectionMode.COLOR });
            (smaaEffect as unknown as { edgeDetectionMaterial: { setEdgeDetectionThreshold: (v: number) => void } }).edgeDetectionMaterial.setEdgeDetectionThreshold(0.05);
        }

        this.effect = new OutlineEffect(scene, camera, {
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

        this.effectDim = new OutlineEffect(scene, camera, {
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

        const outlinePass = new EffectPass(camera, this.effectDim, this.effect);
        this.mComposer.addPass(outlinePass);
        if (this.enableSmaa && smaaEffect) {
            this.mComposer.addPass(new EffectPass(camera, smaaEffect));
        }
    }

    onHullRegister(mesh: Mesh, mode: BorderEffectMode): void {
        this.mModeMap.set(mesh, mode);
        if (mode === "ambient" || mode === "hover") {
            this.effectDim!.selection.add(mesh);
        }
    }

    onHullUnregister(mesh: Mesh): void {
        this.effect!.selection.delete(mesh);
        this.effectDim!.selection.delete(mesh);
        this.mModeMap.delete(mesh);
    }

    onHullActive(mesh: Mesh): void {
        const mode = this.mModeMap.get(mesh);
        if (mode === "hover") {
            this.effectDim!.selection.delete(mesh);
            this.effect!.selection.add(mesh);
        }
    }

    onHullInactive(mesh: Mesh): void {
        const mode = this.mModeMap.get(mesh);
        if (mode === "hover") {
            this.effect!.selection.delete(mesh);
            this.effectDim!.selection.add(mesh);
        }
    }

    render(): void {
        const renderer = this.mRenderer!;
        const scene = this.mScene!;
        const camera = this.mCamera!;

        renderer.autoClear = false;
        renderer.autoClearStencil = false;

        camera.layers.set(0);
        this.mComposer!.render();

        renderer.autoClear = false;
        camera.layers.set(1);
        renderer.render(scene, camera);

        camera.layers.enableAll();
    }

    resize(width: number, height: number): void {
        if (this.mComposer) {
            this.mComposer.setSize(width, height);
        }
    }

    dispose(): void {
        if (this.mComposer) {
            this.mComposer.dispose();
            this.mComposer = undefined;
        }
        if (this.mRenderer) {
            this.mRenderer.autoClear = true;
            this.mRenderer.autoClearStencil = true;
            if (this.mPrevColorSpace !== undefined)
                this.mRenderer.outputColorSpace = this.mPrevColorSpace;
            this.mCamera!.layers.enableAll();
        }
    }
}
