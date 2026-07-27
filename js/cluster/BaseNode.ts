/**
 * Created by Frank on 02.06.2017.
 */

import AnimationMixin from "../utils/AnimationMixin"
import DomEventsAlt from "./utils/DomEventsAlt"
import type View3D from "../view/View3D"

import { BackSide } from "three/src/constants.js";
import { BufferGeometry } from "three/src/core/BufferGeometry.js";
import { SphereGeometry } from "three/src/geometries/SphereGeometry.js";
import { MeshBasicMaterial } from "three/src/materials/MeshBasicMaterial.js";
import { Sphere } from "three/src/math/Sphere.js";
import { Vector3 } from "three/src/math/Vector3.js";
import { Mesh } from "three/src/objects/Mesh.js";
import * as _ from "lodash";

import Mousetrap from "mousetrap";

export default class BaseNode extends Mesh {

    static sphereGeometry: SphereGeometry
    static emptyGeometry: BufferGeometry
    static lastSelectedNode: BaseNode | null
    static lastHoveredNode: BaseNode | null
    static _static_initialised_: boolean

    mParentView: View3D | null
    mCustomEvents: EventTarget
    mCustomEventNames: string[]
    mKeyboardEvents: ReturnType<typeof Mousetrap>
    declare animate: (props: Record<string, number>, duration?: number, onComplete?: () => void, onStep?: () => void) => void

    constructor(view: View3D | null) {
        BaseNode.initStatic();

        const material = new MeshBasicMaterial({
            color: 0xffffff,
            visible: true,
            opacity: 0.01,
            side: BackSide,
            transparent: true,
            alphaTest: 0.99
        });

        super(BaseNode.sphereGeometry, material);

        this.mCustomEventNames = [];
        this.registerCustomEvent('before-render');

        if (view)
            this.setView(view);

        this.mCustomEvents = new EventTarget();

        this.addDefaultHandlers();

        this.mKeyboardEvents = new Mousetrap(document.createElement("span"));

        AnimationMixin(this);
    }

    getView(): View3D | null {
        return this.mParentView;
    }

    setView(view3d: View3D | null): this {
        this.mParentView = view3d;
        return this;
    }

    static initStatic(): void {
        if (BaseNode._static_initialised_) return;

        BaseNode.sphereGeometry = new SphereGeometry(10, 10, 5);
        BaseNode.emptyGeometry = new BufferGeometry();
        BaseNode.emptyGeometry.boundingSphere = new Sphere(new Vector3(), 1);

        BaseNode.lastSelectedNode = null;
        BaseNode.lastHoveredNode = null;
        BaseNode._static_initialised_ = true;

        window.addEventListener("keydown", function (e: KeyboardEvent) {
            if (!BaseNode.lastHoveredNode) return;
            BaseNode.lastHoveredNode.resolveKeyEvent(e);
        });
    }

    getRegisteredCustomEvents(): string[] {
        return this.mCustomEventNames;
    }

    registerCustomEvent(eventName: string): void {
        if (!this.mCustomEventNames) this.mCustomEventNames = [];
        this.mCustomEventNames.push(eventName);
    }

    isCustomEvent(eventName: string): boolean {
        return this.getRegisteredCustomEvents().indexOf(eventName) >= 0;
    }

    isMouseEvent(eventName: string): boolean {
        return DomEventsAlt.eventNames.indexOf(eventName) >= 0;
    }

    onCustomEvent(eventName: string, eventhandler: Function): void {
        this.mCustomEvents.addEventListener(eventName, eventhandler.bind(this) as EventListener);
    }

    offCustomEvent(eventName: string, eventhandler: EventListener): void {
        this.mCustomEvents.removeEventListener(eventName, eventhandler);
    }

    triggerCustomEvent(eventName: string, origDomEvent: Event | null, intersect?: object): void {
        this.mCustomEvents.dispatchEvent(new CustomEvent(eventName, { detail: { origDomEvent, intersect } }));
    }

    onKey(eventName: string, eventhandler: Function): void {
        const handler = _.throttle(eventhandler.bind(this), 100);
        this.mKeyboardEvents.bind(eventName, handler, 'keydown');
    }

    offKey(eventName: string, eventhandler: Function): void {
        this.mKeyboardEvents.unbind(eventName, eventhandler as EventListener);
    }

    triggerKey(eventName: string, origDomEvent?: Event, intersect?: object): void {
        this.mKeyboardEvents.trigger(eventName, origDomEvent, intersect);
    }

    resolveKeyEvent(event: KeyboardEvent): void {
        this.mKeyboardEvents.handleKey(event.key, [], event);
    }

    on(eventName: string, eventhandler: Function): this {
        for (const eName of eventName.split(" ")) {
            if (this.isCustomEvent(eName))
                this.onCustomEvent(eName, eventhandler);
            else if (this.isMouseEvent(eName))
                this.getDOMEvents().addEventListener(this, eName, eventhandler.bind(this), false);
            else
                this.onKey(eName, eventhandler);
        }
        return this;
    }

    off(eventName: string, eventhandler: EventListener): this {
        for (const eName of eventName.split(" ")) {
            for (const eNameInner of eventName.split(" ")) {
                if (this.isCustomEvent(eNameInner))
                    this.offCustomEvent(eNameInner, eventhandler);
                else if (this.isMouseEvent(eNameInner))
                    this.getDOMEvents().removeEventListener(this, eNameInner, eventhandler, false);
                else
                    this.offKey(eNameInner, eventhandler);
            }
        }
        return this;
    }

    trigger(eventName: string, origDomEvent?: Event | null, intersect?: object): this {
        for (const eName of eventName.split(" ")) {
            if (this.isCustomEvent(eName))
                this.triggerCustomEvent(eName, origDomEvent ?? null, intersect);
            else if (this.isMouseEvent(eName))
                this.getDOMEvents()._notify(eName, this, origDomEvent, intersect);
            else
                this.triggerKey(eName, origDomEvent ?? undefined, intersect);
        }
        return this;
    }

    addDefaultHandlers(): void {
        this.on("mouseover", function (this: BaseNode, e: Event & { target?: BaseNode; stopPropagation: () => void }) {
            e.stopPropagation();
            BaseNode.lastHoveredNode = e.target;
        });

        this.on("mouseout", function (this: BaseNode, e: Event & { stopPropagation: () => void }) {
            BaseNode.lastHoveredNode = null;
            e.stopPropagation();
        });

        function onBeforeRender(this: BaseNode) {
            this.trigger("before-render", null, arguments);
        }

        Object.defineProperty(this, "onBeforeRender", {
            enumerable: false,
            configurable: false,
            get: function (this: BaseNode) {
                return onBeforeRender.bind(this);
            }.bind(this),
            set: function (_newValue: unknown) {
                console.warn("onBeforeRender cannot be overridden use .on('before-render',function(){}) instead");
            }
        });

        this.on("before-render", function (this: BaseNode) {
            this.update();
        });
    }

    update(): void {}

    getDOMElement(): HTMLElement {
        throw new Error("implement method 'getDOMElement' in sub class (return valid domElement) ");
    }

    getDOMEvents(): InstanceType<typeof DomEventsAlt> {
        throw new Error("implement method 'getDOMEvents' in sub class (return valid THREEx.domEvents) ");
    }
}
