/**
 extends any given THREE.Material
 with a fadeTo method,
 and overrides opacity attribute

 */


import AnimationMixin from "./AnimationMixin"

export default function MaterialFadeMixin(material) {
    if (!material instanceof THREE.Material) throw new Error("must be THREE.Material")


    AnimationMixin(material)

    material.fade = 1;
    material._opacity = material.opacity;

    Reflect.defineProperty(material, "opacity", {
        enumerable: false,
        configurable: false,
        get: function () {
            return this._opacity * this.fade
        },
        set: function (newOpacity) {

            this._opacity = newOpacity;


            if (this instanceof THREE.ShaderMaterial)
                if (this.uniforms.opacity)
                    this.uniforms.opacity.value = newOpacity

        }

    });


    material.fadeTo = function (fade, mDuration, onComplete) {

        if (fade == material.fade) mDuration = 0; //TODO

        return material.animate({fade: fade}, mDuration, onComplete)
    }


    return material

}



