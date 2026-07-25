import { WebGLRenderer } from "three/src/renderers/WebGLRenderer.js";
import { Scene } from "three/src/scenes/Scene.js";
import { Camera } from "three/src/cameras/Camera.js";
import { Mesh } from "three/src/objects/Mesh.js";

export type BorderEffectMode = "hover" | "ambient" | "none"

export default class BaseBorderEffect {

    mRenderer: WebGLRenderer | undefined
    mScene: Scene | undefined
    mCamera: Camera | undefined

    init(renderer: WebGLRenderer, scene: Scene, camera: Camera): void {
        this.mRenderer = renderer;
        this.mScene = scene;
        this.mCamera = camera;
    }

    render(): void {
        if (this.mRenderer) {
            this.mRenderer.autoClear = true;
            this.mRenderer.render(this.mScene!, this.mCamera!);
        }
    }

    resize(width: number, height: number): void {}

    dispose(): void {}

    onHullRegister(mesh: Mesh, mode: BorderEffectMode): void {}

    onHullUnregister(mesh: Mesh): void {}

    onHullActive(mesh: Mesh): void {}

    onHullInactive(mesh: Mesh): void {}
}
