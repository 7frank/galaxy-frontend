(function (window) {

    'use strict';

    if (!window.Samson) {
        window.Samson = {};
    }

    var Samson = window.Samson;

    Samson.App = window.Samson.App || {};

    Samson.App.FootballFieldChart = {
        _initChart: function () {
            var dataset, width, height, svg, max, min, yScale, xScale, lineData;
            lineData = gon.data.line_data;
            dataset = gon.data.dataset;

            if(!dataset && !lineData ) {
                return ;
            }

            var svgWidth, svgHeight;
            // 115 is height of top container
            svgHeight = $(window).height() - 135;
            svgWidth = $('#football_field').width();

            var margin = {top: 20, right: ((svgWidth/100) * 30), bottom: 100, left: 100};

            width = svgWidth - margin.left - margin.right;
            height = svgHeight - margin.top - margin.bottom;

            _.map(dataset, function (d) {
                d.min = Number(d.min);
                d.max = Number(d.max);
                d.median = Number(d.median);
            });

            max = d3.max(dataset, function (d) {
                return d.max
            });
            min = d3.min(dataset, function (d) {
                return d.min
            });

            var xDomain = _.map(dataset, function(d) { return d.x });

            xScale = d3.scale.ordinal()
                .domain(xDomain)
                .rangeBands([0, width], 0.35, 0.5);

            yScale = d3.scale.linear()
                .domain([min - 2, max + 2])
                .range([height, 0]);

            svg = d3.select('#football_field').append('svg')
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
                .attr('viewBox', '0 0 ' + svgWidth + ' ' + svgHeight)
                .append('g')
                .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

            this._drawAxis(svg, xScale, yScale, height, margin);
            this._drawChart(svg, dataset, xScale, yScale);
            this._drawLine(svg, yScale, width, lineData);
            this._drawGradientBar(svg, height, margin);
        },
        _drawLine: function (svg, yScale, width, lineData) {
            if (!lineData) {
                return;
            }
            svg.append('line')
                .attr('class', 'line')
                .attr('x1', 0)
                .attr('y1', function (d) {
                    return yScale(lineData)
                })
                .attr('x2', width)
                .attr('y2', function (d) {
                    return yScale(lineData)
                });


            var xPosition = width - 30;

            var $text = svg.append('text')
                .attr('x', xPosition)
                .attr('y', function (d) {
                    return yScale(lineData);
                })
                .attr('dy', '.71em')
                .attr('text-anchor', 'middle');

            $text.append('tspan')
                .attr('x', xPosition)
                .attr('y', function (d) {
                    return yScale(lineData) - 40;
                })
                .attr('font-size', '20')
                .attr('text-anchor', 'middle')
                .attr('class', 'stock-price')
                .text('$' + lineData);

            $text.append('tspan')
                .attr('x', xPosition)
                .attr('y', function (d) {
                    return yScale(lineData) - 15;
                })
                .attr('font-size', '9.5')
                .attr('text-anchor', 'middle')
                .text('Stock Price Last Close');

        },
        _drawAxis: function (svg, xScale, yScale, height, margin) {
            var xAxis = d3.svg.axis()
                .scale(xScale)
                .orient('bottom');

            var yAxis = d3.svg.axis()
                .scale(yScale)
                .orient('left');

            svg.append('g')
                .attr('transform', 'translate(0,' + height + ')')
                .attr('class', 'x axis')
                .call(xAxis)
                .selectAll('.tick text')
                .call(this._wrapText, xScale.rangeBand());

            svg.append('g')
                .attr('class', 'y axis')
                .call(yAxis);

        },
        _drawChart: function (svg, dataset, xScale, yScale) {
            var chart = svg.append('g')
                .selectAll('rect')
                .data(dataset)
                .enter();

            chart.append('g')
                .append('rect')
                .attr('class', 'bar')
                .attr('x', function (d, index) {
                    return xScale(d.x)
                })
                .attr('y', function (d) {
                    return yScale(d.max);
                })
                .attr('width', xScale.rangeBand())
                .attr('height', function (d) {
                    return yScale(d.min) - yScale(d.max);
                });


            var diamond = d3.svg.symbol()
                .type('diamond')
                .size( function(d) { return 5 * 15 });


            chart.append("g")
                .attr('transform',function(d,i){ return "translate("+(xScale(d.x) + xScale.rangeBand() / 2)+","+(yScale(d.median))+")"; })
                .append("path")
                .attr('d', diamond)
                .attr('class', 'diamond');

            chart.append('g')
                .append('text')
                .attr('text-anchor', 'middle')
                .attr('x', function (d, index) {
                    return xScale(d.x) + xScale.rangeBand() / 2;
                })
                .attr('y', function (d) {
                    return yScale(d.max) - 8;
                })
                .attr('dy', '.35em')
                .attr('class', 'up')
                .text(function (d) {
                    return d.max;
                });

            chart.append('g')
                .append('text')
                .attr('text-anchor', 'middle')
                .attr('x', function (d, index) {
                    return xScale(d.x) + xScale.rangeBand() / 2;
                })
                .attr('y', function (d) {
                    return yScale(d.min) + 8;
                })
                .attr('dy', '.35em')
                .attr('class', 'down')
                .text(function (d) {
                    return d.min;
                });
        },
        _drawGradientBar: function (svg, height, margin) {
            var gradient;
            var marginBar = 100;

            var point1 = (-(margin.left / 2) - 30) + ',' + (marginBar / 2);
            var point2 = (-(margin.left / 2) + 10) + ',' + (marginBar / 2);
            var point3 = (-(margin.left / 2) - 10) + ',' + (marginBar / 4);


            svg.append('polygon')
                .attr('points', point1 + ' ' + ' ' + point2 + ' ' + point3)
                .attr('class', 'up-arrow');


            point1 = (-(margin.left / 2) - 30) + ',' + (height - (marginBar / 2));
            point2 = (-(margin.left / 2) + 10) + ',' + (height - (marginBar / 2));
            point3 = (-(margin.left / 2) - 10) + ',' + (height - (marginBar / 4));

            gradient = svg.append("defs")
                .append("linearGradient")
                .attr("id", "gradient")
                .attr("x1", "0%")
                .attr("y1", "0%")
                .attr("x2", "0%")
                .attr("y2", "100%")
                .attr("spreadMethod", "pad");

            gradient.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", "#00ba53")
                .attr("stop-opacity", 1);

            gradient.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", "#d30000")
                .attr("stop-opacity", 1);


            svg.append('polygon')
                .attr('points', point1 + ' ' + ' ' + point2 + ' ' + point3)
                .attr('class', 'down-arrow');

            svg.append('rect')
                .attr('width', 20)
                .attr('height', height - marginBar)
                .attr('y', marginBar / 2)
                .attr('x', -(margin.left / 2) - 20)
                .style("fill", "url(#gradient)");

            svg.append('text')
                .attr('y', 0)
                .attr('x', -(margin.left / 2) - 10)
                .attr('dy', '.71em')
                .style('text-anchor', 'middle')
                .text('Bull Case');

            svg.append('text')
                .attr('y', height)
                .attr('x', -(margin.left / 2) - 10)
                .attr('dy', '.71em')
                .style('text-anchor', 'middle')
                .text('Bear Case');

        },
        _wrapText: function (text, width) {
            text.each(function () {
                var text = d3.select(this),
                    words = text.text().split(/\s+/).reverse(),
                    word,
                    line = [],
                    lineNumber = 0,
                    lineHeight = 1.1, // ems
                    y = text.attr('y'),
                    dy = parseFloat(text.attr('dy')),
                    tspan = text.text(null).append('tspan').attr('x', 0).attr('y', y).attr('dy', dy + 'em');
                while (word = words.pop()) {
                    line.push(word);
                    tspan.text(line.join(' '));
                    if (tspan.node().getComputedTextLength() > width) {
                        line.pop();
                        tspan.text(line.join(' '));
                        line = [word];
                        tspan = text.append('tspan').attr('x', 0).attr('y', y).attr('dy', ++lineNumber * lineHeight + dy + 'em').text(word);
                    }
                }
            });
        },
        _resizeChart: function () {
        },
        Init: function () {
            if ($('#football_field').length > 0) {
                this._initChart();
            }
        }
    }

})(window);
