<?php
	header( "Cache-Control: no-cache, must-revalidate" );
	header( "Pragma: no-cache" );
	header( "content-type: application/x-javascript; charset=UTF-8" );
	require_once("../../configs/connect.php");
	include("../../classes/main.php");
	$type_news = explode("_",$_GET['wn']);
	$newFrom = "";
	if($type_news[1] == "customers"){$newFrom = "Customers News : ";}
	if($type_news[1] == "suppliers"){$newFrom = "Suppliers News : ";}
	if($type_news[1] == "company"){$newFrom = "Company News : ";}
	if($type_news[1] == "industry"){$newFrom = "Industry News : ";}

	
	$DJNews = new DJNews();
	$sql_news="select * from news where id='".$_GET['id']."'";
	$result_news = pg_query($link, $sql_news);
	$data_ticker = pg_fetch_assoc($result_news);
	echo "<div class=\"header\"><div style=\"float:left;width:475px;text-align:center;\">".$newFrom."".$_GET['comName']."</div><span onclick=\"ajax_chart_dj_news_close('".$_GET['id']."');\" style=\"cursor:pointer;\">X</span></div>";
	echo "<div class=\"time\">".$DJNews->DisplayDateFull($data_ticker['display_date'],0)."</div>";
	echo "<div class=\"topic\" style=\"text-align:right;color:#9a9a9a;\"><div style=\"float:left;width:450px;text-align:left;color:#000000;\">".stripslashes($data_ticker['topic'])." </div><i class=\"fa fa-print fa-lg\" aria-hidden=\"true\"></i>&nbsp;</div>";
	echo "<div class=\"detail\">".stripslashes($data_ticker['detail'])."</div>";
	pg_close($link);
?>