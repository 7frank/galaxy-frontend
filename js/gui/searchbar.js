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


//import 'jquery-ui/themes/base/theme.css';


$(function () {


    function getNodes() {

        let view = $(".view-3d.view-3d-maximised").get(0)

        return (view && view.mRootCluster && view.mRootCluster.mNodes) ? view.mRootCluster.mNodes : []


    }


    var filterResult = [];

    var container = $("<div>")
        .addClass("searchbar-container")
        .append("<span><span class='searchbar-search'><span>")
        .appendTo("sample-cluster-application graph-hud")

    var searchbar = $("<input placeholder='Search company name, ticker, people, sector, country'>")

    /**
     *  the actual filter for the graph data
     */

    //TODO possible "zoom fit" results and highlight

    function doFilterList() {

        if (filterResult)
            filterResult.forEach(function (v) {
                unhighlightNodeElements.apply(v)
            })

        filterResult = getNodes().filter(function (v) {
            var val = searchbar.val().toLowerCase()
            //name:r.name,group:r.country,industry:r.industry
            var isName,
                isCountry,
                isId,
                isIndustry,
                isTicker;
            if (typeof v.name == "string")
                isName = v.name.toLowerCase().indexOf(val) == 0; //only start of string

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

        /*if (filterResult.length > 0) { //doZoomToMesh(filterResult[0]._bubble)

            doOnClickNode(filterResult[0])

        }*/


    }

    //
    /*  function moveToNode(node) {
        doOnClickNode(node, false, function () {

            setTimeout(function () {

                //defined in force-graph.js
                globalEnv.updateTextWhenCameraIsMoving()

            }, 400)

        }, false)

    }*/

    //-----------------
    //un/highlight all results
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


    //-----------------
    var ac_instance = searchbar.autocomplete({
        minLength: 3,
        source: function (request, successCallback) {

            successCallback(filterResult.slice(0, 80))

        },
        //focus: doFilterList,
        focus: function (event, ui) {

            searchbar.val(ui.item.name)


            //last impl to give the user a feedback
            //showSuggestions([ui.item])


            //doFilterList()
            //moveToNode(ui.item)

            return false;
        },
        select: function (event, ui) {

            searchbar.val(ui.item.name)

            //moveToNode(ui.item)
            doOnClickNode(ui.item, false, function () {
                //    globalEnv.updateTextWhenCameraIsMoving2()
                console.warn("TODO updateTextWhenCameraIsMoving2 ")
            }, false, false, false, true)

            //we set the selection to false but want the node to appear like it was selected
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

        var
            re = new RegExp(val, "gi");

        rowOutput = _.replace(rowOutput, re, "<b>" + val + "</b>")


        ul.addClass("searchbar-autocomplete-popup")


        var $row = $("<li>").addClass('searchbar-search-row')
            .append(rowOutput)
            .append(rowOutput)
            .appendTo(ul);

//FIXME have a more robust  autocomplete
        if (searchbar.hasClass("darker")) {
            let css = window.getComputedStyle(searchbar.get(0), null)

            $row.css({
                "background-color": css.getPropertyValue("background-color"),
                "color": css.getPropertyValue("color")
            })
        }


        return $row
    };

    //searchbar initially hidden
    //container.hide()


    searchbar
        .prependTo(container)
        .on("keypress", doFilterList)

    //TODO plugin won't trigger ctrl+f without disabling default behaviour in advance
    window.addEventListener("keydown", function (e) {

        //ignore ctrl+f
        if (e.keyCode === 114 || (e.ctrlKey && e.keyCode === 70)) {
            e.preventDefault();
        }
        //ignore ctrl+s
        if (e.keyCode === 114 || (e.ctrlKey && e.keyCode === 83)) {
            e.preventDefault();
        }

    })

    function toggleSearch(e) {

        container.toggle()
        searchbar.focus()
        e.stopPropagation()
        e.preventDefault()

    }

    Mousetrap.bind('ctrl+f', toggleSearch);

    Mousetrap(searchbar.get(0)).bind('ctrl+f', toggleSearch);


})
