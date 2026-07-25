import { ArrowHelper } from "three/src/helpers/ArrowHelper.js";
import { Vector3 } from "three/src/math/Vector3.js";
import { Mesh } from "three/src/objects/Mesh.js";
import { Scene } from "three/src/scenes/Scene.js";
import * as _ from "lodash";

interface ArrowNodeRef {
    position: Vector3
    matrixWorld: { elements: number[] }
}

export interface ArrowEdge {
    source: {
        _bubble: ArrowNodeRef
        get3DRoot: () => Mesh
    }
    target: {
        _bubble: ArrowNodeRef
        get3DRoot: () => Mesh
    }
    arrow?: ArrowHelper | null
    _line?: Mesh
}

function _findSceneForMesh(mesh: Mesh | null, maxIter = 99): Scene | null {
    if (!mesh) return null;
    let current: typeof mesh.parent = mesh;
    while (current && current.parent && maxIter--) {
        if (current.parent instanceof Scene) return current.parent;
        current = current.parent;
    }
    return null;
}

export function addArrow(d3LinkObj: ArrowEdge, color?: number, options?: { highlightArrowType?: string }): void {
    const defaults = { highlightArrowType: "line" };
    const env = _.extend(defaults, options);

    if (d3LinkObj.arrow) return;

    const from0 = new Vector3();
    from0.setFromMatrixPosition(d3LinkObj.source._bubble.matrixWorld as unknown as Parameters<Vector3['setFromMatrixPosition']>[0]);

    const to0 = new Vector3();
    to0.setFromMatrixPosition(d3LinkObj.target._bubble.matrixWorld as unknown as Parameters<Vector3['setFromMatrixPosition']>[0]);

    if (!to0) return;

    let arrowHelper: ArrowHelper | undefined;

    if (env.highlightArrowType == "line") {
        const dir = to0.clone().sub(from0);
        const len = dir.length();
        arrowHelper = new ArrowHelper(dir.normalize(), from0, len, color ?? 0x0000FF, 0.001, 0.001);
    } else if (env.highlightArrowType == "simple") {
        const distVec = to0.clone().sub(from0);
        const len = distVec.length();
        distVec.multiplyScalar(0.9);
        const from = from0.clone().add(distVec);
        const to = to0.clone().sub(distVec);
        const direction = to.clone().sub(from);
        const length = direction.length();
        const headLength = 0.2 * len * 0.2;
        arrowHelper = new ArrowHelper(direction.normalize(), from, length, color ?? 0x0000FF, headLength, 0.4 * headLength);
    }

    if (!arrowHelper) return;

    d3LinkObj.arrow = arrowHelper;

    const scene = _findSceneForMesh(d3LinkObj.source.get3DRoot()) ?? _findSceneForMesh(d3LinkObj.target.get3DRoot());

    if (!scene) {
        console.warn("no scene found arrows can't be created");
    } else {
        scene.add(arrowHelper);
    }
}

export function removeArrow(d3LinkObj: ArrowEdge): void {
    if (!d3LinkObj.arrow) return;

    if (d3LinkObj.arrow) {
        const parent = d3LinkObj.arrow.parent;
        if (parent) parent.remove(d3LinkObj.arrow);
        d3LinkObj.arrow = null;
    }
}
