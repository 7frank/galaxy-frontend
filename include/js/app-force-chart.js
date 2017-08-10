(function (window) {

    'use strict';

    if (!window.Samson) {
        window.Samson = {};
    }

    var Samson = window.Samson;

    Samson.App = window.Samson.App || {};

    Samson.App.ForceChart = {
        svg: null,
        AllSectors: [],
        color: d3.scale.category20c(),
        $informationBox: null,
        drawForceChart: function () {
            var self = this;
            var $svgContainer = $('#all_companies_force_chart');
            self.$informationBox = $('#company_information_box');
            var all_companies_force_chart;
            var width = $svgContainer.width(), height = $(window).height() - 135;
            var root;
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
            this.color = color;

            var zoom = d3.behavior.zoom()
                .scaleExtent([0.5, 2])
                .on('zoom', zoomed);

            var force = d3.layout.force()
                .size([width, height])
                .charge(function (d, index) {
                    var charge = -120;
                    if (d.company_id === gon.company_id) {
                        charge = 10 * charge;
                    }
                    return charge;
                })
                .on('tick', tick);

            force.drag().on('dragstart', function (d) {
                d3.select(this).classed('fixed', d.fixed = true);
                d3.event.sourceEvent.stopPropagation(); // silence other listeners
            });


            this.svg = d3.select('#all_companies_force_chart')
                .append('svg')
                .attr('width', width)
                .attr('height', height)
                .attr('class', 'force-chart')
                .call(zoom);


            var container = this.svg.append('g');

            var link = container.selectAll('.link'),
                node = container.selectAll('.node');

            d3.json('/companies/' + gon.company_id + '/force_data.json', function (error, data) {
                if (error) throw error;

                root = JSON.parse(data.body);
                update();
                this.drawLegend();
            }.bind(this));


            function update() {
                var nodes = flatten(root),
                    links = d3.layout.tree().links(nodes);
                // Restart the force layout.


                force
                    .nodes(nodes)
                    .links(links)
                    .start();
                // Update the links…
                link = link.data(links, function (d) {
                    return d.target.id;
                });
                // Exit any old links.
                link.exit().remove();
                // Enter any new links.
                link.enter().insert('line', '.node')
                    .attr('class', 'link')
                    .attr('x1', function (d) {
                        return d.source.x;
                    })
                    .attr('y1', function (d) {
                        return d.source.y;
                    })
                    .attr('x2', function (d) {
                        return d.target.x;
                    })
                    .attr('y2', function (d) {
                        return d.target.y;
                    });
                // Update the nodes…
                node = node.data(nodes, function (d) {
                    return d.id;
                });
                // Exit any old nodes.
                node.exit().remove();


                // Enter any new nodes.
			
                var eachNode = node.enter().append('g');

				
                eachNode
                    .append('circle')
                    .attr('class', 'node')
                    .attr('r', function (d) {
                        if (d.company_id == gon.company_id) {
                            return 8
                        } else {
                            return Math.sqrt(d.size) || 4.5;
                        }
                    })
                    .style('fill', function (d) {
                        if (d.company_id == gon.company_id) {
                            return '#FFF'
                        } else {
                            return color(d.sector);
                        }
                    })
                    .style('stroke', function (d) {
                        if (d.company_id == gon.company_id) {
                            return '#1FB4D6'
                        }
                    })
                    .style('stroke-width', function (d) {
                        if (d.company_id == gon.company_id) {
                            return 3
                        }
                    })
                    .on('click', click)
                    .on('mouseenter', mouseenter)
			
                eachNode.append('text')
                    .attr('dy', -10)
                    .style('text-anchor', 'middle')
                    .style('pointer-events', 'none')
                    .style('font-size', 19)
                    .text(function (d) {
                        if (d.company_id == gon.company_id) {
                            return d.name;
                        }
                        if (d.childrenNumber > 10) {
                            return d.name;
                        }
                    });
				

            }

            function tick() {
                link.attr('x1', function (d) {
                        return d.source.x;
                    })
                    .attr('y1', function (d) {
                        return d.source.y;
                    })
                    .attr('x2', function (d) {
                        return d.target.x;
                    })
                    .attr('y2', function (d) {
                        return d.target.y;
                    });

                node.attr('transform', function (d) {
                    return 'translate(' + d.x + ',' + d.y + ')';
                });
            }

// Toggle children on click.
            function click(d) {
                if (d3.event.defaultPrevented) return;
                var url = '/charts/' + d.company_id + '/supply_chain';
                window.open(url.toString(), '_blank');
            }

            function mouseenter(d) {
                var $informationBox = self.$informationBox;
                $informationBox.find('.init-content').remove();
                $informationBox.find('.header').text(d.name);
                $informationBox.find('#company_information_content').removeClass('hidden');
                $informationBox.find('.company-description').text(d.description);
                $informationBox.find('#sector_info').text(d.sector);
                $informationBox.find('#stock_price_info').text(d.stock_price);
                $informationBox.find('#market_cap_info').text(d.market_cap);


            }

// Returns a list of all nodes under the root.
            function flatten(root) {
                var nodes = [], i = 0;

                function recurse(node) {
                    if (node.children) {
                        node.children.forEach(recurse);
                    }
                    if (!node.id) {
                        if (node.children) {
                            node.childrenNumber = node.children.length;
                        } else {
                            node.childrenNumber = 0;
                        }
                        node.id = ++i;
                    }
                    if (node.company_id == gon.company_id){
                        node.x = width/2;
                        node.y = height/2;
                        node.fixed = true;
                    }
                    if (!(_.includes(self.AllSectors, node.sector))) {
                        if (node.sector != 'KOSE:A004020') {
                            self.AllSectors.push(node.sector)
                        }
                    }
                    nodes.push(node);
                }

                recurse(root);
                return nodes;
            }

            function zoomed() {
                container.attr('transform', 'translate(' + d3.event.translate + ')scale(' + d3.event.scale + ')');
            }
        },
        drawLegend: function () {
            var svgContainer = $('#all_companies_force_chart');
            var width = svgContainer.width(), height = $(window).height() - 135;
            var legendContainer = this.svg.append('g').attr('class', 'legend-container');
            var color = this.color;
            var myPreviousXOffset = 10;
            var containerHeight = height - 20;
            var halfNumber = Math.round(this.AllSectors.length / 2);

            _.each(this.AllSectors, function (data, index) {
                if (index == halfNumber) {
                    myPreviousXOffset = legendContainer[0][0].getBBox().width;
                    containerHeight = height - 50;

                }

                if (index >= halfNumber) {

                    var text = legendContainer.append('text')
                        .attr('x', myPreviousXOffset)
                        .attr('y', containerHeight)
                        .attr('text-anchor', 'end')
                        .text(function () {
                            if (data == null) {
                                return 'Other'
                            } else {
                                return data
                            }
                        });
                    var textWidth = text[0][0].getBBox().width;

                    legendContainer.append('circle')
                        .attr('cx', myPreviousXOffset - textWidth - 10)
                        .attr('cy', containerHeight - 5)
                        .attr('r', 8)
                        .style('fill', function (d) {
                            return color(data);
                        });

                    myPreviousXOffset = myPreviousXOffset - (textWidth + 30);

                }
                else {
                    legendContainer.append('circle')
                        .attr('cx', myPreviousXOffset)
                        .attr('cy', containerHeight - 5)
                        .attr('r', 8)
                        .style('fill', function (d) {
                            return color(data);
                        });

                    var text = legendContainer.append('text')
                        .attr('x', 10 + myPreviousXOffset)
                        .attr('y', containerHeight)
                        .attr('text-anchor', 'start')
                        .text(function () {
                            if (data == null) {
                                return 'Other'
                            } else {
                                return data
                            }
                        });
                    myPreviousXOffset = myPreviousXOffset + text[0][0].getBBox().width + 30;
                }
                legendContainer.attr("transform", function (d) {
                    return "translate(" + (width - legendContainer[0][0].getBBox().width - 30) + "," + 0 + ")";
                })
            });
            $('.all-companies-chart-container').find('.meta-data').removeClass('hidden');
            this.$informationBox.removeClass('hidden');
            $('.spinner').remove();
        },
        setupButton: function () {
            $('#company_information_box_control').on('click', function () {
                $('#company_information_box').toggleClass('hidden');
            });
        },
        Init: function () {
            if ($('#all_companies_force_chart').length > 0) {
                this.drawForceChart();
                this.setupButton();
            }
        }
    }

})(window);
