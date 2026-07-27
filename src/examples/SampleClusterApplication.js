

import "../../css/style.css"
import "../../css/force-graph.css"
import "../../js/gui/searchbar"
import "../../js/gui/GraphHUD"
import "../../js/gui/DebugHUD"
import "../../js/gui/ColorGradient"

import GraphView3D from "../../js/view/GraphView3D"

import CsvDatasource from "../../js/data/CsvDatasource"
import { ClusteringUtils } from "../../js/cluster/ClusteringUtils"

export { CsvDatasource }


export class SampleClusterApplication extends HTMLElement {

    connectedCallback() {

        if (!this.datasource) {
            this.datasource = new CsvDatasource(
                "assets/realDataNodesv5_ticker.csv",
                "assets/realDataLinksv5.csv"
            )
        }

        this.setupViews()

        const hud = document.createElement("graph-hud");
        this.appendChild(hud);

        const debugHud = document.createElement("graph-debug-hud");
        this.appendChild(debugHud);

        const gradient = document.createElement("graph-color-gradient");
        gradient.setAttribute("left-label", "Negative");
        gradient.setAttribute("right-label", "Positive");
        gradient.setAttribute("color-modes", "sentiment,priceRanges,group");
        this.appendChild(gradient);

        const searchbar = document.createElement("graph-searchbar");
        searchbar.setAttribute("placeholder", "Search nodes");
        searchbar.setAttribute("search-fields", "name,id,group,industry");
        this.appendChild(searchbar);
    }


    setupViews() {

        const speccs = ClusteringUtils.buildSpeccs([
            { key: 'group' },
            { key: 'industry' },
            {},
        ]);

        const viewEl = document.createElement("div");
        viewEl.style.cssText = "width:100%;height:100%;position:relative;";
        this.appendChild(viewEl);

        const mGraphView = new GraphView3D(viewEl);
        mGraphView.setSpeccs(speccs);
        mGraphView.loadDatasource(this.datasource);

        this._view = mGraphView;
    }
}

customElements.define("sample-cluster-application", SampleClusterApplication);
