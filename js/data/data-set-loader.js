import $ from 'jquery';
import 'jquery-ui/themes/base/core.css';
//import 'jquery-ui/themes/base/theme.css';
//import 'jquery-ui/themes/base/selectable.css';
import 'jquery-ui/ui/core';
import 'jquery-ui/ui/widgets/progressbar';


import "../gui/searchbar"


import qwest from "qwest"
import Papa from "papaparse"
import {gpuInfo} from "../deprecated/gpu-info";

import ApolloDS from "./ApolloDS"


function createDlg() {

    const dialogTemplate = `<div id="dialog-confirm" title="Load the Graph anyway?">
	  <p><span class="ui-icon ui-icon-alert" style="float:left; margin:12px 12px 20px 0;"></span>Your graphics card might be too slow or your browser does use the onboard card. The page might show 3d content in suboptimal form. </p>
</div>`
    return $(dialogTemplate)
}

function openGraphConfirmDialog(fileName, nodeCount, acceptCallback) {

    gpuInfo().lt(5000, function () {

        console.warn("gpu might be too slow or onboard graphics are used")


        acceptCallback()
        /*

         //FIXME
         if (!window["mGraph"]) setTimeout(waitForGraphToInit,100)
         else waitForGraphToInit()

         function waitForGraphToInit()
         {
         console.log("whoot")


         if (!window["mGraph"]) setTimeout(waitForGraphToInit,100)
         else
         mGraph.nodeDistancePromise.then(() => acceptCallback()  )

         }
         */
        /*
         createDlg().dialog({
         resizable: false,
         height: "auto",
         width: 400,
         modal: true,
         buttons: {
         "Load graph anyway!": function() {
         $( this ).dialog( "close" );

         acceptCallback()

         },
         Cancel: function() {
         $( this ).dialog( "close" );
         }
         }
         });*/

    }).run()


}

export function getGraphDataSets() {

    // Color brewer paired set
    const colors = ['#f90500', '#e9e916', '#55c64c', '#FF0000', '#00FF00', '#0000FF', '#FF00FF', '#C0C0C0', '#808080', '#800000', '#808000', '#008000', '#800080', '#008080', '#000080'];


    function defaultLoadFile(fileName) {

        //add progressbar
        var progressbar = $('<div id="progressbar"></div>')
        var progressLabel = $('<div class="progress-label">Loading... ' + fileName + '</div>')
        progressbar.append(progressLabel)

        progressbar.progressbar({
            value: false,
            change: function () {
                progressLabel.text(fileName + " " + progressbar.progressbar("value") + "%");
            },
            complete: function () {
                progressbar.fadeOut()
                progressLabel.text(fileName + " Complete!");
            }
        });


        if (_.endsWith(fileName, ".json")) {
            //the load function itself
            const loadJSON = function (Graph) {

                qwest.get(fileName, null, null, function (xhr) {

                    xhr.onprogress = function (e) {

                        var val = progressbar.progressbar("value") || 0;
                        console.log(e)
                        progressbar.progressbar("value", e.loaded / e.total * 100);

                    };

                    xhr.onloadstart = function (e) {
                        console.log("onloadstart")
                        progressbar.show()
                        progressbar.appendTo("body")
                    };

                }).then(defaultLoadSuccess).catch(console.warn);


            };
            loadJSON.description = "<em>" + fileName + "</em>";
            return loadJSON;
        }
        else if (_.endsWith(fileName, ".csv")) {




            //the load function itself
            const loadCSV = function (Graph, alternativehandler) {

                var nodes = []


                progressbar.show()
                progressbar.appendTo("body")

                Papa.parse(fileName, {
                    download: true,
                    //worker: true,
                    header: true,
                    dynamicTyping: true,
                    step: function (row) {


                        var curr = row.meta.cursor
                        var max = 450000//TODO file.size
                        progressbar.progressbar("value", curr / max * 100);

                        //id,name,industry,country,sent,price,itemCount
                        //4488	alnc.	Consumer Staples	United States	64	12%	8
                        var r = row.data[0]

                        //TODO having proper groupings probably needs a tree approach that contains order of groups

                        var data = {
                            id: r.id,
                            name: r.name,
                            group: r.country,
                            industry: r.industry,
                            sent: r.sent,
                            price: r.price,
                            itemCount: r.itemCount
                        }

                        data.color = 0x00ff00

                        nodes.push(data)

                    },
                    complete: function () {

                        defaultLoadSuccess(_, {nodes: nodes})
                        progressbar.hide()
                    }
                });


            };
            loadCSV.description = "<em>" + fileName + "</em>";
            return loadCSV;


        }


    }


    /*******************************************************************************************************/
    /**
     * adding some database functions to query the remote server
     *
     *
     * @param countryName
     * @returns {string}
     */
    function getCountryQuery(countryName) {
        var str = ""
        if (countryName)
            str = `country:"${countryName}"`

        return `        
              query GraphCountryData  {
                        nodes(${str}) {
                          id
                          name
                          country
                          industry
                          ticker
                          sentiment
                          price
                          itemCount
                        }
                          edges(${str}){
                            source
                            target
                            strength
                            
                          }     
            }
        `
    }


    var db = new ApolloDS()

    function queryDatabase(query, AlsoNotUsed) {
        return function (notUsed, onSuccess) {


            db.query(query, function (response) {

                var _nodes = response.data.nodes.map(function (r) {

                    var data = {
                        id:""+ r.id,
                        name: r.name,
                        group: r.country,
                        industry: r.industry,
                        sent: r.sentiment,
                        price: r.price,
                        itemCount: r.itemCount,
                        ticker: r.ticker
                    }

                    data.color = 0x0000ff
                    return data
                })

                var _links = []

                response.data.edges.forEach(function (edge) {
                    let link = {
                        source: "" + edge.source,
                        target: "" + edge.target,
                        strength: edge.strength
                    }
                    _links.push(link)
                })


                var data = {
                    expanded: ["United States"],
                    nodes: _nodes,
                    links: _links,
                    isRealData: true
                }

                //FIXME the work flow in here needs some proper refactoring to be more efficient..
                defaultLoadHandler(_,data,onSuccess)





            })

        }
    }


    function loadRealDataSampleOnly(fileName, fileName2, onLoadSuccess) {


        function streamCSVFile(fileName, onRowCallback, onComplete) {
            return new Promise(function (ok, fail) {


                Papa.parse(fileName, {
                    download: true,

                    header: true,
                    dynamicTyping: true,
                    step: onRowCallback,
                    complete: function () {
                        if (typeof onComplete == "function") onComplete();
                        ok()
                    }
                });


            })

        }


        //the load function itself
        const loadCSV = function (Graph, alternativehandler) {

            var nodes = []
            var links = []

            var nodesPromise = streamCSVFile(fileName, function (row) {

                if (row.errors.length > 0) return

                //id,name,industry,country,sent,price,itemCount
                //4488	alnc.	Consumer Staples	United States	64	12%	8
                var r = row.data[0]

                //TODO having proper groupings probably needs a tree approach that contains order of groups

                var data = {
                    id: r.id,
                    name: r.name,
                    group: r.country,
                    industry: r.industry,
                    sent: r.sent,
                    price: r.price,
                    itemCount: r.itemCount,
                    ticker: r.ticker
                }

                data.color = 0x00ff00

                nodes.push(data)

            })


            var invalidLinks = 0
            var linksPromise = streamCSVFile(fileName2, function (row) {

                if (row.errors.length > 0) return

                //SourceID,TargetID,Relationship Strenght
                //4488	448338	12%
                var r = row.data[0]

                //TODO having proper groupings probably needs a tree approach that contains order of groups

                if (!r.SourceID || !r.TargetID) {
                    invalidLinks++;
                    return
                }

                var data = {source: "" + r.SourceID, target: "" + r.TargetID, strength: r['Relationship Strenght']}


                links.push(data)

            }, function onComplete() {

                console.log("invalid links while loading csv:" + fileName2, invalidLinks)
                console.log("valid links:", links)

            })


            Promise.all([nodesPromise, linksPromise])
                .then(function () {


                    defaultLoadSuccess(_, {
                        expanded: ["United States"],
                        nodes: nodes,
                        links: links,
                        isRealData: true
                    }, alternativehandler)

                    if (onLoadSuccess)
                        onLoadSuccess(Graph)


                });


        };
        loadCSV.description = "<em>" + fileName + " " + fileName2 + "</em>";
        return loadCSV;


    }


    function defaultLoadSuccess(_, data, alternativehandler) {


        if (data.nodes.length > 1000)
            openGraphConfirmDialog("filename.filetodo", data.nodes.length, function acceptCallback() {

                defaultLoadHandler(_, data, alternativehandler)

            })
        else
            defaultLoadHandler(_, data, alternativehandler)

    }


    function defaultLoadHandler(_, data, alternativehandler) {
        const nodes = {};


        data.nodes.forEach(node => {
            nodes["" + node.id] = node
        }); // Index by ID


        var alpha = (typeof data.alpha == "number") ? data.alpha : undefined

        const expanded = {};
        if (data.expanded)
            data.expanded.forEach(e => {
                expanded[e] = true
            });


        if (!data.links) {
            console.warn("graph does not contain links")
            data.links = []

        }

        var alteredLinks = data.links.map(link => [link.source, link.target])


        var invalidLinks = 0
        alteredLinks = alteredLinks.filter(function (link) {
            if (!link[0] || !link[1]) {
                invalidLinks++
                return
            }
            return link
        });

        console.log("invalid links after loading", invalidLinks)


        let mGraphData = {
            nodes: nodes,
            links: alteredLinks,// net.links.map(link => [link.source, link.target]),
            expand: expanded,
            alpha: alpha,
            hasCountryGroups: data.isRealData
        }

        //TODO refactor loading .. currently this is quite messy..
        if (typeof alternativehandler == "function")
            alternativehandler(mGraphData)
        else
            throw new Error("using deprecated approach with only one graph instance. use alternativehandler property instead")


    }


    var url = new URL(window.location.href);
    var c = url.searchParams.get("countries");
   let extraCountriesTODO
    if (c) extraCountriesTODO=c.replace(new RegExp("_", "gi")," ")

    return [
       queryDatabase(getCountryQuery(extraCountriesTODO)),
        queryDatabase(getCountryQuery(extraCountriesTODO?extraCountriesTODO:"France,Taiwan")),

        loadRealDataSampleOnly("assets/realDataNodesv5_ticker.csv", "assets/realDataLinksv5.csv", function (graph) {
        }),
        loadRealDataSampleOnly("assets/realDataNodesv1_with_ticker.csv", "assets/realDataLinksv1.csv", function (graph) {
        }),
        //loadRealDataSampleOnly("assets/realDataNodesv1.csv","assets/realDataLinksv1.csv",function(graph){graph.numSkipEdgesRendered(1)  }),
        //loadRealDataSampleOnly("assets/realDataNodes.csv","assets/realDataLinks.csv",function(graph){graph.numSkipEdgesRendered(20)  }),

        defaultLoadFile("assets/miserables.json"),
        defaultLoadFile("assets/orig.json"),
        defaultLoadFile("assets/collapse_test.json"),
        defaultLoadFile("assets/miserables_fixed.json"),
        defaultLoadFile("assets/blocks.json"),
        defaultLoadFile("assets/blocks_fixed.json")
    ];
}
