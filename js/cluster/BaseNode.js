/**
 * Created by Frank on 02.06.2017.
 */


import NodeUtil from "./NodeUtil"

/**
 * simple node implementation for interaction and basic visualisation
 *
 */
export default class BaseNode extends THREE.Mesh {

    constructor(...args) {

        BaseNode.initStatic()

        var material = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            wireframe: true,
            visible: true,
            opacity: 1,
            // opacity: env.useDebugSphere ? 1 : 0,
            transparent: true,
            alphaTest: 0.99 //if set to 1.0 it somehow gets converted to int which will result in the shader failing

        });

        super(BaseNode.sphereGeometry, material);

      //  this.addDefaultListeners();


    }


    addDefaultListeners() {

        this.on("click", () =>
            NodeUtil.zoomToNode(this, function complete() {
            })
        );
    }


    static initStatic() {
        if (BaseNode._static_initialised_) return

        BaseNode.sphereGeometry = new THREE.SphereGeometry(1, 3, 2);
        BaseNode.emptyGeometry = new THREE.Geometry();
        BaseNode.emptyGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3, 1);


        BaseNode.lastSelectedNode = null;

        //FIXME set camera and domElement not via env attribute ...
        // BaseNode.domEvents = new THREEx.DomEvents(/*camera, renderer.domElement*/)
        BaseNode.domEvents = globalEnv.domEvents


        BaseNode._static_initialised_ = true


    }

    on(eventName, eventhandler) {
        BaseNode.domEvents.addEventListener(this, eventName, eventhandler, false);
        return this;
    }

    off(eventName, eventhandler) {
        BaseNode.domEvents.removeEventListener(this, eventName, eventhandler, false);
        return this;
    }

    trigger(eventName, origDomEvent, intersect) {

        BaseNode.domEvents._notify(eventName, this, origDomEvent, intersect);
        return this;
    }


}