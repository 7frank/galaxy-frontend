
import "./ModeSelect.css"

class ModeSelect extends HTMLElement {

    constructor(...args) {
        super(...args);

    }

    connectedCallback() {

      this.btn2d= $("<span>").html("2D").on("click", () => this.setMode("2d"));
       this.btn3d= $("<span>").addClass("selected").html("3D").on("click", () => this.setMode("3d"));

        $(this).append( this.btn3d,  this.btn2d)


    }

    setMode(mode) {

        var spinner=$(`<div class="spinner">
  <div class="bounce1"></div>
  <div class="bounce2"></div>
  <div class="bounce3"></div>
</div>`)

        let main=$("sample-cluster-application").get(0)

           if (this.prevMode == mode) return;//  prevMode = mode;


        if (mode == "3d") {


         //   this.btn3d.html('').append(spinner)
            main.setGraph3D(function(){
                this.prevMode=mode
                this.btn3d.addClass("selected")
                this.btn2d.removeClass("selected")
             //   this.btn3d.html('3D')
            }.bind(this));




            $("body").removeClass("inverted");

            //TODO for orbit controls controls.mouseButtons = { PAN: THREE.MOUSE.LEFT, ZOOM: THREE.MOUSE.MIDDLE, ORBIT: THREE.MOUSE.RIGHT }; // swapping left and right buttons
        }
        else if (mode == "2d") {

           // this.btn2d.html('').append(spinner)
            main.setGraph2D(function(){

                this.prevMode=mode
                this.btn2d.addClass("selected")
                this.btn3d.removeClass("selected")
             //   this.btn3d.html('2D')

            }.bind(this));

        }
    }


}


customElements.define("mode-select", ModeSelect);