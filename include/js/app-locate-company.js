(function (window) {

    'use strict';

    if (!window.Samson) {
        window.Samson = {};
    }

    var Samson = window.Samson;

    Samson.App = window.Samson.App || {};

    Samson.App.LocateComapny = {
        Init: function () {
            if ($('#locate_company').length > 0) {

                var companies = new Bloodhound({
                    datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name', 'symbol'),
                    queryTokenizer: Bloodhound.tokenizers.whitespace,
                    prefetch: '/companies/search.json',
                    remote: {
                        url: '/companies/search.json?query=%QUERY',
                        wildcard: '%QUERY'
                    }
                });

                var $navbarSearch = $('#locate_company').typeahead({
                        hint: true,
                        highlight: true,
                        minLength: 1
                    },
                    {
                        displayKey: 'name',
                        source: companies.ttAdapter(),
                        templates: {
                            empty: function (company) {
                                return [
                                    '<div class="empty-message text-center">',
                                    'Unable to find \"' + company.query + '\" Company',
                                    '</div>'
                                ].join('\n')
                            },
                            suggestion: function (company) {
                                return '<p>' + company.name + ' : ' + company.symbol + '</p>';
                            }
                        }
                    });
                $navbarSearch.bind('typeahead:selected', function (event, suggestion) {
                    window.location = '/charts/iq_maps?company_id='+suggestion.id;
                });
            }

        }
    }
})(window);
