import bodyHTML from "./company-details-body.html"
import TemplateString from "../../utils/TemplateString";
import * as $ from "jquery"

class CompanyDetails extends HTMLElement {

    constructor(...args) {
        super(...args);


    }

    connectedCallback() {


        this.setStuff()

    }


    setStuff(o) {

        o = _.extend({name: "CompanyName", link: ""}, o)


        let str = new TemplateString(bodyHTML).format(o)

        $(this).html(str)


    }


    //placeholder use polymer highstock component instead if possible
    initBody() {
        dj_recent();
        var seriesOptions = [], seriesCounter = 0, names = ['stockprice', 'sentiment'];

        function createChart() {
            Highcharts.stockChart(
                'max-chart',
                {
                    chart: {
                        style: {
                            fontFamily: 'robotoCondensed-light'
                        }
                        ,
                        backgroundColor: 'rgba(0, 0, 0, 0.31)'
                    },
                    credits: {
                        enabled: false
                    },
                    rangeSelector: {
                        selected: 4,
                        enabled: true,
                        inputEnabled: $('#max-chart').width() > 300
                    },
                    xAxis: {
                        type: 'datetime',
                        labels: {
                            format: '{value:%m/%e}',
                            align: 'center'
                        }
                    },
                    yAxis: {
                        labels: {
                            formatter: function () {
                                return (this.value > 0 ? ' + ' : '') + this.value + '%';
                            }
                        },
                        plotLines: [{
                            value: 0,
                            width: 2,
                            color: 'silver'
                        }]
                    },
                    navigator: {
                        enabled: true,
                        height: 20
                    },
                    plotOptions: {
                        series: {
                            compare: 'percent',
                            showInNavigator: true
                        }
                    },
                    tooltip: {
                        pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b> ({point.change}%)<br/>',
                        valueDecimals: 2,
                        split: true
                    },
                    scrollbar: {
                        enabled: false
                    },
                    series: seriesOptions,
                    exporting: {
                        enabled: false
                    }
                });
        }


    }


}

if (!customElements.get("company-details"))
customElements.define("company-details", CompanyDetails);