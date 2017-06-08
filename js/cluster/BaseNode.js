/**
 * Created by Frank on 02.06.2017.
 */


import EdgeUtil from "./EdgeUtil"

/**
 * simple node implementation for interaction and basic visualisation
 *
 */
export default class BaseNode extends THREE.Mesh {

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


    }


    onKey(eventName, eventhandler) {


        $(window).on("keyup", null, eventName, function (e) {
            if (this != BaseNode.lastHoveredNode) return
            e.stopPropagation();
            e.preventDefault();

            e.target=BaseNode.lastHoveredNode;

            eventhandler.bind(BaseNode.lastHoveredNode)(e)

        }.bind(this));


    }

    on(eventName, eventhandler) {


        for (let eName of eventName.split(" ")) {

            let isSpecialEvent = THREEx.DomEvents.eventNames.indexOf(eName) >= 0


            if (isSpecialEvent)
                BaseNode.domEvents.addEventListener(this, eName, eventhandler.bind(this), false);
            else
                this.onKey(eName, eventhandler)

        }
        ;


        return this;
    }

    off(eventName, eventhandler) {

        for (let eName of eventName.split(" "))
            BaseNode.domEvents.removeEventListener(this, eName, eventhandler, false);
        return this;
    }

    trigger(eventName, origDomEvent, intersect) {

        BaseNode.domEvents._notify(eventName, this, origDomEvent, intersect);
        return this;
    }


}