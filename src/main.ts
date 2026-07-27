// import "../css/style.css"
import "../js/gui/searchbar"
import "../js/gui/GraphHUD"
import "../js/gui/DebugHUD"
import "../js/gui/ColorGradient"

import GraphView3D from "../js/view/GraphView3D"
import CsvDatasource from "../js/data/CsvDatasource"
import { ClusteringUtils } from "../js/cluster/ClusteringUtils"

const app = document.getElementById("app")!

const datasource = new CsvDatasource(
    "assets/realDataNodesv5_ticker.csv",
    "assets/realDataLinksv5.csv"
)

const speccs = ClusteringUtils.buildSpeccs([
    { key: 'group' },
    { key: 'industry' },
    {},
])

const viewEl = document.createElement("div")
viewEl.style.cssText = "width:100%;height:100%;position:relative;"
app.appendChild(viewEl)

const mGraphView = new GraphView3D(viewEl)
mGraphView.setSpeccs(speccs)
mGraphView.loadDatasource(datasource)

const hud = document.createElement("graph-hud") as any
hud.setView(mGraphView)
app.appendChild(hud)

const debugHud = document.createElement("graph-debug-hud")
app.appendChild(debugHud)

const gradient = document.createElement("graph-color-gradient")
gradient.setAttribute("left-label", "Negative")
gradient.setAttribute("right-label", "Positive")
gradient.setAttribute("color-modes", "sentiment,priceRanges,group")
app.appendChild(gradient)

const searchbar = document.createElement("graph-searchbar")
searchbar.setAttribute("placeholder", "Search nodes")
searchbar.setAttribute("search-fields", "name,id,group,industry")
app.appendChild(searchbar)
