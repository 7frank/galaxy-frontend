
import "../../gui/company-details/CompanyDetails"
import {AppDataService} from "./AppDataService";

import * as _ from "lodash";


function formatNumber(num) {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
}

var curr = 0
var currentGradientColors = [0x218D20, 0x439229, 0x8CCB84, 0x14B0BF, 0x9DC9CA, 0xCAB81A, 0xBBC42D, 0xC8A6BF, 0xCF73B4, 0x816365, 0x7D5C53, 0xAE5E29, 0xB62729]

function getNextGradient() {

    var availGradients = [
        [0x218D20, 0x439229, 0x8CCB84, 0x14B0BF, 0x9DC9CA, 0xCAB81A, 0xBBC42D, 0xC8A6BF, 0xCF73B4, 0x816365, 0x7D5C53, 0xAE5E29, 0xB62729],
        [0x111111, 0x111111, 0x111111, 0x111111, 0x111111, 0x111111, 0x111111, 0x111111, 0x111111, 0xff0000, 0x00ff00, 0x0000ff, 0xffffff],
        [0xffffff, 0x0000ff, 0x111111, 0x111111, 0x111111, 0x111111, 0x111111, 0x111111, 0x111111, 0x111111, 0x111111, 0x111111, 0x111111]
    ]

    var next = ++curr % availGradients.length
    return currentGradientColors = availGradients[next]

}

export function computeCompanyNodeColor(val = 0, attr = "sent") {

    var sentRanges = [[92, Number.MAX_SAFE_INTEGER], [85, 92], [78, 85], [71, 78], [64, 71], [57, 64], [50, 57], [43, 50], [36, 43], [29, 36], [22, 29], [15, 22], [Number.MIN_SAFE_INTEGER, 22]]
    var priceRangesInPct = [[18, Number.MAX_SAFE_INTEGER], [18, 15], [12, 15], [9, 12], [6, 9], [3, 6], [0, 3], [-3, 0], [-6, -3], [-9, -6], [-12, -9], [-18, -15], [Number.MIN_SAFE_INTEGER, -18]]

    var arr

    if (attr == "sent") arr = sentRanges
    if (attr == "priceRanges") arr = priceRangesInPct;

    var i;
    for (i = 0; i < arr.length; i++) {
        var range = arr[i];

        if (range[0] < val && val < range[1])
            return currentGradientColors[i]

        if (range[1] < val && val < range[0])
            return currentGradientColors[i]
    }

    return 0xffffff
}

export function computeGroupNodeColorHelper(distinctGroupIDS) {
    var colors = []

    for (let i in distinctGroupIDS) {
        colors.push(_.random(0, 255) * _.random(0, 255) * _.random(0, 255))
    }

    return {
        getColor: function (groupID) {
            var i = distinctGroupIDS.indexOf(groupID)
            return colors[i] || 0xFFFFFF
        }
    }
}


function changeGradientBar(colorArray) {
    var gradientString = colorArray.map((c) => "#" + c.toString(16).padStart(6, "0")).join(",")

    var tpl = `.companyGradient {
	  background: lightgrey;
	  background: -webkit-linear-gradient(left,${gradientString});
	  background: -o-linear-gradient(left,${gradientString});
	  background: -moz-linear-gradient(left,${gradientString});
	  background: linear-gradient(to right,${gradientString}); 
	}
`
    var style = document.createElement("style");
    style.textContent = tpl;
    document.head.appendChild(style);
}


document.addEventListener("DOMContentLoaded", function () {

    var sel = document.createElement("select");
    sel.className = "cloudNodeColorSelect";
    sel.innerHTML = `<option value="sent">sentiment</option>
<option value="priceRanges">price ranges</option>
<option value="group">group</option>`;

    var gradientEl = document.querySelector(".companyGradient");
    if (gradientEl) {
        gradientEl.addEventListener("click", function () {
            var array = getNextGradient();
            changeGradientBar(array);
            sel.dispatchEvent(new Event("change"));
        });
    }

    sel.addEventListener("change", function () {
        var val = sel.value;
        window.dispatchEvent(new CustomEvent("node-color-change", {detail: val}));
    });

    var body = getBody();
    if (body) body.appendChild(sel);
});


function getBody() {
    return document.querySelector("sample-cluster-application graph-hud");
}


function makeDraggable(element) {
    var startX, startY, startLeft, startTop;

    function onMouseDown(e) {
        startX = e.clientX;
        startY = e.clientY;
        var style = window.getComputedStyle(element);
        startLeft = parseInt(style.left) || 0;
        startTop = parseInt(style.top) || 0;
        element.style.position = "absolute";
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
        e.preventDefault();
    }

    function onMouseMove(e) {
        element.style.left = (startLeft + e.clientX - startX) + "px";
        element.style.top = (startTop + e.clientY - startY) + "px";
    }

    function onMouseUp() {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
    }

    element.addEventListener("mousedown", onMouseDown);
}

function el(tag, props = {}) {
    var e = document.createElement(tag);
    if (props.className) e.className = props.className;
    if (props.innerHTML) e.innerHTML = props.innerHTML;
    if (props.style) Object.assign(e.style, props.style);
    return e;
}


export var GUI = {
    createAccordion(items) {
        function createSection(caption, content, id) {
            var h3 = document.createElement("h3");
            h3.className = "accordion-header ui-accordion-header ui-helper-reset ui-state-default ui-accordion-icons ui-corner-all";
            h3.innerHTML = caption;

            var div = document.createElement("div");
            div.id = id;
            div.className = "ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom";
            if (typeof content === "string")
                div.innerHTML = content;
            else if (content instanceof Node)
                div.appendChild(content);

            var frag = document.createDocumentFragment();
            frag.appendChild(h3);
            frag.appendChild(div);
            return frag;
        }

        var acc = document.createElement("div");
        acc.className = "ui-accordion ui-widget ui-helper-reset my-accordion";
        for (let item of items) {
            item = Object.assign({caption: "missing 'caption'", content: "missing 'content'"}, item)
            acc.appendChild(createSection(item.caption, item.content, item.id));
        }
        return acc;
    },

    createSlider: function () {
    },

    createSample() {
        let a = GUI.createAccordion([{
            caption: "<span style=\"color:reg(255,255,255);font-family: 'roboto';font-size:16px;\">Top Sectors </span><img src=\"include/images/Triangle.png\" style=\"width:10px;\">",
            id: "companyIndustry",
            content: "Technology, 33%<br>Consumer Discretionary, 20%<br>Consumer Staples, 20%"
        }, {
            caption: "<span style=\"color:reg(255,255,255);font-family: 'roboto';font-size:16px;\">Top Countries</span> <img src=\"include/images/Triangle.png\" style=\"width:10px;\">",
            id: "companyCountry",
            content: "United States, 80%<br>Japan, 10%<br>Germany, 4%"
        }]);

        Object.assign(a.style || {}, {top: "80px", left: "10px", position: "absolute", zIndex: 999, width: "200px"});
        GUI._el = a;

        var body = getBody();
        if (body) body.appendChild(a);

        GUI.createSlider();
        GUI.info = GUI.createNodeInfoPanel();
    },

    createNodeInfoPanel() {
        var infoEl = document.createElement("div");
        infoEl.className = "graph-node-info";
        infoEl.style.display = "none";

        var body = getBody();
        if (body) body.appendChild(infoEl);

        makeDraggable(infoEl);
        GUI._infoEl = infoEl;

        var header = el("div", {className: "graph-node-info-header"});
        var search = el("span", {className: "graph-node-info-search", innerHTML: "Yahoo Search"});
        var price = el("span", {className: "graph-node-info-price", innerHTML: "USD 36.5 (-0.5%)"});
        var close = el("span", {
            className: "graph-node-info-close",
            innerHTML: "<i class=\"fa fa-times\" aria-hidden=\"true\" style=\"font-family:'FontAwesome' !important;\"></i> CLOSE",
            style: {marginLeft: "420px", cursor: "pointer"}
        });

        var stockPrice = "<span style=\"margin-left:20px;margin-top:7px;\">USD <span style=\"color:#f7685e;font-family:'roboto-bold' !important;\">36.5</span> (-0.5%)</span>";

        close.addEventListener("click", function () {
            infoEl.style.display = "none";
        });

        var stockPriceEl = document.createElement("span");
        stockPriceEl.innerHTML = stockPrice;
        header.appendChild(search);
        header.appendChild(stockPriceEl);
        header.appendChild(close);

        var bodyEl = el("div", {className: "graph-node-info-body"});
        bodyEl.innerHTML = "";
        bodyEl.innerHTML = "<company-details></company-details>";

        var newsEl = el("div", {className: "graph-node-info-news"});
        var newsHeader = el("div", {className: "graph-node-info-news-header", innerHTML: "News"});
        var newsBody = el("div", {className: "graph-node-info-news-body"});
        newsEl.appendChild(newsHeader);
        newsEl.appendChild(newsBody);

        infoEl.appendChild(header);
        infoEl.appendChild(bodyEl);
        infoEl.appendChild(newsEl);

        return {
            setNode: function (node) {
                console.warn("TODO implement node data from database")
                let link = "<a target='_blank' href='https://www.iqbanker.com/charts/" + node.id + "/supply_chain'>iq maps</a>"
                var companyDetails = document.querySelector("company-details");
                if (companyDetails) companyDetails.setStuff({name: node.name, link});
            }
        }
    },

    updateNodeInfo(node, bShow = true) {
        if (!GUI._infoEl) return;
        GUI._infoEl.style.display = bShow ? "" : "none";
        if (bShow) GUI.info.setNode(node);
    },

    updateFromVisibleNodes(nodes) {
        if (!GUI._el) return;

        var visibleEl = GUI._el.querySelector(".graph-info-companys-visible");
        if (visibleEl) visibleEl.innerHTML = formatNumber(nodes.length.toLocaleString('en-US'));

        var industries = {}
        var countries = {}
        nodes.forEach(function (n) {
            if (!n.industry) return
            if (!n.group) return
            if (!industries[n.industry]) industries[n.industry] = 0
            industries[n.industry]++
            if (!countries[n.group]) countries[n.group] = 0
            countries[n.group]++
        })

        var sortedIndustries = _.sortBy(_.toPairs(industries), 1).reverse()
        var sortedCountries = _.sortBy(_.toPairs(countries), 1).reverse()

        var totalCountries = _.sum(sortedCountries.map((v) => v[1]))
        var totalIndustries = _.sum(sortedIndustries.map((v) => v[1]))

        var industryEl = GUI._el.querySelector("#companyIndustry");
        var countryEl = GUI._el.querySelector("#companyCountry");

        function pct(val, total) {
            return ", " + _.round(100 * val / total, 1) + "%"
        }

        if (industryEl) {
            industryEl.innerHTML = "";
            for (var industry of sortedIndustries.slice(0, 3)) {
                var row = document.createElement("div");
                row.className = "industry-info-row";
                row.innerHTML = "<table style=\"width:100%;padding:0px;margin:0px;\"><tr><td style=\"padding:0px;margin:0px;text-align:center;width:25px;\" ><img src=\"img/industryIcons/" + industry[0] + ".png\" style=\"width:22px;height:22px;\"></td><td style=\"width:80%;padding:0px;margin:0px;text-align:left; font-family: 'roboto';color:rgb(208, 206, 206);font-size:14px;\">" + industry[0].trim() + "" + pct(industry[1], totalIndustries) + "</td></tr></table>";
                industryEl.appendChild(row);
            }
        }

        if (countryEl) {
            countryEl.innerHTML = "";
            for (var country of sortedCountries.slice(0, 3)) {
                var row = document.createElement("div");
                row.innerHTML = "<span style=\" font-family: 'roboto';color:rgb(208, 206, 206);font-size:14px;\">" + country[0] + "" + pct(country[1], totalCountries) + "</span>";
                countryEl.appendChild(row);
            }
        }
    }
}


document.addEventListener("DOMContentLoaded", function () {
    // GUI.createSample();

    var rightInfo = document.querySelector(".rightCompanyInfo");
    if (rightInfo) makeDraggable(rightInfo);
});
