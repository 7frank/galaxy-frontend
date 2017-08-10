<?php
	header( "Cache-Control: no-cache, must-revalidate" );
	header( "Pragma: no-cache" );
	header( "content-type: application/x-javascript; charset=UTF-8" );
	$link = pg_connect("host=localhost port=5432 dbname=samson_test user=postgres password=123456 options='--client_encoding=UTF8'");
	$DJLast = $_GET['lastNews'];
	$comID = $_GET['selectNews'];
	if(isset($_GET['paramBubble'])){$comID=$_GET['paramBubble'];}
	
	$sql_paramSearch = "";
	if(isset($_GET['paramSearch'])){
		$arrSearch = explode("|", $_GET['paramSearch']);
		$sql_search = "";
		for ($i=1;$i<count($arrSearch);$i++)
		{
			if($i>1){$sql_search.=",";}
			$sql_search.="'".$arrSearch[$i]."'";
		}
		$sql_paramSearch = "and news_subject.code in (".$sql_search.")";
	}
	$searchPage="";
	if($_GET['selectPage']=="1"){$searchPage="";}else{$searchPage="OFFSET ".($_GET['selectPage']-1)*8;}
	$sql = "SELECT news.id, news.lexicon,news.display_date,array_to_string(array_agg(distinct companies.symbol),',') AS symbol
from news inner join news_subject on news_subject.dj_news_id=news.id inner join news_isin on news_isin.dj_news_id=news.id inner join companies on 'I_' || news_isin.isin=companies.isin ".$sql_paramSearch." where  news.id > '150000' and news.id < '".$_GET['lastNews']."'
GROUP BY news.id, news.lexicon,news.display_date order by news.id desc limit 8 ".$searchPage."";
	$result = pg_query($link, $sql);
	while($data = pg_fetch_assoc($result)){
			$DJLast = $data["id"];
		}
	echo $DJLast;
	pg_close($link);
?>