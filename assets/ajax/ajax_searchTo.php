<?php
	header( "Cache-Control: no-cache, must-revalidate" );
	header( "Pragma: no-cache" );
	header( "content-type: application/x-javascript; charset=UTF-8" );
	require_once("../../configs/connect.php");
	include("../../classes/main.php");
	$DJNews = new DJNews();
	$clientTimeZone=$_COOKIE['clientTimeZone'];
	if( $_GET['varSearch'] != ""){
	$arrSearch = explode("|", $_GET['varSearch']);
	$sql_search = "";
	for ($i=1;$i<count($arrSearch);$i++)
	{
		if($i>1){$sql_search.=",";}
		$sql_search.="'".$arrSearch[$i]."'";
	}
		$sql = "select distinct news.id, news.topic, news.lexicon, news.display_date,companies.symbol from news inner join news_industry on news_industry.dj_news_id=news.id inner join dj_industry_mapping on dj_industry_mapping.djtag=news_industry.code inner join news_isin on news_isin.dj_news_id=news.id  inner join companies on 'I_' || news_isin.isin=companies.isin  inner join news_subject on news_subject.dj_news_id=news.id and news_subject.code in (".$sql_search.")  where companies.id='".$_GET['comID']."'  order by news.id desc limit 10";
	}
	else{
		$sql = "select distinct news.id, news.topic, news.lexicon, news.display_date,companies.symbol from news inner join news_industry on news_industry.dj_news_id=news.id inner join dj_industry_mapping on dj_industry_mapping.djtag=news_industry.code inner join news_isin on news_isin.dj_news_id=news.id  inner join companies on 'I_' || news_isin.isin=companies.isin  where companies.id='".$_GET['comID']."'  order by news.id desc limit 10";
	}
	$result = pg_query($link, $sql);
	while($data = pg_fetch_assoc($result)){
		$topic=$data["lexicon"];
		$only_ticker = explode(":", $data['symbol']);
		if(strlen($only_ticker[1])>4){$only_ticker[1]=substr($only_ticker[1],0,4)."..";}
		$about="";
		$i=0;
		
		echo "<div class=\"topic\" onclick=\"ajax_chart_dj_news('".$topic=$data["id"]."');\">".stripslashes($topic)."</div><div class=\"ticker\">".$only_ticker[1]."".$about."</div><div class=\"datetime\">".$DJNews->DisplayDate($data['display_date'],$clientTimeZone)."</div><div style=\"clear:both;\"><hr style=\"padding:0;margin:5px 5px 5px 0px;\"/></div>";
	}
	pg_close($link);
?>