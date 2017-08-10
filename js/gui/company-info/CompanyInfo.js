
import template from "./company-info.html"

import "../searchable-option-list/SearchableOptionList"


class CompanyInfo extends HTMLElement {

    constructor(...args) {
        super(...args);




    }

    connectedCallback(){

        $(this).append(template).
       addClass("rightCompanyInfo")

    }


}


customElements.define("company-info", CompanyInfo);
