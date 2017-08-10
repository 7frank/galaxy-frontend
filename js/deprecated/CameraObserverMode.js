/**
 * this will be a class that holds different stated of input methods
 * from which to select from
 * for example when in 3d mode another control might get used with different camera properties and such
 *
 * TODO make it so
 *
 */


class CameraObserverMode
{
    constructor(env){

  this.mEnv=env;
  this.mModes={}


        this.mModes["2d"]=this.create2DModeControls()
        this.mModes["3d"]=this.create3DModeControls()


    };

     create2DModeControls()
    {

        let env=this.mEnv;
        let  	camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, - 500, 1000 );
        camera.position.x = 200;
        camera.position.y = 100;
        camera.position.z = 200;


        let  controls = new TrackballControls(env.camera, env.renderer.domElement);


        return {camera,controls}

    }

     create3DModeControls()
    {

        let env=this.mEnv;
       let   camera = new THREE.PerspectiveCamera();
        camera.far = 100000;

        let  controls = new TrackballControls(env.camera, env.renderer.domElement);
        env.controls.rotateSpeed = 0.3


        return {camera,controls}

    }


    setMode(modeName){

      var mode=  this.mModes[modeName]
        if (!mode) {

          console.error("mode not defined:", modeName )

          return

        }


        let env=this.mEnv;

        env.domEvents._camera=mode.camera
        env.camera=mode.camera
        env.controls=mode.controls;

    }


    //create different controls and set specifiv one on demand



    /*??
    how to handle
    env.camera
    env.controls

     env.controls = new TrackballControls(env.camera, env.renderer.domElement);


 we do have to update the camera in env and switch the controls in env also ...


     */




}