import TextureAnimator from "./f0_TextureAnimator"

import dot9Image from "../../../img/dot9.png"
import dot7Image from "../../../img/dot7.png"
import ring2Image from "../../../img/ring2.png"
import ring3Image from "../../../img/ring3.png"

import { AdditiveBlending, BackSide, DoubleSide } from "three/src/constants.js";
import { BufferAttribute } from "three/src/core/BufferAttribute.js";
import { BufferGeometry } from "three/src/core/BufferGeometry.js";
import { BoxGeometry } from "three/src/geometries/BoxGeometry.js";
import { PlaneGeometry } from "three/src/geometries/PlaneGeometry.js";
import { SphereGeometry } from "three/src/geometries/SphereGeometry.js";
import { TextureLoader } from "three/src/loaders/TextureLoader.js";
import { MeshBasicMaterial } from "three/src/materials/MeshBasicMaterial.js";
import { PointsMaterial } from "three/src/materials/PointsMaterial.js";
import { Mesh } from "three/src/objects/Mesh.js";
import { Points } from "three/src/objects/Points.js";
import * as _ from "lodash";

export interface NodeEnv {
    valAccessor: (el: NodeEl) => number
    colorAccessor: (el: NodeEl) => number
    nodeRelSize: number
    nameAccessor: (el: NodeEl) => string
    sizeAccessor: (el: NodeEl) => number
    domEvents: DomEvents
    toolTipElem?: HTMLElement
}

export interface NodeEl {
    size?: number
    [key: string]: unknown
}

export interface DomEvents {
    addEventListener(mesh: Mesh | Points, event: string, handler: (e: DomEvent) => void, capture: boolean): void
    removeEventListener(mesh: Mesh | Points, event: string, handler: (e: DomEvent) => void, capture: boolean): void
    _notify(event: string, mesh: Mesh | Points, node: unknown, intersect: unknown): void
}

export interface DomEvent {
    stopPropagation(): void
    target: { node?: unknown; edge?: unknown }
    origDomEvent?: { ctrlKey?: boolean }
    intersect: { object: { node?: unknown } }
    type: string
}

interface ClassFactory {
    geometry: (env: NodeEnv, el: NodeEl) => BufferGeometry
    material: (env: NodeEnv, el: NodeEl) => MeshBasicMaterial | PointsMaterial
    instance: (env: NodeEnv, el: NodeEl) => Mesh | Points
    onAdd: (completeCallback?: () => void) => void
    onRemove: (completeCallback?: () => void) => void
    unique: boolean
    _unique_instance?: Mesh | Points
}

export interface ExtendedMesh extends Mesh {
    onAdd: (cb?: () => void) => void
    onRemove: (cb?: () => void) => void
    set: (attrName: string, options: unknown) => void
}

export interface ExtendedNode extends NodeEl {
    _bubble: Mesh
    _parent: { add(o: Mesh): void; remove(o: Mesh): void }
    _instances: Record<string, ExtendedMesh & { onAdd: (cb?: () => void) => void; onRemove: (cb?: () => void) => void }>
    isHighlighted?: boolean
    showHighlight?: () => void
    hideHighlight?: () => void
    getClassInstance: (className: string) => ExtendedMesh | undefined
    on: (eventName: string, handler: (e: DomEvent) => void) => void
    off: (eventName: string, handler: (e: DomEvent) => void) => void
    show: () => void
    hide: () => void
    trigger: (eventName: string, intersect: unknown, node: unknown) => void
    get3DRoot: () => Mesh
    getParentCluster: () => { getView?: () => { setTooltip(s: string): void } } | null
    addClass: (className: string) => ExtendedNode
    removeClass: (className: string) => ExtendedNode
    hasClass: (className: string) => boolean
    toggleClass: (className: string) => ExtendedNode
}

const _classes: Record<string, ClassFactory> = {};

export function register3DClass(className: string, options: Partial<ClassFactory>): void {
    const defaults: ClassFactory = {
        geometry: function (env: NodeEnv, el: NodeEl) {
            return new BoxGeometry(
                Math.cbrt(env.valAccessor(el) || 1) * env.nodeRelSize,
                Math.cbrt(env.valAccessor(el) || 1) * env.nodeRelSize,
                Math.cbrt(env.valAccessor(el) || 1) * env.nodeRelSize
            );
        },
        material: function (env: NodeEnv, el: NodeEl) {
            return new MeshBasicMaterial({ color: env.colorAccessor(el) || 0xffffff, transparent: true });
        },
        instance: function (this: ClassFactory, env: NodeEnv, el: NodeEl) {
            return new Mesh(this.geometry(env, el), this.material(env, el));
        },
        onAdd: function (completeCallback?: () => void) {
            if (completeCallback) completeCallback();
        },
        onRemove: function (completeCallback?: () => void) {
            if (completeCallback) completeCallback();
        },
        unique: false
    };

    const merged = _.merge({}, defaults, options) as ClassFactory;

    if (typeof _classes[className] != "undefined") throw new Error("className already registered: " + className);

    _classes[className] = merged;
}

export function _newClassViaFactory(className: string, env: NodeEnv, el: NodeEl): ExtendedMesh {
    const factory = _classes[className];
    if (!factory) {
        console.error("3d class " + className + " not found");

        const mMesh = new Mesh() as ExtendedMesh;
        mMesh.onAdd = function () {};
        mMesh.onRemove = function (c?: () => void) { if (c) c(); };
        mMesh.set = function () {};
        return mMesh;
    }

    if (factory.unique && factory._unique_instance) return factory._unique_instance as ExtendedMesh;

    const mMesh = factory.instance(env, el) as ExtendedMesh;

    if (factory.unique) factory._unique_instance = mMesh;

    mMesh.onAdd = factory.onAdd;
    mMesh.onRemove = factory.onRemove;
    mMesh.set = function (attrName: string, options: unknown) {
        if (_.isObject(options)) {
            if (_.isObject((mMesh as Record<string, unknown>)[attrName]))
                Object.assign((mMesh as Record<string, unknown>)[attrName] as object, options);
            else
                (mMesh as Record<string, unknown>)[attrName] = options;
        } else {
            (mMesh as Record<string, unknown>)[attrName] = options;
        }
    };

    return mMesh;
}

function basicSpriteGeometry(): BufferGeometry {
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array([0, 0, 0]), 3));
    return geometry;
}

export function basicSpriteSize(env: NodeEnv, el: NodeEl, scale = 1): number {
    let size = (el.size as number | undefined) ? el.size as number : 32;
    size = Math.cbrt(size) * env.nodeRelSize;
    return (32 + size * 3) * scale;
}

register3DClass("basic-cube", {});

register3DClass("hull-hint", {
    geometry: function () {
        return new BoxGeometry(20, 20, 20);
    }
});

register3DClass("basic-cube-highlighted", {
    geometry: function () {
        return new BoxGeometry(11, 11, 11);
    },
    material: function () {
        return new MeshBasicMaterial({ color: 0xff0000, transparent: true });
    },
    unique: false
});

register3DClass("basic-sphere", {
    material: function (env: NodeEnv, el: NodeEl) {
        return new MeshBasicMaterial({ color: env.colorAccessor(el) || 0xffffff, transparent: true });
    },
    geometry: function (env: NodeEnv, el: NodeEl) {
        return new SphereGeometry(Math.cbrt(env.valAccessor(el) || 1) * env.nodeRelSize, 12, 10);
    },
    unique: false
});

register3DClass("basic-selection", {
    material: function () {
        return new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
    },
    geometry: function (env: NodeEnv, el: NodeEl) {
        return new SphereGeometry(Math.cbrt(env.valAccessor(el) || 1) * env.nodeRelSize / 3.5, 25, 25);
    },
    unique: true
});

const basicCollapsedSprite = new TextureLoader().load(dot9Image);

register3DClass("basic-sprite-collapsed", {
    geometry: basicSpriteGeometry,
    material: function (env: NodeEnv, el: NodeEl) {
        return new PointsMaterial({
            color: env.colorAccessor(el) || 0xffffff,
            size: basicSpriteSize(env, el),
            sizeAttenuation: true,
            map: basicCollapsedSprite,
            alphaTest: 0.0,
            transparent: true,
            opacity: 0.6,
            depthTest: false
        });
    },
    instance(env: NodeEnv, el: NodeEl) {
        return new Points(this.geometry(env, el), this.material(env, el));
    },
    unique: false
});

const ring3Sprite = new TextureLoader().load(ring3Image);

register3DClass("basic-ring", {
    geometry: basicSpriteGeometry,
    material: function (env: NodeEnv, el: NodeEl) {
        return new PointsMaterial({
            color: env.colorAccessor(el) || 0xffffff,
            size: basicSpriteSize(env, el),
            sizeAttenuation: true,
            map: ring3Sprite,
            alphaTest: 0.0,
            transparent: true,
            opacity: 0.6,
            depthTest: false
        });
    },
    instance(env: NodeEnv, el: NodeEl) {
        return new Points(this.geometry(env, el), this.material(env, el));
    },
    unique: false
});

const ring2Sprite = new TextureLoader().load(ring2Image);

register3DClass("basic-ring-2", {
    geometry: basicSpriteGeometry,
    material: function (env: NodeEnv, el: NodeEl) {
        return new PointsMaterial({
            color: env.colorAccessor(el) || 0xffffff,
            size: basicSpriteSize(env, el),
            sizeAttenuation: true,
            map: ring2Sprite,
            alphaTest: 0.0,
            transparent: true,
            opacity: 0.6,
            depthTest: false
        });
    },
    instance(env: NodeEnv, el: NodeEl) {
        return new Points(this.geometry(env, el), this.material(env, el));
    },
    unique: false
});

register3DClass("basic-animated", {
    geometry: basicSpriteGeometry,
    material: function (env: NodeEnv, el: NodeEl) {
        const runnerTexture = new TextureLoader().load('img/run.png');
        const annie = new TextureAnimator(runnerTexture, 10, 1, 10, 75);

        function animate(time = 0) {
            requestAnimationFrame(animate);
            annie.update(time / 1000);
        }
        requestAnimationFrame(animate);

        return new PointsMaterial({
            color: env.colorAccessor(el) || 0xffffff,
            size: basicSpriteSize(env, el),
            sizeAttenuation: true,
            map: runnerTexture,
            alphaTest: 0.0,
            transparent: true,
            opacity: 0.6,
            depthTest: false
        });
    },
    instance(env: NodeEnv, el: NodeEl) {
        return new Points(this.geometry(env, el), this.material(env, el));
    },
    unique: false
});

const expandedSprite = new TextureLoader().load("img/minus-square-o.png");

register3DClass("basic-sprite-expanded", {
    geometry: basicSpriteGeometry,
    material: function (env: NodeEnv, el: NodeEl) {
        return new PointsMaterial({
            color: env.colorAccessor(el) || 0xffffff,
            size: basicSpriteSize(env, el),
            sizeAttenuation: true,
            map: expandedSprite,
            alphaTest: 0.0,
            transparent: true,
            opacity: 0.6,
            depthTest: false
        });
    },
    instance(env: NodeEnv, el: NodeEl) {
        return new Points(this.geometry(env, el), this.material(env, el));
    },
    unique: false
});

const basicSprite = new TextureLoader().load(dot7Image);

register3DClass("basic-sprite", {
    geometry: basicSpriteGeometry,
    material: function (env: NodeEnv, el: NodeEl) {
        return new PointsMaterial({
            color: env.colorAccessor(el) || 0xffffff,
            size: basicSpriteSize(env, el),
            sizeAttenuation: true,
            map: basicSprite,
            alphaTest: 0.0,
            transparent: true,
            opacity: 0.6,
            depthTest: false
        });
    },
    instance(env: NodeEnv, el: NodeEl) {
        return new Points(this.geometry(env, el), this.material(env, el));
    },
    unique: false
});

register3DClass("node-highlighted", {
    geometry: basicSpriteGeometry,
    material: function (env: NodeEnv, el: NodeEl) {
        const sprite = new TextureLoader().load(dot7Image);
        return new PointsMaterial({
            color: env.colorAccessor(el) || 0xffffff,
            size: basicSpriteSize(env, el) * 1.8,
            sizeAttenuation: true,
            map: sprite,
            alphaTest: 0.0,
            transparent: true,
            opacity: 1.6,
            depthTest: false
        });
    },
    instance(env: NodeEnv, el: NodeEl) {
        return new Points(this.geometry(env, el), this.material(env, el));
    },
    unique: false
});

export function basicElementExtend(env: NodeEnv, obj: NodeEl, _mesh: Mesh): ExtendedNode {
    const mDomEvents = env.domEvents;

    const self = _.extend(obj, {
        _instances: {} as ExtendedNode['_instances'],
        getClassInstance(className: string) {
            return this._instances[className];
        },
        on(eventName: string, eventhandler: (e: DomEvent) => void) {
            mDomEvents.addEventListener(_mesh, eventName, eventhandler, false);
        },
        off(eventName: string, eventhandler: (e: DomEvent) => void) {
            mDomEvents.removeEventListener(_mesh, eventName, eventhandler, false);
        },
        show() {
            const el = this.get3DRoot();
            this._parent.add(el);
            el.updateMatrixWorld();
        },
        hide() {
            this._parent.remove(this.get3DRoot());
        },
        trigger(eventName: string, intersect: unknown, node: unknown) {
            mDomEvents._notify(eventName, _mesh, node, intersect);
        },
        get3DRoot() {
            return this._bubble;
        },
        getParentCluster() {
            const el = this.get3DRoot();
            if (!el || !(el as unknown as { _parent?: { parent?: unknown } })._parent) return null;
            return (el as unknown as { _parent: { parent: unknown } })._parent.parent as ExtendedNode['getParentCluster'] extends () => infer R ? R : never;
        },
        addClass(className: string): ExtendedNode {
            for (const name of className.split(" ")) {
                if (this.hasClass(name)) continue;
                const mMesh = this._instances[name] ?? (this._instances[name] = _newClassViaFactory(name, env, obj));
                this.get3DRoot().add(mMesh);
                mMesh.onAdd();
            }
            return this;
        },
        removeClass(className: string): ExtendedNode {
            for (const name of className.split(" ")) {
                if (this._instances[name]) {
                    const mMesh = this._instances[name];
                    mMesh.onRemove(() => this.get3DRoot().remove(mMesh));
                }
            }
            return this;
        },
        hasClass(className: string): boolean {
            const mMesh = this._instances[className];
            return this.get3DRoot().children.indexOf(mMesh) >= 0;
        },
        toggleClass(className: string): ExtendedNode {
            for (const name of className.split(" ")) {
                if (this.hasClass(name))
                    this.removeClass(name);
                else
                    this.addClass(name);
            }
            return this;
        }
    }) as ExtendedNode;

    return self;
}
