/**
 *
 * A web component that manages colors for our node clusters.
 * This is supposed to help manage / change color and presents of the cluster when multiple configurations {@link Default3DGraphConfig} are used.
 *
 * TODO Have some event listeners so that listeners can handle change events
 *
 * @deprecated
 */
import Color from 'easy-color';

export default class DefaultColorScheme extends EventTarget {


    constructor() {
        super();

        this._attrs = {};

        this.addEventListener("edge-color-changed", function () {
            console.warn(arguments)
        })

        this._setAttr("edge-color", "#00AAFFFF")
        this._setAttr("background-color", "black")

    }

    _setAttr(attr, newValue) {
        var parser = new Color(newValue);
        newValue = parser.toRGBA();
        var oldValue = this._attrs[attr];
        this._attrs[attr] = newValue;
        if (oldValue != null && oldValue != newValue)
            this.trigger(attr + "-changed", [newValue, oldValue])
    }

    on(evntName, handler) {
        this.addEventListener(evntName, handler.bind(this))
        return this
    }


    //have some utils to convert colors
    //maybe generate materials also

    trigger(evntName, args) {
        this.dispatchEvent(new CustomEvent(evntName, {detail: args}))
        return this
    }

}

