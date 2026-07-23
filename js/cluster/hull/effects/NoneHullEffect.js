import BaseHullEffect from "./BaseHullEffect";

export default class NoneHullEffect extends BaseHullEffect {
    onAttach(mesh) {
        mesh.visible = false;
    }
    onDetach(mesh) { mesh.visible = true; }
}
