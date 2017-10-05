import "./sol"
import "./sol.css"
import searchListOoptions from "./searchOptions.json"


import template from "./searchable-option-list.html"
import * as $ from "jquery"

class SearchableOptionList extends HTMLElement {


    connectedCallback() {

        $(this).append(template)
            .searchableOptionList({
                maxHeight: '250px', showSelectAll: false,
                data: searchListOoptions,
                converter: function (sol, rawDataFromUrl) {
                    var solData = rawDataFromUrl;

                    // do whatever you have to do
                    // to convert rawDataFromUrl to
                    // valid SOL data format

                    return solData;
                }
            });
    }


}

if (!customElements.get("searchable-option-list"))
customElements.define("searchable-option-list", SearchableOptionList, {extends: "select"});
