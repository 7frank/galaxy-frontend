/**
 *
 * manage color for cluster
 * have listeners so that listeners can handle changes
 *
 *
 */
import Color from 'easy-color';
//OptionsManager
// colors
//TODO currently not in use
export default
class DefaultColorScheme extends HTMLElement {


    static get observedAttributes() {return ['edge-color',"background-color"]; }

    // Respond to attribute changes.
    attributeChangedCallback(attr, oldValue, newValue) {


        var parser = new Color(newValue); // You can also add: # 0af, rgb (0, 170, 255), hsl (..., etc ...

        newValue=  parser.toRGBA();
        if (oldValue!=newValue)
        this.trigger(attr+"-changed",[newValue,oldValue ])
    }


    on(evntName,handler){
        $(this).on(evntName,handler.bind(this))
        return this
    }

    trigger(evntName,args){
        $(this).trigger(evntName,args)
        return this
    }


    //have some utils to convert colors
    //maybe generate materials also

   constructor(){
        super();


       $(this).on("edge-color-changed",function(){
           console.warn(arguments)


       })


       this.setAttribute("edge-color","#00AAFFFF")
       this.setAttribute("background-color","black")

   }

}

customElements.define("default-color-scheme",DefaultColorScheme)

