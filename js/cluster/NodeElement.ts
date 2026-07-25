import BaseNode from "./BaseNode"
import type View3D from "../view/View3D"
import type { NodeEnv, ExtendedMesh, NodeEl } from "./refactor/f0-basic-element-3d-classes"
import { basicSpriteSize, _newClassViaFactory } from "./refactor/f0-basic-element-3d-classes"
import type { ArrowEdge } from "./refactor/f5-arrows"
import type DomEventsAlt from "./utils/DomEventsAlt"

import { SphereGeometry } from "three/src/geometries/SphereGeometry.js";
import { MeshBasicMaterial } from "three/src/materials/MeshBasicMaterial.js";
import { Object3D } from "three/src/core/Object3D.js";
import type { BufferGeometry } from "three/src/core/BufferGeometry.js";

export interface NodeElementData {
    name?: string
    color?: number
    val?: number
    itemCount?: number
    size?: number
    [key: string]: unknown
}

export default class NodeElement extends BaseNode {

    private static _sharedGeometry: SphereGeometry | null = null
    private static _sharedMaterial: MeshBasicMaterial | null = null

    x = 0
    y = 0
    z = 0
    color?: number
    size?: number
    _id?: string
    name?: string

    edges: ArrowEdge[] = []
    children: NodeElement[] = []
    parents: NodeElement[] = []

    _instances: Record<string, ExtendedMesh> = {}
    _parent: Object3D | null = null
    isHighlighted = false
    text?: { addClass?: (s: string) => void; removeClass?: (s: string) => void }

    private readonly _env: NodeEnv

    addDefaultHandlers(): void {
        if (!this._env) return;
        super.addDefaultHandlers();
    }

    constructor(view: View3D | null, env: NodeEnv, data: NodeElementData = {}) {
        super(view);

        this._env = env;
        super.addDefaultHandlers();

        if (!NodeElement._sharedGeometry)
            NodeElement._sharedGeometry = new SphereGeometry(1, 3, 2);

        if (!NodeElement._sharedMaterial)
            NodeElement._sharedMaterial = new MeshBasicMaterial({
                color: 0xffff00,
                wireframe: true,
                visible: false,
                opacity: 1,
                transparent: true,
                alphaTest: 0.99
            });

        this.geometry = NodeElement._sharedGeometry as unknown as BufferGeometry;
        this.material = NodeElement._sharedMaterial;

        this.color = data.color;
        this.size = data.itemCount ?? data.size;
        this.name = data.name ?? '';

        const sz = basicSpriteSize(env, this as unknown as NodeEl) / 5;
        this.scale.setScalar(sz);
    }

    get _bubble(): this { return this; }

    getDOMEvents(): InstanceType<typeof DomEventsAlt> {
        return this._env.domEvents as unknown as InstanceType<typeof DomEventsAlt>;
    }

    getDOMElement(): HTMLElement {
        return document.body;
    }

    show(): void {
        if (this._parent) {
            this._parent.add(this);
            this.updateMatrixWorld();
        }
    }

    hide(): void {
        if (this._parent) this._parent.remove(this);
    }

    get3DRoot(): this { return this; }

    getParentCluster(): Object3D | null {
        if (!this.parent) return null;
        return this.parent.parent;
    }

    showHighlight(): void {
        this.show();
        if (this.isHighlighted) return;
        this.isHighlighted = true;
        this.addClass("node-highlighted");
        if (this.text?.addClass) this.text.addClass("node-caption-highlighted");
    }

    hideHighlight(): void {
        this.hide();
        if (!this.isHighlighted) return;
        this.isHighlighted = false;
        this.removeClass("node-highlighted");
        if (this.text?.removeClass) this.text.removeClass("node-caption-highlighted");
    }

    addClass(className: string): this {
        for (const name of className.split(" ")) {
            if (this.hasClass(name)) continue;
            const mesh = this._instances[name]
                ?? (this._instances[name] = _newClassViaFactory(name, this._env, this as unknown as NodeEl));
            this.add(mesh);
            mesh.onAdd?.();
        }
        return this;
    }

    removeClass(className: string): this {
        for (const name of className.split(" ")) {
            const mesh = this._instances[name];
            if (mesh) mesh.onRemove?.(() => this.remove(mesh));
        }
        return this;
    }

    hasClass(className: string): boolean {
        const mesh = this._instances[className];
        return !!mesh && this.children.indexOf(mesh) >= 0;
    }

    toggleClass(className: string): this {
        for (const name of className.split(" ")) {
            if (this.hasClass(name)) this.removeClass(name);
            else this.addClass(name);
        }
        return this;
    }
}
