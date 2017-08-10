<?php
	header( "Cache-Control: no-cache, must-revalidate" );
	header( "Pragma: no-cache" );
	header( "content-type: application/x-javascript; charset=UTF-8" );
	require_once("../../configs/connect.php");
	include("../../classes/main.php");
	$DJNews = new DJNews();
	
	$news_target = "|";
	$i=0;
	$sql_target="select companies.id from news inner join news_isin on news_isin.dj_news_id=news.id inner join companies on LOWER('i_' || news_isin.isin)=LOWER(companies.isin) where news.id='".$_GET['id']."'";
	$rs_target = pg_query($link, $sql_target);
	while($data = pg_fetch_assoc($rs_target))
	{
		$i++;
		if($i>1){$news_target.="|";}
		$news_target.=$data["id"];
	}
	echo $news_target;
	pg_close($link);
?>