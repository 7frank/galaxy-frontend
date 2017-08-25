/*
* File: jquery.wikiblurb.js
* Version: 1.0.0
* Description: A simple jQuery plugin to get sections of Wikipedia and other Wikis
* Author: 9bit Studios
* Copyright 2012, 9bit Studios
* http://www.9bitstudios.com
* Free to use and abuse under the MIT license.
* http://www.opensource.org/licenses/mit-license.php
*/

import jQuery from 'jquery';

(function ($) {

    $.fn.wikiblurb = function (options) {

        var defaults = $.extend({
	    wikiURL: "http://en.wikipedia.org/",
	    apiPath: 'w',
	    section: 0,
	    page: 'Jimi_Hendrix',
	    removeLinks: false,	    
	    type: 'all',
	    customSelector: '',
            filterSelector: '', 
            callback: function(){ }, errorCallback: function(){ }
        }, options);
        
	/******************************
	Private Variables
	*******************************/         

	var object = $(this);
	var settings = $.extend(defaults, options);
	
	/******************************
	Public Methods
	*******************************/         
        
        var methods = {
        	
	    init: function() {
		return this.each(function () {
		    methods.appendHTML();
		    methods.initializeItems();
		});
	    },

	    /******************************
	    Utilities
	    *******************************/			

	    addUnderscores: function(page) {
		if(page.trim().indexOf(' ') !== -1) {
                    page.replace(' ', '_');
                }
                return page;
	    },            
            
	    /******************************
	    Append HTML
	    *******************************/			

	    appendHTML: function() {
		// nothiing to append
	    },

	    /******************************
	    Initialize
	    *******************************/			

	    initializeItems: function() {
                
                var page = methods.addUnderscores(settings.page);
                
		$.ajax({
		    type: "GET",
		    url: settings.wikiURL + settings.apiPath + "/api.php?action=parse&format=json&prop=text&section="+settings.section+"&page="+settings.page+"&callback=?",
		    contentType: "application/json; charset=utf-8",
		    async: true,
		    dataType: "json",
		    success: function (data, textStatus, jqXHR) {

			try {
			    var markup = data.parse.text["*"];
			    var blurb = $('<div class="nbs-wikiblurb"></div>').html(markup);

			    // remove links?

			    if(settings.removeLinks) {
				blurb.find('a').each(function() { 
				    $(this).replaceWith($(this).html()); 
				});
			    }
			    else {
				blurb.find('a').each(function() {
				    var link = $(this);
				    var relativePath = link.attr('href').substring(1); // remove leading slash
				    link.attr('href', settings.wikiURL + relativePath); 
				});			    
			    }

			    // remove any references
			    blurb.find('sup').remove();

			    // remove cite error
			    blurb.find('.mw-ext-cite-error').remove();

				// filter elements
                            if(settings.filterSelector) { 
                                blurb.find(settings.filterSelector).remove(); 
                            }

			    switch(settings.type) {
				case 'text':				
				    object.html($(blurb).find('p'));
				    break;
				    
				case 'blurb':
				    object.html($(blurb).find('p:first'));
				    break;
				
				case 'infobox':
				    object.html($(blurb).find('.infobox'));
				    break;
				    
				case 'custom':
				    object.html($(blurb).find(settings.customSelector));
				    break;
				
				default:
				    object.html(blurb);
				    break;
			    }
                            
                            settings.callback();
				
			}
			catch(e){
			    methods.showError();
				settings.errorCallback(e,data)
			}
			
		    },
		    error: function (jqXHR, textStatus, errorThrown) {
			methods.showError();
				settings.errorCallback(errorThrown,jqXHR, textStatus)
		    }
		});
	    },
	    
	    showError: function(){
		object.html('<div class="nbs-wikiblurb-error">There was an error locating your wiki data</div>');
	    }

        };
        
        if (methods[options]) { // $("#element").pluginName('methodName', 'arg1', 'arg2');
            return methods[options].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof options === 'object' || !options) { 	// $("#element").pluginName({ option: 1, option:2 });
            return methods.init.apply(this);  
        } else {
            $.error( 'Method "' +  method + '" does not exist in wikiblurb plugin!');
        } 
    };

})(jQuery);
//use promise pattern only
//have all methods return a json object
//also have a simple check for keys within json =>   getCompanyInfo("Yahoo",['misc.stats','misc.info','stock.price'])

//TODO html5 cors + server side  vs jsonp vulnerabilities

//TODO throttle and stack api calls so they won't be called too often
//use qwest?
/*
var DataService=function(){
	
	registerSrc(name,options){
	
			//"wiki",{attrs:"",result:"'misc.stats,misc.info,"}
		//if ()
			return this
	}
	
	
	
}
AppDataService=new DataService("app").registerSrc("wiki",{required:"page",result:"misc.stats,misc.info",url:"http://fallout.wikia.com/"}) //templateurl?
AppDataService.getWiki({page:""})
*/
export
var AppDataService={
	getWiki:function(page){
		
		
	return new Promise(function(ok,fail){ 
		if (!page)fail("no page name")
		
		var container=$('<span>');
		
		container.wikiblurb({
			wikiURL:"http://en.wikipedia.org/w/", //"http://fallout.wikia.com/",
			apiPath: '',
			section: 0,
			page: page,
			removeLinks: false,	    
			type: 'text',
			customSelector: '',
			callback: function(){ 
			
			
			var content=container.text()
			
			ok({page,content})

			},errorCallback(e,response){
				
				//TODO error.warnings
				if(response.error.code)
				if (response.error.code=="missingtitle")
					fail(response.error)
				
				
				else 
				{
					
				fail(response.error)
				debugger
				}
				
			}    
		});
		
		})
		
	},
	
	getCompanyInfo:function(name){
		
	return new Promise(function(ok,fail){ 
		if (!name) fail("no company name")
			$.ajax({
				url: "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%3D%22"+encodeURI(name)+"%22&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=quote",
				dataType: "jsonp",
				jsonp: "callback",
				jsonpCallback: "quote"
			});

			quote = function(data) {
				
				//$(".price").text("$" + data.query.results.quote.AskRealtime);
			ok(data.query.results.quote)
			
			};
		
	  })	
		
	}
	
	/*,
	getCompanyNews:function(name){
		
		
	return new Promise(function(ok,fail){ 
		if (!name) fail("no company name")
			$.ajax({
				
						//																							 select%20*%20from%20xml%20where%20url%20%3D%20'https%3A%2F%2Fnews.ycombinator.com%2Frss'&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=mycallback
				url:"https://news.google.com/news?q="+name+"&output=rss" "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%3D%22"+name+"%22&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=quote",
				dataType: "jsonp",
				jsonp: "callback",
				jsonpCallback: "quote"
			});

			quote = function(data) {
				//$(".price").text("$" + data.query.results.quote.AskRealtime);
			ok(data.query.results.quote)
			
			};
		
	  })	
		
	}*/
	
}



