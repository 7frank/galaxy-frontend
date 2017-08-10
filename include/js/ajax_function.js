function djnew_loadmore(objLast, objSelect, objUpdaet, DJTab, objSymbol, DJBubble,DJSearch, objPage) 
	{
		var req = Inint_AJAX();
		var str = Math.random();
		var paramBubble="";
		var paramSearch="";
		if(DJBubble != ""){ paramBubble = "&paramBubble="+DJBubble;}
		if(DJSearch != ""){ paramSearch = "&paramSearch="+DJSearch;}
		var str_url = "./assets/ajax/djnews_loadmore.php?clearmemory="+str+"&lastNews="+document.getElementById(objLast).value+"&selectNews="+document.getElementById(objSelect).value+"&selectTab="+document.getElementById(DJTab).value+"&selectSymbol="+document.getElementById(objSymbol).value+paramBubble+paramSearch+"&selectPage="+objPage;
			req.open('GET', str_url , true)
			req.onreadystatechange = function() 
			{
				if (req.readyState==4) 
					{
						if (req.status==200) 
							{
								document.getElementById('djnews').innerHTML=req.responseText;
								document.getElementById('DJLast').value =objUpdaet;
								document.getElementById('DJTab').value =document.getElementById(DJTab).value;
							}
					}
			}
		req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		req.send(null);
	}
function djnew_DJLast(DJTab ,objLast, objSelect, objSymbol, objPage) 
	{
		var DJBubble = document.getElementById('DJBubble').value;
		var DJSearch = document.getElementById('DJSearch').value;
		djnew_loadmore(objLast, objSelect, 0, DJTab, objSymbol,DJBubble, DJSearch, objPage); 
		document.getElementById('s_1').className="page-control";
		document.getElementById('s_2').className="page-control";
		document.getElementById('s_3').className="page-control";
		document.getElementById('s_4').className="page-control";
		document.getElementById('s_5').className="page-control";
		document.getElementById('s_6').className="page-control";
		document.getElementById('s_20').className="page-control";
		document.getElementById('s_'+objPage).className="page-control-active";
		/*var req = Inint_AJAX();
		var str = Math.random();
		var DJBubble = document.getElementById('DJBubble').value;
		var DJSearch = document.getElementById('DJSearch').value;
		var paramBubble="";
		var paramSearch="";
		if(DJBubble != ""){ paramBubble = "&paramBubble="+DJBubble;}
		if(DJSearch != ""){ paramSearch = "&paramSearch="+DJSearch;}
		var str_url = "./assets/ajax/djnew_DJLast.php?clearmemory="+str+"&lastNews="+document.getElementById(objLast).value+"&selectNews="+document.getElementById(objSelect).value+"&selectTab="+document.getElementById(DJTab).value+"&selectSymbol="+document.getElementById(objSymbol).value+paramBubble+paramSearch+"&selectPage="+objPage;
		req.open('GET', str_url , true)
			req.onreadystatechange = function() 
			{
				if (req.readyState==4) 
					{
						if (req.status==200) 
							{
								if(document.getElementById(objLast).value > 0 ){ djnew_loadmore(objLast, objSelect, req.responseText, DJTab, objSymbol,DJBubble, DJSearch, objPage); 	 }
									
							}
					}
			}
		req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		req.send(null);*/
	}

function ajax_setTimezone() 
	{
		var d = new Date();
		var n = d.getTimezoneOffset();
		var timezone = n / -60;
		var req = Inint_AJAX();
		var str = Math.random();
		var str_url = "./assets/ajax/setTimezone.php?clearmemory="+str+"&timezone="+timezone;
		req.open('GET', str_url , true)
		req.onreadystatechange = function() {if (req.readyState==4) {if (req.status==200) {}}}
		req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		req.send(null);
	}

function ajax_listDJNews(objDiv,objLast, objSelect, objSymbol)
	{
		
		document.getElementById('DJLast').value="999999999";
		document.getElementById('lsn_company').className = "col";
		document.getElementById('lsn_customers').className = "col";
		document.getElementById('lsn_suppliers').className = "col";
		document.getElementById('lsn_industry').className = "last";

		document.getElementById(objDiv).className += " active ";
		document.getElementById('DJTab').value = objDiv;
		document.getElementById('DJBubble').value = "";
		Samson.App.SupplyChainChart.Component.treeSvg.selectAll('circle').style("stroke", null).style("fill-opacity", 1) ;

		document.getElementById('djnews').innerHTML="";

		djnew_DJLast('DJTab' ,objLast, objSelect, objSymbol) ;
	}


function ajax_chart_dj_news(objID , objComName) 
	{
		document.getElementById('people_relation_strength').style.display='none';
		Samson.App.SupplyChainChart.Component.treeSvg.selectAll('circle').style("stroke", null).style("fill-opacity", 1) ;
		var req = Inint_AJAX();
		var str = Math.random();
		var str_url = "./assets/ajax/ajax_chart_dj_news.php?clearmemory="+str+"&id="+objID+"&wn="+document.getElementById('DJTab').value+"&comName="+objComName;
			req.open('GET', str_url , true)
			req.onreadystatechange = function() 
			{
				if (req.readyState==4) 
					{
						if (req.status==200) 
							{
								ajax_chart_dj_news_stork(objID) ;

								document.getElementById('news_detail').innerHTML=req.responseText;
								document.getElementById('news_detail').style.display='block';
								
							}
					}
			}
		req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		req.send(null);
	}

function ajax_chart_dj_news_stork(objID) 
	{
		var req = Inint_AJAX();
		var str = Math.random();
		var str_url = "./assets/ajax/ajax_chart_dj_news_stork.php?clearmemory="+str+"&id="+objID;
			req.open('GET', str_url , true)
			req.onreadystatechange = function() 
			{
				if (req.readyState==4) 
					{
						if (req.status==200) 
							{
								var res = req.responseText.split("|");
								for(var i=1; i<res.length; i++)
								{
									Samson.App.SupplyChainChart.Component.treeSvg.selectAll('circle#circle_'+res[i]).style("stroke-width", 50).style("stroke", "blue").style("fill-opacity", 1).attr("stroke-opacity", .3) ;
								}
							}
					}
			}
		req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		req.send(null);
	}

function ajax_chart_dj_news_close(objID) 
	{
		document.getElementById('news_detail').style.display='none';
		Samson.App.SupplyChainChart.Component.treeSvg.selectAll('circle').style("stroke", null).style("fill-opacity", 1) ;
	}

function ajax_chart_news(objComID, objTab) 
	{
		Samson.App.SupplyChainChart.Component.treeSvg.selectAll('circle').style("stroke", null).style("fill-opacity", 1) ;
		 $('#supply_chain_menu').addClass('hidden');
		document.getElementById('djnews').innerHTML="";
		document.getElementById('DJLast').value="999999999";
		document.getElementById('lsn_company').className = "col";
		document.getElementById('lsn_customers').className = "col";
		document.getElementById('lsn_suppliers').className = "col";
		document.getElementById('lsn_industry').className = "last";
		document.getElementById(objTab).className += " active ";
		document.getElementById('DJTab').value = objTab;
		Samson.App.SupplyChainChart.Component.treeSvg.selectAll('circle#circle_'+objComID).style("stroke-width", 50).style("stroke", "blue").style("fill-opacity", 1).attr("stroke-opacity", .3) ;
		/*$( "div" ).remove( ".list_news_list" );
		$('.scrollert').scrollert('update');*/
		ajax_chart_news_lastview(objComID);
	}
function ajax_chart_news_lastview(objComID) 
	{		
		var req = Inint_AJAX();
		var str = Math.random();
		document.getElementById('DJBubble').value = objComID;
		var DJSearch = document.getElementById('DJSearch').value;
		var paramSearch="";
		if(DJSearch != ""){ paramSearch = "&paramSearch="+DJSearch;}
		var str_url = "./assets/ajax/ajax_chart_news_lastview.php?clearmemory="+str+"&lastNews="+document.getElementById('DJLast').value+"&selectNews="+objComID+paramSearch;
			req.open('GET', str_url , true)
			req.onreadystatechange = function() 
			{
				if (req.readyState==4) 
					{
						if (req.status==200) 
							{
								if(document.getElementById('DJLast').value > 0 ){ ajax_chart_news_list(objComID, req.responseText, DJSearch);  }
							}
					}
			}
		req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		req.send(null);
	}

function ajax_chart_news_list(objComID, objUpdate, DJSearch) 
	{
		var req = Inint_AJAX();
		var str = Math.random();
		var paramSearch="";
		if(DJSearch != ""){ paramSearch = "&paramSearch="+DJSearch;}
		document.getElementById('DJBubble').value = objComID;
		var str_url = "./assets/ajax/ajax_chart_news_list.php?clearmemory="+str+"&lastNews="+document.getElementById('DJLast').value+"&selectNews="+objComID+paramSearch;
			req.open('GET', str_url , true)
			req.onreadystatechange = function() 
			{
				if (req.readyState==4) 
					{
						if (req.status==200) 
							{
								document.getElementById('djnews').innerHTML +=req.responseText;		
								document.getElementById('DJLast').value = objUpdate;
							}
					}
			}
		req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		req.send(null);
	}
function ajax_searchTo()
{
	document.getElementById('djnews').innerHTML="";
	document.getElementById('DJLast').value="0";
	djnew_DJLast('DJTab','DJLast', 'DJSelect', 'DJSymbol', 1);
}

function dj_recent(){
	var req = Inint_AJAX();
	var str = Math.random();
	var str_url = "./assets/ajax/dj_recent.php?clearmemory="+str;
		req.open('GET', str_url , true)
		req.onreadystatechange = function() 
		{
			if (req.readyState==4) 
				{
					if (req.status==200) 
						{
							document.getElementById('dj_recent').innerHTML=req.responseText;
						}
				}
		}
	req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	req.send(null);
}