(function (window) {

    'use strict';

    if (!window.Samson) {
        window.Samson = {};
    }

    var Samson = window.Samson;

    Samson.App = window.Samson.App || {};

    Samson.App.AboutPageBubbleChart = {
        drawChart: function () {
            var diameter = $('.col-md-6').find('img').first().width();
            var $mapCoverageBubble = $('#map_coverage_bubble');
            $mapCoverageBubble.width(diameter);
            $mapCoverageBubble.height(diameter);
            var data = [
                {
                    name: 'US',
                    value: 3500,
                    color: '#ffc000'
                },
                {
                    name: 'Canada',
                    value: 550,
                    color: '#01b0f1'
                },
                {
                    name: 'Europe',
                    value: 960,
                    color: '#e66b0b'
                },
                {
                    name: 'Others',
                    value: 600,
                    color: '#93d04c'
                },
                {
                    name: 'Asia Pacific',
                    value: 1000,
                    color: '#012060'
                },
                {
                    name: 'Japan',
                    value: 1200,
                    color: '#01b051'
                }
            ]

            var bubbleLayout = d3.layout.pack()
                .sort(null)
                .size([diameter, diameter])
                .padding(1.5);

            var svg = d3.select('#map_coverage_bubble')
                .append('svg')
                .attr('width', diameter)
                .attr('height', diameter)
                .attr('class', 'bubble');

            var nodes = bubbleLayout.nodes({children: data})
                .filter(function (d) {
                    return !d.children;
                });

            var bubbles = svg.selectAll('.node')
                .data(nodes)
                .enter()
                .append('g')
                .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
                .attr('class', 'node');
            bubbles.append('circle')
                .attr('r', function (d) {
                    return d.r;
                })
                .style('fill', function (d) {
                    return d.color;
                });

            bubbles.append("text")
                .attr("dy", "-2px")
                .style("text-anchor", "middle")
                .style('fill', '#FFF')
                .style('font-size', 22)
                .text(function(d) { return d.name; });

            bubbles.append("text")
                .attr("dy", "30px")
                .style("text-anchor", "middle")
                .style('fill', '#FFF')
                .style('font-size', 30)
                .text(function(d) { return d.value.toLocaleString() });

            svg.append('text')
                .attr('x', diameter/2)
                .attr('y', diameter - 10)
                .style("text-anchor", "middle")
                .style("fill", "#888")
                .text('* approximate number of covered companies')
        },
        Init: function () {
            this.drawChart();
        }
    }
})(window);
