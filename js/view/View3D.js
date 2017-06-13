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



       this.initStatic()



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
        this.mCaption.html("").append(text)
        return this
    }


    /**
     *   set up controls,  scene,   renderer,     animation
     *
     */
    initStatic() {

    if (this._inited_static_) return;


        this.mFPS=1;
        this.minFPS=0;
        this.maxFPS=144;


        this.mLastFrameTime=-1


        this.mCaption=$("<span>View3D</span>").css({
           // "pointer-events":"none",
            position:"relative",top:0,left:0})

        $(this).append(   this.mCaption)

        // Add nav info section


        //createTooltip()

        // Setup camera
        this.mCamera = new THREE.PerspectiveCamera();
        this.mCamera.far = 100000;

        // Setup scene

        this.mScene = new THREE.Scene();

        // Setup renderer
        this.mRenderer = new THREE.WebGLRenderer({
            antialias: true
        });
        this.mRenderer.setClearColor( 0x00FF00 );
        this.mRenderer.setPixelRatio( window.devicePixelRatio );

        this.appendChild(this.mRenderer.domElement);

        $(this.mRenderer.domElement).css({width:"100%",height:"100%"})


        //init domEnvents
        this.mDomEvents = new THREEx.DomEvents(this.mCamera, this.mRenderer.domElement)

        // Add camera interaction


        this.mControls = new TrackballControls(this.mCamera, this.mRenderer.domElement);
        this.mControls.rotateSpeed = 0.3
        window.oooControls=  this.mControls


        this.mControls.addEventListener("change", (...args)=> $(this).trigger("change",...args)  )

        this.mControls.addEventListener("change",function(...args){

     //FIXME it seems that the controls are not triggered by the mouse movements
//though they can be triggered manually but still dont render anything
            //oooControls.target.set(-1000,-1,-1);oooControls.update()

          debugger;
           console.log("cjange")

        })



        this._inited_static_=true

    return this

    }

         // Kick-off renderer
    animate() {
var that=this;
      function animate(time) {



          let nextTime=that.mLastFrameTime + (1000 / that.mFPS);
          if (nextTime > time) {

              that.mFrameId = requestAnimationFrame(animate);
              return;
          }

          console.log("animate",time)

          that.mLastFrameTime = time


          that.mControls.update();

          $(that).trigger("before-frame")
          $(that).trigger("animate")

          that.mRenderer.render(that.mScene, that.mCamera);


          that.mFrameId = requestAnimationFrame(animate);
      }

        animate(-1)

    }


    add(object3D)
    {
        this.mScene.add(object3D)

    }

    setToActive()
    {
        //fullscreen
        $(this).addClass("view-3d-maximised")

        //fps
        this.mFPS=this.maxFPS


    }

    setToThumbnail()
    {
        $(this).removeClass("view-3d-maximised")
        this.mFPS=this.minFPS

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


}



document.registerElement("view-3d", View3D);