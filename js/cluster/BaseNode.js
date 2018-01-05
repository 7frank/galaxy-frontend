/**
 * Created by Frank on 02.06.2017.
 */


import AnimationMixin from "../utils/AnimationMixin"

import DomEventsAlt from "./utils/DomEventsAlt"

import * as THREE from "three";
import * as _ from "lodash";

import * as Mousetrap from "mousetrap";
import * as $ from "jquery"

/**
 * A simple graph-node that contains methods for user interaction and basic visualisation via threejs {@see THREE}.
 *
 *
 * Makes use of different types of events (mouse-, keyboard- and custom-events) to be used.
 * Where custom-events are need to be registered first by the class ebfore
 *
 * Registered custom events:
 *      "before-render" - is triggered before the node gets rendered within the threejs scenegraph
 *
 * Note: The current implementation has some limitations for multiple graphs of BaseBode instances to be rendered at the same time.
 *   For example: Parameters like "currentSelection" set by the method  BaseNode::initStatic() will be shared among simultaneously running instances.
 *
 * TODO change behaviour of {@see initStatic} and possibly refactor this part into the root node or a mixin
 *
 *
 */


export default class BaseNode extends THREE.Mesh {

    /**
     * The constructor needs an instance of a view. {@see View3D} It is rendered within the view container to be able to attach DOM events.
     *
     * @param view extends View3D
     */

    constructor(view) {


        BaseNode.initStatic()

        // this part might be redundant
        // it is supposed to add a material which enabled dom events testing for the invisible object
        //TODO find out if this could be removed in future versions

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


        //add animate method via mixin
        AnimationMixin(this)


    }

    /**
     * Tries to return the {@see View3D} element. There is one view that functions as container for a cluster and all its sub-clusters and nodes.
     *
     * @returns a View3D if attached to the view before, else null
     */
    getView() {
        //  var rootCluster=this.getRoot()
        // if (!rootCluster.mParentView) return null
        return this.mParentView
    }

    /**
     * Sets the view element
     * the view must be a View3D (extends HTMLElement)
     *
     */
    setView(view3d) {
        // var rootCluster=this.getRoot()

        this.mParentView = view3d;
        return this
    }



    /**
     * sets some basic parameters for a graph of base nodes
     *
     */


    static initStatic() {
        if (BaseNode._static_initialised_) return

        //BaseNode.sphereGeometry = new THREE.SphereGeometry(1, 3, 2);
        BaseNode.sphereGeometry = new THREE.SphereGeometry(10, 10, 5);
        BaseNode.emptyGeometry = new THREE.Geometry();
        BaseNode.emptyGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3, 1);


        BaseNode.lastSelectedNode = null;

        BaseNode.lastHoveredNode = null;

        BaseNode._static_initialised_ = true


        //this part is by far not optimal..
        //currently this lets us have one global listener for all instances of BaseNode that handles keyboard shortcuts for the whole graph
        $(window).on("keydown", function (e) {
            if (!BaseNode.lastHoveredNode) return

            BaseNode.lastHoveredNode.resolveKeyEvent(e)

        });


    }

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


    /**
     * this method is primarily for inheritance purposes.
     * this way a custom event can be named, which can be used via BaseNode::on() to listen to custom events
     * if a listener is bound to/triggered for an non-existing event a notification is sent. this should simplify debugging event errors that occur by misspelling
     *
     *
     * @param eventName th name of the event stub generated
     */

    registerCustomEvent(eventName) {

        if (!this.mCustomEventNames) this.mCustomEventNames = [];

        this.mCustomEventNames.push(eventName);

    }

    /**
     * checks if a event is a registered custom event
     * */

    isCustomEvent(eventName) {
        return this.getRegisteredCustomEvents().indexOf(eventName) >= 0
    }

    /**
     * checks if an event is a mouse event that the THREEx.DomEvents library can handle
     *
     *
     **/


    isMouseEvent(eventName) {
        return DomEventsAlt.eventNames.indexOf(eventName) >= 0
    }

    //------------------------------------------------

    /**
     * allows to bind custom event listeners to node
     *
     * TODO we could need a single window key-up listener that listens for key events and forwards/triggers
     * them on the current element similar to how the mouse events do
     * the current implementation handles this by having only one key-up event bound in BaseNode::initStatic()
     **/


    onCustomEvent(eventName, eventhandler) {
        this.mCustomEvents.on(eventName, eventhandler.bind(this))
    }

    //------------------------------------------------

    /**
     * allows to unbind custom event listeners from node
     **/

    offCustomEvent(eventName, eventhandler) {
        this.mCustomEvents.off(eventName, eventhandler)
    }

    /**
     * allows to trigger custom events
     **/

    triggerCustomEvent(eventName, origDomEvent, intersect) {
        this.mCustomEvents.trigger(eventName, origDomEvent, intersect)
    }

    /**
     * allows to bind keyboard event listeners to node
     *
     * this implementation supports all key combinations supported by the Mousetrap library
     *
     * Note: the current implementation only triggers keypresses every 100 ms
     */

    onKey(eventName, eventhandler) {
        let handler = _.throttle(eventhandler.bind(this), 100)

        this.mKeyboardEvents.bind(eventName, handler, 'keydown');

    }


    /**
     * allows to unbind keyboard event listeners from node
     **/

    offKey(eventName, eventhandler) {
        this.mKeyboardEvents.unbind(eventName, eventhandler);
        // $(window).off(eventName, eventhandler);

    }

    /**
     * allows to trigger keyboard events
     **/

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

    /**
     * allows to bind event listeners to node
     * forwards binding for keyboard-, mouse-, and custom events to respective methods
     */


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


    /**
     *  allows to unbind event listeners from node
     **/

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


        return this;


    }

    /**
     * allows to trigger keyboard-, mouse-, and custom events for node
     **/

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




    addDefaultHandlers() {


        //store the current cluster/node
        //TODO mouseover seems not to work correct  if a childcluster was hovered before

        this.on("mouseover", function (e) {
            e.stopPropagation()
            BaseNode.lastHoveredNode = e.target

        })

        this.on("mouseout", function (e) {
            //reset hover state to work if child element was selected
            BaseNode.lastHoveredNode = null;
            e.stopPropagation()

        })


        // the default implementation allows only for one handler to be bound
        // instead we change the implementation to support multiple handlers in a standard event -like manner
        function onBeforeRender() {
            this.trigger("before-render", null, arguments)

        }
        //freezes THREE.Mesh::onBeforeRender method so it can't be overridden
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

        // adding a default 'before-render' event handler that calls the update method of a node
        this.on("before-render", function () {
            this.update()
        })


    }

    /**
     * update - stub: override in inheriting class
     * NOTE:don't call update for any cluster directly,it will be called via before-render automatically
     *
     */
    update() {
    }



    /**
     * stub
     *
     * the inheriting class must implement this method which must return the containing dom element in which the graph and its individual nodes are rendered
     * this is necessary to allow for multiple views to be rendered at the same time
     */

    getDOMElement() {

        throw new Error("implement method 'getDOMElement' in sub class (return valid domElement) ")
    }


    /**
     * stub
     *
     * the inheriting class must return an instance of Threex.DomEvents or other compatible classes for mouse and keyboard events to be working
     *
     */
    getDOMEvents() {

        throw new Error("implement method 'getDOMEvents' in sub class (return valid THREEx.domEvents) ")

    }

}