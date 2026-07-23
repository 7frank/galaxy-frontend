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
 * This is the constructor for a web component 'view-3d' which is initialised at the end of the file.
 * It contains most relevant code (camera, scene, animation loop, etc.) to create a Three-js 3D-Canvas
 * In addition the element has got a caption element which can be used to render some info text eg.
 * as well as some parameters to limit the frames per second (FPS) of the rendered 3D-Scene.
 *
 * Usage: create a dom element <view-3d></view-3d> and use it the way you would use any other html element
 *
 * Note: to customise FPS set the attributes 'minFPS' or 'maxFPS'
 *
 */


export default class View3D extends HTMLElement {

    constructor(...args) {
        super(...args);



        this.isRunning=false


        // this.createCSSRule();
        this.mTime = -1;
        this.mActualFPS = 0;
        this.showFPSCounter = false;
        this.mouseSpeed = 2;


        //   this.initStatic()

        // Setup renderer
        this.mRenderer = new THREE.WebGLRenderer({
            antialias: true
        });


        this.addEventListener("resize", () => this.resizeCanvas())


    }

    /**
     * initialise the camera classes with some default values
     *
     * TODO have access methods for camera controls and domEvents to be able to change controls and camera mode
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

        // this.mCamera =   this.mCameraO// new THREE.CombinedCamera();


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
     *
     * TODO have an option to change controls so a user may be able to use different ways of navigation
     */

    createControls() {
        this.mControls = new THREE.TrackballControls(this.mCamera, this.mRenderer.domElement);

        this.mControls.maxDistance = Math.min(this.mCamera.far, 200000);


        this.mControls.addEventListener("change", (e) => this.dispatchEvent(new CustomEvent("change", {detail: e})));


    }


    /**
     * initialise THREEx helper class that provides dom-like mouse events for 3D elements
     * NOTE: The available 3D mouse events are only a subset of otherwise (for native dom elements) existing mouse events
     */
    createDomEvents() {


        //this.mDomEvents = new THREEx.DomEvents(this.mCamera,this.mRenderer.domElement);
        this.mDomEvents = new DomEventsAlt(this.mCamera, this.mRenderer.domElement, this.mScene);

        //Note: have a factory in case we need this kind of injection multiple times
        // THREEx.DomEvents.prototype._onMouseMove=origMouseMove;//restore non throttled work flow to not interfere with other implementations


    }


    /**
     * updates the camera and dependant controls and events classes
     */
    updateCamera() {
        this.mCamera.updateProjectionMatrix();


        //update controls
        this.mControls.object = this.mCamera

        //update domEvents camera with current camera
        this.mDomEvents._camera = this.mCamera

    }

    /**
     * set the camera to orthographic mode
     */

    set2D() {

        //   this.mCameraO.copy( this.mCamera);

        this.mCamera = this.mCameraO


        this.updateCamera()

    }


    /**
     * set the camera to perspective mode
     */
    set3D() {
        //  this.mCameraP.copy( this.mCamera);

        this.mCamera = this.mCameraP

        this.updateCamera()

    }


    /**
     * updates the 3D context to match the dimensions of the HTML container element
     */
    resizeCanvas() {
        if (this.mRenderer && this.mCamera) {
            this.mRenderer.setSize(this.clientWidth, this.clientHeight);
            this.mCamera.aspect = this.clientWidth / this.clientHeight;


            if (this.mCamera instanceof THREE.CombinedCamera)
                this.mCamera.setSize(this.clientWidth, this.clientHeight);
            this.mCamera.updateProjectionMatrix();

            //adjust orthographic camera
            let camFactor = 2
            this.mCameraO.left = -this.clientWidth / camFactor;
            this.mCameraO.right = this.clientWidth / camFactor;
            this.mCameraO.top = this.clientHeight / camFactor;
            this.mCameraO.bottom = -this.clientHeight / camFactor;
            this.mCameraO.updateProjectionMatrix();


        }

        if (this.mRenderer && this.mControls) {
            this.mControls.panSpeed = 1600 / this.clientWidth * this.mouseSpeed * 0.3
            this.mControls.rotateSpeed = 1600 / this.clientWidth * this.mouseSpeed
        }

    }


    /**
     * sets the value of a text element that functions as a caption. the element is a native child dom-element
     * within our <view-3d></view-3d> element and can be styled via css in a usual way.
     * Note: To customise styling use the css class '.view-3d-caption'
     *
     * @param text ... a string value representing the text that shall be shown
     * @returns {View3D} for chaining
     */
    setCaption(text) {


        if (!this.mCaption)
            this.mCaption = $("<span></span>").html(this.name).addClass(".view-3d-caption");

        this.mCaption.html("").append(text);
        return this
    }


    /**
     *   set up controls,  scene,   renderer,     animation
     *
     */
    initStatic() {

        if (this._inited_static_) return;
        var that = this;


        this.mFPS = 0.5;
        this.minFPS = this.minFPS || 0;
        this.maxFPS = this.maxFPS || 144;


        this.mLastFrameTime = -1;


        this.setCaption(this.name)

        $(this).addClass("view-3d");


        // Setup scene

        this.mScene = new THREE.Scene();

        //added to be able to use threejs inspector
        window.scene = this.mScene;
        window.THREE = THREE;
        // Add nav info section
        //createTooltip()

        this.createCamera();

        this.mRenderer.setClearColor(0x000000);
        this.mRenderer.setPixelRatio(window.devicePixelRatio);

        this.appendChild(this.mRenderer.domElement);


        $(this.mRenderer.domElement).css({position: "absolute", top: 0, left: 0, width: "100%", height: "100%"});


        //init basic keyboard io
        //FIXME this probably interferes with domEvents here..
        /*

         this.mOtherEvents = new Mousetrap(this.mRenderer.domElement);
         //  this.mOtherEvents
         Mousetrap .bind("shift+r",function(e){
         e.preventDefault();
         e.stopPropagation();
         console.log("actualFPS",   that.mActualFPS)

         })*/

        this.mFpsCounter = $("<span     style='color: white;position: absolute;' >");
        $(this).append(this.mFpsCounter);


        //------------------------------------------------
        this.createDomEvents();

        //------------------------------------------------


        //FIXME binding events will interfere with controls
        $(this.mRenderer.domElement).on("mouseover", function (e) {

            if (that.isMaximised()) return;

            e.stopPropagation();
            that.setActive();

            $(that).attr("hasFocus", true);


            that.mCaption.stop(true, false).fadeOut(200)


        });


        $(this.mRenderer.domElement).on("mouseout", function (e) {

            if (that.isMaximised()) return;

            e.stopPropagation();


            $(that).removeAttr("hasFocus");
            if (!$(that).hasClass("view-3d-maximised")) {

                that.mCaption.stop(true, false).delay(400).fadeIn();

                //keep maximised element active or whatever state it currently holds
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
     * This can be useful to render special effects like multiple layers or for masking objects.
     */

    setStencil(bTrue) {

        //TODO have a switch to be able to debug options
        var gl = this.mRenderer.context;

        // enable stencil test
        if (bTrue)
            gl.enable(gl.STENCIL_TEST);
        else
            gl.disable(gl.STENCIL_TEST);
    }


    /**
     * wrapper method to call renderer
     * Note: override in subclass to provide option to use multiple renderers
     */
    render() {

        this.mRenderer.render(that.mScene, that.mCamera);

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
            // console.log("doAnimate",time)
            //that.mControls.update();
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
     *
     * @param object3D ... an instance of a {@link THRE.Mesh}
     *
     */
    add(object3D) {
        this.mScene.add(object3D)

    }


    /**
     * Maximises the view within the available browser window and bringing
     * it on top of all other potential existing view-3d instances.
     */

    maximise() {
        $(this).addClass("view-3d-maximised");

        this.mCaption.fadeOut();

        this.setActive()


    }

    /**
     * tests if the view is maximised
     */
    isMaximised() {

        return $(this).hasClass("view-3d-maximised")

    }


    /**
     * reverts the effects of {@link View3D.maximise}
     */
    undoMaximise() {
        $(this).removeClass("view-3d-maximised");

        this.setInactive()


    }


    /**
     * setting a view active will result in the renderer using the maximum allowed FPS.
     */

    setActive() {

        //fps
        this.mFPS = this.maxFPS;

        this.resizeCanvas();
        this.start();

    }

    /**
     * setting a view inactive will result in the renderer using only the  minFPS value resulting in lower GPU usage.
     */
    setInactive() {
        //  $(this).removeClass("view-3d-maximised")
        this.mFPS = this.minFPS;

        this.resizeCanvas()
    }


    /**
     * access method to start rendering the 3D content
     *
     */

    start() {

        this.stop();

        this.animate()


    }


    /**
     * access method to stop rendering the 3D content
     * FIXME it appears that the animation loop isn't canceled correctly which breaks the whole rendering
     *
     */
    stop() {

        if (this.isRunning) {
            window.cancelAnimationFrame(this.mFrameId)
            this.isRunning=false;
        }

    }


    /**
     * convenience method
     *
     */
    resume() {

        this.start()

    }


    /**
     * starts the animation loop and shows the dom element
     */

    show() {
        this.resume()
        $(this).show()
    }


    /**
     * stops the animation loop and hides the dom element
     */
    hide() {
        this.stop()
        $(this).hide()
    }


    /**
     * A callback invoked when the HTML-element is attached to the DOM.
     * We'll use it here to initialise the 3D context and start the rendering loop.
     */

    connectedCallback() {

        this.createTooltip();


        this.initStatic();
        this.start();

        this.dispatchEvent(new CustomEvent("connected"))


    }

    /**
     * Create the DOM element for the tooltip element which can be used to show
     * a 2D overlay on top of a 3D scene projecting the 3D position into 2D coordinates
     */
    createTooltip() {

        // Setup tooltip
        if (this.toolTipElem) return;

        this.toolTipElem = document.createElement('div');
        this.toolTipElem.classList.add('graph-tooltip');

        $(this.toolTipElem).css({
            "z-index": 1,
            position: "absolute",
            "user-select": "none"
        });

        this.appendChild(this.toolTipElem);

        // Capture mouse coords on move

        this.mouse = new THREE.Vector2();
        this.mouse.x = -2; // Initialize off canvas
        this.mouse.y = -2;
        this.addEventListener("mousemove", ev => {
            // update the mouse pos


            //$(env.toolTipElem).show()

            const offset = getOffset(this),
                relPos = {
                    x: ev.pageX - offset.left,
                    y: ev.pageY - offset.top
                };
            this.mouse.x = (relPos.x / this.clientWidth) * 2 - 1;
            this.mouse.y = -(relPos.y / this.clientHeight) * 2 + 1;
            //console.log(offset);
            // Move tooltip
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


/**
 * creates the web component itself
 *
 */
if (!customElements.get("view-3d"))
customElements.define("view-3d", View3D);
