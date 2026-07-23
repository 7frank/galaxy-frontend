export default class BaseBorderEffect {

    init(renderer, scene, camera) {
        this.mRenderer = renderer;
        this.mScene = scene;
        this.mCamera = camera;
    }

    render() {
        if (this.mRenderer) {
            this.mRenderer.autoClear = true;
            this.mRenderer.render(this.mScene, this.mCamera);
        }
    }

    resize(width, height) {}

    dispose() {}

    onHullRegister(mesh, mode) {}

    onHullUnregister(mesh) {}

    onHullActive(mesh) {}

    onHullInactive(mesh) {}

}
