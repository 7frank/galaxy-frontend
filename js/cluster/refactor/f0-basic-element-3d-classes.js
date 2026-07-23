/**
 * Created by Frank on 16.07.2017.
 */


import TextureAnimator from "./f0_TextureAnimator"

import dot9Image from "../../../img/dot9.png"
import dot7Image from "../../../img/dot7.png"
import ring2Image from "../../../img/ring2.png"
import ring3Image from "../../../img/ring3.png"


import { AdditiveBlending, BackSide, DoubleSide } from "three/src/constants.js";
import { BufferAttribute } from "three/src/core/BufferAttribute.js";
import { BufferGeometry } from "three/src/core/BufferGeometry.js";
import { BoxGeometry } from "three/src/geometries/BoxGeometry.js";
import { PlaneGeometry } from "three/src/geometries/PlaneGeometry.js";
import { SphereGeometry } from "three/src/geometries/SphereGeometry.js";
import { TextureLoader } from "three/src/loaders/TextureLoader.js";
import { MeshBasicMaterial } from "three/src/materials/MeshBasicMaterial.js";
import { PointsMaterial } from "three/src/materials/PointsMaterial.js";
import { Mesh } from "three/src/objects/Mesh.js";
import { Points } from "three/src/objects/Points.js";
import * as _ from "lodash";

//------------------------------------------------
//helper structures for "class"-like work flow with nodes
var _classes = {};


export function register3DClass(className, options) {

    var defaults = {
        geometry: function (env, el) {
            return new BoxGeometry(Math.cbrt(env.valAccessor(el) || 1) * env.nodeRelSize, Math.cbrt(env.valAccessor(el) || 1) * env.nodeRelSize, Math.cbrt(env.valAccessor(el) || 1) * env.nodeRelSize);
            ;
        },
        material: function (env, el) {
            return new MeshBasicMaterial({color: env.colorAccessor(el) || 0xffffff, transparent: true})
        },
        instance: function (env, el) {
            return new Mesh(this.geometry(env, el), this.material(env, el));
        }, onAdd: function (completeCallback) {
            if (completeCallback)
                completeCallback();
            return;


            var mesh = this;

            mesh.material.opacity = 0;
            var tween = new TWEEN.Tween(mesh.material)
                .to({opacity: 1}, 200)
                .onUpdate(function () {

                    //mesh.material.opacity=this.opacity
                })
                .onComplete(completeCallback)
                .start();


        },
        onRemove: function (completeCallback) {
            if (completeCallback)
                completeCallback();
            return;

            var mesh = this;
            mesh.material.opacity = 1;
            var tween = new TWEEN.Tween(mesh.material)
                .to({opacity: 0}, 200)
                .onUpdate(function () {

                    //mesh.material.opacity=this.opacity
                })
                .onComplete(completeCallback)
                .start();


        },
        unique: false
    };

    //options = $.extend(true, {}, defaults, options);

    options = _.merge( {}, defaults, options);

    if (typeof _classes[className] != "undefined") throw new Error("className already registered:", className);

    _classes[className] = options
}

function _newClassViaFactory(className, env, el) {
    var factory = _classes[className];
    if (!factory) {

        //throw new Error("3d class "+className+" not found")
        console.error("3d class " + className + " not found");

        var mMesh = new Mesh();
        mMesh.onAdd = function () {
        };
        mMesh.onRemove = mMesh.onAdd = function (c) {
            if (c) c()
        };
        mMesh.set = function () {
        };
        return mMesh;


    }


    if (factory.unique && factory._unique_instance) return factory._unique_instance;

    var material;
    var geometry;


    var mMesh = factory.instance(env, el);

    if (factory.unique)
        factory._unique_instance = mMesh;

    mMesh.onAdd = factory.onAdd;
    mMesh.onRemove = factory.onRemove;
    mMesh.set = function (attrName, options) {
        //TODO do we needthat in any way?

        if (_.isObject(options)) {
            if (_.isObject(mMesh[attrName]))
                $.extend(mMesh[attrName], options);
            else
                mMesh[attrName] = options
        }
        else
            mMesh[attrName] = options

    };


    return mMesh

}


//------------------------------------------

function basicSpriteGeometry(env, el) {

    var geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array([0, 0, 0]), 3));


    return (function (env, el) {
        return geometry;
    })()

}

export function basicSpriteSize(env, el, scale = 1) {
    // Math.cbrt(env.valAccessor(el) || 1) * env.nodeRelSize
    let size = el.size ? el.size : 32;
    size = Math.cbrt(size) * env.nodeRelSize;
    return (32 + size * 3) * scale

}


//define some sample "classes"
register3DClass("basic-cube", {});
//----------------------------------------
register3DClass("hull-hint", {
    geometry: function (env, el) {
        return new BoxGeometry(20, 20, 20);
    }
});


//----------------------------------------
register3DClass("basic-cube-highlighted", {
    geometry: function (env, el) {
        return new BoxGeometry(11, 11, 11);
    },
    material: function (env, el) {
        return new MeshBasicMaterial({color: 0xff0000, transparent: true});
    },
    unique: false
});
//----------------------------------------
register3DClass("basic-sphere", {
    material: function (env, el) {
        return new MeshBasicMaterial({color: env.colorAccessor(el) || 0xffffff, transparent: true});
    },
    geometry: function (env, el) {
        return new SphereGeometry(Math.cbrt(env.valAccessor(el) || 1) * env.nodeRelSize, 12, 10);
    },
    unique: false
});
//----------------------------------------
register3DClass("basic-selection", {
    material: function (env, el) {
        return new MeshBasicMaterial({color: 0xffffff, transparent: true, opacity: 0.3/*,side: BackSide*/});
    },
    geometry: function (env, el) {
        return new SphereGeometry(Math.cbrt(env.valAccessor(el) || 1) * env.nodeRelSize / 3.5, 25, 25);
    },
    unique: true
});

//----------------------------------------

var basicCollapsedSprite = new TextureLoader().load(dot9Image);

register3DClass("basic-sprite-collapsed", {
    geometry: basicSpriteGeometry
    ,
    material: function (env, el) {

        material = new PointsMaterial({
            color: env.colorAccessor(el) || 0xffffff,
            size: basicSpriteSize(env, el),
            sizeAttenuation: true,
            map: basicCollapsedSprite,
            alphaTest: 0.0,
            transparent: true,
            opacity: 0.6,
            depthTest: false
        });
        return material

    }, instance(env, el) {

        var mPointMesh = new Points(this.geometry(env, el), this.material(env, el));


        return mPointMesh;

    },
    unique: false
});


//----------------------------------------
var ring3Sprite = new TextureLoader().load(ring3Image);

register3DClass("basic-ring", {
    geometry: basicSpriteGeometry,
    material: function (env, el) {


        material = new PointsMaterial({
            color: env.colorAccessor(el) || 0xffffff,
            size: basicSpriteSize(env, el),
            sizeAttenuation: true,
            map: ring3Sprite,
            alphaTest: 0.0,
            transparent: true,
            opacity: 0.6,
            depthTest: false
        });
        return material

    }, instance(env, el) {

        var mPointMesh = new Points(this.geometry(env, el), this.material(env, el));


        return mPointMesh;

    },
    unique: false
});


//----------------------------------------
var ring2Sprite = new TextureLoader().load(ring2Image);

register3DClass("basic-ring-2", {
    geometry: basicSpriteGeometry
    ,
    material: function (env, el) {


        material = new PointsMaterial({
            color: env.colorAccessor(el) || 0xffffff,
            size: basicSpriteSize(env, el),
            sizeAttenuation: true,
            map: ring2Sprite,
            alphaTest: 0.0,
            transparent: true,
            opacity: 0.6,
            depthTest: false
        });
        return material

    }, instance(env, el) {

        var mPointMesh = new Points(this.geometry(env, el), this.material(env, el));


        return mPointMesh;

    },
    unique: false
});


register3DClass("basic-animated", {
    geometry: basicSpriteGeometry,
    material: function (env, el) {


        var runnerTexture = new TextureLoader().load('img/run.png');
        var annie = new TextureAnimator(runnerTexture, 10, 1, 10, 75); // texture, #horiz, #vert, #total, duration.
        //var runnerMaterial = new MeshBasicMaterial( { map: runnerTexture, side:DoubleSide } );
        //var runnerGeometry = new PlaneGeometry(50, 50, 1, 1);
        //var runner = new Mesh(runnerGeometry, runnerMaterial);
        //runner.position.set(-100,25,0);
        //scene.add(runner);

        //FIXME animation increases in speed over time
        //animate material
        function animate(time = 0) {
            requestAnimationFrame(animate);
            annie.update(time / 1000);
        }

        requestAnimationFrame(animate);


        //var sprite = new TextureLoader().load(dot9Image);
        material = new PointsMaterial({
            color: env.colorAccessor(el) || 0xffffff,
            size: basicSpriteSize(env, el),
            sizeAttenuation: true,
            map: runnerTexture,
            alphaTest: 0.0,
            transparent: true,
            opacity: 0.6,
            depthTest: false
        });
        return material

    }, instance(env, el) {

        var mPointMesh = new Points(this.geometry(env, el), this.material(env, el));


        return mPointMesh;

    },
    unique: false
});


//----------------------------------------

var expandedSprite = new TextureLoader().load("img/minus-square-o.png");
register3DClass("basic-sprite-expanded", {
    geometry: basicSpriteGeometry,
    material: function (env, el) {


        material = new PointsMaterial({
            color: env.colorAccessor(el) || 0xffffff,
            size: basicSpriteSize(env, el),
            sizeAttenuation: true,
            map: expandedSprite,
            alphaTest: 0.0,
            transparent: true,
            opacity: 0.6,
            depthTest: false
        });
        return material

    }, instance(env, el) {

        return new Points(this.geometry(env, el), this.material(env, el));

    },
    unique: false
});


//----------------------------------------

var basicSprite = new TextureLoader().load(dot7Image);
register3DClass("basic-sprite", {
    geometry: basicSpriteGeometry,
    material: function (env, el) {

        var material = new PointsMaterial({
            color: env.colorAccessor(el) || 0xffffff,
            size: basicSpriteSize(env, el),
            sizeAttenuation: true,
            map: basicSprite,
            alphaTest: 0.0,
            transparent: true,
            opacity: 0.6,
            depthTest: false
        });

        //depthTest:false, fog:false,blending:AdditiveBlending,


        return material

    }, instance(env, el) {

        return new Points(this.geometry(env, el), this.material(env, el));

    },
    unique: false
});
//----------------------------------------
register3DClass("node-highlighted", {
    geometry: basicSpriteGeometry,
    material: function (env, el) {
        var sprite = new TextureLoader().load(dot7Image);
        var material = new PointsMaterial({
            color: env.colorAccessor(el) || 0xffffff,
            size: basicSpriteSize(env, el) * 1.8,
            sizeAttenuation: true,
            map: sprite,
            alphaTest: 0.0,
            transparent: true,
            opacity: 1.6,
            depthTest: false
        });

        //depthTest:false, fog:false,blending:AdditiveBlending,


        return material

    }, instance(env, el) {

        return new Points(this.geometry(env, el), this.material(env, el));

    },
    unique: false
});


/**
 basicElementExtend adds:

 on/off
 add/remove/toggle 3d-class

 TODO refactor => BaseXElement

 */
export function basicElementExtend(env, obj, _mesh) {
    var mDomEvents = env.domEvents;


    var self = _.extend(obj,
        {
            _instances: {},
            getClassInstance: function (className) {
                return this._instances[className];
            },
            on: function (eventName, eventhandler) {
                mDomEvents.addEventListener(_mesh, eventName, eventhandler, false)
            },
            off: function (eventName, eventhandler) {
                mDomEvents.removeEventListener(_mesh, eventName, eventhandler, false)
            },
            show: function () {
                //needs a parent element it is attached to
                let el = this.get3DRoot()
                this._parent.add(el)


                // el.updateMatrix()
                el.updateMatrixWorld()

            },
            hide: function () {
                //needs a parent element it is attached to
                this._parent.remove(this.get3DRoot())
            },
            trigger: function (eventName, intersect, node) {


                mDomEvents._notify(eventName, _mesh, node, intersect);


            }, get3DRoot: function () {

            return this._bubble
        },
            getParentCluster()  //NOTE: more of getParentClusterLeaf
            {
                let el = this.get3DRoot();

                if (!el || !el._parent) return null;

                return el._parent.parent
            },
            addClass: function (className) {

                for (className of className.split(" ")) {

                    if (this.hasClass(className)) continue;

                    var mMesh;

                    if (this._instances[className])
                        mMesh = this._instances[className];
                    else
                        mMesh = this._instances[className] = _newClassViaFactory(className, env, obj);


                    this.get3DRoot().add(mMesh);
                    mMesh.onAdd()


                }
                return this
            }, removeClass(className) {
            for (className of className.split(" ")) {
                var mMesh;
                if (this._instances[className]) {

                    mMesh = this._instances[className];

                    mMesh.onRemove(() => this.get3DRoot().remove(mMesh))

                }

            }
            return this
        },
            hasClass: function (className) {
                var mMesh;
                if (this._instances[className])
                    mMesh = this._instances[className];

                return (this.get3DRoot().children.indexOf(mMesh) >= 0)

            },
            toggleClass: function (className) {

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
        });

    return self
}
