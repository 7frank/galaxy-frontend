<?php
	ob_start();
	header( "Cache-Control: no-cache, must-revalidate" );
	header( "Pragma: no-cache" );
	header( "content-type: application/x-javascript; charset=UTF-8" );
	setcookie("clientTimeZone", $_GET['timezone'], time() + (86400 * 30), "/");
?>