<link href="include/css/layout.css" rel="stylesheet" type="text/css" />
<link href="include/css/main.css" rel="stylesheet" type="text/css" >
<link href="include/css/sol.css" rel="stylesheet" type="text/css" >
<link href="include/css/scrollert.min.css" rel="stylesheet" type="text/css" >
<link href="include/css/font-roboto.css" rel="stylesheet" type="text/css" />
<link href="include/css/font-roboto-condense.css" rel="stylesheet" type="text/css" />
<link href="include/css/font-benchnine.css" rel="stylesheet" type="text/css" />
<link href="include/fonts/font-awesome/css/font-awesome.min.css" rel="stylesheet" type="text/css" />

<script src="include/js/ajax_connect.js"></script>
<script src="include/js/ajax_function.js"></script>
<script src="include/js/ajax_people.js"></script>
<script src="include/js/sol.js"></script>
<script src="include/js/scrollert.min.js"></script>
<script src="include/highstock/code/highstock.js"></script>
<script src="include/highstock/code/js/themes/dark-unica.js"></script>
<script src="include/highstock/code/modules/exporting.js"></script>
<style>
    #logo {
        position: absolute;
        top: 0px;
        left: 30;
        color: #ffffff;
        z-index: 1;padding: 10px;
    }
    #starview {
        position: absolute;
        top: 0px;
        right: 0;
        color: #ffffff;
        z-index: 1;padding: 5px 10px 10px 10px;
    }
    #sig_menu {
        font-family:'roboto';
        position: absolute;
        top: 13px;
        left: 650;
        color: #0490cd;
        z-index: 1;padding: 10px;
        font-size:15px;
        background: rgba(0, 0, 0, 0.51);
        cursor:pointer;
    }

</style>
<script>
    function js_menu_sig(){
        if(document.getElementById('hid_sig_menu').value==0){
            document.getElementById('sig_menu_sub').style.display='block';
            document.getElementById('hid_sig_menu').value=1;
        }else{
            document.getElementById('sig_menu_sub').style.display='none';
            document.getElementById('hid_sig_menu').value=0;
        }
    }
    ajax_setTimezone() ;
</script>