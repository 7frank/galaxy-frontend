<?php
	header( "Cache-Control: no-cache, must-revalidate" );
	header( "Pragma: no-cache" );
	header( "content-type: application/x-javascript; charset=UTF-8" );
	require_once("../../configs/connect.php");
	$DJLast = $_GET['lastNews'];
	$sql_paramSearch = "";
	if( $_GET['paramSearch'] != ""){
		$arrSearch = explode("|", $_GET['paramSearch']);
		$sql_search = "";
		for ($i=1;$i<count($arrSearch);$i++)
		{
			if($i>1){$sql_search.=",";}
			$sql_search.="'".$arrSearch[$i]."'";
		}
		$sql_paramSearch = "and news_subject.code in (".$sql_search.")";
	}
	$sql = "
	SELECT distinct companies.name,companies.symbol,companies.isin, news.id, news.topic, news.display_date FROM companies inner join news_isin on 'I_' || news_isin.isin=companies.isin inner join news on news.id=news_isin.dj_news_id inner join news_subject on news_subject.dj_news_id=news.id ".$sql_paramSearch." where companies.id = '".$_GET['selectNews']."' and news.id < '".$_GET['lastNews']."' order by news.id desc limit 10";
	$result = pg_query($link, $sql);
	while($data = pg_fetch_assoc($result)){
			$DJLast = $data["id"];
		}
	echo $DJLast;
	pg_close($link);
?>