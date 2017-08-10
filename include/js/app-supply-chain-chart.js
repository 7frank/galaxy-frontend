(function (window) {

    'use strict';

    if (!window.Samson) {
        window.Samson = {};
    }

    var Samson = window.Samson;

    Samson.App = window.Samson.App || {};

    Samson.App.SupplyChainChart = {
        Root: {},
        Component: {
            width: 0,
            height: 0,
            concludeChartHeight: 0,
            svg: null,
            data: null,
            customerNumber: 0,
            supplierNumber: 0,
            treeChartWidth: 0,
            treeChartHeight: 0,
            nodeRadius: 24,
            donutRadius: 40,
            pieData: 0,
            customerOffset: 0,
            supplierOffset: 0,
            showRange: 8,
            treeSvg: null,
            isGovernment: false

        },
        _initChart: function () {

            this.Component.concludeChartHeight = 90;

            //Parents are customers, Children are suppliers.
            this.Component.data = gon.data;

            this.Component.isGovernment = this.Component.data.isgovernment;

            if (!this.Component.data) {
                return;
            }

            var margin = {top: 0, right: 0, bottom: this.Component.concludeChartHeight, left: 0};
            this.Component.width = $('#supply_chain').width();
            // 115 is height of top container
            this.Component.height = $(window).height() - 160;

            if (this.Component.height < 600 && this.Component.height >= 480) {
                this.Component.showRange = 6;
            } else if (this.Component.height < 480) {
                this.Component.showRange = 4;
            }

            this.Component.treeChartWidth = this.Component.width - margin.left - margin.right;
            this.Component.treeChartHeight = this.Component.height - margin.top - margin.bottom;

            this.Component.svg = d3.select('#supply_chain').append('svg')
                .attr('width', this.Component.treeChartWidth + margin.left + margin.right)
                .attr('height', this.Component.treeChartHeight + margin.top + margin.bottom);

            this.Component.customerNumber = this.Component.data.parents.length;
            this.Component.supplierNumber = this.Component.data.children.length;


            this.Component.svg.append('svg:defs').selectAll('marker')
                .data(['customer', 'supplier', 'red'])
                .enter().append('svg:marker')
                .attr('id', String)
                .attr('viewBox', '0 -5 10 10')
                .attr('refX', 5)
                .attr('markerWidth', 8)
                .attr('markerHeight', 8)
                .attr('orient', '360')
                .append('svg:path')
                .attr('d', 'M0,-5L10,0L0,5');

            this.Component.pieData = this.Component.data.percent_number;


            this._drawTreeChart();
            this._drawConcludeChart();
            this._drawDonutChart();
        },
        _drawConcludeChart: function () {
            var gradient, concludeContainer;
            concludeContainer = this.Component.svg.append('g');
            gradient = concludeContainer.append("defs")
                .append("linearGradient")
                .attr("id", "gradient")
                .attr("x1", "100%")
                .attr("y1", "0%")
                .attr("x2", "0%")
                .attr("y2", "0%")
                .attr("spreadMethod", "pad");

            gradient.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", "#96d72b")
                .attr("stop-opacity", 1);

            gradient.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", "#dd0003")
                .attr("stop-opacity", 1);

            concludeContainer.append('rect')
                .attr('width', this.Component.width - (this.Component.width / 3))
                .attr('height', 30)
                .attr('y', this.Component.height - (this.Component.concludeChartHeight / 2))
                .attr('x', (this.Component.width / 3) / 2)
                .style("fill", "url(#gradient)");

            var $footerInfo = $('#iq_banker_footer_info');
            $footerInfo.css('left', (this.Component.width / 2) -244 );
            $footerInfo.css('top', this.Component.height - (this.Component.concludeChartHeight / 2) - 70);
            concludeContainer.append('text')
                .attr('x', this.Component.width / 2)
                .attr('y', this.Component.height - (this.Component.concludeChartHeight / 2) - 10)
                .attr('text-anchor', 'middle')
                .text('Revenue Growth Trends (LTM)')
                .on('mouseenter', function() {
                    $footerInfo.removeClass('hidden');
                })
                .on('mouseleave', function() {
                    $footerInfo.addClass('hidden');
                });;


				concludeContainer.append("image")
					.attr("xlink:href", "assets/images/icon-charts-news.png")
					.attr("width",15)
					.attr("height", 15)
					.attr('x', this.Component.width - (this.Component.width / 3) / 2 - 130)
					.attr('y', this.Component.height - (this.Component.concludeChartHeight / 2) - 50);

			   concludeContainer.append('text')
                .attr('x', this.Component.width - (this.Component.width / 3) / 2 - 180)
                .attr('y', this.Component.height - (this.Component.concludeChartHeight / 2) - 20)
                .attr('text-anchor', 'start')
				.style('font-size', '10px')
				.attr('class', 'label-text')
                .text('Recent Relationship News');

			 concludeContainer.append('text')
                .attr('x', this.Component.width - (this.Component.width / 3) / 2 + 20)
                .attr('y', this.Component.height - (this.Component.concludeChartHeight / 2) + 18)
                .attr('text-anchor', 'start')
                .text('Positive');
			

			concludeContainer.append("image")
					.attr("xlink:href", "assets/images/desc_people.png")
					.attr('x', (this.Component.width / 3) / 2 + 80)
					.attr('y', this.Component.height - (this.Component.concludeChartHeight / 2) - 70);
			
			  concludeContainer.append('text')
                .attr('x', (this.Component.width / 3) / 2 +60)
                .attr('y', this.Component.height - (this.Component.concludeChartHeight / 2) -20)
                .attr('text-anchor', 'start')
				.style('font-size', '10px')
				.attr('class', 'label-text')
                .text('Executives Relationship Strength');

            concludeContainer.append('text')
                .attr('x', (this.Component.width / 3) / 2 - 20)
                .attr('y', this.Component.height - (this.Component.concludeChartHeight / 2) + 18)
                .attr('text-anchor', 'end')
                .text('Negative');


        },
        _drawTreeChart: function () {
            var treeSvg, parentDiagonal, childDiagonal;
            var self = this;
            var treeLayout = d3.old_layout.tree()
                .size([this.Component.height - 50, this.Component.width]);

            this.Component.treeSvg = this.Component.svg.append('g')
                .attr('transform', 'translate(' + this.Component.treeChartWidth / 2 + ',' + 20 + ')');

            parentDiagonal = d3.svg.diagonal()
                .source(function (d) {
                    return {"x": d.source.x, "y": (d.source.y + 250)};
                })
                .projection(function (d) {
                    var arrowMargin = 4;
                    return [(-d.y + self.Component.nodeRadius - arrowMargin), d.x];
                });

            childDiagonal = d3.svg.diagonal()
                .source(function (d) {
                    return {"x": d.source.x, "y": (d.source.y + 250)};
                })
                .projection(function (d) {
                    var arrowMargin = 4;
                    return [d.y - (self.Component.nodeRadius + arrowMargin), d.x];
                });
            var i = 0;

            var colorPalette = ['#dd0003', '#dd0003', '#c40003', '#aa0002', '#910002', '#404040', '#5b8419', '#6a991d', '#79af21', '#88c425', '#96d72b'];

            var colorDomain = d3.scale.quantize()
                .domain([-25, -20, -15, -10, -5, 0, 5, 10, 15, 20, 25])
                .range(colorPalette);

            var formatData = this._mapData();
            this.Root = formatData;

            this.Root.x0 = this.Component.width / 2;
            this.Root.y0 = this.Component.height / 2;

            var nodes = treeLayout.nodes(this.Root);

            nodes.forEach(function (d) {
                d.y = d.depth * self.Component.width / 2.5;
            });

            var node = this.Component.treeSvg.selectAll('g.node')
                .data(nodes, function (d) {
                    return d.id = ++i;
                });

            var link = this.Component.treeSvg.selectAll('path.link')
                .data(treeLayout.links_parents(nodes).concat(treeLayout.links(nodes)), function (d) {
                    return d.target.id;
                });


            link.enter().insert('svg:path', 'g')
                .attr('marker-end', function (d) { if (!this._isParent(d.target)) { return 'url(#supplier)' } }.bind(this))
                .attr('marker-start', function (d) { if (this._isParent(d.target)) { return 'url(#customer)' } }.bind(this))
                .attr('class', function (d) { if (this._isParent(d.target)) { return 'link customer' } else { return 'link supplier' } }.bind(this))
                .attr('d', function (d) { if (this._isParent(d.target)) { return parentDiagonal(d); } else { return childDiagonal(d); } }.bind(this))
                .attr('id', function (d, i) { return 'link_id_' + i; });
		

            var nodeEnter = node.enter().append('g')
                .attr('class', function (d) {
                    if (this._isParent(d)) {
                        if (d.name == 'government') {
                            return 'node government';
                        } else {
                            return 'node customer';
                        }
                    }
                    else if (d.isroot == true) {
                        return 'node root';
                    }
                    else {
                        return 'node supplier';
                    }
                }.bind(this))
                .attr('transform', function (d) {
                    if (this._isParent(d)) {
                        return 'translate(' + (-d.y) + ',' + d.x + ')';
                    } else {
                        return 'translate(' + d.y + ',' + d.x + ')';
                    }
                }.bind(this))
                .on('mouseenter', function (d) {
                    if (d.isroot) {
                        return
                    }
                    if (d.name == 'government') {
                        return;
                    }
                    var circle = $(this).find('circle')[0];
                    var $arrow = $('#company_information_arrow');
                    var scrollTop = $(window).scrollTop();
                    if ((circle.getBoundingClientRect().top + scrollTop - 110) > self.Component.height / 2) {
                        $arrow.attr('class', 'arrow-down');
                        var yPosition = circle.getBoundingClientRect().top + scrollTop - 35;
                    } else {
                        $arrow.attr('class', 'arrow-up');
                        var yPosition = circle.getBoundingClientRect().top + scrollTop - 60;
                    }
                    var position = {
                        x: circle.getBoundingClientRect().left - 140,
                        y: yPosition
                    };
                    Samson.App.SupplyChainChartUtility.showCompanyInfo(d, position);
                })
                .on('mouseleave', function (d) {
                    if (d.isroot) {
                        return
                    }
                    if (d.name == 'government') {
                        return;
                    }
                    Samson.App.SupplyChainChartUtility.hideCompanyInfo();
                })
                .on('click', function (d) {
                    if (d.name == 'government') {
                        return;
                    }
                    Samson.App.SupplyChainChartUtility.hideCompanyInfo();

                    if (d.isroot) {
                        return
                    }
                    var circle = $(this).find('circle')[0];
                    var scrollTop = $(window).scrollTop();
                    var position = {
                        x: circle.getBoundingClientRect().left - 70,
                        y: circle.getBoundingClientRect().top + scrollTop - 65,
                        width: self.Component.width,
                        height: self.Component.height
                    };
                    if (!d.isroot) {
                        Samson.App.SupplyChainChartUtility.showMenu({
                            name: d.name,
                            isparent: d.isparent,
							full_ticker: d.full_ticker,
                            id: d.company_id,
                            hierarchy_info: d.hierarchy_info,
                            histories: d.histories
                        }, position);
                    }
                });

            nodeEnter.append('circle')
				.attr('id', function (d, i) { return 'circle_' + d.company_id; })
                .attr('r', function (d) {
                    if (this._isParent(d)) {
                        return self.Component.nodeRadius;
                    } else if (!d.isroot) {
                        return self.Component.nodeRadius;
                    } else if (d.isroot) {
                        return self.Component.donutRadius -4;
                    }

                }.bind(this))
                .attr('fill', function (d) {
                    return colorDomain(d.percentage_number);
                });

            nodeEnter.append('text')
                .attr('text-anchor', 'middle')
                .attr('dy', '.35em')
                .attr('class', 'percent-text')
                .text(function (d) {
                    if (d.isroot) {
                        if (self.Component.customerNumber > 0) {
                            if (self.Component.isGovernment) {
                                return '';
                            } else {
                                return d.percent;
                            }
                        }
                    }
                    else {
                        return d.percent;
                    }
                });

            if (self.Component.isGovernment) {
                nodeEnter.append('text')
                    .attr('text-anchor', 'middle')
                    .attr('class', function (d) {
                        if (d.isroot) {
                            return 'root-info'
                        }
                    })
                    .attr('dy', '.35em')
                    .attr('y', function (d) {
                        return -(self.Component.donutRadius + 38)
                    })
                    .text(function (d) {
                        if (d.isroot) {
                            return 'Total Quantifiable'

                        }
                    });
                nodeEnter.append('text')
                    .attr('text-anchor', 'middle')
                    .attr('class', function (d) {
                        if (d.isroot) {
                            return 'root-info'
                        }
                    })
                    .attr('dy', '.35em')
                    .attr('y', function (d) {
                        return -(self.Component.donutRadius + 26)
                    })
                    .text(function (d) {
                        if (d.isroot) {
                            return 'Spending on Publically'

                        }
                    });
                nodeEnter.append('text')
                    .attr('text-anchor', 'middle')
                    .attr('class', function (d) {
                        if (d.isroot) {
                            return 'root-info'
                        }
                    })
                    .attr('dy', '.35em')
                    .attr('y', function (d) {
                        return -(self.Component.donutRadius + 12)
                    })
                    .text(function (d) {
                        if (d.isroot) {
                            return 'Traded Stocks'

                        }
                    });
            } else {
                nodeEnter.append('text')
                    .attr('text-anchor', 'middle')
                    .attr('class', function (d) {
                        if (d.isroot) {
                            return 'root-info'
                        }
                    })
                    .attr('dy', '.35em')
                    .attr('y', function (d) {
                        return -(self.Component.donutRadius + 22)
                    })
                    .text(function (d) {
                        if (d.isroot) {
                            if (self.Component.customerNumber > 0) {
                                return 'Quantifiable Customers'
                            }

                        }
                    });
                nodeEnter.append('text')
                    .attr('text-anchor', 'middle')
                    .attr('class', function (d) {
                        if (d.isroot) {
                            return 'root-info'
                        }
                    })
                    .attr('dy', '.35em')
                    .attr('y', function (d) {
                        return -(self.Component.donutRadius + 9)
                    })
                    .text(function (d) {
                        if (d.isroot) {
                            if (self.Component.customerNumber > 0) {
                                return 'as % of Revenue'
                            }
                        }
                    });
            }
            nodeEnter.append('text')
                .attr('text-anchor', 'middle')
                .attr('class', function (d) {
                    if (d.isroot) {
                        return 'root-name';
                    }
                })
                .attr('dy', '.35em')
                .attr('x', function (d) {
                    if (d.isroot) {
                        if (self.Component.isGovernment) {
                            return -(self.Component.nodeRadius + 80)
                        }
                    }
                })
                .attr('y', function (d) {
                    if (d.isroot) {
                        if (self.Component.isGovernment) {
                            return -(self.Component.nodeRadius + 64)
                        }
                        if (self.Component.customerNumber > 0) {
                            return -(self.Component.nodeRadius + 52)
                        } else {
                            return -(self.Component.nodeRadius + 26)
                        }
                    }
                    else {
                        return -(self.Component.nodeRadius + 7)
                    }
                }.bind(this))
                .text(function (d) {
                    if (d.isroot) {
                        return d.name
                    }
                    if (d.full_ticker) {
                        if (d.full_ticker.toLowerCase() == 'private') {
                            if (d.name) {
                                if (d.name.length > 15) {
                                    var text = d.name.slice(0, 12) + '...';
                                    return text;
                                } else {
                                    return d.name;
                                }
                            }
                        }
                        else {
							
                            return d.full_ticker;
                        }
                    }
                });
			
			
			this.Component.treeSvg.selectAll('.image-text').data(treeLayout.links_parents(nodes).concat(treeLayout.links(nodes)), function (d) {
                    return d.target.id;
                })
			.enter().append("image").attr("xlink:href", "assets/images/icon-charts-news.png").attr("width", 20).attr("height", 20) .attr('x', function (d, i) {
                    if (self._isParent(d.target)) {
						var test = d.source.y  - d.target.y  + self.Component.nodeRadius + 20;
                        return test;
                    } else {
						var test = -d.source.y  + d.target.y  - self.Component.nodeRadius - 40;
                        return test  ;
                    }
                })
                .attr('y', function (d) {
						if (self._isParent(d.target)) {
							return d.target.x ;
						}else{
							 return d.target.x;
						}
                    }.bind(this)
                ).attr("hidden", function (d) {
						if (d.target.DJNews > 0) {
							return null;
						}else{
							 return true;
						}
				});
			
			this.Component.treeSvg.selectAll('.image-text').data(treeLayout.links_parents(nodes).concat(treeLayout.links(nodes)), function (d) {
                    return d.target.id;
                })
			.enter().append("image").attr("xlink:href", function (d, i) {
					if(d.target.PeopleRelation > 0){
						return "assets/images/"+ d.target.PeopleRelation +"_people.png";
					}
					else
					{
						return null;
					}

                } ).attr("width", 23).attr("height", 15) .attr('x', function (d, i) {
                    if (self._isParent(d.target)) {
						var test = d.source.y  - d.target.y  + self.Component.nodeRadius + 45;
                        return test;
                    } else {
						var test = -d.source.y  + d.target.y  - self.Component.nodeRadius - 70;
                        return test  ;
                    }
                })
                .attr('y', function (d) {
						if (self._isParent(d.target)) {
							return d.target.x ;
						}else{
							 return d.target.x;
						}
                    }.bind(this)
                ).on('click', function(d,i){ people_relation_strength(d.target.id);  }).style("cursor", "pointer");

            this.Component.treeSvg.selectAll('.label-text')
                .data(treeLayout.links_parents(nodes).concat(treeLayout.links(nodes)), function (d) {
                    return d.target.id;
                })
                .enter().append('text')
                .attr('class', 'label-text')
                .attr('dy', '.72em')
                .attr('x', function (d, i) {
                    var linkNode = document.getElementById('link_id_' + i);
                    var box = linkNode.getBoundingClientRect();
                    if (self._isParent(d.target)) {
                        return -d.target.y + box.width / 2 - self.Component.nodeRadius;
                    } else {
                        return d.target.y - box.width / 2 - self.Component.nodeRadius;
                    }
                })
                .attr('y', function (d) {
                        var height = d.source.x - d.target.x;
                        if (d.target.x > d.source.x) {
                            return d.target.x + height / 2
                        } else if (d.target.x == d.source.x) {
                            return d.target.x
                        } else {
                            return d.target.x + height / 2
                        }
                    }.bind(this)
                )
                .text(function (d) {
                    if (d.target.info) {
                        if (d.target.info.length > 15) {
                            var text = d.target.info.slice(0, 12) + '...';
                            return text;
                        }
                        else {
                            return d.target.info;
                        }
                    }
                })
                .on('mouseenter', function (d) {
                    d3.select(this).text(d.target.info)
                })
                .on('mouseout', function (d) {
                    if (d.target.info.length > 15) {
                        var text = d.target.info.slice(0, 12) + '...';
                        d3.select(this).text(text)
                    }
                    else {
                        d3.select(this).text(d.target.info)
                    }
                });

        },
        _drawDonutChart: function () {
            var pie_data_array = [100 - this.Component.pieData, this.Component.pieData];
            var treeMarginTop = 40;


            var color = ['#7f7f7f', '#00aff4'];

            var pieLayout = d3.old_layout.pie()
                .sort(null);

            var arc = d3.svg.arc()
                .innerRadius(this.Component.donutRadius)
                .outerRadius(this.Component.donutRadius - 8);

            var donutChart = this.Component.svg.append("g")
                .attr("transform", "translate(" + this.Component.width / 2 + "," + ((this.Component.height - this.Component.concludeChartHeight ) / 2 + treeMarginTop) + ")");

            var path = donutChart.selectAll("path")
                .data(pieLayout(pie_data_array))
                .enter().append("path")
                .attr("fill", function (d, i) {
                    return color[i];
                })
                .attr("d", arc);

            if (this.Component.customerNumber > 0) {
                if (this.Component.isGovernment) {
                    // 245 = box width(100) - left position (100) + 24 radius + 21 ?
                    this.Component.svg.append('line')
                        .attr('class', 'customer-count-line')
                        .attr('x1', this.Component.width / 2 - 300)
                        .attr('y1', ((this.Component.height - this.Component.concludeChartHeight  ) / 2 ) + treeMarginTop)
                        .attr('x2', (this.Component.width / 2) - this.Component.donutRadius - 8)
                        .attr('y2', ((this.Component.height - this.Component.concludeChartHeight  ) / 2) + treeMarginTop)
                        .attr('marker-end', 'url(#customer)');

                    this.Component.svg.append('circle')
                        .attr('class', 'sum-percent')
                        .attr('r', 30)
                        .attr('cx', (this.Component.width / 2) - 195)
                        .attr('cy', ((this.Component.height - this.Component.concludeChartHeight ) / 2) + treeMarginTop);

                    this.Component.svg.append('text')
                        .attr('class', 'sum-companies')
                        .attr('text-anchor', 'middle')
                        .attr('x', this.Component.width / 2 - 195)
                        .attr('y', ((this.Component.height - this.Component.concludeChartHeight ) / 2) + 5 + treeMarginTop)
                        .text('100%');

                    this.Component.svg.append('text')
                        .attr('class', 'root-info')
                        .attr('text-anchor', 'middle')
                        .attr('x', this.Component.width / 2 - 195)
                        .attr('y', ((this.Component.height - this.Component.concludeChartHeight ) / 2) + 5 - 48 + treeMarginTop)
                        .text('Total Tax Revenue');

                    this.Component.svg.append('text')
                        .attr('class', 'sum-companies')
                        .attr('text-anchor', 'middle')
                        .attr('x', this.Component.width / 2)
                        .attr('y', ((this.Component.height - this.Component.concludeChartHeight ) / 2) + 5 - 8 + treeMarginTop)
                        .text('$340');

                    this.Component.svg.append('text')
                        .attr('class', 'sum-companies')
                        .attr('text-anchor', 'middle')
                        .attr('x', this.Component.width / 2)
                        .attr('y', ((this.Component.height - this.Component.concludeChartHeight ) / 2) + 5 + 8 + treeMarginTop)
                        .text('Billion');
                }
                else {
                    var companyCountText = "";
                    if (this.Component.customerNumber == 1) {
                        companyCountText = "1 Customer"
                    } else {
                        companyCountText = this.Component.customerNumber + " Customers"
                    }
                    // 245 = box width(100) - left position (100) + 24 radius + 21 ?
                    this.Component.svg.append('line')
                        .attr('class', 'customer-count-line')
                        .attr('x1', this.Component.width / 2 - 123)
                        .attr('y1', ((this.Component.height - this.Component.concludeChartHeight  ) / 2 ) + treeMarginTop)
                        .attr('x2', (this.Component.width / 2) - this.Component.donutRadius - 8)
                        .attr('y2', ((this.Component.height - this.Component.concludeChartHeight  ) / 2) + treeMarginTop)
                        .attr('marker-end', 'url(#customer)');

                    this.Component.svg.append('rect')
                        .attr('class', 'sum-companies')
                        .attr('width', 100)
                        .attr('height', 30)
                        .attr('x', this.Component.width / 2 - 223)
                        .attr('y', ((this.Component.height - this.Component.concludeChartHeight ) / 2) - 15 + treeMarginTop);

                    this.Component.svg.append('text')
                        .attr('class', 'sum-companies')
                        .attr('text-anchor', 'middle')
                        .attr('x', this.Component.width / 2 - 223 + 50)
                        .attr('y', ((this.Component.height - this.Component.concludeChartHeight ) / 2) + 5 + treeMarginTop)
                        .text(companyCountText);
                }
            }

            if (this.Component.supplierNumber > 0) {
                // 100 = right position (100) + radius
                var companyCountText = "";
                if (this.Component.supplierNumber == 1) {
                    companyCountText = "1 Supplier"
                } else {
                    companyCountText = this.Component.supplierNumber + " Suppliers"
                }

                this.Component.svg.append('rect')
                    .attr('class', 'sum-companies')
                    .attr('width', 100)
                    .attr('height', 30)
                    .attr('x', this.Component.width / 2 + 124)
                    .attr('y', ((this.Component.height - this.Component.concludeChartHeight ) / 2) - 15 + treeMarginTop);

                this.Component.svg.append('line')
                    .attr('class', 'supplier-count-line')
                    .attr('x1', (this.Component.width / 2) + this.Component.donutRadius)
                    .attr('y1', ((this.Component.height - this.Component.concludeChartHeight ) / 2) + treeMarginTop)
                    .attr('x2', this.Component.width / 2 + 124 - 8)
                    .attr('y2', ((this.Component.height - this.Component.concludeChartHeight ) / 2) + treeMarginTop)
                    .attr('marker-end', 'url(#supplier)');


                this.Component.svg.append('text')
                    .attr('class', 'sum-companies')
                    .attr('text-anchor', 'middle')
                    .attr('x', this.Component.width / 2 + 124 + 50)
                    .attr('y', ((this.Component.height - this.Component.concludeChartHeight ) / 2) + 5 + treeMarginTop)
                    .text(companyCountText);

                if (this.Component.customerNumber == 0) {
                    this.Component.svg.append('circle')
                        .attr('class', 'zero-customer')
                        .attr('r', 30)
                        .attr('cx', (this.Component.width / 2))
                        .attr('cy', ((this.Component.height - this.Component.concludeChartHeight ) / 2) + treeMarginTop);
                }
            }
            var $supplyChainCustomerText = $('#supply_chain_customer_text');
            if ($supplyChainCustomerText.length > 0) {
                if ($('.node.customer').length > 0) {
                    var scrollTop = $(window).scrollTop();
                    var circle = $('.node.customer circle')[0];
                    $supplyChainCustomerText.css('left', circle.getBoundingClientRect().left - 70);
                    $supplyChainCustomerText.css('top', circle.getBoundingClientRect().top + scrollTop - 150);
                }
            }

            var $supplyChainSupplierText = $('#supply_chain_supplier_text');
            if ($supplyChainSupplierText.length > 0) {
                if ($('.node.supplier').length > 0) {
                    var scrollTop = $(window).scrollTop();
                    var circle = $('.node.supplier circle')[0];
                    $supplyChainSupplierText.css('left', circle.getBoundingClientRect().left - 70);
                    $supplyChainSupplierText.css('top', circle.getBoundingClientRect().top + scrollTop - 150);
                }
            }
        },
        _setupClickButton: function () {
            var $customer = $('#supply_chain_customer_control');
            var $supplier = $('#supply_chain_supplier_control');
            var self = this;
            var totalCustomerPageNumber = Math.ceil(self.Component.customerNumber / self.Component.showRange);
            var totalSupplierPageNumber = Math.ceil(self.Component.supplierNumber / self.Component.showRange);
            if (totalSupplierPageNumber > 0) {
                $supplier.find('#current_supplier_page').text((self.Component.supplierOffset + 1) + ' of ' + totalSupplierPageNumber);
            }

            if (totalCustomerPageNumber > 0) {
                $customer.find('#current_customer_page').text((self.Component.customerOffset + 1) + ' of ' + totalCustomerPageNumber);
            }

            $customer.on('click', '[data-toggle=previous-button]', function (event) {
                event.preventDefault();
                if (self.Component.customerOffset == 0) {
                    return;
                }
                $(self.Component.treeSvg[0]).empty();
                self.Component.customerOffset--;
                $customer.find('#current_customer_page').text((self.Component.customerOffset + 1) + ' of ' + totalCustomerPageNumber);
                self._drawTreeChart();
                self._drawDonutChart();
            });
            $customer.on('click', '[data-toggle=next-button]', function (event) {
                event.preventDefault();
                if (((self.Component.customerOffset + 1) * self.Component.showRange) >= self.Component.customerNumber) {
                    return;
                }
                $(self.Component.treeSvg[0]).empty();
                self.Component.customerOffset++;
                $customer.find('#current_customer_page').text((self.Component.customerOffset + 1) + ' of ' + totalCustomerPageNumber);
                self._drawTreeChart();
                self._drawDonutChart();

            });

            $supplier.on('click', '[data-toggle=previous-button]', function (event) {
                event.preventDefault();
                if (self.Component.supplierOffset == 0) {
                    return;
                }
                $(self.Component.treeSvg[0]).empty();
                if (((self.Component.supplierOffset + 1) * self.Component.showRange) >= self.Component.supplierNumber) {
                }
                self.Component.supplierOffset--;
                $supplier.find('#current_supplier_page').text((self.Component.supplierOffset + 1) + ' of ' + totalSupplierPageNumber);
                self._drawTreeChart();
                self._drawDonutChart();
            });
            $supplier.on('click', '[data-toggle=next-button]', function (event) {
                event.preventDefault();
                if (((self.Component.supplierOffset + 1) * self.Component.showRange) >= self.Component.supplierNumber) {
                    return;
                }
                $(self.Component.treeSvg[0]).empty();
                self.Component.supplierOffset++;
                $supplier.find('#current_supplier_page').text((self.Component.supplierOffset + 1) + ' of ' + totalSupplierPageNumber);
                self._drawTreeChart();
                self._drawDonutChart();
            });
        },
        _mapData: function () {
            var newData = {};
            var parents = [];
            var children = [];
            newData['percent'] = this.Component.data.percent;
			if(newData['percent']=='0.0%'){newData['percent']='';}
            newData['percentage_number'] = this.Component.data.percentage_number;
            newData['name'] = this.Component.data.name;
            newData['isroot'] = true;

            var parentStart = (this.Component.customerOffset * this.Component.showRange);
            var parentBound = (this.Component.customerOffset * this.Component.showRange) + this.Component.showRange;

            var childrenStart = (this.Component.supplierOffset * this.Component.showRange);
            var childrenBound = (this.Component.supplierOffset * this.Component.showRange) + this.Component.showRange;

            if (parentBound > this.Component.customerNumber) {
                parentBound = this.Component.customerNumber;
            }
            if (childrenBound > this.Component.supplierNumber) {
                childrenBound = this.Component.supplierNumber;
            }

            for (; parentStart < parentBound; parentStart++) {
                parents.push(this.Component.data.parents[parentStart]);
            }
            for (; childrenStart < childrenBound; childrenStart++) {
                children.push(this.Component.data.children[childrenStart]);
            }
            newData['parents'] = parents;
            newData['children'] = children;


            return newData
        },


        _isParent: function (node) {
            if (node.parent && node.parent != this.Root) {
                return this._isParent(node.parent);
            } else if (node.isparent) {
                return true;
            } else {
                return false;
            }
        },

        Init: function () {
            if ($('#supply_chain').length > 0) {
                this._initChart();
                this._setupClickButton();
            }
        }
    }

})(window);
