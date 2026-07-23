/**
 * Created by Frank on 16.07.2017.
 */


/**
 * we want to init an arbitrary Object3D and add specific visual effects by adding removing classes like we would be able in 2d on a HTMLElement
 *
 *
 */

import { Object3D } from "three/src/core/Object3D.js";

export default class Base3DElement extends Object3D {


    constructor(domEvents, env) {
        super();

        var obj = this;

        this._instances = {};

        this.mEnv = env || {};
        this.mDomEvents = domEvents;

        return self
    }


    getClassInstance(className) {
        return this._instances[className];
    }

    on(eventName, eventhandler) {
        this.mDomEvents.addEventListener(this, eventName, eventhandler, false)
    }

    off(eventName, eventhandler) {
        this.mDomEvents.removeEventListener(this, eventName, eventhandler, false)
    }

    trigger(eventName, intersect, node) {


        this.mDomEvents._notify(eventName, this, node, intersect);


    }

    getParentCluster()  //NOTE: more of getParentClusterLeaf
    {

        if (!this.parent) return null;

        return el.parent.parent
    }

    addClass(className) {

        for (className of className.split(" ")) {

            if (this.hasClass(className)) continue;

            var mMesh;

            if (this._instances[className])
                mMesh = this._instances[className];
            else
                mMesh = this._instances[className] = _newClassViaFactory(className, env, obj);


            this.add(mMesh);
            mMesh.onAdd()


        }
        return this
    }

    removeClass(className) {
        for (className of className.split(" ")) {
            var mMesh;
            if (this._instances[className]) {

                mMesh = this._instances[className];

                mMesh.onRemove(() => this.remove(mMesh))

            }

        }
        return this
    }

    hasClass(className) {
        var mMesh;
        if (this._instances[className])
            mMesh = this._instances[className];

        return (this.children.indexOf(mMesh) >= 0)

    }

    toggleClass(className) {

        for (className of className.split(" ")) {

            var mMesh;

            if (this._instances[className])
                mMesh = this._instances[className];

            if (this.hasClass(className))
                this.removeClass(className);
            else
                this.addClass(className)

        }
        return this
    }


}