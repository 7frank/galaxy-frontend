/**
 * Created by Frank on 13.06.2017.
 *
 * a view class to be able to use multiple views and switch between them
 * also can limit fps to lower gpu impact
 * see shadertoy for possible usage as thumbnail or preview
 */


import DomEventsAlt from "../cluster/utils/DomEventsAlt"
import "./View3D.css"

import { OrthographicCamera } from "three/src/cameras/OrthographicCamera.js";
import { PerspectiveCamera } from "three/src/cameras/PerspectiveCamera.js";
import { Vector2 } from "three/src/math/Vector2.js";
import { Vector3 } from "three/src/math/Vector3.js";
import { WebGLRenderer } from "three/src/renderers/WebGLRenderer.js";
import { Scene } from "three/src/scenes/Scene.js";
import { Object3D } from "three/src/core/Object3D.js";
import { CombinedCamera } from "../lib/CombinedCamera";
import { TrackballControls } from "../lib/TrackballControls";


/**
 * View3D manages a Three.js 3D canvas inside a given DOM container element.
 * Pass a DOM element as the first constructor argument.
 *
 * Note: to customise FPS set the properties 'minFPS' or 'maxFPS'
 */

export interface BorderEffect {
    init(renderer: WebGLRenderer, scene: Scene, camera: View3D['mCamera']): void
    render(): void
    resize(width: number, height: number): void
    dispose(): void
}

export default class View3D extends EventTarget {

    el: HTMLElement
    isRunning: boolean
    mTime: number
    mActualFPS: number
    mouseSpeed: number
    mRenderer: WebGLRenderer
    mScene: Scene
    mCamera: CombinedCamera | PerspectiveCamera | OrthographicCamera
    mCameraP: PerspectiveCamera
    mCameraO: OrthographicCamera
    mControls: InstanceType<typeof TrackballControls>
    mDomEvents: InstanceType<typeof DomEventsAlt>
    mBorderEffect: BorderEffect | null
    mCaption: HTMLSpanElement | undefined
    toolTipElem: HTMLDivElement | undefined
    mouse: Vector2 | undefined
    mFPS: number
    minFPS: number
    maxFPS: number
    mLastFrameTime: number
    mFrameId: number
    name: string
    _inited_static_: boolean

    constructor(el: HTMLElement) {
        super();

        this.el = el || document.createElement("div");
        this.el.classList.add("view-3d");
        (this.el as HTMLElement & { _view3d?: View3D })._view3d = this;

        this.isRunning = false;

        this.mTime = -1;
        this.mActualFPS = 0;

        this.mouseSpeed = 2;

        this.mRenderer = new WebGLRenderer({
            antialias: true
        });

        this.el.addEventListener("resize", () => this.resizeCanvas())
    }

    get clientWidth(): number { return this.el.clientWidth }
    get clientHeight(): number { return this.el.clientHeight }

    /**
     * initialise the camera classes with some default values
     */
    createCamera(): void {

        var initialCameraPosition = new Vector3(-5500, -4000, 50000);

        this.mCameraP = new PerspectiveCamera();

        this.mCameraO = new OrthographicCamera();
        this.mCameraO.far = 5000000;
        this.mCameraO.lookAt(this.mScene.position);
        this.mCameraO.position.copy(initialCameraPosition)

        this.mCamera = new CombinedCamera();

        if (this.mCamera instanceof CombinedCamera) {
            this.mCamera.setFar(5000000);
            this.mCamera.setFov(50);
        } else {
            (this.mCamera as PerspectiveCamera | OrthographicCamera).far = 5000000;
        }

        this.mCamera.lookAt(this.mScene.position);
        this.mCamera.position.copy(initialCameraPosition)
    }


    /**
     * Add user (mouse,keyboard) interaction
     */
    createControls(): void {
        this.mControls = new TrackballControls(this.mCamera, this.mRenderer.domElement);

        this.mControls.maxDistance = Math.min((this.mCamera as { far: number }).far, 200000);

        (this.mControls as unknown as EventTarget).addEventListener("change", (e: Event) => this.dispatchEvent(new CustomEvent("change", {detail: e})));
    }


    /**
     * initialise THREEx helper class that provides dom-like mouse events for 3D elements
     */
    createDomEvents(): void {
        this.mDomEvents = new DomEventsAlt(this.mCamera, this.mRenderer.domElement, this.mScene);
    }


    /**
     * updates the camera and dependant controls and events classes
     */
    updateCamera(): void {
        this.mCamera.updateProjectionMatrix();

        this.mControls.object = this.mCamera

        this.mDomEvents._camera = this.mCamera
    }

    /**
     * set the camera to orthographic mode
     */
    set2D(): void {
        this.mCamera = this.mCameraO
        this.updateCamera()
    }


    /**
     * set the camera to perspective mode
     */
    set3D(): void {
        this.mCamera = this.mCameraP
        this.updateCamera()
    }


    /**
     * updates the 3D context to match the dimensions of the HTML container element
     */
    resizeCanvas(): void {
        if (this.mRenderer && this.mCamera) {
            this.mRenderer.setSize(this.el.clientWidth, this.el.clientHeight);
            if ('aspect' in this.mCamera) (this.mCamera as PerspectiveCamera).aspect = this.el.clientWidth / this.el.clientHeight;

            if (this.mCamera instanceof CombinedCamera)
                this.mCamera.setSize(this.el.clientWidth, this.el.clientHeight);
            this.mCamera.updateProjectionMatrix();

            let camFactor = 2
            this.mCameraO.left = -this.el.clientWidth / camFactor;
            this.mCameraO.right = this.el.clientWidth / camFactor;
            this.mCameraO.top = this.el.clientHeight / camFactor;
            this.mCameraO.bottom = -this.el.clientHeight / camFactor;
            this.mCameraO.updateProjectionMatrix();
        }

        if (this.mRenderer && this.mControls) {
            this.mControls.handleResize();
            this.mControls.panSpeed = 1600 / this.el.clientWidth * this.mouseSpeed * 0.3
            this.mControls.rotateSpeed = 1600 / this.el.clientWidth * this.mouseSpeed
        }

        if (this.mBorderEffect) {
            this.mBorderEffect.resize(this.el.clientWidth, this.el.clientHeight);
        }
    }


    /**
     * sets the value of a text element that functions as a caption.
     */
    setCaption(text: string): this {

        if (!this.mCaption) {
            this.mCaption = document.createElement("span");
            this.mCaption.className = "view-3d-caption";
            this.el.appendChild(this.mCaption);
        }

        this.mCaption.textContent = text;
        return this
    }


    /**
     * set up controls, scene, renderer, animation
     */
    initStatic(): this | undefined {

        if (this._inited_static_) return;
        var that = this;

        this.createTooltip();

        this.mFPS = 0.5;
        this.minFPS = this.minFPS || 0;
        this.maxFPS = this.maxFPS || 144;

        this.mLastFrameTime = -1;

        this.setCaption(this.name)

        this.mScene = new Scene();

        (window as Window & { scene?: Scene }).scene = this.mScene;

        this.createCamera();

        this.mRenderer.setClearColor(0x000000);
        this.mRenderer.setPixelRatio(window.devicePixelRatio);

        this.el.appendChild(this.mRenderer.domElement);

        Object.assign(this.mRenderer.domElement.style, {position: "absolute", top: 0, left: 0, width: "100%", height: "100%"});

        this.createDomEvents();

        this.mRenderer.domElement.addEventListener("mouseover", function (e) {

            if (that.isMaximised()) return;

            e.stopPropagation();
            that.setActive();

            that.el.setAttribute("hasFocus", "true");

            that.mCaption!.style.opacity = "0"
        });

        this.mRenderer.domElement.addEventListener("mouseout", function (e) {

            if (that.isMaximised()) return;

            e.stopPropagation();

            that.el.removeAttribute("hasFocus");
            if (!that.el.classList.contains("view-3d-maximised")) {
                that.mCaption!.style.opacity = "1";
                that.setInactive();
            }
        });

        this.createControls();

        this.resizeCanvas();

        if (this.mBorderEffect) {
            this.mBorderEffect.init(this.mRenderer, this.mScene, this.mCamera);
        }

        this._inited_static_ = true;

        return this
    }


    /**
     * Enable or disable stencil tests.
     */
    setStencil(bTrue: boolean): void {

        var gl = this.mRenderer.getContext();

        if (bTrue)
            gl.enable(gl.STENCIL_TEST);
        else
            gl.disable(gl.STENCIL_TEST);
    }


    setBorderEffect(borderEffect: BorderEffect): void {
        this.mBorderEffect = borderEffect;
        if (this._inited_static_) {
            borderEffect.init(this.mRenderer, this.mScene, this.mCamera);
        }
    }

    /**
     * wrapper method to call renderer
     */
    render(): void {

        if (this.mBorderEffect) {
            this.mBorderEffect.render();
        } else {
            this.mRenderer.render(this.mScene, this.mCamera);
        }
    }

    /**
     * start the main animation loop for the 3D context
     */
    animate(): void {

        if (this.isRunning) return
        this.isRunning = true;

        console.log("starting 'view-3d' animation loop")
        var initialFrames = 0;
        var that = this;
        var accTime = 0, accFrames = 0;

        function doAnimate(time: number) {
            that.mTime = time;
            initialFrames--;
            if (that.mFPS == 0) {

                if (initialFrames < 0) {
                    that.mFrameId = requestAnimationFrame(doAnimate);
                    return;
                }
            } else {

                let nextTime = that.mLastFrameTime + (1000 / that.mFPS);
                if (nextTime > time) {
                    that.mFrameId = requestAnimationFrame(doAnimate);
                    return;
                }
            }

            if (that.mLastFrameTime < 0) {
                that.mLastFrameTime = time;
                that.mFrameId = requestAnimationFrame(doAnimate);
                return;
            }

            accTime += time - that.mLastFrameTime;
            accFrames++;

            if (accTime > 1000) {
                that.mActualFPS = Math.round(accFrames * 1000 / accTime);
                accTime = 0;
                accFrames = 0;
            }

            that.mLastFrameTime = time;

            if (that.mControls) that.mControls.update();

            that.dispatchEvent(new CustomEvent("before-render", {detail: time}));

            that.render()

            that.dispatchEvent(new CustomEvent("after-render", {detail: time}));

            that.mFrameId = requestAnimationFrame(doAnimate);
        }

        doAnimate(-1)
    }


    /**
     * convenience method to add 3d elements
     */
    add(object3D: Object3D): void {
        this.mScene.add(object3D)
    }


    /**
     * Maximises the view within the available browser window.
     */
    maximise(): void {
        this.el.classList.add("view-3d-maximised");

        if (this.mCaption) this.mCaption.style.opacity = "0";

        this.setActive()
    }

    /**
     * tests if the view is maximised
     */
    isMaximised(): boolean {
        return this.el.classList.contains("view-3d-maximised")
    }


    /**
     * reverts the effects of maximise
     */
    undoMaximise(): void {
        this.el.classList.remove("view-3d-maximised");
        this.setInactive()
    }


    /**
     * setting a view active will result in the renderer using the maximum allowed FPS.
     */
    setActive(): void {
        this.mFPS = this.maxFPS;
        this.resizeCanvas();
        this.start();
    }

    /**
     * setting a view inactive will result in the renderer using only the minFPS value.
     */
    setInactive(): void {
        this.mFPS = this.minFPS;
        this.resizeCanvas()
    }


    /**
     * access method to start rendering the 3D content
     */
    start(): void {
        this.stop();
        this.animate()
    }


    /**
     * access method to stop rendering the 3D content
     */
    stop(): void {
        if (this.isRunning) {
            window.cancelAnimationFrame(this.mFrameId)
            this.isRunning = false;
        }
    }


    /**
     * convenience method
     */
    resume(): void {
        this.start()
    }


    /**
     * starts the animation loop and shows the dom element
     */
    show(): void {
        this.resume()
        this.el.style.display = ""
    }


    /**
     * stops the animation loop and hides the dom element
     */
    hide(): void {
        this.stop()
        this.el.style.display = "none"
    }


    /**
     * Initialise the 3D context and start the rendering loop.
     * Call this after appending el to the DOM.
     */
    init(): void {
        this.createTooltip();
        this.initStatic();
        this.start();
        this.dispatchEvent(new CustomEvent("connected"))
    }

    /**
     * Create the DOM element for the tooltip element
     */
    createTooltip(): void {

        if (this.toolTipElem) return;

        this.toolTipElem = document.createElement('div');
        this.toolTipElem.classList.add('graph-tooltip');

        Object.assign(this.toolTipElem.style, {
            zIndex: 1,
            position: "absolute",
            userSelect: "none"
        });

        this.el.appendChild(this.toolTipElem);

        this.mouse = new Vector2();
        this.mouse.x = -2;
        this.mouse.y = -2;
        this.el.addEventListener("mousemove", ev => {

            const offset = getOffset(this.el),
                relPos = {
                    x: ev.pageX - offset.left,
                    y: ev.pageY - offset.top
                };
            this.mouse!.x = (relPos.x / this.el.clientWidth) * 2 - 1;
            this.mouse!.y = -(relPos.y / this.el.clientHeight) * 2 + 1;
            this.toolTipElem!.style.top = (relPos.y - 40) + 'px';
            this.toolTipElem!.style.left = (relPos.x - 20) + 'px';

            function getOffset(el: HTMLElement) {
                const rect = el.getBoundingClientRect(),
                    scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
                    scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                return {
                    top: rect.top + scrollTop,
                    left: rect.left + scrollLeft
                };
            }
        }, false);
    }


    /**
     * set the content of the tooltip element
     */
    setTooltip(text: string | HTMLElement): void {

        this.toolTipElem!.innerHTML = "";
        if (typeof text === "string") this.toolTipElem!.innerHTML = text;
        else this.toolTipElem!.appendChild(text);
        this.toolTipElem!.style.display = "";
    }
}
