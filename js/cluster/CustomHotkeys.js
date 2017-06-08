/**
 * Created by Frank on 08.06.2017.
 */


/**
 * this is a custom implementation to define actions instead of events
 * the action does have a default event attached which triggers the action
 * but the event can be changed on the fly for user customisation
 *
 */

export default
class CustomHotkeys
{
    constructor(){
        this.mActions={}


    }

    //TODO implement and make use of it
    registerAction(actionName,eventFunction,defaultEvent=null){

        if (typeof this.mActions[actionName]=="undefined")  this.mActions[actionName]={}


    }



}