import bodyHTML from "./company-details-body.html"
import TemplateString from "../../utils/TemplateString";

class CompanyDetails extends HTMLElement {

    constructor(...args) {
        super(...args);


    }

    connectedCallback() {


        this.setStuff()

    }


    setStuff(o) {

        o = Object.assign({name: "CompanyName", link: ""}, o);

        let str = new TemplateString(bodyHTML).format(o);

        this.innerHTML = str;


    }



}

if (!customElements.get("company-details"))
customElements.define("company-details", CompanyDetails);