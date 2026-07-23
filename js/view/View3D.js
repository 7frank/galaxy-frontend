/**
 * Created by Frank on 13.06.2017.
 *
 * a view class to be able to use multiple views and switch between them
 * also can limit fps to lower gpu impact
 * see shadertoy for possible usage as thumbnail or preview
 */


import DomEventsAlt from "../cluster/utils/DomEventsAlt"
import "./View3D.css"

import * as THREE from "three";
import "../lib/CombinedCamera"
import "../lib/TrackballControls"

import * as $ from "jquery"


/**
 * View3D manages a Three.js 3D canvas inside a given DOM container element.
 * Pass a DOM element as the first constructor argument.
 *
 * Note: to customise FPS set the properties 'minFPS' or 'maxFPS'
 */


export default class View3D extends EventTarget {

    constructor(el) {
        super();

        this.el = el || document.createElement("div");
        this.el.classList.add("view-3d");

        this.isRunning = false;

        this.mTime = -1;
        this.mActualFPS = 0;
        this.showFPSCounter = false;
        this.mouseSpeed = 2;

        // Setup renderer
        this.mRenderer = new THREE.WebGLRenderer({
            antialias: true
        });

        this.el.addEventListener("resize", () => this.resizeCanvas())

    }

    get clientWidth() { return this.el.clientWidth }
    get clientHeight() { return this.el.clientHeight }

    /**
     * initialise the camera classes with some default values
     */

    createCamera() {

        var initialCameraPosition = new THREE.Vector3(-5500, -4000, 50000);


        // Setup camera
        this.mCameraP = new THREE.PerspectiveCamera();


        this.mCameraO = new THREE.OrthographicCamera();
        this.mCameraO.far = 5000000;
        this.mCameraO.lookAt(this.mScene.position);
        this.mCameraO.position.copy(initialCameraPosition)


        this.mCamera = new THREE.CombinedCamera();

        if (this.mCamera instanceof THREE.CombinedCamera) {
            this.mCamera.setFar(5000000);

            this.mCamera.setFov(50);
        }
        else
            this.mCamera.far = 5000000;


        this.mCamera.lookAt(this.mScene.position);
        this.mCamera.position.copy(initialCameraPosition)


    }


    /**
     *  Add user (mouse,keyboard) interaction
     */

    createControls() {
        this.mControls = new THREE.TrackballControls(this.mCamera, this.mRenderer.domElement);

        this.mControls.maxDistance = Math.min(this.mCamera.far, 200000);

        this.mControls.addEventListener("change", (e) => this.dispatchEvent(new CustomEvent("change", {detail: e})));

    }


    /**
     * initialise THREEx helper class that provides dom-like mouse events for 3D elements
     */
    createDomEvents() {

        this.mDomEvents = new DomEventsAlt(this.mCamera, this.mRenderer.domElement, this.mScene);

    }


    /**
     * updates the camera and dependant controls and events classes
     */
    updateCamera() {
        this.mCamera.updateProjectionMatrix();

        this.mControls.object = this.mCamera

        this.mDomEvents._camera = this.mCamera

    }

    /**
     * set the camera to orthographic mode
     */

    set2D() {

        this.mCamera = this.mCameraO

        this.updateCamera()

    }


    /**
     * set the camera to perspective mode
     */
    set3D() {

        this.mCamera = this.mCameraP

        this.updateCamera()

    }


    /**
     * updates the 3D context to match the dimensions of the HTML container element
     */
    resizeCanvas() {
        if (this.mRenderer && this.mCamera) {
            this.mRenderer.setSize(this.el.clientWidth, this.el.clientHeight);
            this.mCamera.aspect = this.el.clientWidth / this.el.clientHeight;


            if (this.mCamera instanceof THREE.CombinedCamera)
                this.mCamera.setSize(this.el.clientWidth, this.el.clientHeight);
            this.mCamera.updateProjectionMatrix();

            //adjust orthographic camera
            let camFactor = 2
            this.mCameraO.left = -this.el.clientWidth / camFactor;
            this.mCameraO.right = this.el.clientWidth / camFactor;
            this.mCameraO.top = this.el.clientHeight / camFactor;
            this.mCameraO.bottom = -this.el.clientHeight / camFactor;
            this.mCameraO.updateProjectionMatrix();


        }

        if (this.mRenderer && this.mControls) {
            this.mControls.panSpeed = 1600 / this.el.clientWidth * this.mouseSpeed * 0.3
            this.mControls.rotateSpeed = 1600 / this.el.clientWidth * this.mouseSpeed
        }

    }


    /**
     * sets the value of a text element that functions as a caption.
     */
    setCaption(text) {

        if (!this.mCaption)
            this.mCaption = $("<span></span>").html(this.name).addClass(".view-3d-caption");

        this.mCaption.html("").append(text);
        return this
    }


    /**
     * set up controls, scene, renderer, animation
     */
    initStatic() {

        if (this._inited_static_) return;
        var that = this;


        this.mFPS = 0.5;
        this.minFPS = this.minFPS || 0;
        this.maxFPS = this.maxFPS || 144;


        this.mLastFrameTime = -1;


        this.setCaption(this.name)


        // Setup scene

        this.mScene = new THREE.Scene();

        //added to be able to use threejs inspector
        window.scene = this.mScene;
        window.THREE = THREE;

        this.createCamera();

        this.mRenderer.setClearColor(0x000000);
        this.mRenderer.setPixelRatio(window.devicePixelRatio);

        this.el.appendChild(this.mRenderer.domElement);


        $(this.mRenderer.domElement).css({position: "absolute", top: 0, left: 0, width: "100%", height: "100%"});


        this.mFpsCounter = $("<span     style='color: white;position: absolute;' >");
        this.el.appendChild(this.mFpsCounter[0]);


        //------------------------------------------------
        this.createDomEvents();

        //------------------------------------------------


        //FIXME binding events will interfere with controls
        $(this.mRenderer.domElement).on("mouseover", function (e) {

            if (that.isMaximised()) return;

            e.stopPropagation();
            that.setActive();

            that.el.setAttribute("hasFocus", true);

            that.mCaption.stop(true, false).fadeOut(200)


        });


        $(this.mRenderer.domElement).on("mouseout", function (e) {

            if (that.isMaximised()) return;

            e.stopPropagation();

            that.el.removeAttribute("hasFocus");
            if (!that.el.classList.contains("view-3d-maximised")) {

                that.mCaption.stop(true, false).delay(400).fadeIn();

                that.setInactive();


            }

        });


        this.createControls();

        this.resizeCanvas();


        this._inited_static_ = true;

        return this

    }


    /**
     * Enable or disable stencil tests.
     */

    setStencil(bTrue) {

        var gl = this.mRenderer.context;

        if (bTrue)
            gl.enable(gl.STENCIL_TEST);
        else
            gl.disable(gl.STENCIL_TEST);
    }


    /**
     * wrapper method to call renderer
     */
    render() {

        this.mRenderer.render(this.mScene, this.mCamera);

    }

    /**
     * start the main animation loop for the 3D context
     */
    animate() {


        if (this.isRunning) return
        this.isRunning = true;

        console.log("starting 'view-3d' animation loop")
        var initialFrames = 0;
        var that = this;
        var accTime = 0, accFrames = 0;

        function doAnimate(time) {
            that.mTime = time;
            initialFrames--;
            if (that.mFPS == 0) {

                if (initialFrames < 0) {
                    that.mFrameId = requestAnimationFrame(doAnimate);
                    return;
                }
            }
            else {

                let nextTime = that.mLastFrameTime + (1000 / that.mFPS);
                if (nextTime > time) {

                    that.mFrameId = requestAnimationFrame(doAnimate);
                    return;
                }
            }


            //count frames
            accTime += time - that.mLastFrameTime;
            accFrames++;

            if (accTime > 1000) {
                that.mActualFPS = accFrames;

                if (that.showFPSCounter)
                    that.mFpsCounter.html(that.mActualFPS);

                accTime = 0;
                accFrames = 0;


            }


            that.mLastFrameTime = time;

            that.mControls.update();


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
    add(object3D) {
        this.mScene.add(object3D)

    }


    /**
     * Maximises the view within the available browser window.
     */

    maximise() {
        this.el.classList.add("view-3d-maximised");

        this.mCaption.fadeOut();

        this.setActive()


    }

    /**
     * tests if the view is maximised
     */
    isMaximised() {

        return this.el.classList.contains("view-3d-maximised")

    }


    /**
     * reverts the effects of maximise
     */
    undoMaximise() {
        this.el.classList.remove("view-3d-maximised");

        this.setInactive()


    }


    /**
     * setting a view active will result in the renderer using the maximum allowed FPS.
     */

    setActive() {

        this.mFPS = this.maxFPS;

        this.resizeCanvas();
        this.start();

    }

    /**
     * setting a view inactive will result in the renderer using only the minFPS value.
     */
    setInactive() {
        this.mFPS = this.minFPS;

        this.resizeCanvas()
    }


    /**
     * access method to start rendering the 3D content
     */

    start() {

        this.stop();

        this.animate()


    }


    /**
     * access method to stop rendering the 3D content
     */
    stop() {

        if (this.isRunning) {
            window.cancelAnimationFrame(this.mFrameId)
            this.isRunning = false;
        }

    }


    /**
     * convenience method
     */
    resume() {

        this.start()

    }


    /**
     * starts the animation loop and shows the dom element
     */

    show() {
        this.resume()
        this.el.style.display = ""
    }


    /**
     * stops the animation loop and hides the dom element
     */
    hide() {
        this.stop()
        this.el.style.display = "none"
    }


    /**
     * Initialise the 3D context and start the rendering loop.
     * Call this after appending el to the DOM.
     */

    init() {

        this.createTooltip();

        this.initStatic();
        this.start();

        this.dispatchEvent(new CustomEvent("connected"))

    }

    /**
     * Create the DOM element for the tooltip element
     */
    createTooltip() {

        if (this.toolTipElem) return;

        this.toolTipElem = document.createElement('div');
        this.toolTipElem.classList.add('graph-tooltip');

        $(this.toolTipElem).css({
            "z-index": 1,
            position: "absolute",
            "user-select": "none"
        });

        this.el.appendChild(this.toolTipElem);

        this.mouse = new THREE.Vector2();
        this.mouse.x = -2;
        this.mouse.y = -2;
        this.el.addEventListener("mousemove", ev => {

            const offset = getOffset(this.el),
                relPos = {
                    x: ev.pageX - offset.left,
                    y: ev.pageY - offset.top
                };
            this.mouse.x = (relPos.x / this.el.clientWidth) * 2 - 1;
            this.mouse.y = -(relPos.y / this.el.clientHeight) * 2 + 1;
            this.toolTipElem.style.top = (relPos.y - 40) + 'px';
            this.toolTipElem.style.left = (relPos.x - 20) + 'px';

            function getOffset(el) {
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
    setTooltip(text) {

        $(this.toolTipElem).html("").append(text).show()

    }


}
