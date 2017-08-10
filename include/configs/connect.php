<?php
	set_time_limit(0);
	ini_set('memory_limit', '-1');
	ini_set('display_errors', 0);
	ignore_user_abort(1);
	header('Content-Type: text/html; charset=utf-8');
	//$link = pg_connect("host=samsondatabase.c7kbkwa5yufi.us-east-1.rds.amazonaws.com dbname=samsonweb_testphp user=samsonuser password=samsondb");
	$link = pg_connect("host=localhost port=5432 dbname=samson_test user=postgres password=123456 options='--client_encoding=UTF8'");
?>