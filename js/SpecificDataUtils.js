import $ from 'jquery';
import 'jquery-ui/themes/base/core.css';
//import 'jquery-ui/themes/base/theme.css';
//import 'jquery-ui/themes/base/selectable.css';
import 'jquery-ui/ui/core';
import 'jquery-ui/ui/widgets/slider';
import 'jquery-ui/ui/widgets/draggable';
import 'jquery-ui/ui/widgets/resizable';

function formatNumber (num) {
	return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
}
var curr=0
var currentGradientColors=[0x218D20,0x439229,0x8CCB84,0x14B0BF,0x9DC9CA,0xCAB81A,0xBBC42D,0xC8A6BF,0xCF73B4,0x816365,0x7D5C53,0xAE5E29,0xB62729]
function getNextGradient()
{
	
	
	var availGradients=[

	[0x218D20,0x439229,0x8CCB84,0x14B0BF,0x9DC9CA,0xCAB81A,0xBBC42D,0xC8A6BF,0xCF73B4,0x816365,0x7D5C53,0xAE5E29,0xB62729],
	[0x111111,0x111111,0x111111,0x111111,0x111111,0x111111,0x111111,0x111111,0x111111,0xff0000,0x00ff00,0x0000ff,0xffffff],
	[0xffffff,0x0000ff,0x111111,0x111111,0x111111,0x111111,0x111111,0x111111,0x111111,0x111111,0x111111,0x111111,0x111111]
	]
	
	var next=++curr % availGradients.length
	return currentGradientColors=availGradients[next]
	
}			
	

	function computeCompanyNodeColor(val=0,attr="sent"){

					
					var sentRanges= [[92,Number.MAX_SAFE_INTEGER],[85,92],[78,85],[71,78],[64,71],[57,64],[50,57],[43,50],[36,43],[29,36],[22,29],[15,22],[Number.MIN_SAFE_INTEGER,22]]
					var priceRangesInPct=[[18,Number.MAX_SAFE_INTEGER],[18,15],[12,15],[9,12],[6,9],[3,6],[0,3],[-3,0],[-6,-3],[-9,-6],[-12,-9],[-18,-15],[Number.MIN_SAFE_INTEGER,-18]]

				var arr

				if (attr=="sent") arr=sentRanges
				if (attr=="priceRanges") arr=priceRangesInPct;
				
				var i;
				for (i=0;i<arr.length;i++) {
					var range=arr[i] ;

					if (range[0]<val && val<range[1] )
					return currentGradientColors[i]
				
					if (range[1]<val && val<range[0] )
					return currentGradientColors[i]
				}

					return 0xffffff
			}
			
				
			function computeGroupNodeColorHelper(distinctGroupIDS)
			{
				var colors=[]
				
				for (i in distinctGroupIDS)
				{
					colors.push(_.random(0,255)*_.random(0,255)*_.random(0,255))
					
				}
				
				
				return {
					getColor:function (groupID){
					
					var i=distinctGroupIDS.indexOf(groupID)
					return colors[i]|| 0xFFFFFF
				}
				
				}
				
			}
			

		
function changeGradientBar(colorArray)
{
	var gradientString=colorArray.map( (c) => "#"+c.toString(16).padStart(6,"0")  ).join(",")

		var tpl=`.companyGradient {
		  background: lightgrey;
		  
		  background: -webkit-linear-gradient(left,${gradientString});
		 
		  background: -o-linear-gradient(left,${gradientString});
		  
		  background: -moz-linear-gradient(left,${gradientString});
		 
		  background: linear-gradient(to right,${gradientString}); 
		}
`
 $("<style>").text(tpl).appendTo("head")
	
	
	
}
			
			
		
$(function(){
	
	var selectTemplate=`
	<select class="cloudNodeColorSelect">
	<option value="sent">sent</option>
	<option value="priceRanges">priceRanges</option>
	<option value="group">group</option>
	</select> 
	`
	var $sel=$(selectTemplate)
	
	$(".companyGradient").on("click",function(){
		
		var array=getNextGradient()	
		changeGradientBar(array)
		$sel.trigger("change")
	})
	
	
	$sel.on("change",function(e,ui){
        var val=$sel.val()

		$(window).trigger("node-color-change",val)

/*
        var helper=computeGroupNodeColorHelper(globalEnv.nodeClouds.groupIdList)


        if (val=="group")
            globalNodes.forEach(function(v){ v.color=helper.getColor(v.group)});
        else
            globalNodes.forEach(function(v){ v.color=computeCompanyNodeColor(parseInt(v.sent),val)   } )

        globalEnv.nodeClouds.update()

        globalEnv.particles.updateColors()

*/



    }).appendTo("body")
	
})


export
var GUI={
	createAccordion(items)
	{
		function createSection(caption,content,id)
		{
		var sectionTpl=`<h3 class="accordion-header ui-accordion-header ui-helper-reset ui-state-default ui-accordion-icons ui-corner-all" > ${caption}</h3>
		<div id="${id}" class="ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom">
			
		</div>`
		 var section=$(sectionTpl)
		 
		
		 section.find(".ui-accordion-content").addBack('.ui-accordion-content').append(content)

		return section
		}
		var acc=$('<div class="ui-accordion ui-widget ui-helper-reset">')
		for (let item of items)
		{
		item=_.extend({caption:"missing 'caption'",content:"missing 'content'"},item)
		var sec=createSection(item.caption,item.content,item.id)
		acc.append(sec)
		}
		
		//acc.accordion({ header: "h3", active: false, collapsible: true })
		return acc
	},
	createSlider:function(){
		
		
		
		var slider=$("<div>").slider({
			min:10,max:1000,
			slide:function( event, ui ){
				
				
				doZoomByVal(ui.value)
				
			}
		
		}).addClass("zoom-slider")
		.css({
		    width: 200,
    "margin-left": "2em",
    "margin-top": "0.5em",
		})
		
		slider.appendTo("body")
		
		
	},
	createSample(){
		
		let a=GUI.createAccordion([{caption:"<span style=\"color:reg(255,255,255);font-family: 'roboto';font-size:16px;\">Top Sectors </span><img src=\"include/images/Triangle.png\" style=\"width:10px;\">",id:"companyIndustry",content:"Technology, 33%<br>Consumer Discretionary, 20%<br>Consumer Staples, 20%"},{caption:"<span style=\"color:reg(255,255,255);font-family: 'roboto';font-size:16px;\">Top Countries</span> <img src=\"include/images/Triangle.png\" style=\"width:10px;\">",id:"companyCountry",content:"United States, 80%<br>Japan, 10%<br>Germany, 4%"}])
		a.css({top:80,left:10,position:"absolute", zIndex:999,width:200}).appendTo("body")
		GUI.$el=a
		
		
		GUI.createSlider()
	GUI.info=	GUI.createNodeInfoPanel()
		
		
		
	},
	createNodeInfoPanel(){
		
		GUI.$info=$("<div>")
		
		
		GUI.$info.hide().appendTo("body")
		
		GUI.$info.addClass("graph-node-info").draggable().resizable()
		
		var $header=$("<div>").addClass("graph-node-info-header")
		
		
				var $search=$("<span>").addClass("graph-node-info-search").html("Yahoo Search")
				var $price=$("<span>").addClass("graph-node-info-price").html("USD 36.5 (-0.5%)")
				var $close=$("<span style=\"margin-left:420px;cursor:pointer;\">").addClass("graph-node-info-close").html("<i class=\"fa fa-times\" aria-hidden=\"true\" style=\"font-family:'FontAwesome' !important;\"></i> CLOSE")
			
				var stockPrice = "<span style=\"margin-left:20px;margin-top:7px;\">USD <span style=\"color:#f7685e;font-family:'roboto-bold'  !important;\">36.5</span> (-0.5%)</span>";
               // var headBar = "<span style=\"margin-left:400px;margin-top:7px;\" ></span>";
			
			
			$close.on("click",function(){
				GUI.$info.fadeOut(50)
				
			})
			
		$header.append($search,stockPrice,$close)
		
		var $body=$("<div>").addClass("graph-node-info-body")
		
		$body.html("COMPANY<br> wikiinfo")
		
		var $news=$("<div>").addClass("graph-node-info-news")
		
		//$news.html("RSS or Twitter or News")
		
			var $newsHeader=$("<div>").addClass("graph-node-info-news-header").html("News")
				var $newsBody=$("<div>").addClass("graph-node-info-news-body")
		$news.append($newsHeader,$newsBody)
		
		GUI.$info.append($header,$body,$news)
		
		
	return {
		setNode:function(node)
		{
			var news=["U.S., China agree to first trade steps under 100-day plan",
			"Wall Street falls, department stores take a drubbing",
			"Behind Kushner Companies, a Chinese agency skirts visa-for-investment rules",
			"In blow to Trump, GE backs NAFTA and plans growth in Mexico"]
			
				lorem="Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet."
			
			
			
			//header
			
			
			$search.html($("<a style=\"text-decoration:none;\">").html("<div style=\"float:left;\">Go to Company Page </div><div  style=\"float:right;padding-left:5px;padding-top:1px;\"> >></div>").attr({target:"_blank",href:"#",title:"Open new Tab for "+node.name}))
			
			
			//price
			
			var companyLookupName=node.name
			if (node.ticker)
				companyLookupName=node.ticker.split(":")[1]
			
			AppDataService.getCompanyInfo(companyLookupName).then(function(data){
			
			/*if (!data.LastTradePriceOnly)
			{
				console.error("'"+node.name+"' not found",data)
				$price.html("-/-")
				return
			}*/
			
				var str=`${data.Currency} ${data.LastTradePriceOnly} (${data.ChangeinPercent})`
				$price.html(str)
				
			})
			
			
			
			//body
			$body.html("")
			AppDataService.getWiki(node.name).then(function(data){
				
				if (data.content=="Redirect to:")
				{
					$body.html("<h2>"+node.name+"</h2><br>").append("TODO handle redirects for wikipedia")
					/*
					AppDataService.getWiki(data.page).then(function(data){
						$body.html("<h2>"+node.name+"</h2><br>").append(data.content)
						
					})*/
				}
				else
				$body.html("<h2>"+node.name+"</h2><br>").append(data.content)
				
			}).catch(function(e){
				
				
				if (e.code=="missingtitle")
					$body.html("Wiki info not found for: "+node.name)
				else
				$body.html(e.code)
				
			})
			
			
			
			$newsBody.html("")
			
			
			function getNews()
			{
				var n=news[_.random(0,3)]
				var el=$("<p>").append(n)
				$newsBody.append(el)
			}
			
			getNews()
			
			getNews()
			getNews()
			
		}
	}
		
	},
	updateNodeInfo(node,bShow=true){
		
		
		GUI.$info.toggle(bShow)
		if (bShow)
		GUI.info.setNode(node)
		
		
	},
	
	updateFromVisibleNodes(nodes){
		
			if (!GUI.$el) return 
			
			
			
				GUI.$el.parent().find(".graph-info-companys-visible").html(formatNumber(nodes.length.toLocaleString('en-US')))

			
	
		var industries={}
		var countries={}
		nodes.forEach(function(n){
			
			if (!n.industry) return 
			
			if (!n.group) return 
			
			if (!industries[n.industry]) industries[n.industry]=0
			industries[n.industry]++
			
			if (!countries[n.group]) countries[n.group]=0
			countries[n.group]++
			
		})
		
		
		var sortedIndustries = _.sortBy(_.toPairs(industries), 1).reverse()
		var sortedCountries = _.sortBy(_.toPairs(countries), 1).reverse()
		
		var totalCountries=_.sum(sortedCountries.map( (v) => v[1]))
		var totalIndustries=_.sum(sortedIndustries.map( (v) => v[1]))
		
		var $industry=GUI.$el.find("#companyIndustry")
		var $country=GUI.$el.find("#companyCountry")
		
		
		function pct(val,total)
		{
			return ", "+_.round(100*val/total,1)+"%"
			
		}
		
		$industry.html("")
		for (var industry of sortedIndustries.slice(0,3))
		{
			var resHTML="<table style=\"width:100%;padding:0px;margin:0px;\"><tr><td style=\"padding:0px;margin:0px;text-align:center;width:25px;\" ><img src=\"img/industryIcons/"+industry[0]+".png\" style=\"width:22px;height:22px;\"></td><td style=\"width:80%;padding:0px;margin:0px;text-align:left; font-family: 'roboto';color:rgb(208, 206, 206);font-size:14px;\">"+industry[0].trim()+""+pct(industry[1],totalIndustries)+"</td></tr></table>";
			var $row=$("<div>").addClass("industry-info-row").append(resHTML)
			$industry.append($row)		
		}
		
	
		$country.html("")
		for (var country of sortedCountries.slice(0,3))
		{
			var $row=$("<div>").append("<span style=\" font-family: 'roboto';color:rgb(208, 206, 206);font-size:14px;\">"+country[0]+""+pct(country[1],totalCountries)+"</span>")
			$country.append($row)
			
		}
		//TODO percentage
		
		
		
	}
	
	
}


$(function(){
	
	GUI.createSample()

	$(".rightCompanyInfo").draggable()
	

	
})
	