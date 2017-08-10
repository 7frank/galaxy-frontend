(function (window) {

    'use strict';

    if (!window.Samson) {
        window.Samson = {};
    }

    var Samson = window.Samson;

    Samson.App = window.Samson.App || {};

    Samson.App.BubbleChart = {
        drawBubbleChart: function () {
            var svgContainer = $('#trending_bubble_chart');

            var sectorDomain = [
                'Information Technology',
                'Telecommunication Services',
                'Healthcare',
                'Industrials',
                'Energy',
                'Consumer Staples',
                'Materials',
                'Consumer Discretionary',
                'Financials',
                'Utilities',
                null
            ]
            var colorDomain = ['#69D2E7',
                '#F38630',
                '#ECD078',
                '#C02942',
                '#542437',
                '#53777A',
                '#0B486B',
                '#A8DBA8',
                '#031634',
                '#CDB380',
                '#C7F464',
                '#FF6B6B'];

            var color = d3.scale.ordinal()
                .domain(sectorDomain)
                .range(colorDomain);
            var width = svgContainer.width(), height = $(window).height();
            var diameter = 500;
            var bubbleLayout = d3.layout.pack()
                .sort(null)
                .size([width * 2, height / 2])
                .padding(6);

            var svg = d3.select('#trending_bubble_chart')
                .append('svg')
                .attr('width', width)
                .attr('height', height / 2)
                .attr('class', 'bubble');

            d3.json('/companies/bubble_data.json', function (error, data) {

                data = data.map(function (d) {
                    d.value = +d.value;
                    return d;
                });


                var nodes = bubbleLayout.nodes({children: data})
                    .filter(function (d) {
                        return !d.children;
                    });

                var bubbles = svg.selectAll('.node')
                    .data(nodes)
                    .enter()
                    .append('g')
                    .attr('class', 'node');
                bubbles.append('circle')
                    .attr('r', function (d) {
                        return d.r;
                    })
                    .attr('cx', function (d) {
                        return d.x - width / 2;
                    })
                    .attr('cy', function (d) {
                        return d.y;
                    })
                    .style('fill', function (d) {
                        return color(d.sector);
                    })
                    .on('click', function (d) {
                        var url = '/charts/' + d.id + '/supply_chain';
                        window.open(url.toString(), '_blank');
                    })
                    .on('mouseenter', function (d) {
                        var circle = $(this)[0];
                        var $arrow = $('#company_information_arrow');
                        var scrollTop = $(window).scrollTop();
                        $arrow.attr('class', 'arrow-down');
                        var yPosition = circle.getBoundingClientRect().top + scrollTop + 80;
                        var position = {
                            x: d.x - width/2 - 135,
                            y: yPosition
                        };
                        Samson.App.SupplyChainChartUtility.showCompanyInfo(d, position);
                    })
                    .on('mouseleave', function (d) {
                        Samson.App.SupplyChainChartUtility.hideCompanyInfo();
                    });

                bubbles.append('text')
                    .attr('dy', '.3em')
                    .attr('x', function (d) {
                        return d.x - width / 2;
                    })
                    .attr('y', function (d) {
                        return d.y;
                    })
                    .style('font-size', function (d) {
                        return (d.value / 10) * 2 + 14;
                    })
                    .style('pointer-events', 'none')
                    .style('fill', function (d) {
                        return '#FFFFFF';
                    })
                    .style('text-anchor', 'middle')
                    .text(function (d) {
                        return d.full_ticker.substring(0, d.r / 5);
                    });
            })
        },
        Init: function () {
            if ($('#trending_bubble_chart').length > 0) {
                this.drawBubbleChart();
            }
        }
    }

})(window);
