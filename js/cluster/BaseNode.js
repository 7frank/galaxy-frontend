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


    getRegisteredCustomEvents() {
        return this.mCustomEventNames

    }

    registerCustomEvent(eventName) {

        if (!this.mCustomEventNames) this.mCustomEventNames = [];

        this.mCustomEventNames.push(eventName);

    }


    isCustomEvent(eventName) {
        return this.getRegisteredCustomEvents().indexOf(eventName) >= 0
    }

    isMouseEvent(eventName) {
        return THREEx.DomEvents.eventNames.indexOf(eventName) >= 0
    }


    //------------------------------------------------
    onCustomEvent(eventName, eventhandler) {
        this.mCustomEvents.on(eventName, eventhandler.bind(this))
    }

    offCustomEvent(eventName, eventhandler) {
        this.mCustomEvents.off(eventName, eventhandler)
    }


    triggerCustomEvent(eventName, origDomEvent, intersect) {
        this.mCustomEvents.trigger(eventName, origDomEvent, intersect)
    }

    //------------------------------------------------


    // we need a single window keyup listener that listens for keyevents and forwards/triggers
    // them on the current element similar to how the mouse events do
    //Note: the current implementation only triggers keypresses every 300 ms
    onKey(eventName, eventhandler) {
        let handler = _.throttle(eventhandler.bind(this), 300)

        this.mKeyboardEvents.bind(eventName, handler, 'keydown');

    }

    //TODO wont work with debounced handler
    offKey(eventName, eventhandler) {
        this.mKeyboardEvents.unbind(eventName, eventhandler);
        // $(window).off(eventName, eventhandler);

    }

    triggerKey(eventName, origDomEvent, intersect) {
        this.mKeyboardEvents.trigger(eventName, origDomEvent, intersect);
        // $(window).trigger(eventName, origDomEvent, intersect);
    }

    /**
     * gets called on the node that the mouse is hovering over
     *
     */
    resolveKeyEvent(event) {


        this.mKeyboardEvents.handleKeyEvent(event)

    }


    //------------------------------------------------
    on(eventName, eventhandler) {


        for (let eName of eventName.split(" ")) {

            if (this.isCustomEvent(eName))
                this.onCustomEvent(eName, eventhandler);
            else if (this.isMouseEvent(eName))
                this.getDOMEvents().addEventListener(this, eName, eventhandler.bind(this), false);
            else
                this.onKey(eName, eventhandler)

        }
        ;

        return this;
    }

    off(eventName, eventhandler) {

        for (let eName of eventName.split(" "))


            for (let eName of eventName.split(" ")) {

                if (this.isCustomEvent(eName))
                    this.offCustomEvent(eName, eventhandler);
                else if (this.isMouseEvent(eName))
                    this.getDOMEvents().removeEventListener(this, eName, eventhandler, false);
                else
                    this.offKey(eName, eventhandler)

            }
        ;

        return this;


    }

    trigger(eventName, origDomEvent, intersect) {


        for (let eName of eventName.split(" ")) {


            if (this.isCustomEvent(eName))
                this.triggerCustomEvent(eName, origDomEvent, intersect);
            else if (this.isMouseEvent(eName))
                this.getDOMEvents()._notify(eName, this, origDomEvent, intersect);
            else
                this.triggerKey(eName, origDomEvent, intersect)

        }
        ;

        return this;


    }


    //---------------end of event definition part----------------------

    constructor(view) {


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

        this.registerCustomEvent('before-render')


        // var axisHelper = new THREE.AxisHelper( 50 );
        // this.add( axisHelper );


        if (view instanceof HTMLElement)
            this.setView(view)


        this.mCustomEvents = $({})


        this.addDefaultHandlers();

        //custom events container

        //keyboard events container
        // TODO to be able to use event bubbling we'd need to append the html elements to the one of the parent cluster
        this.mKeyboardEvents = new Mousetrap(document.createElement("span"));


    }


    addDefaultHandlers() {

        //FIXME something is off with ordering an nesting .. preventing the correct node to be used
        //store the current cluster/node
        this.on("mouseover", function (e) {
            e.stopPropagation()
            BaseNode.lastHoveredNode = e.target
            // e.stopPropagation()

        })
        this.on("mouseout", function (e) {
            //  BaseNode.lastHoveredNode =null;
            //  e.stopPropagation()

        })


        // adding before-render event

        function onBeforeRender() {
            this.trigger("before-render")

        }

        Object.defineProperty(this, "onBeforeRender", {
            enumerable: false,
            configurable: false,
            get: function () {
                return onBeforeRender.bind(this);
            }.bind(this),
            set: function (newValue) {

                console.warn("onBeforeRender cannot be overridden use .on('before-render',function(){}) instead")


            }

        });
        //------------------

        // adding before-render event default handler
        this.on("before-render", function () {

            //the update is currently called from the view3D for the root element
            //and all child elements..
            // TODO check what impact this has on the workflow
            this.update()

        })


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
        // BaseNode.domEvents = globalEnv.domEvents


        BaseNode._static_initialised_ = true


        //have one gloabal listener for all nodes and let them
        $(window).on("keydown", function (e) {
            if (!BaseNode.lastHoveredNode) return

            BaseNode.lastHoveredNode.resolveKeyEvent(e)

        });


    }


    /**
     * update stub, override in descending class
     * NOTE:don't call update for any cluster directly,it will be called via before-render
     *
     */
    update() {
    }


    /**
     * stub
     *
     *
     */
    getDOMElement() {


        throw new Error("implement method 'getDOMElement' in sub class (return valid domElement) ")

    }


    /**
     * stub
     *
     *
     */
    getDOMEvents() {


        throw new Error("implement method 'getDOMEvents' in sub class (return valid THREEx.domEvents) ")

    }

}