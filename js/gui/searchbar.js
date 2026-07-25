/**
 * the searchbar for the graph
 */

import {doOnClickNode, highlightNodeElements, unhighlightNodeElements} from "../cluster/GraphElementExtension"
import * as _ from "lodash";


document.addEventListener("DOMContentLoaded", function () {

    function getNodes() {
        let viewEl = document.querySelector(".view-3d.view-3d-maximised");
        let view = viewEl ? viewEl._view3d : null;
        return (view && view.mRootCluster && view.mRootCluster.mNodes) ? view.mRootCluster.mNodes : []
    }

    var filterResult = [];
    var lastResults = [];

    var container = document.createElement("div");
    container.className = "searchbar-container";
    container.innerHTML = "<span><span class='searchbar-search'><span>";

    var hudEl = document.querySelector("sample-cluster-application graph-hud");
    if (hudEl) hudEl.appendChild(container);

    var searchbarEl = document.createElement("input");
    searchbarEl.placeholder = "Search company name, ticker, people, sector, country";
    container.insertBefore(searchbarEl, container.firstChild);

    var dropdown = document.createElement("ul");
    dropdown.className = "searchbar-autocomplete-popup";
    dropdown.style.display = "none";
    container.appendChild(dropdown);

    function showSuggestions(mResult) {
        lastResults.forEach(v => unhighlightNodeElements.apply(v));
        mResult.forEach(v => highlightNodeElements.apply(v, [true, false]));
        lastResults = mResult;
    }

    function doFilterList() {
        filterResult.forEach(v => unhighlightNodeElements.apply(v));

        var val = searchbarEl.value.toLowerCase();
        if (!val) { filterResult = []; renderDropdown([]); return; }

        filterResult = getNodes().filter(function (v) {
            var isName, isCountry, isId, isIndustry, isTicker;
            if (typeof v.name === "string") isName = v.name.toLowerCase().indexOf(val) === 0;
            if (typeof v.group === "string") isCountry = v.group.toLowerCase().indexOf(val) >= 0;
            if (typeof v.industry === "string") isIndustry = v.industry.toLowerCase().indexOf(val) >= 0;
            if (typeof v.ticker === "string") {
                var offset = v.ticker.indexOf(":");
                isTicker = v.ticker.toLowerCase().indexOf(val) >= 0 + offset;
            }
            if (typeof v.id === "string") isId = v.id.toLowerCase().indexOf(val) >= 0;
            return isName || isCountry || isId || isIndustry || isTicker;
        });

        renderDropdown(filterResult.slice(0, 80));
    }

    function renderDropdown(items) {
        dropdown.innerHTML = "";
        if (items.length === 0) { dropdown.style.display = "none"; return; }

        var val = searchbarEl.value;
        var re = new RegExp(val, "gi");

        items.forEach(function (item) {
            var tcr = item.ticker ? "Ticker:" + item.ticker : "";
            var text = `${item.name} (${tcr})`;
            var highlighted = text.replace(re, "<b>$&</b>");

            var li = document.createElement("li");
            li.className = "searchbar-search-row";
            li.innerHTML = "<div>" + highlighted + "</div>";

            li.addEventListener("mousedown", function (e) {
                e.preventDefault();
                searchbarEl.value = item.name;
                dropdown.style.display = "none";
                doOnClickNode(item, false, function () {
                    console.warn("TODO updateTextWhenCameraIsMoving2");
                }, false, false, false, true);
                if (item.classList) item.classList.add("basic-selection");
            });

            dropdown.appendChild(li);
        });

        dropdown.style.display = "";
        if (searchbarEl.classList.contains("darker")) {
            var css = window.getComputedStyle(searchbarEl, null);
            dropdown.style.backgroundColor = css.getPropertyValue("background-color");
            dropdown.style.color = css.getPropertyValue("color");
        }
    }

    searchbarEl.addEventListener("keyup", doFilterList);

    searchbarEl.addEventListener("blur", function () {
        setTimeout(function () {
            searchbarEl.value = "";
            dropdown.style.display = "none";
            showSuggestions([]);
        }, 150);
    });

    window.addEventListener("keydown", function (e) {
        if (e.keyCode === 114 || (e.ctrlKey && e.keyCode === 70)) e.preventDefault();
        if (e.keyCode === 114 || (e.ctrlKey && e.keyCode === 83)) e.preventDefault();
    });

    function toggleSearch(e) {
        container.style.display = container.style.display === "none" ? "" : "none";
        searchbarEl.focus();
        e.stopPropagation();
        e.preventDefault();
    }

    Mousetrap.bind('ctrl+f', toggleSearch);
    Mousetrap(searchbarEl).bind('ctrl+f', toggleSearch);
});
