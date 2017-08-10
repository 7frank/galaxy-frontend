<?php
class DJNews {
	public function DisplayDate ($display_date, $clientTimeZone)
	{
		$display_datetime = explode("T", $display_date);
		$display_year = substr($display_datetime[0],0,4);
		$display_month = substr($display_datetime[0],4,2);
		$display_day = substr($display_datetime[0],6,2);
		$display_time = explode(".", $display_datetime[1]);
		$display_h = substr($display_time[0],0,2);
		$display_i = substr($display_time[0],2,2);
		$display_s = 0;

		$date_now = date("Y-m-d", mktime(date("H"), date("i")+0, date("s")+0, date("m")+0  , date("d")+0, date("Y")+0));
		$date_newC = date("Y-m-d", mktime($display_h+$clientTimeZone, $display_i, $display_s, $display_month , $display_day, $display_year));
		$date_news = date("Y-m-d H:i", mktime($display_h+$clientTimeZone, $display_i, $display_s, $display_month , $display_day, $display_year));

		if($date_now==$date_newC){$DisplayDate=date("H:i", mktime($display_h+$_COOKIE['clientTimeZone'], $display_i, $display_s, $display_month , $display_day, $display_year));}else{$DisplayDate=date("n/j", mktime($display_h+$_COOKIE['clientTimeZone'], $display_i, $display_s, $display_month , $display_day, $display_year));}
		
		return $DisplayDate;
	}

	public function DisplayDateFull ($display_date, $clientTimeZone)
	{
		$display_datetime = explode("T", $display_date);
		$display_year = substr($display_datetime[0],0,4);
		$display_month = substr($display_datetime[0],4,2);
		$display_day = substr($display_datetime[0],6,2);
		$display_time = explode(".", $display_datetime[1]);
		$display_h = substr($display_time[0],0,2);
		$display_i = substr($display_time[0],2,2);

		$date_now = date("Y-m-d", mktime(date("H")+$clientTimeZone, date("i")+0, date("s")+0, date("m")+0  , date("d")+0, date("Y")+0));
		$date_news = date("Y-m-d H:i:s", mktime($display_h, $display_i, $display_s, $display_month , $display_day, $display_year));

		$DisplayDate=date("j F Y H:i", mktime($display_h+$_COOKIE['clientTimeZone'], $display_i, $display_s, $display_month , $display_day, $display_year));
		
		return $DisplayDate;
	}
} 
?>