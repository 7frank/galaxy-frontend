(function (window) {

    'use strict';

    if (!window.Samson) {
        window.Samson = {};
    }

    var Samson = window.Samson;

    Samson.App = window.Samson.App || {};

    Samson.App.SupplyChainBigCompanyChart = {
        _drawChart: function () {
            var svgWidth, svgHeight, data, diameter;
            var margin = {top: 0, right: 0, bottom: 0, left: 0};
            svgWidth = $('#supply_chain_big_company_chart').width();
            svgHeight = $(window).height() - 135;

            diameter = svgHeight >= svgWidth ? svgWidth : svgHeight;
            data = gon.data;

            var tree = d3.layout.tree()
                .size([360, (diameter / 2) - 140])
                .separation(function (a, b) {
                    return (a.parent == b.parent ? 1 : 2) / a.depth;
                });

            var diagonal = d3.svg.diagonal.radial()
                .projection(function (d) {
                    return [d.y, d.x / 180 * Math.PI];
                });

            var svg = d3.select('#supply_chain_big_company_chart').append('svg')
                .attr('width', svgWidth)
                .attr('height', svgHeight)
                .append('g')
                .attr('transform', 'translate(' + diameter / 2 + ',' + svgHeight / 2 + ')');

            var nodes = tree.nodes(data),
                links = tree.links(nodes);

            var link = svg.selectAll('.link')
                .data(links)
                .enter().append('path')
                .attr('class', 'link')
                .attr('d', diagonal);

            var node = svg.selectAll(".node")
                .data(nodes)
                .enter().append("g")
                .attr("class", "node")
                .attr("transform", function (d) {
                    return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")";
                }).on('click', function (d) {
                    Samson.App.SupplyChainChartUtility.showMenu({
                            name: d.name,
                            id: d.id,
                            hierarchy_info: d.hierarchy_info,
                            histories: d.histories
                        },
                        {
                            x: $(d3.select(this)[0]).offset().left,
                            y: $(d3.select(this)[0]).offset().top
                        }
                    );
                });
            ;

            node.append("circle")
                .attr("r", 4.5);

            node.append("text")
                .attr("dy", ".31em")
                .attr("text-anchor", function (d) {
                    return d.x < 180 ? "start" : "end";
                })
                .attr("transform", function (d) {
                    return d.x < 180 ? "translate(8)" : "rotate(180)translate(-8)";
                })
                .text(function (d) {
                    if (!d.isroot) {
                        return ' ' + d.ticker + ' (' + d.percent + ')';
                    }
                });

            node.append('text')
                .attr('class', 'company-text')
                .attr('dy', '.31em')
                .attr('text-anchor', 'middle')
                .attr('transform', function (d) {
                    return 'rotate(270)translate(0 , -20)';
                })
                .text(function (d) {
                    if (d.isroot) {
                        return d.name;
                    }
                })

        },
        _drawTableContainer: function () {
            var svgWidth = $('#supply_chain_big_company_chart').width();
            var svgHeight = $(window).height() - 150;
            var $supplyChainTable = $('#supply_chain_table');
            var diameter = svgHeight >= svgWidth ? svgWidth : svgHeight;
            $supplyChainTable.height(svgHeight);
            $supplyChainTable.width(svgWidth - diameter - 50);
        },
        Init: function () {
            if ($('#supply_chain_big_company_chart').length > 0) {
                this._drawChart();
                this._drawTableContainer();
            }
        }
    }
})(window);
