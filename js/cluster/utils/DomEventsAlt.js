// This THREEx helper makes it easy to handle the mouse events in your 3D scene
//
// * CHANGES NEEDED
//   * handle drag/drop
//   * notify events not object3D - like DOM
//     * so single object with property
//   * DONE bubling implement bubling/capturing
//   * DONE implement event.stopPropagation()
//   * DONE implement event.type = "click" and co
//   * DONE implement event.target
//
// # Lets get started
//
// First you include it in your page
//
// ```<script src='domevent.js'>< /script>```
//
// # use the object oriented api
//
// You bind an event like this
// 
// ```mesh.on('click', function(object3d){ ... })```
//
// To unbind an event, just do
//
// ```mesh.off('click', function(object3d){ ... })```
//
// As an alternative, there is another naming closer DOM events.
// Pick the one you like, they are doing the same thing
//
// ```mesh.addEventListener('click', function(object3d){ ... })```
// ```mesh.removeEventListener('click', function(object3d){ ... })```
//
// # Supported Events
//
// Always in a effort to stay close to usual pratices, the events name are the same as in DOM.
// The semantic is the same too.
// Currently, the available events are
// [click, dblclick, mouseup, mousedown](http://www.quirksmode.org/dom/events/click.html),
// [mouseover and mouse out](http://www.quirksmode.org/dom/events/mouseover.html).
//
// # use the standalone api
//
// The object-oriented api modifies THREE.Object3D class.
// It is a global class, so it may be legitimatly considered unclean by some people.
// If this bother you, simply do ```DomEvents.noConflict()``` and use the
// standalone API. In fact, the object oriented API is just a thin wrapper
// on top of the standalone API.
//
// First, you instanciate the object
//
// ```var domEvent = new DomEvent();```
// 
// Then you bind an event like this
//
// ```domEvent.bind(mesh, 'click', function(object3d){ object3d.scale.x *= 2; });```
//
// To unbind an event, just do
//
// ```domEvent.unbind(mesh, 'click', callback);```
//
// 
// # Code

//

/** @namespace */
//var THREEx		= THREEx 		|| {};


/**
 * Note: DomEventsAlt is a partial rewrite of THREEx.DomEvents for nested graph-like structures.
 * It prioritises 'distanceToRay' and depth of element within scene graph to find best matching elements for user interaction.
 * Also it speeds up comparisons for meshes by using the 'scene' parameter to be able to use
 * a raycast call (for relevant meshes) as well as bubbling up the rendered scene graph (from leaf to root)
 * for objects that do have the events context. ( a mesh that has events bound to it via DomEvents or DomEventsAlt does have a '_3xDomEvent' property)
 */

import * as THREE from "three";
import * as _ from "lodash";

import { CombinedCamera } from "../../lib/CombinedCamera";


// # Constructor
export default function DomEventsAlt(camera, domElement, scene) {
    this._camera = camera || null;
    this._domElement = domElement || document;
    this._raycaster = new THREE.Raycaster();


    this._selected = null;
    this._boundObjs = {};

    this.scene = scene

    // Bind dom event for mouse and touch
    var _this = this;

    this._$onClick = function () {
        _this._onClick.apply(_this, arguments);
    };
    this._$onDblClick = function () {
        _this._onDblClick.apply(_this, arguments);
    };
    this._$onMouseMove = function () {
        _this._onMouseMove.apply(_this, arguments);
    };
    this._$onMouseDown = function () {
        _this._onMouseDown.apply(_this, arguments);
    };
    this._$onMouseUp = function () {
        _this._onMouseUp.apply(_this, arguments);
    };
    this._$onTouchMove = function () {
        _this._onTouchMove.apply(_this, arguments);
    };
    this._$onTouchStart = function () {
        _this._onTouchStart.apply(_this, arguments);
    };
    this._$onTouchEnd = function () {
        _this._onTouchEnd.apply(_this, arguments);
    };
    this._$onContextmenu = function () {
        _this._onContextmenu.apply(_this, arguments);
    };
    this._domElement.addEventListener('click', this._$onClick, false);
    this._domElement.addEventListener('dblclick', this._$onDblClick, false);
    this._domElement.addEventListener('mousemove', this._$onMouseMove, false);
    this._domElement.addEventListener('mousedown', this._$onMouseDown, false);
    this._domElement.addEventListener('mouseup', this._$onMouseUp, false);
    this._domElement.addEventListener('touchmove', this._$onTouchMove, false);
    this._domElement.addEventListener('touchstart', this._$onTouchStart, false);
    this._domElement.addEventListener('touchend', this._$onTouchEnd, false);
    this._domElement.addEventListener('contextmenu', this._$onContextmenu, false);

}

// # Destructor
DomEventsAlt.prototype.destroy = function () {
    // unBind dom event for mouse and touch
    this._domElement.removeEventListener('click', this._$onClick, false);
    this._domElement.removeEventListener('dblclick', this._$onDblClick, false);
    this._domElement.removeEventListener('mousemove', this._$onMouseMove, false);
    this._domElement.removeEventListener('mousedown', this._$onMouseDown, false);
    this._domElement.removeEventListener('mouseup', this._$onMouseUp, false);
    this._domElement.removeEventListener('touchmove', this._$onTouchMove, false);
    this._domElement.removeEventListener('touchstart', this._$onTouchStart, false);
    this._domElement.removeEventListener('touchend', this._$onTouchEnd, false);
    this._domElement.removeEventListener('contextmenu', this._$onContextmenu, false);
}

DomEventsAlt.eventNames = [
    "click",
    "dblclick",
    "mouseover",
    "mouseout",
    "mousemove",
    "mousedown",
    "mouseup",
    "contextmenu",
    "touchstart",
    "touchend"
];

DomEventsAlt.prototype._getRelativeMouseXY = function (domEvent) {
    var element = domEvent.target || domEvent.srcElement;
    if (element.nodeType === 3) {
        element = element.parentNode; // Safari fix -- see http://www.quirksmode.org/js/events_properties.html
    }

    //get the real position of an element relative to the page starting point (0, 0)
    //credits go to brainjam on answering http://stackoverflow.com/questions/5755312/getting-mouse-position-relative-to-content-area-of-an-element
    var elPosition = {x: 0, y: 0};
    var tmpElement = element;
    //store padding
    var style = getComputedStyle(tmpElement, null);
    elPosition.y += parseInt(style.getPropertyValue("padding-top"), 10);
    elPosition.x += parseInt(style.getPropertyValue("padding-left"), 10);
    //add positions
    do {
        elPosition.x += tmpElement.offsetLeft;
        elPosition.y += tmpElement.offsetTop;
        style = getComputedStyle(tmpElement, null);

        elPosition.x += parseInt(style.getPropertyValue("border-left-width"), 10);
        elPosition.y += parseInt(style.getPropertyValue("border-top-width"), 10);
    } while (tmpElement = tmpElement.offsetParent);

    var elDimension = {
        width: (element === window) ? window.innerWidth : element.offsetWidth,
        height: (element === window) ? window.innerHeight : element.offsetHeight
    };

    return {
        x: +((domEvent.pageX - elPosition.x) / elDimension.width ) * 2 - 1,
        y: -((domEvent.pageY - elPosition.y) / elDimension.height) * 2 + 1
    };
};


/********************************************************************************/
/*		domevent context						*/
/********************************************************************************/

// handle domevent context in object3d instance

DomEventsAlt.prototype._objectCtxInit = function (object3d) {
    object3d._3xDomEvent = {};
}
DomEventsAlt.prototype._objectCtxDeinit = function (object3d) {
    delete object3d._3xDomEvent;
}
DomEventsAlt.prototype._objectCtxIsInit = function (object3d) {
    return object3d._3xDomEvent ? true : false;
}
DomEventsAlt.prototype._objectCtxGet = function (object3d) {
    return object3d._3xDomEvent;
}

/********************************************************************************/
/*										*/
/********************************************************************************/

/**
 * Getter/Setter for camera
 */
DomEventsAlt.prototype.camera = function (value) {
    if (value) this._camera = value;
    return this._camera;
}

DomEventsAlt.prototype.bind = function (object3d, eventName, callback, useCapture) {
    console.assert(DomEventsAlt.eventNames.indexOf(eventName) !== -1, "not available events:" + eventName);

    if (!this._objectCtxIsInit(object3d)) this._objectCtxInit(object3d);
    var objectCtx = this._objectCtxGet(object3d);
    if (!objectCtx[eventName + 'Handlers']) objectCtx[eventName + 'Handlers'] = [];

    objectCtx[eventName + 'Handlers'].push({
        callback: callback,
        useCapture: useCapture
    });

    // add this object in this._boundObjs
    if (this._boundObjs[eventName] === undefined) {
        this._boundObjs[eventName] = [];
    }
    this._boundObjs[eventName].push(object3d);
}
DomEventsAlt.prototype.addEventListener = DomEventsAlt.prototype.bind

DomEventsAlt.prototype.unbind = function (object3d, eventName, callback, useCapture) {
    console.assert(DomEventsAlt.eventNames.indexOf(eventName) !== -1, "not available events:" + eventName);

    if (!this._objectCtxIsInit(object3d)) this._objectCtxInit(object3d);

    var objectCtx = this._objectCtxGet(object3d);
    if (!objectCtx[eventName + 'Handlers']) objectCtx[eventName + 'Handlers'] = [];

    var handlers = objectCtx[eventName + 'Handlers'];
    for (var i = 0; i < handlers.length; i++) {
        var handler = handlers[i];
        if (callback != handler.callback) continue;
        if (useCapture != handler.useCapture) continue;
        handlers.splice(i, 1)
        break;
    }
    // from this object from this._boundObjs
    var index = this._boundObjs[eventName].indexOf(object3d);
    console.assert(index !== -1);
    this._boundObjs[eventName].splice(index, 1);
}
DomEventsAlt.prototype.removeEventListener = DomEventsAlt.prototype.unbind

DomEventsAlt.prototype._bound = function (eventName, object3d) {
    var objectCtx = this._objectCtxGet(object3d);
    if (!objectCtx) return false;
    return objectCtx[eventName + 'Handlers'] ? true : false;
}

/********************************************************************************/
/*		onMove								*/
/********************************************************************************/

// # handle mousemove kind of events

DomEventsAlt.prototype._onMove = function (eventName, mouseX, mouseY, origDomEvent) {
//console.log('eventName', eventName, 'boundObjs', this._boundObjs[eventName])
    // get objects bound to this event
    // var boundObjs	= this._boundObjs[eventName];
    // if( boundObjs === undefined || boundObjs.length === 0 )	return;
    // compute the intersection
    var vector = new THREE.Vector2();

    // update the picking ray with the camera and mouse position
    vector.set(mouseX, mouseY);

    let mCamera;

    if (this._camera instanceof CombinedCamera) {

        if (this._camera.inPerspectiveMode) mCamera = this._camera.cameraP;
        if (this._camera.inOrthographicMode) mCamera = this._camera.cameraO;

    }
    else
        mCamera = this._camera;

    this._raycaster.setFromCamera(vector, mCamera);

    //@frank4711 altering intersection from flat array will improve mouse move performance for many elements bound
    var intersects = this._raycaster.intersectObjects(this.scene.children, true);
    // intersects=  intersects.filter( i => this._objectCtxIsInit(i.object) );
    intersects = this.getRelevantIntersections(intersects)
    //var intersects = this._raycaster.intersectObjects( boundObjs );

    var oldSelected = this._selected;

    if (intersects.length > 0) {

        var notifyOver, notifyOut, notifyMove;
        var intersect = intersects[0];
        var newSelected = intersect.object;
        this._selected = newSelected;
        // if newSelected bound mousemove, notify it
        notifyMove = this._bound('mousemove', newSelected);

        if (oldSelected != newSelected) {
            // if newSelected bound mouseenter, notify it
            notifyOver = this._bound('mouseover', newSelected);
            // if there is a oldSelect and oldSelected bound mouseleave, notify it
            notifyOut = oldSelected && this._bound('mouseout', oldSelected);
        }
    } else {
        // if there is a oldSelect and oldSelected bound mouseleave, notify it
        notifyOut = oldSelected && this._bound('mouseout', oldSelected);
        this._selected = null;
    }


    // notify mouseMove - done at the end with a copy of the list to allow callback to remove handlers
    notifyMove && this._notify('mousemove', newSelected, origDomEvent, intersect);
    // notify mouseEnter - done at the end with a copy of the list to allow callback to remove handlers
    notifyOver && this._notify('mouseover', newSelected, origDomEvent, intersect);
    // notify mouseLeave - done at the end with a copy of the list to allow callback to remove handlers
    notifyOut && this._notify('mouseout', oldSelected, origDomEvent, intersect);
}


/**
 *  The threejs raycaster will return a set of intersections.
 *  Those are used to determines the relevant intersecting objects - that have mouse events bound to them - by using a recursive approach.
 *
 * @param intersects ... a set of {@link THREE.Object3D} that where generated by raycasting part of a scene graph.
 *
 *  @author frank1147
 */

DomEventsAlt.prototype.getRelevantIntersections = function getRelevantIntersections(intersects) {


    if (intersects.length === 0) return intersects;

    var relevant = [];
    var that = this;
    intersects.forEach(function (i) {


        if (that._objectCtxIsInit(i.object)) relevant.push(i)
        else {
            var el = i.object
            while (el = el.parent) {
                //NOTE: using this recursive approach will return parent element of a intersected element that has the context
                //this can result in a difference between the clicked point of a child element and the assumed point of the bound geometry of the parent element
                if (that._objectCtxIsInit(el)) {
                    i.object = el
                    relevant.push(i);
                    break;//we found the parent element that has the given context, so we can break the loop
                }
            }


        }

    });


    if (relevant.length == 0) return relevant

    return this.sortByDepth(relevant);

}


/**
 *
 * We want to sort elements by ascending (ASC) <b>distance</b> first (as done by DOMEvents) and descending (DESC) <b>depth</b> next.
 * This way elements that are closer to the camera and deeper within the scene graph are more relevant for mouse interaction.
 *
 * @param intersects ... a set of {@link THREE.Object3D}
 *
 * @author frank1147
 */

DomEventsAlt.prototype.sortByDepth = function (intersects) {


    //calculate depth in scene
    intersects.forEach(function (i) {

        var el = i.object
        var depth = 0;

        //TODO check alternatives
        //our ClusterLeafElements do get a depth property attached bythe raycaster

        if (i.depth)
            return i.depth

        while (el = el.parent) {
            depth++;
        }
        i.depth = depth;

    });

    //we want to sort elements by ASC distance first like originally
    // and DESC depth
    //so elements that are closer and deeper within the scene are more relevant

    intersects = _.sortBy(intersects, [(o) => -o.depth, o => o.distanceToRay]);  //,o => o.distance


    return intersects
}

/********************************************************************************/
/*		onEvent								*/
/********************************************************************************/

// # handle click kind of events

DomEventsAlt.prototype._onEvent = function (eventName, mouseX, mouseY, origDomEvent) {
    //console.log('eventName', eventName, 'boundObjs', this._boundObjs[eventName])
    // get objects bound to this event


    var boundObjs = this._boundObjs[eventName];
    if (boundObjs === undefined || boundObjs.length === 0) return;
    // compute the intersection
    var vector = new THREE.Vector2();

    // update the picking ray with the camera and mouse position
    vector.set(mouseX, mouseY);


    let mCamera;

    if (this._camera instanceof CombinedCamera) {

        if (this._camera.inPerspectiveMode) mCamera = this._camera.cameraP;
        if (this._camera.inOrthographicMode) mCamera = this._camera.cameraO;

    }
    else
        mCamera = this._camera

    this._raycaster.setFromCamera(vector, mCamera);

    //var intersects = this._raycaster.intersectObjects( boundObjs, true);

    //@frank4711 altering intersection from flat array will improve mouse move performance for many elements bound
    var intersects = this._raycaster.intersectObjects(this.scene.children, true);
    // intersects=  intersects.filter( i => this._objectCtxIsInit(i.object) );
    intersects = this.getRelevantIntersections(intersects)
    // if there are no intersections, return now
    if (intersects.length === 0) return;

    // init some variables
    var intersect = intersects[0];
    var object3d = intersect.object;


    // notify handlers
    this._notify(eventName, object3d, origDomEvent, intersect);
}

DomEventsAlt.prototype._notify = function (eventName, object3d, origDomEvent, intersect) {
    var objectCtx = this._objectCtxGet(object3d);
    var handlers = objectCtx ? objectCtx[eventName + 'Handlers'] : null;

    // parameter check
    console.assert(arguments.length === 4)

    // do bubbling
    if (!objectCtx || !handlers || handlers.length === 0) {
        object3d.parent && this._notify(eventName, object3d.parent, origDomEvent, intersect);
        return;
    }

    // notify all handlers
    var handlers = objectCtx[eventName + 'Handlers'];
    for (var i = 0; i < handlers.length; i++) {
        var handler = handlers[i];
        var toPropagate = true;
        handler.callback({
            type: eventName,
            target: object3d,
            origDomEvent: origDomEvent,
            intersect: intersect,
            stopPropagation: function () {
                toPropagate = false;
            }
        });
        if (!toPropagate) continue;
        // do bubbling
        if (handler.useCapture === false) {
            object3d.parent && this._notify(eventName, object3d.parent, origDomEvent, intersect);
        }
    }
}

/********************************************************************************/
/*		handle mouse events						*/
/********************************************************************************/
// # handle mouse events

DomEventsAlt.prototype._onMouseDown = function (event) {
    return this._onMouseEvent('mousedown', event);
}
DomEventsAlt.prototype._onMouseUp = function (event) {
    return this._onMouseEvent('mouseup', event);
}


DomEventsAlt.prototype._onMouseEvent = function (eventName, domEvent) {
    var mouseCoords = this._getRelativeMouseXY(domEvent);
    this._onEvent(eventName, mouseCoords.x, mouseCoords.y, domEvent);
}

DomEventsAlt.prototype._onClick = function (event) {
    // TODO handle touch ?
    this._onMouseEvent('click', event);
}
DomEventsAlt.prototype._onDblClick = function (event) {
    // TODO handle touch ?
    this._onMouseEvent('dblclick', event);
}

DomEventsAlt.prototype._onContextmenu = function (event) {
    //TODO don't have a clue about how this should work with touch..
    this._onMouseEvent('contextmenu', event);
}

/********************************************************************************/
/*		handle touch events						*/
/********************************************************************************/
// # handle touch events


DomEventsAlt.prototype._onTouchStart = function (event) {
    return this._onTouchEvent('touchstart', event);
}
DomEventsAlt.prototype._onTouchEnd = function (event) {
    return this._onTouchEvent('touchend', event);
}

DomEventsAlt.prototype._onTouchMove = function (domEvent) {
    if (domEvent.touches.length != 1) return undefined;

    domEvent.preventDefault();

    var mouseX = +(domEvent.touches[0].pageX / window.innerWidth ) * 2 - 1;
    var mouseY = -(domEvent.touches[0].pageY / window.innerHeight) * 2 + 1;
    this._onMove('mousemove', mouseX, mouseY, domEvent);
    //  this._onMove('mouseover', mouseX, mouseY, domEvent);
    //  this._onMove('mouseout' , mouseX, mouseY, domEvent);
}

DomEventsAlt.prototype._onTouchEvent = function (eventName, domEvent) {
    if (domEvent.touches.length != 1) return undefined;

    domEvent.preventDefault();

    var mouseX = +(domEvent.touches[0].pageX / window.innerWidth ) * 2 - 1;
    var mouseY = -(domEvent.touches[0].pageY / window.innerHeight) * 2 + 1;
    this._onEvent(eventName, mouseX, mouseY, domEvent);
}


/*
DomEventsAlt.prototype._onMouseMove	= function(domEvent)
{
    var mouseCoords = this._getRelativeMouseXY(domEvent);
    this._onMove('mousemove', mouseCoords.x, mouseCoords.y, domEvent);
   // this._onMove('mouseover', mouseCoords.x, mouseCoords.y, domEvent);
   // this._onMove('mouseout' , mouseCoords.x, mouseCoords.y, domEvent);
}*/



/**
 *
 * Altered the original THREEx.DomeEvents._onMouseMove.
 * Added throttling move events to improve overall performance (no need to trigger the raycaster each animation frame).
 *
 * @author frank1147
 */
DomEventsAlt.prototype._onMouseMove = _.throttle(function (domEvent) {
    var mouseCoords = this._getRelativeMouseXY(domEvent);
    this._onMove('mousemove', mouseCoords.x, mouseCoords.y, domEvent);
}, 40);  //25 (f)ps
