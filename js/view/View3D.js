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
    super(...args)


        this.createCSSRule()

    //   this.initStatic()




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
        }

        if (!this.mCaption)
            this.mCaption=$("<span></span>").html(this.name).css(captionCSS)

        this.mCaption.html("").append(text)
        return this
    }




    /**
     *   set up controls,  scene,   renderer,     animation
     *
     */
    initStatic() {

         if (this._inited_static_) return;
         var that=this

        this.mFPS=0.5;
        this.minFPS=0;
        this.maxFPS=144;


        this.mLastFrameTime=-1

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
        }

    if (!this.mCaption)
        this.mCaption=$("<span></span>").html(this.name).css(captionCSS)

        $(this).append(   this.mCaption).addClass("view-3d")



        // Add nav info section


        //createTooltip()

        // Setup camera
        this.mCamera = new THREE.PerspectiveCamera();
        this.mCamera.far = 100000;


        // Setup scene

        this.mScene = new THREE.Scene();



        this.mCamera.lookAt(this.mScene.position);

        this.mCamera.position.z = 9000;



        // Setup renderer
        this.mRenderer = new THREE.WebGLRenderer({
            antialias: true
        });
        this.mRenderer.setClearColor( 0x000000 );
        this.mRenderer.setPixelRatio( window.devicePixelRatio );

        this.appendChild(this.mRenderer.domElement);




        $(this.mRenderer.domElement).css({    position: "absolute",width:"100%",height:"100%"})


        //init domEnvents
        this.mDomEvents = new THREEx.DomEvents(this.mCamera,this.mRenderer.domElement)



        //FIXME binding events will interfere with controls
        $(this.mRenderer.domElement).on("mouseover",_.throttle(function(e){
            e.stopPropagation()
            that.setActive()

            $(that).attr("hasFocus",true)


            that.mCaption.stop(true,false).fadeOut(200)


        },20))
        $(this.mRenderer.domElement).on("mouseout",function(e){
            e.stopPropagation()
            that.setInactive()

            $(that).removeAttr("hasFocus")
            if (!$(that).hasClass("view-3d-maximised"))
            that.mCaption.stop(true,false).delay(400).fadeIn()


        })


        // Add camera interaction
        this.mControls = new TrackballControls(this.mCamera, this.mRenderer.domElement);
       // this.mControls.rotateSpeed = 0.3







        this.resizeCanvas()

        this.mControls.addEventListener("change", (...args)=> $(this).trigger("change",...args)  )

        this._inited_static_=true

    return this

    }

         // Kick-off renderer
    animate() {

       var initialFrames=1;
        var that=this;
      function animate(time) {

          that.mControls.update();
          initialFrames--
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
      //    console.log("animate",time)

          that.mLastFrameTime = time


          $(that).trigger("before-render")
         // $(that).trigger("animate")

          that.mRenderer.render(that.mScene, that.mCamera);


          that.mFrameId = requestAnimationFrame(animate);
      }

        animate(-1)

    }


    add(object3D)
    {
        this.mScene.add(object3D)

    }


    maximise() {
        $(this).addClass("view-3d-maximised")

        this.setActive()


    }

    isMaximised(){

     return   $(this).hasClass("view-3d-maximised")

    }


    undoMaximise() {
        $(this).removeClass("view-3d-maximised")

        this.setInactive()


    }





    setActive()
    {

        //fps
        this.mFPS=this.maxFPS

        this.resizeCanvas()
        this.start();

    }

    setInactive()
    {
      //  $(this).removeClass("view-3d-maximised")
        this.mFPS=this.minFPS

        this.resizeCanvas()
    }


    start(){

    this.stop()

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

        this.initStatic();
        this.start();
    }


}


customElements.define("view-3d", View3D);
