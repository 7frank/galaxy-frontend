
import template from "./company-info.html"

import "../searchable-option-list/SearchableOptionList"
import ApolloDS from "../../data/ApolloDS";
import _ from "lodash"

class CompanyInfo extends HTMLElement {

    constructor(...args) {
        super(...args);

   this.myds=new ApolloDS()
var that=this



        function generateNews(){

            that.myds.query(that.getNewsQuery(),function(response){


                //TODO add new news incrementally currently db replaces news again
                // response.data.news.forEach(n => that.addNews(n))
                that.addNews( response.data.news[0])



            })

        }
        generateNews()
        setInterval( generateNews,11000 )


    }

    connectedCallback(){

        $(this).append(template).
       addClass("rightCompanyInfo")

    }

    getNewsQuery(){

     //  var time= Date.now()
        var time= _.random(0,990000)


        return  `
        query News{
          news(latest:${time}){
            title
            content
            author
            
          }
        }
        `


    }

    addNews(obj){

      let container=  $(this).find("#djnews")


        let newsEntry=$("<div>")
        newsEntry.append("<b>"+obj.title+"</b>","<br>",obj.content,"<hr>")
        newsEntry.hide()
        container.prepend(newsEntry)
        newsEntry.slideDown(500)

    }

}


customElements.define("company-info", CompanyInfo);
