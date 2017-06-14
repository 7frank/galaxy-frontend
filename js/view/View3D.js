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



     //  this.initStatic()




    }


    resizeCanvas() {
    if (this.mRenderer) {
        this.mRenderer.setSize(this.clientWidth, this.clientHeight);
        this.mCamera.aspect = this.clientWidth /this.clientHeight;
        this.mCamera.updateProjectionMatrix();
    }
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
 var that=this

        this.mFPS=0;
        this.minFPS=0;
        this.maxFPS=144;


        this.mLastFrameTime=-1


        this.mCaption=$("<span>View3D</span>").css({
            "pointer-events":"none",
            position:"relative",top:0,left:0,zIndex:1})

        $(this).append(   this.mCaption)

        // Add nav info section


        //createTooltip()

        // Setup camera
        this.mCamera = new THREE.PerspectiveCamera();
        this.mCamera.far = 100000;


        // Setup scene

        this.mScene = new THREE.Scene();



        this.mCamera.lookAt(this.mScene.position);

        this.mCamera.position.z = 5000;



        // Setup renderer
        this.mRenderer = new THREE.WebGLRenderer({
            antialias: true
        });
        this.mRenderer.setClearColor( 0x111111 );
        this.mRenderer.setPixelRatio( window.devicePixelRatio );

        this.appendChild(this.mRenderer.domElement);




        $(this.mRenderer.domElement).css({    position: "absolute",width:"100%",height:"100%"})


        //init domEnvents
        this.mDomEvents = new THREEx.DomEvents(this.mCamera,this.mRenderer.domElement)



        //FIXME binding events will interfere with controls
        $(this.mRenderer.domElement).on("mouseover",function(e){
            e.stopPropagation()
            that.setActive()
        })
        $(this.mRenderer.domElement).on("mouseout",function(e){
            e.stopPropagation()
            that.setInactive()
        })


        // Add camera interaction
        this.mControls = new TrackballControls(this.mCamera, this.mRenderer.domElement);
        this.mControls.rotateSpeed = 0.3







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




          $(that).trigger("before-frame")
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

    setActive()
    {

        //fullscreen
        $(this).addClass("view-3d-maximised")

        //fps
        this.mFPS=this.maxFPS

        this.resizeCanvas()
    }

    setInactive()
    {
        $(this).removeClass("view-3d-maximised")
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


}


customElements.define("view-3d", View3D);
