
import "./ModeSelect.css"

class ModeSelect extends HTMLElement {

    constructor(...args) {
        super(...args);

    }

    connectedCallback() {

        let _2d = $("<span>").html("2d").on("click", () => this.setMode("2d"));
        let _3d = $("<span>").html("3d").on("click", () => this.setMode("3d"));

        $(this).append(_3d, _2d)


    }

    setMode(mode) {

        /*
            var cameraModi;
            var main = null;

            var prevMode;
            */


        //   if (prevMode == mode) return;//  prevMode = mode;
        //  if (!cameraModi) cameraModi = new CameraObserverMode(env);

        if (mode == "3d") {
            main.setGraph3D();
            // cameraModi.setMode("3d")


            //Graph.numDimensions(3);
            $("body").removeClass("inverted");

            //   env.controls.target.set(new THREE.Vector3(0,0,0));
            //      doZoomToPos(new THREE.Vector3(0, 0, 5000));
            //   main.getCurrentView().mRootCluster.zoomToCluster()
            //   env.controls.noRotate=false
            //TODO for orbit controls controls.mouseButtons = { PAN: THREE.MOUSE.LEFT, ZOOM: THREE.MOUSE.MIDDLE, ORBIT: THREE.MOUSE.RIGHT }; // swapping left and right buttons
        }
        else if (mode == "2d") {
            main.setGraph2D();
            //  cameraModi.setMode("2d")
            //Graph.numDimensions(2);
            $("body").addClass("inverted");
            //  env.controls.target.set(new THREE.Vector3(0,0,0));
            //main.getCurrentView().mRootCluster.zoomToCluster()
            //  doZoomToPos(new THREE.Vector3(0, 0, 3000));
            //   env.controls.noRotate=true
        }
    }


}


customElements.define("mode-select", ModeSelect);