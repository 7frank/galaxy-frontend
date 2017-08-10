$(document).ready(function(){
	$("#nav-right").click(function () { 
		var clicks = $(this).data('clicks');
		  if (clicks) {	
			  var w = $(this).parent().width() - 400;
				$("#wrapper").animate({ 'margin-right': "400px" });
				$("#column-left").animate({"width":w});			
				$("#column-right").css({ 'display': "block" });
				$("#column-right").animate({ 'width': "390px" });	
				$("#column-right").promise().done(function(){$("#column-right").css({ 'display': "block" });document.getElementById('supply_chain').innerHTML='';$(document).ready(ready);$(document).on('page:load', ready);	});								
				
				} else {
				 var w = $(this).parent().width() - 10;
				$("#wrapper").animate({ 'margin-right': "10px" });
				$("#column-left").animate({"width":w});	
				$("#column-right").animate({ 'width': "0px" });		
				$("#column-right").promise().done(function(){$("#column-right").css({ 'display': "none" });document.getElementById('supply_chain').innerHTML='';$(document).ready(ready);$(document).on('page:load', ready);});		
		  }   
			$(this).data("clicks", !clicks);		 
	});
	
});
/*$( window ).resize(function() {
				var w = $(window).width() - 20;
				$("#wrapper").animate({ 'margin-right': "20px" });
				$("#column-left").animate({"width":w});	
				$("#column-right").animate({ 'width': "0px" });		
				$("#column-right").promise().done(function(){$("#column-right").css({ 'display': "none" });document.getElementById('supply_chain').innerHTML='';$(document).ready(ready);$(document).on('page:load', ready);});
});*/

function js_activeTab(tab)
{
	document.getElementById("tabS").value=tab;
	document.getElementById("tbl_tab1").style.display='none';
	document.getElementById("tbl_tab2").style.display='none';
	if(tab==1)
	{
		document.getElementById("tbl_tab1").style.display='';
		document.getElementById("tbl_tab2").style.display='none';
		document.getElementById('td1').className = 'buttonActivet';
		document.getElementById('td2').className = 'buttont';
	}
	else
	{
		document.getElementById("tbl_tab1").style.display='none';
		document.getElementById("tbl_tab2").style.display='';
		document.getElementById('td1').className = 'buttont';
		document.getElementById('td2').className = 'buttonActivet';
	}
}