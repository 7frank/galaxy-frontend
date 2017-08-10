(function (window) {

    'use strict';

    if (!window.Samson) {
        window.Samson = {};
    }

    var Samson = window.Samson;

    Samson.App = window.Samson.App || {};

    Samson.App.SearchBar = {
        Init: function () {
		
            if ($('#navbar_search').length > 0) {

                var companies = new Bloodhound({
                    datumTokenizer:  function(d) {
                        var nameToken = Bloodhound.tokenizers.nonword(d.name);
                        var tickerToken = Bloodhound.tokenizers.nonword(d.ticker);
                        return nameToken.concat(tickerToken);
                    },
                    queryTokenizer: Bloodhound.tokenizers.nonword,
                    prefetch: '/iqbankerdev/modules/search/companies.php?q=*-*-*-',
                    remote: {
                        url: '/iqbankerdev/modules/search/companies.php?q=%QUERY',
                        wildcard: '%QUERY'
                    },
                    identify: function(obj) { return obj.id; }
                });
                companies.initialize();

                var $navbarSearch = $('#navbar_search').typeahead({
                        hint: false,
                        highlight: true,
                        minLength: 1,
                    },
                    {
                        displayKey: 'name',
                        source: companies.ttAdapter(),
                        templates: {
                            empty: function (company) {
                                return [
                                    '<div class="empty-message">',
                                    'Unable to find \"' + company.query + '\" Company',
                                    '</div>'
                                ].join('\n')
                            },
                            suggestion: function (company) {
								var n = company.symbol.search(":"); 
								if(n > 0)
									{
										var res = company.symbol.split(":"); 
										return '<table style="width:700px;"><tr><td style="width:150px;text-align:left;">' + res[1].trim() + '</td><td style="width:400px;text-align:left;">' + company.name.trim() + '</td><td style="width:150px;text-align:right;">' + res[0].trim() + '</td></tr></table>';
									}
								else
									{
										return '<div style="width:100%;">' + company.symbol + '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + company.name + '</div>';
									}
                            },
                            footer: function (company) {
								return "";
                                //return "<a href='/companies/search?query="+company.query +"' class='tt-suggestion tt-selectable'> <i class='fa fa-search' aria-hidden='true'></i> Find more result for <strong class='tt-highlight'>" +  company.query + "</strong></a>"
                            }
                        },
                    });
                $navbarSearch.bind('typeahead:selected', function (event, suggestion) {
                    window.location = '/iqbankerdev/charts.php?id=' + suggestion.id;
                });
            }

        }
    }
})(window);
