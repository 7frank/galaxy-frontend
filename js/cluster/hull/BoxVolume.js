/**
 * Created by Frank on 22.06.2017.
 */

import BaseVolume from "./BaseVolume"
/**
 * a slight derivative of it's base class
 * allowing for user to add to sub-cluster
 *
 */

export default
class BoxVolume extends  BaseVolume {

    constructor(...args) {
        super(...args)


    }


    canBeVisible()
    {
        return true
    }


}