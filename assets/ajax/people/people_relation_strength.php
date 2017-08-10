<?php
	header( "Cache-Control: no-cache, must-revalidate" );
	header( "Pragma: no-cache" );
	header( "content-type: application/x-javascript; charset=UTF-8" );
	require_once("../../../configs/connect.php");
	include("../../../classes/main.php");
	echo "<div class=\"header\"><div style=\"float:left;width:375px;text-align:left;\">Relationship Mapping Summary: HPQ-INTC >></div><span onclick=\"people_relation_strength_close();\" style=\"cursor:pointer;\">X</span></div>";
	echo "<div id=\"people_chart\"></div><script>Highcharts.chart('people_chart', {
    chart: {
        plotBackgroundColor: null,
        plotBorderWidth: 0,
        plotShadow: false
    },
    title: {
        text: '540<br>Executive<br>Relationships',
        align: 'center',
        verticalAlign: 'middle',
        y: 40,
        style: {
                    fontWeight: 'bold',
                    
                    fontSize: '20px'
                }
    },
    tooltip: {
        pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
    },
    plotOptions: {
        pie: {
        
             colors: [
     '#1f4e79', 
     '#2e75b6', 
     '#9dc3e6',
      '#bdd7ee'
    
   ],
            dataLabels: {
                enabled: true,
                distance: 0,
                style: {
                    
                    color: '#a6a6a6',
                     fontSize: '18px'
                }
            },
            startAngle: -90,
            endAngle: 90,
            center: ['50%', '75%']
        }
    },
    series: [{
        type: 'pie',
        name: 'Browser share',
        innerSize: '50%',
        data: [
              ['Others',       200],
            ['Marketing & Sales', 200],
            ['Board of Directors',    65],
            ['C-Levels',     100],
            {
                name: 'Proprietary or Undetectable',
                y: 0.2,
                dataLabels: {
                    enabled: false
                }
            }
        ]
    }]
});</script>";
	echo "<div class=\"topic\" style=\"text-align:right;color:#9a9a9a;\"></div>";
	echo "<div class=\"detail\"></div>";
?>