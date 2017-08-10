var ready;
ready = function () {

    'use strict';

    if (!window.Samson) {
        window.Samson = {};
    }

    var Samson = window.Samson;

    // initialize the application
    Samson.Init = (function () {
        $('[data-toggle=tooltip]').tooltip();
        $('#company_info').popover({placement: 'bottom'});
        Samson.App.SupplyChainChart.Init();
        Samson.App.FootballFieldChart.Init();
        Samson.App.SearchBar.Init();
        Samson.App.SupplyChainBigCompanyChart.Init();
        Samson.App.SupplyChainChartUtility.Init();
        Samson.App.BubbleChart.Init();
        Samson.App.LocateComapny.Init();
        Samson.App.ForceChart.Init();
        Samson.App.AboutPageBubbleChart.Init();
    })();
};



$(document).ready(ready);
$(document).on('page:load', ready);
// Todo Workaround for turbo links
Turbolinks.pagesCached(0);

ajax_setTimezone();