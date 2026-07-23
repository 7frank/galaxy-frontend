/**
 * extends any given object
 * with an animate method
 *
 * animate(options:Object, mDuration : Number, onComplete:function)
 *
 * options does contain all the animated properties
 */
//import TWEEN from "@tweenjs/tween.js"
import TWEEN from "../lib/Tween"

export default function AnimationMixin(origObject) {
    if (typeof origObject == "undefined") throw new Error("must be an object");


    //https://github.com/tweenjs/tween.js/issues/78
    //Flatten/Deflate an object
    var flatten = function (source, pathArray, result) {
        pathArray = (typeof pathArray === 'undefined') ? [] : pathArray;
        result = (typeof result === 'undefined') ? {} : result;
        var key, value, newKey;
        for (var i in source) {
            if (source.hasOwnProperty(i)) {
                key = i;
                value = source[i];
                pathArray.push(key);

                if (typeof value === 'object' && value !== null) {
                    result = flatten(value, pathArray, result);
                } else {
                    newKey = pathArray.join('.');
                    result[newKey] = value;
                }
                pathArray.pop();
            }
        }
        return result;
    };

    function ref(obj, str) {
        return str.split(".").reduce(function (o, x) {
            return o[x]
        }, obj);
    }

//Move values from a flatten object to its original object
    function returnValue(obj, flattened, key) {
        let parts = key.split(/\.(?=[^.]+$)/)  // Split "foo.bar.baz" into ["foo.bar", "baz"]
        if (parts.length == 1) {
            obj[parts[0]] = flattened[key];
        } else {
            ref(obj, parts[0])[parts[1]] = flattened[key];
        }
    }

    function getValue(obj, key) {
        let parts = key.split(/\.(?=[^.]+$)/)  // Split "foo.bar.baz" into ["foo.bar", "baz"]
        if (parts.length == 1) {
            return obj[parts[0]]
        } else {
            return ref(obj, parts[0])[parts[1]]
        }
    }


    origObject.animate = function (options = {}, mDuration = 400, onComplete, onUpdate) {
        var mTimeout;
        var that = this;
        var stopped = false

        var flattened_to = flatten(options);

        var keys = Object.keys(flattened_to)
        var flattened_from = {}
        keys.forEach(k => flattened_from[k] = getValue(that, k))

        that.mAnimating = (that.mAnimating || 0) + 1;

        var tween = new TWEEN.Tween(flattened_from);
        tween.to(flattened_to, mDuration)
            .onUpdate(function () {

                //Move the values from the flattened and tweening object
                //to the original object
                for (let key in this) {
                    returnValue(that, this, key);
                }
                if (typeof onUpdate == "function") onUpdate.bind(that)()

            })
            .onComplete(function () {

                cancelAnimationFrame(mTimeout);

                stopped = true
                that.mAnimating = Math.max(0, (that.mAnimating || 1) - 1);
                if (typeof onComplete == "function")
                    onComplete.bind(origObject)()
            })
            .start();

        mTimeout = requestAnimationFrame(animate);

        function animate(time) {
            if (stopped) return

            tween.update(time);
            mTimeout = requestAnimationFrame(animate);

        }

        return this;
    };

    return origObject

}


