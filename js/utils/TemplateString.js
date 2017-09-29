import _ from "lodash"


export default class TemplateString {
    constructor(str) {

        this.mStr = str;

    }


    format(obj) {
        return _.template(_.isString(this.mStr) ? this.mStr : '', {interpolate: /\$\{([^\}]+)\}/gm})(obj);
    }


}