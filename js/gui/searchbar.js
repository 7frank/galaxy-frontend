/**
 * the searchbar for the graph
 *
 *
 */

import $ from 'jquery';
import 'jquery-ui/themes/base/core.css';
import 'jquery-ui/themes/base/autocomplete.css';
import 'jquery-ui/themes/base/menu.css';
import 'jquery-ui/ui/core';
import 'jquery-ui/ui/widgets/autocomplete';


import {doOnClickNode, highlightNodeElements, unhighlightNodeElements} from "../cluster/refactor/f1"


document.addEventListener("DOMContentLoaded", function () {


    function getNodes() {
        let viewEl = document.querySelector(".view-3d.view-3d-maximised");
        let view = viewEl ? viewEl._view3d : null;
        return (view && view.mRootCluster && view.mRootCluster.mNodes) ? view.mRootCluster.mNodes : []
    }


    var filterResult = [];

    var container = document.createElement("div");
    container.className = "searchbar-container";
    container.innerHTML = "<span><span class='searchbar-search'><span>";

    var hudEl = document.querySelector("sample-cluster-application graph-hud");
    if (hudEl) hudEl.appendChild(container);

    var searchbarEl = document.createElement("input");
    searchbarEl.placeholder = "Search company name, ticker, people, sector, country";

    var searchbar = $(searchbarEl);

    /**
     *  the actual filter for the graph data
     */

    function doFilterList() {

        if (filterResult)
            filterResult.forEach(function (v) {
                unhighlightNodeElements.apply(v)
            })

        filterResult = getNodes().filter(function (v) {
            var val = searchbar.val().toLowerCase()
            var isName, isCountry, isId, isIndustry, isTicker;

            if (typeof v.name == "string")
                isName = v.name.toLowerCase().indexOf(val) == 0;

            if (typeof v.group == "string")
                isCountry = v.group.toLowerCase().indexOf(val) >= 0;

            if (typeof v.industry == "string")
                isIndustry = v.industry.toLowerCase().indexOf(val) >= 0;

            if (typeof v.ticker == "string") {
                var offset = v.ticker.indexOf(":");
                isTicker = v.ticker.toLowerCase().indexOf(val) >= 0 + offset;
            }

            if (typeof v.id == "string")
                isId = v.id.toLowerCase().indexOf(val) >= 0;

            return isName || isCountry || isId || isIndustry || isTicker
        })
    }

    var lastResults = []

    function showSuggestions(mResult) {
        lastResults.forEach(function (v) {
            unhighlightNodeElements.apply(v)
        })
        mResult.forEach(function (v) {
            highlightNodeElements.apply(v, [true, false])
        })
        lastResults = mResult
    }


    var ac_instance = searchbar.autocomplete({
        minLength: 3,
        source: function (request, successCallback) {
            successCallback(filterResult.slice(0, 80))
        },
        focus: function (event, ui) {
            searchbar.val(ui.item.name)
            return false;
        },
        select: function (event, ui) {
            searchbar.val(ui.item.name)
            doOnClickNode(ui.item, false, function () {
                console.warn("TODO updateTextWhenCameraIsMoving2 ")
            }, false, false, false, true)
            ui.item.addClass("basic-selection")
            return false;
        }
    }).autocomplete("instance")

    searchbar.on("blur", function () {
        searchbar.val("")
        showSuggestions([])
    })


    ac_instance._renderItem = function (ul, item) {
        var tcr = ""
        if (item.ticker)
            tcr = "Ticker:" + item.ticker

        var val = searchbar.val()
        var rowOutput = `<div>  ${item.name} (${tcr})</div>`
        var re = new RegExp(val, "gi");
        rowOutput = _.replace(rowOutput, re, "<b>" + val + "</b>")

        ul.addClass("searchbar-autocomplete-popup")

        var $row = $("<li>").addClass('searchbar-search-row')
            .append(rowOutput)
            .appendTo(ul);

        if (searchbarEl.classList.contains("darker")) {
            let css = window.getComputedStyle(searchbarEl, null)
            $row.css({
                "background-color": css.getPropertyValue("background-color"),
                "color": css.getPropertyValue("color")
            })
        }

        return $row
    };

    searchbar
        .prependTo(container)
        .on("keypress", doFilterList)

    window.addEventListener("keydown", function (e) {
        if (e.keyCode === 114 || (e.ctrlKey && e.keyCode === 70)) {
            e.preventDefault();
        }
        if (e.keyCode === 114 || (e.ctrlKey && e.keyCode === 83)) {
            e.preventDefault();
        }
    })

    function toggleSearch(e) {
        container.style.display = container.style.display === "none" ? "" : "none";
        searchbarEl.focus();
        e.stopPropagation();
        e.preventDefault();
    }

    Mousetrap.bind('ctrl+f', toggleSearch);
    Mousetrap(searchbarEl).bind('ctrl+f', toggleSearch);
})
