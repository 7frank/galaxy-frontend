import "./ModeSelect.css"
import Extended2DGraphConfig from "../cluster/configs/Extendend2DGraphConfig";
import Default3DGraphConfig from "../cluster/configs/Default3DGraphConfig";
import Default2DGraphConfig from "../cluster/configs/Default2DGraphConfig";


class ModeSelect extends HTMLElement {

    constructor(...args) {
        super(...args);

    }


    addModeBtn(caption, mode, bSelected) {

        var that = this

        if (!(mode instanceof Default3DGraphConfig)) throw new Error("must be instanceof Default3DGraphConfig")


        function selectBtn(btn) {
            btn.parentElement.querySelectorAll(".selected").forEach(el => el.classList.remove("selected"));
            btn.classList.add("selected");
        }

        let modeBtn = document.createElement("span");
        modeBtn.innerHTML = caption;
        modeBtn.addEventListener("click", onModeClick);

        if (bSelected) {
            that.prevMode == caption
            modeBtn.classList.add("selected");
        }

        function onModeClick() {

            let main = document.querySelector("sample-cluster-application")

            if (that.prevMode == caption) return;//  prevMode = mode;


            mode.setView(main.getCurrentView()).setMode(function () {

                that.prevMode = caption

                selectBtn(modeBtn)

            }.bind(this));

        }

        this.appendChild(modeBtn);

    }

    connectedCallback() {

        this.addModeBtn("3D", new Default3DGraphConfig(), true)
        this.addModeBtn("2D", new Default2DGraphConfig())
        this.addModeBtn("2D+", new Extended2DGraphConfig())

    }
}


customElements.define("mode-select", ModeSelect);