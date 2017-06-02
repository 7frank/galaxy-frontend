/**
 * Created by Frank on 02.06.2017.
 */


export default
class EdgeUtil {

    static getEdgesForNodes(nodes, bInternal = true, bExternal = false) {

        //FIXME
        console.warn("TODO EdgeUtil.getEdgesForNodes")
       return []


    if (nodes instanceof ClusterLeafElement) nodes = nodes.mNodes

    if (!bInternal && !bExternal) return []
    //get relevant edges from
    //a.clusters.mClusters.mClusters["United States"][0].mNodes

    var edges = [];

    _.each(nodes, function (node, id) {

        //check if it is a container element
        if (node instanceof ClusterLeafElement) {
            let _edges = getEdgesForNodes(node.mNodes, bInternal, bExternal)
            edges = edges.concat(_edges);
            edges = _.uniq(edges)
            return
        }

        _.each(node.edges, function (edge, id) {


            let srcContained = nodes.indexOf(edge.source) >= 0;
            let trgContained = nodes.indexOf(edge.target) >= 0;


            let isInternalNode = srcContained && trgContained;

            // console.log(srcContained,trgContained,isInternalNode)
            if (bInternal && isInternalNode || bExternal && !isInternalNode) {
                edges = edges.concat(node.edges);
                edges = _.uniq(edges)
            }

        })


    })


    return edges

}

}