import "../../gui/company-details/CompanyDetails"
import * as _ from "lodash";
import { cycleGradient, getCurrentGradient } from "../utils/ColorUtils";

export { computeCompanyNodeColor, computeGroupNodeColorHelper } from "../utils/ColorUtils";

function formatNumber(num: number): string {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
}

function changeGradientBar(colorArray: number[]): void {
    const gradientString = colorArray.map((c) => "#" + c.toString(16).padStart(6, "0")).join(",");
    const tpl = `.companyGradient {
  background: lightgrey;
  background: -webkit-linear-gradient(left,${gradientString});
  background: -o-linear-gradient(left,${gradientString});
  background: -moz-linear-gradient(left,${gradientString});
  background: linear-gradient(to right,${gradientString});
}
`;
    const style = document.createElement("style");
    style.textContent = tpl;
    document.head.appendChild(style);
}

function getBody(): Element | null {
    return document.querySelector("sample-cluster-application graph-hud");
}

function makeDraggable(element: HTMLElement): void {
    let startX: number, startY: number, startLeft: number, startTop: number;

    function onMouseDown(e: MouseEvent) {
        startX = e.clientX;
        startY = e.clientY;
        const style = window.getComputedStyle(element);
        startLeft = parseInt(style.left) || 0;
        startTop = parseInt(style.top) || 0;
        element.style.position = "absolute";
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
        e.preventDefault();
    }

    function onMouseMove(e: MouseEvent) {
        element.style.left = (startLeft + e.clientX - startX) + "px";
        element.style.top = (startTop + e.clientY - startY) + "px";
    }

    function onMouseUp() {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
    }

    element.addEventListener("mousedown", onMouseDown);
}

function el(tag: string, props: { className?: string; innerHTML?: string; style?: Partial<CSSStyleDeclaration> } = {}): HTMLElement {
    const e = document.createElement(tag);
    if (props.className) e.className = props.className;
    if (props.innerHTML) e.innerHTML = props.innerHTML;
    if (props.style) Object.assign(e.style, props.style);
    return e;
}

interface AccordionItem {
    caption: string
    content: string | Node
    id?: string
}

interface GUINodeInfo {
    setNode: (node: unknown) => void
}

export const GUI = {
    _el: null as HTMLElement | null,
    _infoEl: null as HTMLElement | null,
    info: null as GUINodeInfo | null,

    createAccordion(items: AccordionItem[]): HTMLElement {
        function createSection(caption: string, content: string | Node, id?: string): DocumentFragment {
            const h3 = document.createElement("h3");
            h3.className = "accordion-header ui-accordion-header ui-helper-reset ui-state-default ui-accordion-icons ui-corner-all";
            h3.innerHTML = caption;

            const div = document.createElement("div");
            if (id) div.id = id;
            div.className = "ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom";
            if (typeof content === "string")
                div.innerHTML = content;
            else if (content instanceof Node)
                div.appendChild(content);

            const frag = document.createDocumentFragment();
            frag.appendChild(h3);
            frag.appendChild(div);
            return frag;
        }

        const acc = document.createElement("div");
        acc.className = "ui-accordion ui-widget ui-helper-reset my-accordion";
        for (let item of items) {
            item = Object.assign({ caption: "missing 'caption'", content: "missing 'content'" }, item);
            acc.appendChild(createSection(item.caption, item.content, item.id));
        }
        return acc;
    },

    createSlider(): void {},

    createSample(): void {
        const a = GUI.createAccordion([{
            caption: "<span style=\"color:reg(255,255,255);font-family: 'roboto';font-size:16px;\">Top Sectors </span><img src=\"include/images/Triangle.png\" style=\"width:10px;\">",
            id: "companyIndustry",
            content: "Technology, 33%<br>Consumer Discretionary, 20%<br>Consumer Staples, 20%"
        }, {
            caption: "<span style=\"color:reg(255,255,255);font-family: 'roboto';font-size:16px;\">Top Countries</span> <img src=\"include/images/Triangle.png\" style=\"width:10px;\">",
            id: "companyCountry",
            content: "United States, 80%<br>Japan, 10%<br>Germany, 4%"
        }]);

        Object.assign(a.style, { top: "80px", left: "10px", position: "absolute", zIndex: "999", width: "200px" });
        GUI._el = a;

        const body = getBody();
        if (body) body.appendChild(a);

        GUI.createSlider();
        GUI.info = GUI.createNodeInfoPanel();
    },

    createNodeInfoPanel(): GUINodeInfo {
        const infoEl = document.createElement("div");
        infoEl.className = "graph-node-info";
        infoEl.style.display = "none";

        const body = getBody();
        if (body) body.appendChild(infoEl);

        makeDraggable(infoEl);
        GUI._infoEl = infoEl;

        const header = el("div", { className: "graph-node-info-header" });
        const search = el("span", { className: "graph-node-info-search", innerHTML: "Yahoo Search" });
        const stockPrice = "<span style=\"margin-left:20px;margin-top:7px;\">USD <span style=\"color:#f7685e;font-family:'roboto-bold' !important;\">36.5</span> (-0.5%)</span>";
        const close = el("span", {
            className: "graph-node-info-close",
            innerHTML: "<i class=\"fa fa-times\" aria-hidden=\"true\" style=\"font-family:'FontAwesome' !important;\"></i> CLOSE",
            style: { marginLeft: "420px", cursor: "pointer" }
        });

        close.addEventListener("click", function () {
            infoEl.style.display = "none";
        });

        const stockPriceEl = document.createElement("span");
        stockPriceEl.innerHTML = stockPrice;
        header.appendChild(search);
        header.appendChild(stockPriceEl);
        header.appendChild(close);

        const bodyEl = el("div", { className: "graph-node-info-body" });
        bodyEl.innerHTML = "<company-details></company-details>";

        const newsEl = el("div", { className: "graph-node-info-news" });
        const newsHeader = el("div", { className: "graph-node-info-news-header", innerHTML: "News" });
        const newsBody = el("div", { className: "graph-node-info-news-body" });
        newsEl.appendChild(newsHeader);
        newsEl.appendChild(newsBody);

        infoEl.appendChild(header);
        infoEl.appendChild(bodyEl);
        infoEl.appendChild(newsEl);

        return {
            setNode: function (_node: unknown) {
                console.warn("TODO implement node data from database");
            }
        };
    },

    updateNodeInfo(node: unknown, bShow = true): void {
        if (!GUI._infoEl) return;
        GUI._infoEl.style.display = bShow ? "" : "none";
        if (bShow) GUI.info?.setNode(node);
    },

    updateFromVisibleNodes(nodes: Array<object>): void {
        if (!GUI._el) return;

        const visibleEl = GUI._el.querySelector(".graph-info-companys-visible");
        if (visibleEl) visibleEl.innerHTML = formatNumber(nodes.length);

        const industries: Record<string, number> = {};
        const countries: Record<string, number> = {};

        nodes.forEach(function (n) {
            const industry = (n as { industry?: string }).industry;
            const group = (n as { group?: string }).group;
            if (!industry) return;
            if (!group) return;
            if (!industries[industry]) industries[industry] = 0;
            industries[industry]++;
            if (!countries[group]) countries[group] = 0;
            countries[group]++;
        });

        const sortedIndustries = _.sortBy(_.toPairs(industries), 1).reverse();
        const sortedCountries = _.sortBy(_.toPairs(countries), 1).reverse();

        const totalCountries = _.sum(sortedCountries.map((v) => v[1]));
        const totalIndustries = _.sum(sortedIndustries.map((v) => v[1]));

        const industryEl = GUI._el.querySelector("#companyIndustry");
        const countryEl = GUI._el.querySelector("#companyCountry");

        function pct(val: number | string, total: number): string {
            return ", " + _.round(100 * (val as number) / total, 1) + "%";
        }

        if (industryEl) {
            industryEl.innerHTML = "";
            for (const industry of sortedIndustries.slice(0, 3)) {
                const row = document.createElement("div");
                row.className = "industry-info-row";
                row.innerHTML = "<table style=\"width:100%;padding:0px;margin:0px;\"><tr><td style=\"padding:0px;margin:0px;text-align:center;width:25px;\" ><img src=\"img/industryIcons/" + industry[0] + ".png\" style=\"width:22px;height:22px;\"></td><td style=\"width:80%;padding:0px;margin:0px;text-align:left; font-family: 'roboto';color:rgb(208, 206, 206);font-size:14px;\">" + industry[0].trim() + "" + pct(industry[1], totalIndustries) + "</td></tr></table>";
                industryEl.appendChild(row);
            }
        }

        if (countryEl) {
            countryEl.innerHTML = "";
            for (const country of sortedCountries.slice(0, 3)) {
                const row = document.createElement("div");
                row.innerHTML = "<span style=\" font-family: 'roboto';color:rgb(208, 206, 206);font-size:14px;\">" + country[0] + "" + pct(country[1], totalCountries) + "</span>";
                countryEl.appendChild(row);
            }
        }
    }
};

document.addEventListener("DOMContentLoaded", function () {
    const sel = document.createElement("select");
    sel.className = "cloudNodeColorSelect";
    sel.innerHTML = `<option value="sent">sentiment</option>
<option value="priceRanges">price ranges</option>
<option value="group">group</option>`;

    const gradientEl = document.querySelector(".companyGradient");
    if (gradientEl) {
        gradientEl.addEventListener("click", function () {
            const array = cycleGradient();
            changeGradientBar(array);
            sel.dispatchEvent(new Event("change"));
        });
    }

    sel.addEventListener("change", function () {
        const val = sel.value;
        window.dispatchEvent(new CustomEvent("node-color-change", { detail: val }));
    });

    const body = getBody();
    if (body) body.appendChild(sel);
});

document.addEventListener("DOMContentLoaded", function () {
    const rightInfo = document.querySelector<HTMLElement>(".rightCompanyInfo");
    if (rightInfo) makeDraggable(rightInfo);
});
