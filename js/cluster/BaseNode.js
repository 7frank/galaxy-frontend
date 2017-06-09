/**
 * Created by Frank on 02.06.2017.
 */


import EdgeUtil from "./EdgeUtil"

/**
 * simple node implementation for interaction and basic visualisation
 *
 */
export default class BaseNode extends THREE.Mesh {

    /**
     * there are 3 types of events handled for a node
     * (1) mouse events via THREEx.domEvents
     * (2) keyboard hotkeys that are bound to "keyup" via jQuery.hotkeys
     * (3) any other custom event
     * NOTE: customise in sub class as needed
     */


    getRegisteredCustomEvents()
    {
        return ['before-render']

    }

    isCustomEvent(eventName)
    {
        return this.getRegisteredCustomEvents().indexOf(eventName)>=0
    }

    isMouseEvent(eventName)
    {
        return  THREEx.DomEvents.eventNames.indexOf(eventName) >= 0
    }



    //------------------------------------------------
    onCustomEvent(eventName,eventhandler)
    {
        this.mCustomEvents.on(eventName,eventhandler)
    }

    offCustomEvent(eventName,eventhandler)
    {
        this.mCustomEvents.off(eventName,eventhandler)
    }


    triggerCustomEvent(eventName, origDomEvent, intersect)
    {
        this.mCustomEvents.trigger(eventName, origDomEvent, intersect)
    }
    //------------------------------------------------


    //FIXME we need a single window keyup listener that listens for keyevents and forwards/triggers
    // them on the current element similar to how the mouse events do
    onKey(eventName, eventhandler) {


        this.mKeyboardEvents.bind(eventName, eventhandler.bind(this),'keydown');

     /*   $(window).on("keyup", null, eventName, function (e) {
            if (this != BaseNode.lastHoveredNode) return
            e.stopPropagation();
            e.preventDefault();

            e.target=BaseNode.lastHoveredNode;

            eventhandler.bind(BaseNode.lastHoveredNode)(e)

        }.bind(this));
*/

    }
    //FIXME see issue of onKey
    offKey(eventName, eventhandler)
    {
        this.mKeyboardEvents.unbind(eventName, eventhandler);
       // $(window).off(eventName, eventhandler);

    }

    triggerKey(eventName, origDomEvent, intersect)
    {
        this.mKeyboardEvents.trigger(eventName,  origDomEvent, intersect);
       // $(window).trigger(eventName, origDomEvent, intersect);
    }

    /**
     * gets called on the node that the mouse is hovering over
     *
     */
    resolveKeyEvent(event){


        this.mKeyboardEvents.handleKeyEvent(event)

     }


    //------------------------------------------------
    on(eventName, eventhandler) {


        for (let eName of eventName.split(" ")) {

            if (this. isCustomEvent(eName))
                this.onCustomEvent(eName,eventhandler);
            else
            if (this.isMouseEvent(eName))
                BaseNode.domEvents.addEventListener(this, eName, eventhandler.bind(this), false);
            else
                this.onKey(eName, eventhandler)

        };

        return this;
    }

    off(eventName, eventhandler) {

        for (let eName of eventName.split(" "))


        for (let eName of eventName.split(" ")) {

            if (this. isCustomEvent(eName))
                this.offCustomEvent(eName,eventhandler);
            else
            if (this.isMouseEvent(eName))
                BaseNode.domEvents.removeEventListener(this, eName, eventhandler, false);
            else
                this.offKey(eName, eventhandler)

        };

        return this;




    }

    trigger(eventName, origDomEvent, intersect) {





        for (let eName of eventName.split(" ")) {



            if (this. isCustomEvent(eName))
                this.triggerCustomEvent(eName, origDomEvent, intersect);
            else
            if (this.isMouseEvent(eName))
                BaseNode.domEvents._notify(eName, this, origDomEvent, intersect);
            else
                triggerKey(eName,origDomEvent, intersect)

        };

        return this;


    }




    //---------------end of event definition part----------------------

    constructor(...args) {

        BaseNode.initStatic()

        var material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            // wireframe: true,
            visible: true,
            opacity: 0.01,
            side: THREE.BackSide,
            // opacity: env.useDebugSphere ? 1 : 0,
            transparent: true,
            alphaTest: 0.99 //if set to 1.0 it somehow gets converted to int which will result in the shader failing

        });


        super(BaseNode.sphereGeometry, material);


        this.addDefaultHandlers();

        //custom events container
        this.mCustomEvents=$({})
        //keyboard events container
        // TODO to be able to use event bubbling we'd need to append the html elements to the one of the parent cluster
        this.mKeyboardEvents= new Mousetrap(document.createElement("span"));


    }




    addDefaultHandlers() {

        //FIXME something is off with ordering an nesting .. preventing the correct node to be used
        //store the current cluster/node
        this.on("mouseover", function (e) {
            BaseNode.lastHoveredNode = e.target
           // e.stopPropagation()

        })
        this.on("mouseout", function (e) {
          //  BaseNode.lastHoveredNode =null;
          //  e.stopPropagation()

        })

        function onBeforeRender(){
            this.trigger("before-render")

        }

        Object.defineProperty(this, "onBeforeRender", {
            enumerable: false,
            configurable: false,
            get: function() { return onBeforeRender.bind(this); }.bind(this),
            set: function(newValue) {

                console.warn("onBeforeRender cannot be overridden use .on('before-render',function(){}) instead")


            }

        });





    }


    static initStatic() {
        if (BaseNode._static_initialised_) return

        //BaseNode.sphereGeometry = new THREE.SphereGeometry(1, 3, 2);
        BaseNode.sphereGeometry = new THREE.SphereGeometry(10, 10, 5);
        BaseNode.emptyGeometry = new THREE.Geometry();
        BaseNode.emptyGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3, 1);


        BaseNode.lastSelectedNode = null;

        BaseNode.lastHoveredNode = null;

        //FIXME set camera and domElement not via env attribute ...
        // BaseNode.domEvents = new THREEx.DomEvents(/*camera, renderer.domElement*/)
        BaseNode.domEvents = globalEnv.domEvents


        BaseNode._static_initialised_ = true



        //have one gloabal listener for all nodes and let them
        $(window).on("keydown", function (e) {
            if (!BaseNode.lastHoveredNode) return

            BaseNode.lastHoveredNode.resolveKeyEvent(e)

        });



    }

}