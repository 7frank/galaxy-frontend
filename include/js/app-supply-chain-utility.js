(function (window) {

    'use strict';

    if (!window.Samson) {
        window.Samson = {};
    }

    var Samson = window.Samson;

    Samson.App = window.Samson.App || {};

    Samson.App.SupplyChainChartUtility = {
        drawChart: function (data) {
            var width, height, max, min,
                xScale, yScale, svg;
            var $container = $('#supply_chain_histories');
            $('#supply_chain_histories_chart').empty();

            var headerHeight = 80;
            width = $container.width();
            height = $container.height() - headerHeight;
            var dataSet = data.slice(0);


            _.map(dataSet, function (d) {
                d.percentage = Number(d.percentage);
            });


            max = d3.max(dataSet, function (d) {
                return d.percentage
            });

            var xDomain = _.map(dataSet, function (d) {
                if (d.year !== '') {
                    return d.year
                }
            });


            var margin = {top: 10, right: 10, bottom: 30, left: 10};


            width = width - margin.left - margin.right;
            height = height - margin.top - margin.bottom;


            xScale = d3.scale.ordinal()
                .domain(xDomain)
                .rangeBands([0, width], 0.35, 0.5);

            yScale = d3.scale.linear()
                .domain([0, max + 5])
                .range([height, 0]);


            svg = d3.select('#supply_chain_histories_chart').append('svg')
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            var chart = svg.append('g')
                .selectAll('rect')
                .data(dataSet)
                .enter();

            chart.append('g')
                .append('rect')
                .attr('class', 'bar')
                .attr('x', function (d, index) {
                    return xScale(d.year)
                })
                .attr('y', function (d) {
                    return yScale(d.percentage);
                })
                .attr('width', xScale.rangeBand())
                .attr('height', function (d) {
                    return height - yScale(d.percentage);
                });

            chart.append('g')
                .append('text')
                .attr('x', function (d, index) {
                    return xScale(d.year) + (xScale.rangeBand() / 2);
                })
                .attr('y', function (d) {
                    return yScale(d.percentage) - 10;
                })
                .attr('text-anchor', 'middle')
                .text(function (d) {
                    return d.percentage + '%';
                });

            var xAxis = d3.svg.axis()
                .scale(xScale)
                .orient('bottom');

            svg.append('g')
                .attr('transform', 'translate(0,' + (height) + ')')
                .attr('class', 'x axis')
                .call(xAxis)
                .selectAll('.tick text');

        },
        showCompanyInfo: function (info, position) {
            var $companyInfo = $('#company_information');
            var $arrow = $companyInfo.find('#company_information_arrow');
            var $name = $companyInfo.find('#info_company_name');
            var $description = $companyInfo.find('#company_info_paragraph');
            var $stock_price = $companyInfo.find('#stock_price_info');
            var $market_cap = $companyInfo.find('#market_cap_info');
            var $revenue_trends = $companyInfo.find('#revenue_trends_info');
            var $sector_info = $companyInfo.find('#sector_info');
            //this.hideMenu();
            $name.text(info.name + ' (' + info.full_ticker + ')');
            $companyInfo.removeClass('hidden');
            $description.text(info.description);
            if (info.stock_price) {
                $stock_price.text(info.stock_price);
            } else {
                $stock_price.text('N/A')
            }

            if (info.market_cap) {
                $market_cap.text(info.market_cap);
            } else {
                $market_cap.text('N/A')
            }

            if (info.revenue_trend) {
                $revenue_trends.text(info.revenue_trend);
            } else {
                $revenue_trends.text('N/A')
            }

            if (info.industry_type) {
                $sector_info.text(info.industry_type.name);
            } else {
                $sector_info.text('N/A')
            }
            var yPosition = position.y;
            if ($arrow.hasClass('arrow-down')) {
                yPosition = yPosition - ($companyInfo.height() + 90);
            }
            $companyInfo.css('left', position.x);
            $companyInfo.css('top', yPosition);
            Samson.App.SupplyChainChartUtility.hideMenu();
        },
        hideCompanyInfo: function () {
            var $companyInfo = $('#company_information');
            $companyInfo.addClass('hidden');
        },
        showBarChart: function (position) {
            var $chart = $('#supply_chain_histories_chart_container');
            var positionY;
            var positionX;

            if(  position.x > (position.width/2)) {
                positionX = position.x - 200;
            } else {
                positionX = position.x + 70;
            }

            if( position.y - 40 < (position.height/2)) {
                positionY = position.y + 100;
            } else {
                positionY = position.y -290;
            }
            $chart.css('left', positionX);
            $chart.css('top', positionY);
            $chart.removeClass('hidden');
        },
        hideMenu: function () {
            $('#supply_chain_menu').addClass('hidden');
        },
        showMenu: function (info, position) {
            var $menu = $('#supply_chain_menu');
            var $link = $menu.find('#company_link');
            var $history = $menu.find('#company_history');
			var $pdf = $menu.find('#company_pdf');
			var $djnews = $menu.find('#company_news');
			Samson.App.SupplyChainChart.Component.treeSvg.selectAll('circle').style("stroke", null).style("fill-opacity", 1) ;
            $menu.removeClass('hidden');
            $menu.css('left', position.x);
            $menu.css('top', position.y);
            $link.attr('href', '/iqbankerdev/charts.php?id='+info.id);
			$link.attr('target', '_self');
			$pdf.attr('href', '#');
			$djnews.attr('href', '#');
			if(info.isparent){$djnews.attr('onclick', 'ajax_chart_news("'+info.id+'", "lsn_customers");');}else{$djnews.attr('onclick',  'ajax_chart_news("'+info.id+'", "lsn_suppliers");');}
			//$pdf.attr('target', '_blank');
			/*if(info.isparent)
			{
				var arr_pdf = document.getElementById('hidCusSymbol').value.split("|"); 
				if(arr_pdf.length > 1)
				{		
					for (var i=1; i<=arr_pdf.length ; i++)
					{
						var pdf_ticker = arr_pdf[i].split("#"); 
						if(pdf_ticker[0]==info.full_ticker)
						{
							$pdf.attr('href', '../../../pdf/'+ pdf_ticker[1] +'?page='+ pdf_ticker[2] +'');
							//$pdf.attr('target', '_blank');
							return false;
						}
					}
				}
			}
			else
			{
				var arr_pdf = document.getElementById('hidSupSymbol').value.split("|"); 
				if(arr_pdf.length > 1)
				{		
					for (var i=1; i<=arr_pdf.length ; i++)
					{
						var pdf_ticker = arr_pdf[i].split("#"); 
						if(pdf_ticker[0]==info.full_ticker)
						{
							$pdf.attr('href', '../../../pdf/'+ pdf_ticker[1] +'?page='+ pdf_ticker[2] +'');
							//$pdf.attr('target', '_blank');
							return false;
						}
					}
				}
				
			}*/

            $link.off().on('click', function (event) {
                Samson.App.SupplyChainChartUtility.hideMenu();
            });
            $history.off().on('click', function (event) {
                event.preventDefault();
                Samson.App.SupplyChainChartUtility.showBarChart(position);
                Samson.App.SupplyChainChartUtility.drawChart(info.histories);
                Samson.App.SupplyChainChartUtility.setCompanyName(info.id, info.name);
                console.log(info)
                if (info.isparent) {
                    Samson.App.SupplyChainChartUtility.setHierarchyInfo(info.hierarchy_info);
                } else {
                    Samson.App.SupplyChainChartUtility.setHierarchyInfo(info.name + ' -> ' +info.hierarchy_info);
                }
                Samson.App.SupplyChainChartUtility.hideMenu();

            });

        },
        setUpCloseMeu: function () {
            if ($('#supply_chain_histories_chart_container').length > 0) {
                $('#close_supply_chain_menu').on('click', function () {
                    this.hideMenu();
                }.bind(this));
            }
        },
        setCompanyName: function (id, name) {
            var $link = $('#supply_chain_histories_company_name_link');
            $link.text(name);
            $link.attr('href', '/iqbankerdev/charts.php?id='+id)
        },
        setHierarchyInfo: function (hierarchyInfo) {
            $('#hierarchy_info').text(hierarchyInfo)
        },
        hideBarChart: function () {
            $('#supply_chain_histories_chart_container').addClass('hidden');
        },
        setupCloseBarChart: function () {
            if ($('#supply_chain_histories_chart_container').length > 0) {
                $('[data-toggle=close-supply-chain-histories]').on('click', function () {
                    this.hideBarChart();
                }.bind(this));
            }
        },
        Init: function () {
            this.setupCloseBarChart();
            this.setUpCloseMeu();
        }

    }
})(window);