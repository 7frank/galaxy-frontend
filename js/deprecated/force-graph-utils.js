// rest of things that need to be refactored
//doesn't work that way.. more of a reminder for now

//------------------------------------------------
//feature 6 store export nodes
/**
 * @deprecated
 *  we might be able to use some of that in the future in case there is a user story to download a filtered graph
 */

$(function () {

    setTimeout(function () {

        var searchbar = $(".searchbar-container input");

        $(window).bind('keyup', 'ctrl+s', exportGraph);
        searchbar.on("keyup", null, 'ctrl+s', exportGraph)


    }, 1000)


});


function exportGraph() {

    download("resultGraph.json", _exportNodes(globalNodes, globalLinks))
}


function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

function _exportNodes(nodes, edges, ignoredNodeKeys) {
    if (!ignoredNodeKeys)
        ignoredNodeKeys = "_id,children,parents,edges,_bubble".split(",");


    var mappedNodes = nodes.map(node => _.omit(node, ignoredNodeKeys));

    var mappedEdges = edges.map(edge => ({source: edge.source.id, target: edge.target.id} ));

    var obj = {alpha: globalEnv.layout.alpha(), nodes: mappedNodes, links: mappedEdges};

    return JSON.stringify(obj)

}

//-----------------------------------------------
//adding demo stuff

//make canvas focusable so below actions can be triggered when input is not focused


/*
setTimeout(function () {

    $("#3d-graph canvas").attr("tabindex", "1").on("click", function () {
        $(this).focus()
    })
}, 500);

$(window).bind('keyup', '+', function () {

    curDataSetIdx = (curDataSetIdx + 1) % dataSets.length;
    toggleDimensions(3)

});
$(window).bind('keyup', '-', function () {

    curDataSetIdx = (curDataSetIdx + dataSets.length - 1) % dataSets.length;
    toggleDimensions(3)

});

*/
