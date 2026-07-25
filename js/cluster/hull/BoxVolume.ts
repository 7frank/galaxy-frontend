/**
 * Created by Frank on 22.06.2017.
 */

import BaseVolume from "./BaseVolume"
import { Material } from "three/src/materials/Material.js";
import { Mesh } from "three/src/objects/Mesh.js";

/**
 * A slight (and visible) derivative of it's base class {@link BaseVolume}
 */

export default class BoxVolume extends BaseVolume {

    constructor() {
        super();
        this.maxOpacity = 0.1;
        (this.getMaterial() as any).transparent = true;
    }

    transferFunction(x: number): number {
        return 1
    }

    setLOD(newLOD: number): void {
        super.setLOD(newLOD);

        let y = this.transferFunction(newLOD)
        if (this.mesh && (this.mesh as Mesh).material) {
            const mat = (this.mesh as Mesh).material as Material;
            (mat as any).opacity = this.maxOpacity * y;

            if (y <= 0)
                mat.visible = false;
            else
                mat.visible = true;
        }
    }

    canBeVisible(): boolean {
        return true
    }
}
