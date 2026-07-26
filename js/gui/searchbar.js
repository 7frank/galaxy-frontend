import { doOnClickNode, highlightNodeElements, unhighlightNodeElements } from "../cluster/GraphElementExtension"
import * as _ from "lodash";
import Mousetrap from "mousetrap";
import "./searchbar.css";

function getNodes() {
    const viewEl = document.querySelector(".view-3d.view-3d-maximised");
    const view = viewEl ? viewEl._view3d : null;
    return (view && view.mRootCluster && view.mRootCluster.mNodes) ? view.mRootCluster.mNodes : [];
}

class GraphSearchbar extends HTMLElement {

    connectedCallback() {
        this._filterResult = [];
        this._lastResults = [];
        this._build();
    }

    disconnectedCallback() {
        this._mousetrap?.reset();
    }

    _build() {
        const container = document.createElement("div");
        container.className = "searchbar-container";

        const searchbarEl = document.createElement("input");
        searchbarEl.placeholder = this.getAttribute("placeholder") ?? "Search…";
        container.appendChild(searchbarEl);

        const icon = document.createElement("span");
        icon.className = "searchbar-search";
        container.appendChild(icon);

        const dropdown = document.createElement("ul");
        dropdown.className = "searchbar-autocomplete-popup";
        dropdown.style.display = "none";
        container.appendChild(dropdown);

        this.appendChild(container);
        this._container = container;
        this._searchbarEl = searchbarEl;
        this._dropdown = dropdown;

        searchbarEl.addEventListener("keyup", () => this._doFilterList());

        searchbarEl.addEventListener("blur", () => {
            setTimeout(() => {
                searchbarEl.value = "";
                dropdown.style.display = "none";
                this._showSuggestions([]);
            }, 150);
        });

        window.addEventListener("keydown", (e) => {
            if (e.keyCode === 114 || (e.ctrlKey && e.keyCode === 70)) e.preventDefault();
            if (e.keyCode === 114 || (e.ctrlKey && e.keyCode === 83)) e.preventDefault();
        });

        const toggleSearch = (e) => {
            container.style.display = container.style.display === "none" ? "" : "none";
            searchbarEl.focus();
            e.stopPropagation();
            e.preventDefault();
        };

        this._mousetrap = new Mousetrap();
        this._mousetrap.bind("ctrl+f", toggleSearch);
        new Mousetrap(searchbarEl).bind("ctrl+f", toggleSearch);
    }

    _showSuggestions(results) {
        this._lastResults.forEach(v => unhighlightNodeElements.apply(v));
        results.forEach(v => highlightNodeElements.apply(v, [true, false]));
        this._lastResults = results;
    }

    _doFilterList() {
        this._filterResult.forEach(v => unhighlightNodeElements.apply(v));

        const val = this._searchbarEl.value.toLowerCase();
        if (!val) { this._filterResult = []; this._renderDropdown([]); return; }

        this._filterResult = getNodes().filter(function (v) {
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

        this._renderDropdown(this._filterResult.slice(0, 80));
    }

    _renderDropdown(items) {
        const { _dropdown: dropdown, _searchbarEl: searchbarEl } = this;
        dropdown.innerHTML = "";
        if (items.length === 0) { dropdown.style.display = "none"; return; }

        const val = searchbarEl.value;
        const re = new RegExp(val, "gi");

        items.forEach((item) => {
            const tcr = item.ticker ? "Ticker:" + item.ticker : "";
            const text = `${item.name} (${tcr})`;
            const highlighted = text.replace(re, "<b>$&</b>");

            const li = document.createElement("li");
            li.className = "searchbar-search-row";
            li.innerHTML = "<div>" + highlighted + "</div>";

            li.addEventListener("mousedown", (e) => {
                e.preventDefault();
                searchbarEl.value = item.name;
                dropdown.style.display = "none";
                doOnClickNode(item);
                if (item.classList) item.classList.add("basic-selection");
            });

            dropdown.appendChild(li);
        });

        dropdown.style.display = "";
        if (searchbarEl.classList.contains("darker")) {
            const css = window.getComputedStyle(searchbarEl, null);
            dropdown.style.backgroundColor = css.getPropertyValue("background-color");
            dropdown.style.color = css.getPropertyValue("color");
        }
    }
}

if (!customElements.get("graph-searchbar"))
    customElements.define("graph-searchbar", GraphSearchbar);

export { GraphSearchbar };
