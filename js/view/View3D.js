/**
 * Created by Frank on 13.06.2017.
 */


//a view class to be able to use multiple views and switch between them
//limit fps
//see shadertoy for usage as thumbnail and such


export default
class View3D extends HTMLElement
{

    constructor(...args){
    super(...args);


        this.createCSSRule();
        this.mTime=-1;
        this.mActualFPS=0;
        this.showFPSCounter=false;

    //   this.initStatic()

        // Setup renderer
        this.mRenderer = new THREE.WebGLRenderer({
            antialias: true
        });


    }



    //TODO remove little redundancy
    createCSSRule()
    {
        var style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = '.view-3d-maximised { position: absolute !important;   top: 0  !important;   left: 0  !important;   height: 100% !important;    width: 100% !important; }';
        document.getElementsByTagName('head')[0].appendChild(style);



    }


    resizeCanvas() {
    if (this.mRenderer) {
        this.mRenderer.setSize(this.clientWidth, this.clientHeight);
        this.mCamera.aspect = this.clientWidth /this.clientHeight;
        this.mCamera.updateProjectionMatrix();
    }

        if (this.mRenderer)
            this.mControls.panSpeed =  this.mControls.rotateSpeed = 1600/this.clientWidth*0.3


    }


   /* get scene() {
        return ""+ this.mScene
    }
    set scene(scene) {
        this.mScene=scene
    }
*/
    setCaption(text)
    {


        let captionCSS= {
            "pointer-events": "none",
            position: "relative",
            padding: "1em",
            "font-size": "2em",
            top: "30%",
            height: "3em",
            width: "100%",
            background: "rgba(255,255,255,0.3)",
            left: "0px",
            "z-index": 1
        };

        if (!this.mCaption)
            this.mCaption=$("<span></span>").html(this.name).css(captionCSS);

        this.mCaption.html("").append(text);
        return this
    }




    /**
     *   set up controls,  scene,   renderer,     animation
     *
     */
    initStatic() {

         if (this._inited_static_) return;
         var that=this;


        this.mFPS=0.5;
        this.minFPS=this.minFPS||0;
        this.maxFPS=this.maxFPS||144;


        this.mLastFrameTime=-1;

        let captionCSS= {
            "pointer-events": "none",
            position: "relative",
            padding: "1em",
            "font-size": "2em",
            top: "30%",
            height: "3em",
            width: "100%",
            background: "rgba(255,255,255,0.3)",
            left: "0px",
            "z-index": 1
        };

    if (!this.mCaption)
        this.mCaption=$("<span></span>").html(this.name).css(captionCSS);

        $(this).append(   this.mCaption).addClass("view-3d");



        // Add nav info section


        //createTooltip()

        // Setup camera
        this.mCamera = new THREE.PerspectiveCamera();
        this.mCamera.far = 200000;


        // Setup scene

        this.mScene = new THREE.Scene();



        this.mCamera.lookAt(this.mScene.position);

        this.mCamera.position.z = 150000;




        this.mRenderer.setClearColor( 0x000000 );
        this.mRenderer.setPixelRatio( window.devicePixelRatio );

        this.appendChild(this.mRenderer.domElement);




        $(this.mRenderer.domElement).css({    position: "absolute",width:"100%",height:"100%"});


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

        this.mFpsCounter=$("<span     style='color: white;position: absolute;' >");
        $(this).append(this.mFpsCounter);


        //------------------------------------------------
        //throttle move events to about 50 fps
        //let origMouseMove=THREEx.DomEvents.prototype._onMouseMove;
        THREEx.DomEventsAlt.prototype._onMouseMove	=_.throttle(function(domEvent)
        //THREEx.DomEvents.prototype._onMouseMove	=_.throttle(function(domEvent)
        {
            var mouseCoords = this._getRelativeMouseXY(domEvent);
            this._onMove('mousemove', mouseCoords.x, mouseCoords.y, domEvent);
            this._onMove('mouseover', mouseCoords.x, mouseCoords.y, domEvent);
            this._onMove('mouseout' , mouseCoords.x, mouseCoords.y, domEvent);
        },40);  //25 (f)ps

        //init domEnvents
        //this.mDomEvents = new THREEx.DomEvents(this.mCamera,this.mRenderer.domElement);
        this.mDomEvents = new THREEx.DomEventsAlt(this.mCamera,this.mRenderer.domElement,this.mScene);

        //Note: have a factory in case we need this kind of injection multiple times
       // THREEx.DomEvents.prototype._onMouseMove=origMouseMove;//restore non throttled work flow to not interfere with other implementations


        //------------------------------------------------



        //FIXME binding events will interfere with controls
        $(this.mRenderer.domElement).on("mouseover",function(e){

            if (that.isMaximised()) return;

            e.stopPropagation();
            that.setActive();

            $(that).attr("hasFocus",true);


            that.mCaption.stop(true,false).fadeOut(200)


        });


        $(this.mRenderer.domElement).on("mouseout",function(e) {

            if (that.isMaximised()) return;

            e.stopPropagation();


            $(that).removeAttr("hasFocus");
            if (!$(that).hasClass("view-3d-maximised")) {

            that.mCaption.stop(true, false).delay(400).fadeIn();

            //keep maximised element active or whatever state it currently holds
            that.setInactive();


            }

        });


        // Add camera interaction
        this.mControls = new TrackballControls(this.mCamera, this.mRenderer.domElement);
       // this.mControls.rotateSpeed = 0.3

        this.mControls.maxDistance = this.mCamera.far;





        this.resizeCanvas();

       this.mControls.addEventListener("change", (...args)=> $(this).trigger("change",...args)  );







        this._inited_static_=true;

    return this

    }

         // Kick-off renderer
    animate() {

        var initialFrames=1;
        var that=this;
        var accTime=0,accFrames=0;

      function animate(time) {
        that.mTime=time;


          initialFrames--;
          if (that.mFPS==0) {

              if (initialFrames<0)
              {
                  that.mFrameId = requestAnimationFrame(animate);
                  return;
              }
          }
          else {

              let nextTime = that.mLastFrameTime + (1000 / that.mFPS);
              if (nextTime > time) {

                  that.mFrameId = requestAnimationFrame(animate);
                  return;
              }
          }


          //count frames
          accTime+=time-that.mLastFrameTime;
          accFrames++;

          if (accTime>1000)
          {
              that.mActualFPS=accFrames;

              if (that.showFPSCounter)
              that.mFpsCounter.html(that.mActualFPS);

              accTime=0;
              accFrames=0;


          }



          that.mLastFrameTime = time;

          that.mControls.update();



          $(that).trigger("before-render",time);
         // $(that).trigger("animate")

          that.mRenderer.render(that.mScene, that.mCamera);

          $(that).trigger("after-render",time);

          that.mFrameId = requestAnimationFrame(animate);
      }

        animate(-1)

    }


    add(object3D)
    {
        this.mScene.add(object3D)

    }


    maximise() {
        $(this).addClass("view-3d-maximised");

     this.mCaption.fadeOut();

        this.setActive()


    }

    isMaximised(){

     return   $(this).hasClass("view-3d-maximised")

    }


    undoMaximise() {
        $(this).removeClass("view-3d-maximised");

        this.setInactive()


    }





    setActive()
    {

        //fps
        this.mFPS=this.maxFPS;

        this.resizeCanvas();
        this.start();

    }

    setInactive()
    {
      //  $(this).removeClass("view-3d-maximised")
        this.mFPS=this.minFPS;

        this.resizeCanvas()
    }


    start(){

    this.stop();

     this.animate()


    }

    stop(){
        window.cancelAnimationFrame( this.mFrameId)
    }

    resume(){

       this.start()

    }


    show(){
        this.resume()


    }

    hide() {
        this.stop()
    }


    connectedCallback(){

        this.createTooltip();


        this.initStatic();
        this.start();

        $(this).trigger("connected")


    }


    createTooltip() {

        // Setup tooltip
        if ( this.toolTipElem ) return;

        this.toolTipElem = document.createElement('div');
        this.toolTipElem.classList.add('graph-tooltip');

        $(this.toolTipElem).css({
            "z-index":1,
            position:"relative",
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
            this.mouse.y =  - (relPos.y / this.clientHeight) * 2 + 1;
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
    setTooltip(text)
    {

        $(this.toolTipElem).html("").append(text).show()

    }



}


customElements.define("view-3d", View3D);
