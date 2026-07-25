import type { Material } from "three/src/materials/Material.js";

export type FadeMaterial<T extends Material = Material> = T & {
    fade?: number
    fadeTo?: (target: number, duration: number, onComplete?: () => void) => void
}
