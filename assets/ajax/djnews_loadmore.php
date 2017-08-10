<?php
	header( "Cache-Control: no-cache, must-revalidate" );
	header( "Pragma: no-cache" );
	header( "content-type: application/x-javascript; charset=UTF-8" );

	$link = @pg_connect("host=localhost port=5432 dbname=samson_test user=postgres password=123456 options='--client_encoding=UTF8'");
	
	if (!$link) {
		echo "no database connection";
		exit;	
		
	}
	
	include("../../include/classes/main.php");
	$DJNews = new DJNews();
	$clientTimeZone=$_COOKIE['clientTimeZone'];
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
	if($_GET['selectPage']=="1"){$searchPage="OFFSET 0";}else{$searchPage="OFFSET ".($_GET['selectPage']-1)*7;}
	$sql = "select * from news order by id desc limit 7 ".$searchPage."";
	$result = pg_query($link, $sql);
	echo "<div class=\"list_news_list\">";
	while($data = pg_fetch_assoc($result)){
		echo "<div class=\"topic\" >".stripslashes($data['lexicon'])."</div><div class=\"ticker\"></div><div class=\"datetime\">".$DJNews->DisplayDate($data['display_date'],$clientTimeZone)."</div><div style=\"clear:both;\"><hr style=\"padding:0;margin:0px;margin-bottom:10px;background: rgba(127,127,127, 0.41);height: 1px; border: 0;\"/></div>";
	}
	echo "</div>";
	pg_close($link);
?>