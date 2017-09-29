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
import  "../lib/CombinedCamera"
import "../lib/TrackballControls"

export default class View3D extends HTMLElement {

    constructor(...args) {
        super(...args);


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


        $(this).on("resize", () => this.resizeCanvas())


    }


    //FIXME have accesss methods for camera controls and domEvents to be able to change controls and camera mode

    initCamera() {

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

    setControls() {
        // Add camera interaction
        this.mControls = new THREE.TrackballControls(this.mCamera, this.mRenderer.domElement);

        this.mControls.maxDistance = Math.min(this.mCamera.far, 200000);


        this.mControls.addEventListener("change", (...args) => $(this).trigger("change", ...args));


    }

    setDomEvents() {


        //init domEnvents
        //this.mDomEvents = new THREEx.DomEvents(this.mCamera,this.mRenderer.domElement);
        this.mDomEvents = new DomEventsAlt(this.mCamera, this.mRenderer.domElement, this.mScene);

        //Note: have a factory in case we need this kind of injection multiple times
        // THREEx.DomEvents.prototype._onMouseMove=origMouseMove;//restore non throttled work flow to not interfere with other implementations


    }


    updateCamera() {
        this.mCamera.updateProjectionMatrix();


        //update controls
        this.mControls.object = this.mCamera

        //update domEvents camera with current camera
        this.mDomEvents._camera = this.mCamera


    }

    set2D() {

        //   this.mCameraO.copy( this.mCamera);

        this.mCamera = this.mCameraO


        this.updateCamera()

    }

    set3D() {
        //  this.mCameraP.copy( this.mCamera);

        this.mCamera = this.mCameraP

        this.updateCamera()

    }


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


    /* get scene() {
     return ""+ this.mScene
     }
     set scene(scene) {
     this.mScene=scene
     }
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

        this.initCamera();

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
        this.setDomEvents();

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


        this.setControls();

        this.resizeCanvas();


        this._inited_static_ = true;

        return this

    }


    setStencil(bTrue) {

        //TODO have a switch to be able to debug options
        var gl = this.mRenderer.context;

        // enable stencil test
        if (bTrue)
            gl.enable(gl.STENCIL_TEST);
        else
            gl.disable(gl.STENCIL_TEST);
    }


    render() {


        this.mRenderer.render(that.mScene, that.mCamera);

    }

    // Kick-off renderer
    animate() {


        if (this._a) return
        this._a = true;

        console.log("animate")
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


            $(that).trigger("before-render", time);


            that.render()


            $(that).trigger("after-render", time);

            that.mFrameId = requestAnimationFrame(doAnimate);
        }

        doAnimate(-1)

    }


    add(object3D) {
        this.mScene.add(object3D)

    }


    maximise() {
        $(this).addClass("view-3d-maximised");

        this.mCaption.fadeOut();

        this.setActive()


    }

    isMaximised() {

        return $(this).hasClass("view-3d-maximised")

    }


    undoMaximise() {
        $(this).removeClass("view-3d-maximised");

        this.setInactive()


    }


    setActive() {

        //fps
        this.mFPS = this.maxFPS;

        this.resizeCanvas();
        this.start();

    }

    setInactive() {
        //  $(this).removeClass("view-3d-maximised")
        this.mFPS = this.minFPS;

        this.resizeCanvas()
    }


    start() {

        this.stop();

        this.animate()


    }

    stop() {
        //  window.cancelAnimationFrame(this.mFrameId)
    }

    resume() {

        this.start()

    }


    show() {
        this.resume()


    }

    hide() {
        this.stop()
    }


    connectedCallback() {

        this.createTooltip();


        this.initStatic();
        this.start();

        $(this).trigger("connected")


    }


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
     * set the content of the tooltip
     *
     *
     * @param text
     */
    setTooltip(text) {

        $(this.toolTipElem).html("").append(text).show()

    }


}


customElements.define("view-3d", View3D);
