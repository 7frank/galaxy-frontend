import { Mesh } from "three/src/objects/Mesh.js";

export type EffectMode = "hover" | "ambient" | "none"

export default class BaseHullEffect {
    onAttach(mesh: Mesh): void {}
    onDetach(mesh: Mesh): void {}
    onActive(mesh: Mesh): void {}
    onInactive(mesh: Mesh): void {}
    dispose(): void {}
}
