import "../js/gui/searchbar"
import "../js/gui/NodeListPanel"
import "../js/gui/GraphHUD"
import "../js/gui/DebugHUD"
import "../js/gui/ColorGradient"
import "../js/gui/Breadcrumb"

import GraphView3D from "../js/view/GraphView3D"
import CsvDatasource from "../js/data/CsvDatasource"
import { ClusteringUtils } from "../js/cluster/ClusteringUtils"

const datasource = new CsvDatasource(
    "assets/realDataNodesv5_ticker.csv",
    "assets/realDataLinksv5.csv"
)

const speccs = ClusteringUtils.buildSpeccs([
    { key: 'group' },
    { key: 'industry' },
    {},
])

const viewEl = document.getElementById("view")!
const mGraphView = new GraphView3D(viewEl)
mGraphView.setSpeccs(speccs)
mGraphView.loadDatasource(datasource)

window.dispatchEvent(new CustomEvent("graph-ready"))
