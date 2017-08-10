<?php
	header( "Cache-Control: no-cache, must-revalidate" );
	header( "Pragma: no-cache" );
	header( "content-type: application/x-javascript; charset=UTF-8" );
	require_once("../../configs/connect.php");
	include("../../classes/main.php");
	$DJNews = new DJNews();
	$clientTimeZone=$_COOKIE['clientTimeZone'];

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

	$sql = "SELECT distinct companies.name,companies.symbol,companies.isin, news.id, news.topic, news.lexicon, news.display_date FROM companies inner join news_isin on LOWER('i_' || news_isin.isin)=LOWER(companies.isin) inner join news on news.id=news_isin.dj_news_id inner join news_subject on news_subject.dj_news_id=news.id ".$sql_paramSearch." where companies.id = '".$_GET['selectNews']."' and news.id < '".$_GET['lastNews']."'  order by news.id desc limit 10";
	$result = pg_query($link, $sql);
	echo "<div class=\"list_news_list\">";
	while($data = pg_fetch_assoc($result)){
		$topic=$data["lexicon"];
		$only_ticker = explode(":", $data['symbol']);
		if(strlen($only_ticker[1])>4){$only_ticker[1]=substr($only_ticker[1],0,4)."..";}
		$about="";
		$i=0;
		$sqlTicker="select news_isin.isin ,companies.symbol from news_isin inner join companies on LOWER('i_' || news_isin.isin)=LOWER(companies.isin) where dj_news_id='".$data['id']."' and companies.symbol !='".$data['symbol']."' and news_isin.isin in (select news_isin.isin from news inner join news_isin on news_isin.dj_news_id=news.id and LOWER('i_' || news_isin.isin) in ((select LOWER(isin) from companies where id in (select company_id from customers where symbol='".$_GET['selectSymbol']."') UNION ALL select LOWER(isin) from companies where symbol in (select symbol from customers where company_id='".$_GET['selectNews']."'))) where news.id = '".$data['id']."')";
		$result_ticker = pg_query($link, $sqlTicker);
		while($data_ticker = pg_fetch_assoc($result_ticker)){
			$i++;
			$only_ticker2 = explode(":", $data_ticker['symbol']);
			if(strlen($only_ticker2[1])>4){$only_ticker2[1]=substr($only_ticker2[1],0,4)."..";}
			if($i=="1"){$about.= ", ".$only_ticker2[1];}
			if($i=="2"){$about.= ", ..";}
		}
		echo "<div class=\"topic\" onclick=\"ajax_chart_dj_news('".$data["id"]."', '".$data["name"]."(".$data["symbol"].")');\">".stripslashes($topic)."</div><div class=\"ticker\">".$only_ticker[1]."".$about."</div><div class=\"datetime\">".$DJNews->DisplayDate($data['display_date'],$clientTimeZone)."</div><div style=\"clear:both;\"><hr style=\"padding:0;margin:5px 5px 5px 0px;\"/></div>";
	}
	echo "</div>";
	pg_close($link);
?>